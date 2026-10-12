import { Injectable } from '@nestjs/common';
import type { Prisma, TipoActividadTarea } from '@prisma/client';

/** Registra el historial de una tarea: cada acción deja un evento con quién la hizo. */
@Injectable()
export class ActividadService {
  registrar(
    tx: Prisma.TransactionClient,
    tareaId: string,
    usuarioId: string,
    tipo: TipoActividadTarea,
    descripcion: string,
  ) {
    return tx.actividadTarea.create({
      data: {
        tareaId,
        usuarioId,
        tipo,
        descripcion: descripcion.slice(0, 300),
      },
    });
  }

  registrarVarios(
    tx: Prisma.TransactionClient,
    tareaId: string,
    usuarioId: string,
    eventos: { tipo: TipoActividadTarea; descripcion: string }[],
  ) {
    if (eventos.length === 0) return Promise.resolve();
    // Un milisegundo entre eventos para que el orden del historial sea estable.
    const base = Date.now();
    return tx.actividadTarea.createMany({
      data: eventos.map((e, i) => ({
        tareaId,
        usuarioId,
        tipo: e.tipo,
        descripcion: e.descripcion.slice(0, 300),
        createdAt: new Date(base + i),
      })),
    });
  }
}
