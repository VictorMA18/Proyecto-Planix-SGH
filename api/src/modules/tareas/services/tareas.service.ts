import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Organizacion, Prisma, Usuario } from '@prisma/client';
import { ROLES_GESTION_TAREAS } from '../../../common/constants/tareas.constants';
import { RelojService } from '../../../common/reloj/reloj.service';
import {
  fechaLocal,
  instanteLocal,
  lunesDe,
  sumarDias,
} from '../../../common/utils/zona-horaria.util';
import { CloudinaryService } from '../../../cloudinary/cloudinary.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificacionesService } from '../../notificaciones/services/notificaciones.service';
import {
  comentarioTarea,
  destinatariosTarea,
  type MensajeNotificacion,
  subtareaCompletada,
  tareaAsignada,
  tareaMovida,
} from '../../notificaciones/utils/mensajes.util';
import { AccesoOrganizacionService } from '../../organizaciones/services/acceso-organizacion.service';
import {
  ActividadResponseDto,
  ComentarioResponseDto,
} from '../dto/comentario-actividad-response.dto';
import { CrearTareaDto } from '../dto/crear-tarea.dto';
import {
  INCLUDE_TAREA,
  leerAdjuntos,
  type MiembroPorUsuario,
  TareaCalendarioResponseDto,
  type TareaCompleta,
  TareaDetalleResponseDto,
} from '../dto/tarea-response.dto';
import {
  describirCambios,
  ESTADO_TAREA_TEXTO,
  type FotoTarea,
} from '../utils/describir-cambios.util';
import { ActividadService } from './actividad.service';
import type { EstadoTarea } from '@prisma/client';

const SOLO_GESTION = 'Solo un ADMIN o SUPERVISOR puede gestionar tareas.';

/**
 * Tareas de una organización (documentacion/06, flujo 5.5). Ver, comentar, mover el estado y marcar
 * subtareas: cualquier miembro activo. Crear, editar, duplicar y eliminar: ADMIN y SUPERVISOR.
 */
