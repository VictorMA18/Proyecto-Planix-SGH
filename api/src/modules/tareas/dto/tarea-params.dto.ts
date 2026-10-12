import { IsUUID } from 'class-validator';

/** Parámetro de ruta `:tareaId`. */
export class TareaIdParamDto {
  @IsUUID('all', { message: 'El identificador de la tarea no es válido.' })
  tareaId!: string;
}

/** Parámetros `:tareaId/subtareas/:subtareaId`. */
export class SubtareaParamDto extends TareaIdParamDto {
  @IsUUID('all', { message: 'El identificador de la subtarea no es válido.' })
  subtareaId!: string;
}

/** Parámetros `:tareaId/adjuntos/:adjuntoId`. */
export class AdjuntoParamDto extends TareaIdParamDto {
  @IsUUID('all', { message: 'El identificador del adjunto no es válido.' })
  adjuntoId!: string;
}
