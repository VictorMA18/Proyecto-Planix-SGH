import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import type { Prisma, Usuario } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  ADJUNTO_MAX_BYTES,
  ADJUNTOS_MAX,
  ROLES_GESTION_TAREAS,
} from '../../../common/constants/tareas.constants';
import { RelojService } from '../../../common/reloj/reloj.service';
import { CloudinaryService } from '../../../cloudinary/cloudinary.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccesoOrganizacionService } from '../../organizaciones/services/acceso-organizacion.service';
import {
  AdjuntoResponseDto,
  leerAdjuntos,
  type AdjuntoGuardado,
} from '../dto/tarea-response.dto';
import { detectarTipoArchivo } from '../utils/tipo-archivo.util';
import { ActividadService } from './actividad.service';
import { TareasService } from './tareas.service';

export interface ArchivoRecibido {
  originalname: string;
  size: number;
  buffer: Buffer;
}

/**
 * Adjuntos de una tarea (documentacion/03, campo `adjuntos`). El backend valida tamaño y contenido
 * antes de subir nada a Cloudinary; el cliente nunca sube directamente ni ve las credenciales.
 */
@Injectable()
export class AdjuntosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acceso: AccesoOrganizacionService,
    private readonly tareas: TareasService,
    private readonly actividad: ActividadService,
    private readonly cloudinary: CloudinaryService,
    private readonly reloj: RelojService,
  ) {}

  async subir(
    usuario: Usuario,
    tareaId: string,
    archivo: ArchivoRecibido | undefined,
  ): Promise<AdjuntoResponseDto> {
    const tarea = await this.tareas.cargarConAcceso(usuario, tareaId);
    await this.acceso.exigirRol(
      usuario.id,
      tarea.organizacionId,
      ROLES_GESTION_TAREAS,
      'Solo un ADMIN o SUPERVISOR puede adjuntar archivos.',
    );

    if (!archivo)
      throw new BadRequestException(
        'Adjunta un archivo en el campo «archivo».',
      );
    if (archivo.size > ADJUNTO_MAX_BYTES)
      throw new PayloadTooLargeException(
        'El archivo supera el tamaño máximo de 10 MB.',
      );
    const tipo = detectarTipoArchivo(archivo.buffer);
    if (!tipo)
      throw new UnsupportedMediaTypeException(
        'Solo se admiten PDF e imágenes (JPG, PNG, WebP o GIF).',
      );

    const actuales = leerAdjuntos(tarea.adjuntos);
    if (actuales.length >= ADJUNTOS_MAX)
      throw new BadRequestException(
        `Una tarea admite como máximo ${ADJUNTOS_MAX} archivos.`,
      );

    const subido = await this.cloudinary.subir(
      archivo.buffer,
      `sgh/${tarea.organizacionId}/tareas/${tareaId}`,
      tipo.tipo === 'IMAGEN',
    );
    const adjunto: AdjuntoGuardado = {
      id: randomUUID(),
      tipo: tipo.tipo,
      url: subido.url,
      cloudinaryPublicId: subido.publicId,
      nombreArchivo: archivo.originalname.slice(0, 200),
      mimeType: tipo.mime,
      tamanoBytes: archivo.size,
      orden: actuales.length,
      createdAt: this.reloj.ahora().toISOString(),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.tarea.update({
        where: { id: tareaId },
        data: {
          adjuntos: [...actuales, adjunto] as unknown as Prisma.InputJsonValue,
        },
      });
      await this.actividad.registrar(
        tx,
        tareaId,
        usuario.id,
        'ADJUNTO',
        `adjuntó «${adjunto.nombreArchivo}»`,
      );
    });
    return AdjuntoResponseDto.desde(adjunto);
  }

  /** Contenido de un adjunto con su tipo y nombre originales (cualquier miembro de la organización). */
  async archivo(
    usuario: Usuario,
    tareaId: string,
    adjuntoId: string,
  ): Promise<{ contenido: Buffer; adjunto: AdjuntoGuardado }> {
    const tarea = await this.tareas.cargarConAcceso(usuario, tareaId);
    const adjunto = leerAdjuntos(tarea.adjuntos).find(
      (a) => a.id === adjuntoId,
    );
    if (!adjunto) throw new NotFoundException('Adjunto no encontrado');
    return { contenido: await this.cloudinary.descargar(adjunto.url), adjunto };
  }

  async eliminar(
    usuario: Usuario,
    tareaId: string,
    adjuntoId: string,
  ): Promise<void> {
    const tarea = await this.tareas.cargarConAcceso(usuario, tareaId);
    await this.acceso.exigirRol(
      usuario.id,
      tarea.organizacionId,
      ROLES_GESTION_TAREAS,
      'Solo un ADMIN o SUPERVISOR puede quitar archivos.',
    );

    const actuales = leerAdjuntos(tarea.adjuntos);
    const adjunto = actuales.find((a) => a.id === adjuntoId);
    if (!adjunto) throw new NotFoundException('Adjunto no encontrado');

    const restantes = actuales
      .filter((a) => a.id !== adjuntoId)
      .map((a, orden) => ({ ...a, orden }));
    await this.prisma.$transaction(async (tx) => {
      await tx.tarea.update({
        where: { id: tareaId },
        data: { adjuntos: restantes },
      });
      await this.actividad.registrar(
        tx,
        tareaId,
        usuario.id,
        'ADJUNTO',
        `quitó el adjunto «${adjunto.nombreArchivo}»`,
      );
    });
    await this.cloudinary.eliminar(
      adjunto.cloudinaryPublicId,
      adjunto.tipo === 'IMAGEN',
    );
  }
}
