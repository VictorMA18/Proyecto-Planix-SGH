import type {
  MiembroOrganizacion,
  PlantillaTurno,
  Usuario,
} from '@prisma/client';
import {
  duracionTurnoMin,
  horaDeTimeDb,
  minutosDeTimeDb,
} from '../../../common/utils/hora.util';

/** Cuántos miembros asignados se devuelven con nombre y foto (para los avatares). */
const VISTA_PREVIA_EQUIPO = 8;

type MiembroConUsuario = MiembroOrganizacion & { usuario: Usuario };

export class MiembroTurnoResponseDto {
  id!: string;
  nombre!: string;
  avatarUrl!: string | null;

  static desde(miembro: MiembroConUsuario): MiembroTurnoResponseDto {
    return Object.assign(new MiembroTurnoResponseDto(), {
      id: miembro.id,
      nombre: miembro.usuario.nombre,
      avatarUrl: miembro.usuario.avatarUrl,
    });
  }
}

export class PlantillaTurnoResponseDto {
  id!: string;
  nombre!: string;
  horaInicio!: string;
  horaFin!: string;
  /** Duración en horas (2 decimales). */
  horas!: number;
  dias!: number[];
  asignados!: number;
  miembroIds!: string[];
  equipo!: MiembroTurnoResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;

  /** `miembros`: los miembros ACTIVOS asignados, ordenados por nombre. */
  static desde(
    plantilla: PlantillaTurno,
    miembros: MiembroConUsuario[],
  ): PlantillaTurnoResponseDto {
    const minutos = duracionTurnoMin(
      minutosDeTimeDb(plantilla.horaInicio),
      minutosDeTimeDb(plantilla.horaFin),
    );
    return Object.assign(new PlantillaTurnoResponseDto(), {
      id: plantilla.id,
      nombre: plantilla.nombre,
      horaInicio: horaDeTimeDb(plantilla.horaInicio),
      horaFin: horaDeTimeDb(plantilla.horaFin),
      horas: Math.round((minutos / 60) * 100) / 100,
      dias: [...plantilla.dias].sort((a, b) => a - b),
      asignados: miembros.length,
      miembroIds: miembros.map((m) => m.id),
      equipo: miembros
        .slice(0, VISTA_PREVIA_EQUIPO)
        .map((m) => MiembroTurnoResponseDto.desde(m)),
      createdAt: plantilla.createdAt,
      updatedAt: plantilla.updatedAt,
    });
  }
}

export class ResumenTurnosResponseDto {
  activas!: number;
  /** Miembros activos con una plantilla asignada. */
  cubiertos!: number;
  toleranciaMin!: number;
}

export class ConfiguracionTurnosResponseDto {
  plantillas!: PlantillaTurnoResponseDto[];
  resumen!: ResumenTurnosResponseDto;

  static desde(
    plantillas: PlantillaTurno[],
    miembros: MiembroConUsuario[],
    toleranciaMin: number,
  ): ConfiguracionTurnosResponseDto {
    const porPlantilla = (id: string) =>
      miembros.filter((m) => m.plantillaTurnoId === id);
    return Object.assign(new ConfiguracionTurnosResponseDto(), {
      plantillas: plantillas.map((p) =>
        PlantillaTurnoResponseDto.desde(p, porPlantilla(p.id)),
      ),
      resumen: {
        activas: plantillas.length,
        cubiertos: miembros.filter((m) => m.plantillaTurnoId !== null).length,
        toleranciaMin,
      },
    });
  }
}
