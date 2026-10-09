import { Injectable } from '@nestjs/common';
import type {
  MiembroOrganizacion,
  Organizacion,
  PlantillaTurno,
} from '@prisma/client';
import { RelojService } from '../../../common/reloj/reloj.service';
import {
  plantillaBasica,
  turnoDelDia,
  type TurnoDelDia,
} from '../../../common/utils/jornada.util';
import {
  comoFechaDb,
  fechaLocal,
  sumarDias,
} from '../../../common/utils/zona-horaria.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccesoOrganizacionService } from '../../organizaciones/services/acceso-organizacion.service';
import type { JornadaConMovimientos } from '../dto/jornada-response.dto';

export interface ContextoAsistencia {
  membresia: MiembroOrganizacion & { plantillaTurno: PlantillaTurno | null };
  organizacion: Organizacion;
  ahora: Date;
  /** Fecha de hoy en la zona de la organización. */
  fecha: string;
}

/** Piezas comunes de asistencia que también usan «Inicio» y los reportes. */
@Injectable()
export class JornadasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acceso: AccesoOrganizacionService,
    private readonly reloj: RelojService,
  ) {}

  /** Miembro ACTIVO (si no, 404), su turno, la organización y la fecha local de hoy. */
  async contexto(
    usuarioId: string,
    organizacionId: string,
  ): Promise<ContextoAsistencia> {
    await this.acceso.exigirMiembro(usuarioId, organizacionId);
    const membresia = await this.prisma.miembroOrganizacion.findUniqueOrThrow({
      where: { usuarioId_organizacionId: { usuarioId, organizacionId } },
      include: { plantillaTurno: true, organizacion: true },
    });
    const ahora = this.reloj.ahora();
    return {
      membresia,
      organizacion: membresia.organizacion,
      ahora,
      fecha: fechaLocal(ahora, membresia.organizacion.zonaHoraria),
    };
  }

  /** Turno que le toca hoy según su plantilla actual. */
  turnoDeHoy({
    membresia,
    organizacion,
    fecha,
  }: ContextoAsistencia): TurnoDelDia | null {
    return membresia.plantillaTurno
      ? turnoDelDia(
          plantillaBasica(membresia.plantillaTurno),
          fecha,
          organizacion.zonaHoraria,
        )
      : null;
  }

  /**
   * Turno de la jornada en curso: el que se copió al entrar (no cambia si luego se edita la
   * plantilla) o, si no hay copia, el que le toca hoy según su plantilla actual.
   */
  turnoVigente(
    ctx: ContextoAsistencia,
    jornada: JornadaConMovimientos | null,
  ): TurnoDelDia | null {
    if (jornada?.turnoNombre && jornada.turnoInicio && jornada.turnoFin) {
      return {
        nombre: jornada.turnoNombre,
        inicio: jornada.turnoInicio,
        fin: jornada.turnoFin,
        objetivoMin: Math.round(
          (jornada.turnoFin.getTime() - jornada.turnoInicio.getTime()) / 60_000,
        ),
      };
    }
    // Sin copia (entró antes de tener turno, o se le asignó después): se muestra el turno que le
    // toca hoy según su plantilla. La puntualidad de esa entrada queda sin evaluar (`null`).
    return this.turnoDeHoy(ctx);
  }

  /**
   * Jornada en curso: la de hoy o, si quedó abierta, la de ayer (turnos que cruzan la medianoche).
   */
  jornadaActual(usuarioId: string, organizacionId: string, fecha: string) {
    return this.prisma.jornadaAsistencia.findFirst({
      where: {
        usuarioId,
        organizacionId,
        OR: [
          { fecha: comoFechaDb(fecha) },
          { fecha: comoFechaDb(sumarDias(fecha, -1)), estadoActual: 'DENTRO' },
        ],
      },
      orderBy: { fecha: 'desc' },
      include: { movimientos: { orderBy: { hora: 'asc' } } },
    });
  }
}