@Injectable()
export class TareasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acceso: AccesoOrganizacionService,
    private readonly actividad: ActividadService,
    private readonly cloudinary: CloudinaryService,
    private readonly reloj: RelojService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  // ------------------------------------------------------------------ lectura

  async listar(
    usuario: Usuario,
    organizacionId: string,
    {
      desde,
      hasta,
      miembroId,
    }: { desde: string; hasta: string; miembroId?: string },
  ): Promise<TareaCalendarioResponseDto[]> {
    await this.acceso.exigirMiembro(usuario.id, organizacionId);
    const organizacion = await this.organizacion(organizacionId);

    let usuarioAsignado: string | undefined;
    if (miembroId) {
      const miembro = await this.prisma.miembroOrganizacion.findFirst({
        where: { id: miembroId, organizacionId },
      });
      if (!miembro) return [];
      usuarioAsignado = miembro.usuarioId;
    }
    return this.listarEntre(
      usuario.id,
      organizacion,
      desde,
      hasta,
      usuarioAsignado,
    );
  }

  /** `GET /me/tareas`: solo las asignadas al usuario. */
  async listarMias(
    usuario: Usuario,
    {
      organizacionId,
      desde,
      hasta,
    }: { organizacionId: string; desde: string; hasta: string },
  ): Promise<TareaCalendarioResponseDto[]> {
    await this.acceso.exigirMiembro(usuario.id, organizacionId);
    return this.listarEntre(
      usuario.id,
      await this.organizacion(organizacionId),
      desde,
      hasta,
      usuario.id,
    );
  }

  /** Tareas que empiezan entre dos fechas locales (ambas incluidas). Sin control de acceso. */
  async listarEntre(
    usuarioId: string,
    organizacion: Organizacion,
    desde: string,
    hasta: string,
    asignadaA?: string,
  ): Promise<TareaCalendarioResponseDto[]> {
    const tareas = await this.prisma.tarea.findMany({
      where: {
        organizacionId: organizacion.id,
        fechaInicio: {
          gte: instanteLocal(desde, 0, organizacion.zonaHoraria),
          lt: instanteLocal(sumarDias(hasta, 1), 0, organizacion.zonaHoraria),
        },
        ...(asignadaA
          ? { asignaciones: { some: { usuarioId: asignadaA } } }
          : {}),
      },
      include: INCLUDE_TAREA,
      orderBy: [{ fechaInicio: 'asc' }, { createdAt: 'asc' }],
    });
    const miembros = await this.miembrosPorUsuario(organizacion.id);
    return tareas.map((t) =>
      TareaCalendarioResponseDto.desde(t, miembros, usuarioId),
    );
  }

  /** Avance de la semana actual (lunes a domingo): todas o solo las asignadas a alguien. */
  async avanceSemana(organizacion: Organizacion, asignadaA?: string) {
    const lunes = lunesDe(
      fechaLocal(this.reloj.ahora(), organizacion.zonaHoraria),
    );
    const where: Prisma.TareaWhereInput = {
      organizacionId: organizacion.id,
      fechaInicio: {
        gte: instanteLocal(lunes, 0, organizacion.zonaHoraria),
        lt: instanteLocal(sumarDias(lunes, 7), 0, organizacion.zonaHoraria),
      },
      ...(asignadaA
        ? { asignaciones: { some: { usuarioId: asignadaA } } }
        : {}),
    };
    const [total, completadas] = await Promise.all([
      this.prisma.tarea.count({ where }),
      this.prisma.tarea.count({ where: { ...where, estado: 'COMPLETADA' } }),
    ]);
    return { completadas, total };
  }

  async obtener(
    usuario: Usuario,
    tareaId: string,
  ): Promise<TareaDetalleResponseDto> {
    const tarea = await this.cargarConAcceso(usuario, tareaId);
    return this.detalle(tarea.id, usuario.id);
  }

  async comentarios(
    usuario: Usuario,
    tareaId: string,
  ): Promise<ComentarioResponseDto[]> {
    const tarea = await this.cargarConAcceso(usuario, tareaId);
    const [lista, miembros] = await Promise.all([
      this.prisma.comentarioTarea.findMany({
        where: { tareaId },
        include: { usuario: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.miembrosPorUsuario(tarea.organizacionId),
    ]);
    return lista.map((c) => ComentarioResponseDto.desde(c, miembros));
  }

  async historial(
    usuario: Usuario,
    tareaId: string,
  ): Promise<ActividadResponseDto[]> {
    const tarea = await this.cargarConAcceso(usuario, tareaId);
    const [lista, miembros] = await Promise.all([
      this.prisma.actividadTarea.findMany({
        where: { tareaId },
        include: { usuario: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.miembrosPorUsuario(tarea.organizacionId),
    ]);
    return lista.map((a) => ActividadResponseDto.desde(a, miembros));
  }

  // ------------------------------------------------------------------ escritura (ADMIN y SUPERVISOR)

  async crear(
    usuario: Usuario,
    organizacionId: string,
    dto: CrearTareaDto,
  ): Promise<TareaDetalleResponseDto> {
    await this.acceso.exigirRol(
      usuario.id,
      organizacionId,
      ROLES_GESTION_TAREAS,
      SOLO_GESTION,
    );
    const organizacion = await this.organizacion(organizacionId);
    const fechas = this.fechas(dto, organizacion);

    const { id, usuarios } = await this.prisma.$transaction(async (tx) => {
      const asignados = await this.resolverAsignados(
        tx,
        organizacionId,
        dto.miembroIds,
      );
      const tarea = await tx.tarea.create({
        data: {
          organizacionId,
          creadoPor: usuario.id,
          ...this.campos(dto, fechas),
          asignaciones: {
            create: asignados.map((a) => ({ usuarioId: a.usuarioId })),
          },
          subtareas: {
            create: dto.subtareas.map((s, orden) => ({
              titulo: s.titulo,
              completada: s.completada,
              orden,
            })),
          },
        },
      });
      await this.actividad.registrar(
        tx,
        tarea.id,
        usuario.id,
        'CREADA',
        'creó la tarea',
      );
      return { id: tarea.id, usuarios: asignados.map((a) => a.usuarioId) };
    });
    await this.avisarAsignacion(
      usuario,
      { id, organizacionId, titulo: dto.titulo },
      usuarios,
    );
    return this.detalle(id, usuario.id);
  }

  async actualizar(
    usuario: Usuario,
    tareaId: string,
    dto: CrearTareaDto,
  ): Promise<TareaDetalleResponseDto> {
    const actual = await this.cargarConAcceso(usuario, tareaId);
    await this.acceso.exigirRol(
      usuario.id,
      actual.organizacionId,
      ROLES_GESTION_TAREAS,
      SOLO_GESTION,
    );
    const organizacion = await this.organizacion(actual.organizacionId);
    const fechas = this.fechas(dto, organizacion);

    const propias = new Set(actual.subtareas.map((s) => s.id));
    const ajena = dto.subtareas.find((s) => s.id && !propias.has(s.id));
    if (ajena)
      throw new BadRequestException(
        'Alguna subtarea no pertenece a esta tarea.',
      );

    const antes = new Set(actual.asignaciones.map((a) => a.usuarioId));
    const nuevos = await this.prisma.$transaction(async (tx) => {
      const asignados = await this.resolverAsignados(
        tx,
        actual.organizacionId,
        dto.miembroIds,
      );
      const campos = this.campos(
        dto,
        fechas,
        actual.estado,
        actual.completadaEn,
      );

      await tx.tarea.update({ where: { id: tareaId }, data: campos });

      const usuarios = asignados.map((a) => a.usuarioId);
      await tx.asignacionTarea.deleteMany({
        where: { tareaId, usuarioId: { notIn: usuarios } },
      });
      await tx.asignacionTarea.createMany({
        data: usuarios.map((usuarioId) => ({ tareaId, usuarioId })),
        skipDuplicates: true,
      });

      const conservadas = dto.subtareas.filter((s) => s.id).map((s) => s.id!);
      await tx.subtareaTarea.deleteMany({
        where: { tareaId, id: { notIn: conservadas } },
      });
      const finales: { id: string; titulo: string; completada: boolean }[] = [];
      for (const [orden, s] of dto.subtareas.entries()) {
        const fila = s.id
          ? await tx.subtareaTarea.update({
              where: { id: s.id },
              data: { titulo: s.titulo, completada: s.completada, orden },
            })
          : await tx.subtareaTarea.create({
              data: {
                tareaId,
                titulo: s.titulo,
                completada: s.completada,
                orden,
              },
            });
        finales.push(fila);
      }

      const foto = this.foto(actual);
      const despues: FotoTarea = {
        ...foto,
        titulo: campos.titulo,
        estado: campos.estado,
        prioridad: campos.prioridad,
        fechaInicio: campos.fechaInicio,
        fechaFin: campos.fechaFin,
        ubicacion: campos.ubicacion,
        descripcion: campos.descripcion,
        etiquetas: campos.etiquetas,
        asignados,
        subtareas: finales,
      };
      await this.actividad.registrarVarios(
        tx,
        tareaId,
        usuario.id,
        describirCambios(foto, despues, usuario.id, organizacion.zonaHoraria),
      );
      return usuarios.filter((id) => !antes.has(id));
    });
    await this.avisarAsignacion(
      usuario,
      {
        id: tareaId,
        organizacionId: actual.organizacionId,
        titulo: dto.titulo,
      },
      nuevos,
    );
    return this.detalle(tareaId, usuario.id);
  }

  /** Copia con «(copia)», en Por hacer y con las subtareas sin marcar. Sin adjuntos: no se comparten archivos. */
  async duplicar(
    usuario: Usuario,
    tareaId: string,
  ): Promise<TareaDetalleResponseDto> {
    const original = await this.cargarConAcceso(usuario, tareaId);
    await this.acceso.exigirRol(
      usuario.id,
      original.organizacionId,
      ROLES_GESTION_TAREAS,
      SOLO_GESTION,
    );

    const id = await this.prisma.$transaction(async (tx) => {
      const copia = await tx.tarea.create({
        data: {
          organizacionId: original.organizacionId,
          creadoPor: usuario.id,
          titulo: `${original.titulo} (copia)`.slice(0, 200),
          descripcion: original.descripcion,
          enlace: original.enlace,
          fechaInicio: original.fechaInicio,
          fechaFin: original.fechaFin,
          prioridad: original.prioridad,
          ubicacion: original.ubicacion,
          etiquetas: original.etiquetas,
          estado: 'PENDIENTE',
          asignaciones: {
            create: original.asignaciones.map((a) => ({
              usuarioId: a.usuarioId,
            })),
          },
          subtareas: {
            create: original.subtareas.map((s, orden) => ({
              titulo: s.titulo,
              completada: false,
              orden,
            })),
          },
        },
      });
      await this.actividad.registrar(
        tx,
        copia.id,
        usuario.id,
        'DUPLICADA',
        `duplicó «${original.titulo}»`,
      );
      return copia.id;
    });
    const copia = await this.detalle(id, usuario.id);
    await this.avisarAsignacion(
      usuario,
      { id, organizacionId: original.organizacionId, titulo: copia.titulo },
      original.asignaciones.map((a) => a.usuarioId),
    );
    return copia;
  }

  /** Borra la tarea (comentarios, subtareas y actividad en cascada) y luego sus archivos en Cloudinary. */
  async eliminar(usuario: Usuario, tareaId: string): Promise<void> {
    const tarea = await this.cargarConAcceso(usuario, tareaId);
    await this.acceso.exigirRol(
      usuario.id,
      tarea.organizacionId,
      ROLES_GESTION_TAREAS,
      SOLO_GESTION,
    );
    await this.prisma.tarea.delete({ where: { id: tareaId } });
    await Promise.all(
      leerAdjuntos(tarea.adjuntos).map((a) =>
        this.cloudinary.eliminar(a.cloudinaryPublicId, a.tipo === 'IMAGEN'),
      ),
    );
  }

  // ------------------------------------------------------------------ cualquier miembro

  async cambiarEstado(
    usuario: Usuario,
    tareaId: string,
    estado: EstadoTarea,
  ): Promise<TareaDetalleResponseDto> {
    const tarea = await this.cargarConAcceso(usuario, tareaId);
    if (tarea.estado !== estado) {
      await this.prisma.$transaction(async (tx) => {
        await tx.tarea.update({
          where: { id: tareaId },
          data: {
            estado,
            completadaEn: estado === 'COMPLETADA' ? this.reloj.ahora() : null,
          },
        });
        await this.actividad.registrar(
          tx,
          tareaId,
          usuario.id,
          'ESTADO',
          `movió la tarea a ${ESTADO_TAREA_TEXTO[estado]}`,
        );
      });
      await this.avisarNovedad(
        usuario,
        tarea,
        tareaMovida(usuario.nombre, tarea.titulo, estado),
      );
    }
    return this.detalle(tareaId, usuario.id);
  }

  async marcarSubtarea(
    usuario: Usuario,
    tareaId: string,
    subtareaId: string,
    completada: boolean,
  ): Promise<{ id: string; titulo: string; completada: boolean }> {
    const tarea = await this.cargarConAcceso(usuario, tareaId);
    const subtarea = tarea.subtareas.find((s) => s.id === subtareaId);
    if (!subtarea) throw new NotFoundException('Subtarea no encontrada');

    const actualizada = await this.prisma.$transaction(async (tx) => {
      const fila = await tx.subtareaTarea.update({
        where: { id: subtareaId },
        data: { completada },
      });
      if (subtarea.completada !== completada) {
        await this.actividad.registrar(
          tx,
          tareaId,
          usuario.id,
          'SUBTAREA',
          `${completada ? 'completó' : 'reabrió'} «${subtarea.titulo}»`,
        );
      }
      return fila;
    });
    if (completada && !subtarea.completada) {
      await this.avisarNovedad(
        usuario,
        tarea,
        subtareaCompletada(usuario.nombre, subtarea.titulo, tarea.titulo),
      );
    }
    return {
      id: actualizada.id,
      titulo: actualizada.titulo,
      completada: actualizada.completada,
    };
  }

  async comentar(
    usuario: Usuario,
    tareaId: string,
    texto: string,
  ): Promise<ComentarioResponseDto> {
    const tarea = await this.cargarConAcceso(usuario, tareaId);
    const comentario = await this.prisma.$transaction(async (tx) => {
      const fila = await tx.comentarioTarea.create({
        data: { tareaId, usuarioId: usuario.id, texto },
        include: { usuario: true },
      });
      await this.actividad.registrar(
        tx,
        tareaId,
        usuario.id,
        'COMENTARIO',
        'comentó la tarea',
      );
      return fila;
    });
    await this.avisarNovedad(
      usuario,
      tarea,
      comentarioTarea(usuario.nombre, tarea.titulo, texto),
    );
    return ComentarioResponseDto.desde(
      comentario,
      await this.miembrosPorUsuario(tarea.organizacionId),
    );
  }

  // ------------------------------------------------------------------ notificaciones

  /** «Nueva tarea asignada» a quienes se acaban de asignar (sin quien asignó). */
  private async avisarAsignacion(
    actor: Usuario,
    tarea: { id: string; organizacionId: string; titulo: string },
    usuarioIds: string[],
  ) {
    await this.notificaciones.notificar({
      organizacionId: tarea.organizacionId,
      tipo: 'TAREA_ASIGNADA',
      ...tareaAsignada(actor.nombre, tarea.titulo),
      referenciaId: tarea.id,
      actorId: actor.id,
      usuarioIds,
    });
  }

  /** Novedad (estado, subtarea o comentario) a asignados y creador, salvo quien la hizo. */
  private async avisarNovedad(
    actor: Usuario,
    tarea: TareaCompleta,
    mensaje: MensajeNotificacion,
  ) {
    await this.notificaciones.notificar({
      organizacionId: tarea.organizacionId,
      tipo: 'TAREA_ACTUALIZADA',
      ...mensaje,
      referenciaId: tarea.id,
      actorId: actor.id,
      usuarioIds: destinatariosTarea(
        tarea.asignaciones.map((a) => a.usuarioId),
        tarea.creadoPor,
        actor.id,
      ),
      filtro: 'novedadesTareas',
    });
  }

  // ------------------------------------------------------------------ apoyo

  /** La tarea existe y el usuario es miembro activo de su organización; si no, 404 (no se revela). */
  async cargarConAcceso(
    usuario: Usuario,
    tareaId: string,
  ): Promise<TareaCompleta> {
    const tarea = await this.prisma.tarea.findUnique({
      where: { id: tareaId },
      include: INCLUDE_TAREA,
    });
    if (!tarea) throw new NotFoundException('Tarea no encontrada');
    try {
      await this.acceso.exigirMiembro(usuario.id, tarea.organizacionId);
    } catch {
      throw new NotFoundException('Tarea no encontrada');
    }
    return tarea;
  }

  async detalle(
    tareaId: string,
    usuarioId: string,
  ): Promise<TareaDetalleResponseDto> {
    const tarea = await this.prisma.tarea.findUniqueOrThrow({
      where: { id: tareaId },
      include: INCLUDE_TAREA,
    });
    return TareaDetalleResponseDto.desde(
      tarea,
      await this.miembrosPorUsuario(tarea.organizacionId),
      usuarioId,
    );
  }

  async miembrosPorUsuario(organizacionId: string): Promise<MiembroPorUsuario> {
    const miembros = await this.prisma.miembroOrganizacion.findMany({
      where: { organizacionId, estado: 'ACTIVO' },
      select: { id: true, usuarioId: true },
    });
    return new Map(miembros.map((m) => [m.usuarioId, m.id]));
  }

  organizacion(organizacionId: string) {
    return this.prisma.organizacion.findUniqueOrThrow({
      where: { id: organizacionId },
    });
  }

  /** Inicio y fin válidos: el fin, si existe, el mismo día local que el inicio. */
  private fechas(dto: CrearTareaDto, organizacion: Organizacion) {
    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin = dto.fechaFin ? new Date(dto.fechaFin) : null;
    if (
      fechaFin &&
      fechaLocal(fechaFin, organizacion.zonaHoraria) !==
        fechaLocal(fechaInicio, organizacion.zonaHoraria)
    ) {
      throw new BadRequestException(
        'La tarea debe terminar el mismo día en que empieza.',
      );
    }
    return { fechaInicio, fechaFin };
  }

  private campos(
    dto: CrearTareaDto,
    { fechaInicio, fechaFin }: { fechaInicio: Date; fechaFin: Date | null },
    estadoAnterior?: EstadoTarea,
    completadaAntes?: Date | null,
  ) {
    const completada = dto.estado === 'COMPLETADA';
    return {
      titulo: dto.titulo,
      descripcion: dto.descripcion || null,
      estado: dto.estado,
      prioridad: dto.prioridad,
      fechaInicio,
      fechaFin,
      ubicacion: dto.ubicacion || null,
      etiquetas: dto.etiquetas,
      completadaEn: completada
        ? estadoAnterior === 'COMPLETADA' && completadaAntes
          ? completadaAntes
          : this.reloj.ahora()
        : null,
    };
  }

  /** Solo se asignan miembros ACTIVOS de esta organización (por id de membresía). */
  private async resolverAsignados(
    tx: Prisma.TransactionClient,
    organizacionId: string,
    miembroIds: string[],
  ) {
    const miembros = await tx.miembroOrganizacion.findMany({
      where: { id: { in: miembroIds }, organizacionId, estado: 'ACTIVO' },
      include: { usuario: true },
    });
    if (miembros.length !== miembroIds.length) {
      throw new BadRequestException(
        'Algunas personas no pertenecen al equipo activo de la organización.',
      );
    }
    return miembros.map((m) => ({
      usuarioId: m.usuarioId,
      nombre: m.usuario.nombre,
    }));
  }

  private foto(tarea: TareaCompleta): FotoTarea {
    return {
      titulo: tarea.titulo,
      estado: tarea.estado,
      prioridad: tarea.prioridad,
      fechaInicio: tarea.fechaInicio,
      fechaFin: tarea.fechaFin,
      ubicacion: tarea.ubicacion,
      descripcion: tarea.descripcion,
      etiquetas: tarea.etiquetas,
      asignados: tarea.asignaciones.map((a) => ({
        usuarioId: a.usuarioId,
        nombre: a.usuario.nombre,
      })),
      subtareas: tarea.subtareas.map((s) => ({
        id: s.id,
        titulo: s.titulo,
        completada: s.completada,
      })),
    };
  }
}
