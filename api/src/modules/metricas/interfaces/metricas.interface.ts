import type { RolMiembro, TipoMovimientoAsistencia } from '@prisma/client';
import type { TipoPeriodo } from '../../../common/constants/metricas.constants';
import type {
  Agregado,
  Rango,
  RegistroDia,
  ResumenColaborador,
} from '../utils/metricas.util';

export type Alcance = 'EQUIPO' | 'MIEMBRO';

export interface MiembroObjetivo {
  miembroId: string;
  nombre: string;
  avatarUrl: string | null;
  rol: RolMiembro;
  turno: string | null;
}

/** Marca de QR (movimiento) para el anexo del reporte. */
export interface MarcaQr {
  nombre: string;
  fecha: string;
  hora: Date;
  tipo: TipoMovimientoAsistencia;
}

/**
 * Métricas ya calculadas de un periodo. Es el mismo modelo para la pantalla, la lista de
 * colaboradores y el reporte (PDF/Excel), así sus números siempre coinciden.
 */
export interface MetricasCalculadas {
  organizacion: { id: string; nombre: string; zonaHoraria: string };
  hoy: string;
  tipo: TipoPeriodo;
  rango: Rango;
  alcance: Alcance;
  miembro: MiembroObjetivo | null;
  miembrosActivos: number;
  agregado: Agregado;
  /** Todos los colaboradores, ya ordenados (solo EQUIPO). */
  colaboradores: ResumenColaborador[] | null;
  /** Solo MIEMBRO. */
  registroDiario: RegistroDia[] | null;
  tareas: { completadas: number; total: number } | null;
  marcas: MarcaQr[];
}
