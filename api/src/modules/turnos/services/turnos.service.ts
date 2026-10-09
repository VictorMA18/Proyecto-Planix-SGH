import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, Usuario } from '@prisma/client';
import { aTimeDb } from '../../../common/utils/hora.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccesoOrganizacionService } from '../../organizaciones/services/acceso-organizacion.service';
import {
  ConfiguracionTurnosResponseDto,
  PlantillaTurnoResponseDto,
} from '../dto/configuracion-turnos-response.dto';
import { PlantillaTurnoDto } from '../dto/plantilla-turno.dto';
import { ToleranciaDto } from '../dto/tolerancia.dto';

const miembrosActivos = (organizacionId: string) =>
  ({
    where: { organizacionId, estado: 'ACTIVO' },
    include: { usuario: true },
    orderBy: { usuario: { nombre: 'asc' } },
  }) satisfies Prisma.MiembroOrganizacionFindManyArgs;

/** Plantillas de turno, asignación de miembros (un turno por miembro) y tolerancia de entrada. */
@Injectable()
export class TurnosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acceso: AccesoOrganizacionService,
  ) {}

  async configuracion(
    usuario: Usuario,
    organizacionId: string,
  ): Promise<ConfiguracionTurnosResponseDto> {
    await this.acceso.exigirAdmin(usuario.id, organizacionId);
    return this.leerConfiguracion(organizacionId);
  }

  async crear(
    usuario: Usuario,
    organizacionId: string,
    dto: PlantillaTurnoDto,
  ): Promise<PlantillaTurnoResponseDto> {
    await this.acceso.exigirAdmin(usuario.id, organizacionId);
    this.validarHorario(dto);

    const id = await this.prisma.$transaction(async (tx) => {
      await this.validarMiembros(tx, organizacionId, dto.miembroIds);
      const plantilla = await tx.plantillaTurno.create({
        data: { organizacionId, ...this.datos(dto) },
      });
      await this.asignar(tx, organizacionId, plantilla.id, dto.miembroIds);
      return plantilla.id;
    });
    return this.leerPlantilla(organizacionId, id);
  }

  async actualizar(
    usuario: Usuario,
    organizacionId: string,
    turnoId: string,
    dto: PlantillaTurnoDto,
  ): Promise<PlantillaTurnoResponseDto> {
    await this.acceso.exigirAdmin(usuario.id, organizacionId);
    this.validarHorario(dto);
    await this.exigirPlantilla(organizacionId, turnoId);

    await this.prisma.$transaction(async (tx) => {
      await this.validarMiembros(tx, organizacionId, dto.miembroIds);
      await tx.plantillaTurno.update({
        where: { id: turnoId },
        data: this.datos(dto),
      });
      await this.asignar(tx, organizacionId, turnoId, dto.miembroIds);
    });
    return this.leerPlantilla(organizacionId, turnoId);
  }

  /** Elimina la plantilla; sus miembros quedan sin turno (`ON DELETE SET NULL`). */
  async eliminar(
    usuario: Usuario,
    organizacionId: string,
    turnoId: string,
  ): Promise<void> {
    await this.acceso.exigirAdmin(usuario.id, organizacionId);
    await this.exigirPlantilla(organizacionId, turnoId);
    await this.prisma.plantillaTurno.delete({ where: { id: turnoId } });
  }

  async cambiarTolerancia(
    usuario: Usuario,
    organizacionId: string,
    { toleranciaMin }: ToleranciaDto,
  ): Promise<ConfiguracionTurnosResponseDto> {
    await this.acceso.exigirAdmin(usuario.id, organizacionId);
    await this.prisma.organizacion.update({
      where: { id: organizacionId },
      data: { toleranciaEntradaMin: toleranciaMin },
    });
    return this.leerConfiguracion(organizacionId);
  }

  private validarHorario(dto: PlantillaTurnoDto) {
    if (dto.horaInicio === dto.horaFin) {
      throw new BadRequestException(
        'La hora de fin debe ser distinta a la de inicio.',
      );
    }
  }

  private datos(dto: PlantillaTurnoDto) {
    return {
      nombre: dto.nombre,
      horaInicio: aTimeDb(dto.horaInicio),
      horaFin: aTimeDb(dto.horaFin),
      dias: [...dto.dias].sort((a, b) => a - b),
    };
  }

  private async exigirPlantilla(organizacionId: string, turnoId: string) {
    const plantilla = await this.prisma.plantillaTurno.findFirst({
      where: { id: turnoId, organizacionId },
    });
    if (!plantilla)
      throw new NotFoundException('Plantilla de turno no encontrada');
    return plantilla;
  }

  /** Solo se asignan miembros ACTIVOS de esta organización. */
  private async validarMiembros(
    tx: Prisma.TransactionClient,
    organizacionId: string,
    miembroIds: string[],
  ) {
    if (miembroIds.length === 0) return;
    const validos = await tx.miembroOrganizacion.count({
      where: { id: { in: miembroIds }, organizacionId, estado: 'ACTIVO' },
    });
    if (validos !== miembroIds.length) {
      throw new BadRequestException(
        'Algunos miembros no pertenecen al equipo activo de la organización.',
      );
    }
  }

  /** Reemplaza la lista de asignados: quien sale queda sin turno y quien entra deja su turno anterior. */
  private async asignar(
    tx: Prisma.TransactionClient,
    organizacionId: string,
    plantillaId: string,
    miembroIds: string[],
  ) {
    await tx.miembroOrganizacion.updateMany({
      where: {
        organizacionId,
        plantillaTurnoId: plantillaId,
        id: { notIn: miembroIds },
      },
      data: { plantillaTurnoId: null },
    });
    if (miembroIds.length > 0) {
      await tx.miembroOrganizacion.updateMany({
        where: { organizacionId, id: { in: miembroIds } },
        data: { plantillaTurnoId: plantillaId },
      });
    }
  }

  private async leerPlantilla(
    organizacionId: string,
    id: string,
  ): Promise<PlantillaTurnoResponseDto> {
    const [plantilla, miembros] = await Promise.all([
      this.prisma.plantillaTurno.findUniqueOrThrow({ where: { id } }),
      this.prisma.miembroOrganizacion.findMany({
        ...miembrosActivos(organizacionId),
        where: { organizacionId, estado: 'ACTIVO', plantillaTurnoId: id },
      }),
    ]);
    return PlantillaTurnoResponseDto.desde(plantilla, miembros);
  }

  private async leerConfiguracion(
    organizacionId: string,
  ): Promise<ConfiguracionTurnosResponseDto> {
    const [organizacion, plantillas, miembros] = await Promise.all([
      this.prisma.organizacion.findUniqueOrThrow({
        where: { id: organizacionId },
      }),
      this.prisma.plantillaTurno.findMany({
        where: { organizacionId },
        orderBy: [{ horaInicio: 'asc' }, { nombre: 'asc' }],
      }),
      this.prisma.miembroOrganizacion.findMany(miembrosActivos(organizacionId)),
    ]);
    return ConfiguracionTurnosResponseDto.desde(
      plantillas,
      miembros,
      organizacion.toleranciaEntradaMin,
    );
  }
}
