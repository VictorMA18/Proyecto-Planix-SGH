import { EstadoTarea } from '@prisma/client';
import { IsBoolean, IsEnum, IsString, Length } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

/** Cuerpo de `PATCH /tareas/{id}/estado` (cualquier miembro). */
export class CambiarEstadoDto {
  @IsEnum(EstadoTarea, { message: 'El estado no es válido.' })
  estado!: EstadoTarea;
}

/** Cuerpo de `PATCH /tareas/{id}/subtareas/{subtareaId}` (cualquier miembro). */
export class MarcarSubtareaDto {
  @IsBoolean({ message: 'Indica si la subtarea está completada.' })
  completada!: boolean;
}

/** Cuerpo de `POST /tareas/{id}/comentarios`. */
export class CrearComentarioDto {
  @Trim()
  @IsString({ message: 'El comentario no es válido.' })
  @Length(1, 1000, {
    message: 'El comentario debe tener entre 1 y 1000 caracteres.',
  })
  texto!: string;
}
