import { QrResponseDto } from '../../qr/dto/qr-response.dto';

export class PresenciaResponseDto {
  /** Miembros activos con turno hoy. */
  esperados!: number;
  /** Personas dentro de la sede ahora mismo. */
  presentes!: number;
  /** Primeras entradas de hoy dentro de la tolerancia. */
  puntuales!: number;
  retrasos!: number;
  /** Esperados que aún no registran entrada. */
  pendientes!: number;
}

export class DiaPuntualidadResponseDto {
  /** L, M, X, J, V. */
  dia!: string;
  fecha!: string;
  /** % puntual de ese día; `null` si es futuro o no hubo entradas con turno. */
  valor!: number | null;
}

export class AsistenciaRecienteResponseDto {
  /** Id de la jornada. */
  id!: string;
  miembroId!: string | null;
  nombre!: string;
  avatarUrl!: string | null;
  /** Turno con el que entró (o «Sin turno»). */
  area!: string;
  hora!: Date;
  estado!: 'PUNTUAL' | 'TARDE' | 'SIN_TURNO';
  minutosTarde!: number | null;
}

/** `GET /organizaciones/{id}/inicio/panel`: ADMIN y SUPERVISOR (el QR solo para ADMIN). */
export class PanelResponseDto {
  fecha!: string;
  qr!: QrResponseDto | null;
  presencia!: PresenciaResponseDto;
  puntualidadSemanal!: {
    promedio: number | null;
    dias: DiaPuntualidadResponseDto[];
  };
  asistenciasRecientes!: AsistenciaRecienteResponseDto[];
}
