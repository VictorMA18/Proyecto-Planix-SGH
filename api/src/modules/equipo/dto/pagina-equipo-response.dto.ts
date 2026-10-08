import { InvitacionPendienteResponseDto } from '../../invitaciones/dto/invitacion-pendiente-response.dto';
import { MiembroEquipoResponseDto } from './miembro-equipo-response.dto';

export type ItemEquipoResponseDto =
  MiembroEquipoResponseDto | InvitacionPendienteResponseDto;

/** Cantidad de elementos por filtro (ignora la búsqueda). */
export class ConteosEquipoResponseDto {
  todos!: number;
  admins!: number;
  supervisores!: number;
  empleados!: number;
  pendientes!: number;
}

export class PaginaEquipoResponseDto {
  items!: ItemEquipoResponseDto[];
  /** Total de elementos que cumplen el filtro y la búsqueda. */
  total!: number;
  page!: number;
  pageSize!: number;
  conteos!: ConteosEquipoResponseDto;
}
