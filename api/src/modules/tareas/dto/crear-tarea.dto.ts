import { EstadoTarea, PrioridadTarea } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';
import {
  ETIQUETA_MAX_LONGITUD,
  ETIQUETAS_MAX,
} from '../../../common/constants/tareas.constants';
import { NoAnteriorA } from '../validators/no-anterior-a.validator';

/** Subtarea dentro de la tarea: sin `id` se crea; con `id`, se actualiza la existente. */
export class SubtareaInputDto {
  @IsOptional()
  @IsUUID('all', { message: 'El identificador de la subtarea no es válido.' })
  id?: string;

  @Trim()
  @IsString({ message: 'La subtarea no es válida.' })
  @Length(1, 120, {
    message: 'Cada subtarea debe tener entre 1 y 120 caracteres.',
  })
  titulo!: string;

  @IsBoolean({ message: 'Indica si la subtarea está completada.' })
  completada!: boolean;
}

/**
 * Cuerpo de `POST /organizaciones/{id}/tareas` y de `PATCH /tareas/{id}` (reemplazo completo:
 * asignados, etiquetas y subtareas se sustituyen por los enviados). Los adjuntos van aparte.
 */
export class CrearTareaDto {
  @Trim()
  @IsString({ message: 'El título no es válido.' })
  @Length(3, 200, { message: 'El título debe tener entre 3 y 200 caracteres.' })
  titulo!: string;

  @IsOptional()
  @Trim()
  @IsString({ message: 'La descripción no es válida.' })
  @MaxLength(2000, {
    message: 'La descripción no puede superar los 2000 caracteres.',
  })
  descripcion?: string;

  @IsOptional()
  @IsEnum(EstadoTarea, { message: 'El estado no es válido.' })
  estado: EstadoTarea = 'PENDIENTE';

  @IsOptional()
  @IsEnum(PrioridadTarea, { message: 'La prioridad no es válida.' })
  prioridad: PrioridadTarea = 'MEDIA';

  @IsISO8601({ strict: true }, { message: 'La fecha de inicio no es válida.' })
  fechaInicio!: string;

  /** Mismo día que `fechaInicio` (se comprueba con la zona de la organización en el servicio). */
  @ValidateIf(
    (dto: CrearTareaDto) => dto.fechaFin !== undefined && dto.fechaFin !== null,
  )
  @IsISO8601({ strict: true }, { message: 'La hora de fin no es válida.' })
  @NoAnteriorA('fechaInicio')
  fechaFin?: string | null;

  @IsOptional()
  @Trim()
  @IsString({ message: 'La ubicación no es válida.' })
  @MaxLength(120, {
    message: 'La ubicación no puede superar los 120 caracteres.',
  })
  ubicacion?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    Array.isArray(value)
      ? value.map((v: unknown) => (typeof v === 'string' ? v.trim() : v))
      : value,
  )
  @IsArray({ message: 'Las etiquetas deben ser una lista.' })
  @ArrayMaxSize(ETIQUETAS_MAX, {
    message: `Máximo ${ETIQUETAS_MAX} etiquetas.`,
  })
  @ArrayUnique({ message: 'Hay etiquetas repetidas.' })
  @IsString({ each: true, message: 'Cada etiqueta debe ser un texto.' })
  @Length(1, ETIQUETA_MAX_LONGITUD, {
    each: true,
    message: `Cada etiqueta debe tener entre 1 y ${ETIQUETA_MAX_LONGITUD} caracteres.`,
  })
  etiquetas: string[] = [];

  @IsArray({ message: 'Las personas asignadas deben ser una lista.' })
  @ArrayMinSize(1, { message: 'Asigna la tarea al menos a una persona.' })
  @ArrayMaxSize(200, { message: 'Demasiadas personas en una sola tarea.' })
  @ArrayUnique({ message: 'Hay personas repetidas.' })
  @IsUUID('all', {
    each: true,
    message: 'Algún identificador de miembro no es válido.',
  })
  miembroIds!: string[];

  @IsOptional()
  @IsArray({ message: 'Las subtareas deben ser una lista.' })
  @ArrayMaxSize(50, { message: 'Máximo 50 subtareas.' })
  @ValidateNested({ each: true })
  @Type(() => SubtareaInputDto)
  subtareas: SubtareaInputDto[] = [];
}
