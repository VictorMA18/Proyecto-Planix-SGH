import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Usuario } from '@prisma/client';
import { generarCodigo } from '../../../common/utils/codigo.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { MiembroResponseDto } from '../../organizaciones/dto/miembro-response.dto';
import { AccesoOrganizacionService } from '../../organizaciones/services/acceso-organizacion.service';
import { MiembrosService } from '../../organizaciones/services/miembros.service';
import { CodigoInvitacionResponseDto } from '../dto/codigo-invitacion-response.dto';
import { CrearCodigoInvitacionDto } from '../dto/crear-codigo-invitacion.dto';

const MAX_INTENTOS_CODIGO = 5;

/** Códigos genéricos de invitación: sin correo asociado, los usa cualquiera hasta que expiran. */
@Injectable()
export class CodigosInvitacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acceso: AccesoOrganizacionService,
    private readonly miembros: MiembrosService,
  ) {}

  async crear(
    usuario: Usuario,
    organizacionId: string,
    { rol, vigenciaMinutos }: CrearCodigoInvitacionDto,
  ): Promise<CodigoInvitacionResponseDto> {
    await this.acceso.exigirAdmin(usuario.id, organizacionId);

    const expiraEn = new Date(Date.now() + vigenciaMinutos * 60_000);
    for (let intento = 0; intento < MAX_INTENTOS_CODIGO; intento++) {
      try {
        const codigo = await this.prisma.codigoInvitacion.create({
          data: {
            organizacionId,
            codigo: await this.generarCodigoLibre(),
            rol,
            creadoPor: usuario.id,
            expiraEn,
          },
        });
        return CodigoInvitacionResponseDto.desde(codigo);
      } catch (err) {
        const duplicado =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002';
        if (!duplicado) throw err;
      }
    }
    throw new Error('No se pudo generar un código de invitación único');
  }

  /** Une al usuario a la organización con el rol del código. 404 si no existe, 410 si expiró. */
  async canjear(usuario: Usuario, codigo: string): Promise<MiembroResponseDto> {
    const registro = await this.prisma.codigoInvitacion.findUnique({
      where: { codigo },
      include: { organizacion: { select: { activa: true } } },
    });
    if (!registro || !registro.organizacion.activa) {
      throw new NotFoundException('Código de invitación inexistente');
    }
    if (registro.expiraEn.getTime() < Date.now()) {
      throw new GoneException('El código expiró');
    }

    const miembro = await this.miembros.activar(
      usuario.id,
      registro.organizacionId,
      registro.rol,
    );
    return MiembroResponseDto.desde(miembro);
  }

  /** Un código que no coincide con ningún token de invitación personal ni con otro código. */
  async generarCodigoLibre(): Promise<string> {
    for (let intento = 0; intento < MAX_INTENTOS_CODIGO; intento++) {
      const codigo = generarCodigo();
      const [personal, generico] = await Promise.all([
        this.prisma.invitacion.findUnique({
          where: { token: codigo },
          select: { id: true },
        }),
        this.prisma.codigoInvitacion.findUnique({
          where: { codigo },
          select: { id: true },
        }),
      ]);
      if (!personal && !generico) return codigo;
    }
    throw new Error('No se pudo generar un código de invitación único');
  }
}
