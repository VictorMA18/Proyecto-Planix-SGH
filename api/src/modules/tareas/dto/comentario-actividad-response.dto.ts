import type {
  ActividadTarea,
  ComentarioTarea,
  TipoActividadTarea,
  Usuario,
} from '@prisma/client';
import { MiembroPorUsuario, PersonaTareaDto } from './tarea-response.dto';

export class ComentarioResponseDto {
  id!: string;
  autor!: PersonaTareaDto;
  texto!: string;
  createdAt!: Date;

  static desde(
    c: ComentarioTarea & { usuario: Usuario },
    miembros: MiembroPorUsuario,
  ): ComentarioResponseDto {
    return Object.assign(new ComentarioResponseDto(), {
      id: c.id,
      autor: PersonaTareaDto.desde(c.usuario, miembros),
      texto: c.texto,
      createdAt: c.createdAt,
    });
  }
}

export class ActividadResponseDto {
  id!: string;
  tipo!: TipoActividadTarea;
  actor!: PersonaTareaDto;
  descripcion!: string;
  createdAt!: Date;

  static desde(
    a: ActividadTarea & { usuario: Usuario | null },
    miembros: MiembroPorUsuario,
  ): ActividadResponseDto {
    return Object.assign(new ActividadResponseDto(), {
      id: a.id,
      tipo: a.tipo,
      actor: PersonaTareaDto.desde(a.usuario, miembros),
      descripcion: a.descripcion,
      createdAt: a.createdAt,
    });
  }
}
