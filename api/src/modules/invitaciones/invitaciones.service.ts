import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RolMiembro, Usuario } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

// Sin caracteres ambiguos (0/O, 1/I) para que el código sea fácil de escribir en el móvil.
const ALFABETO_TOKEN = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LONGITUD_TOKEN = 10;
const DIAS_VIGENCIA = 7;
const ROLES_INVITABLES: RolMiembro[] = ['ADMIN', 'SUPERVISOR', 'EMPLEADO'];
const ROLES_QUE_INVITAN: RolMiembro[] = ['SUPER_ADMIN', 'ADMIN'];
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class InvitacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(usuario: Usuario, organizacionId: string, body: unknown) {
    const { email, rol } = this.validarInvitacion(body);

    const membresia = await this.prisma.miembroOrganizacion.findUnique({
      where: { usuarioId_organizacionId: { usuarioId: usuario.id, organizacionId } },
    });
    if (!membresia || membresia.estado !== 'ACTIVO') {
      throw new NotFoundException('Organización no encontrada');
    }
    if (!ROLES_QUE_INVITAN.includes(membresia.rol)) {
      throw new ForbiddenException('Solo un ADMIN puede invitar miembros');
    }

    const yaEsMiembro = await this.prisma.miembroOrganizacion.findFirst({
      where: { organizacionId, estado: 'ACTIVO', usuario: { email } },
    });
    if (yaEsMiembro) throw new ConflictException('Ese correo ya es miembro de la organización');

    const expiraEn = new Date(Date.now() + DIAS_VIGENCIA * 24 * 60 * 60 * 1000);
    const { invitadoPor: _invitadoPor, organizacionId: _org, ...invitacion } =
      await this.prisma.invitacion.create({
        data: {
          organizacionId,
          email,
          rol,
          token: this.generarToken(),
          invitadoPor: usuario.id,
          expiraEn,
        },
      });
    return invitacion;
  }

  async aceptar(usuario: Usuario, tokenRecibido: string) {
    const token = tokenRecibido.trim().toUpperCase();
    const invitacion = await this.prisma.invitacion.findUnique({ where: { token } });
    if (!invitacion) throw new NotFoundException('Código de invitación inexistente');

    if (invitacion.estado !== 'PENDIENTE') {
      throw new GoneException('La invitación ya fue utilizada o cancelada');
    }
    if (invitacion.expiraEn.getTime() < Date.now()) {
      await this.prisma.invitacion.update({
        where: { id: invitacion.id },
        data: { estado: 'EXPIRADA' },
      });
      throw new GoneException('La invitación expiró');
    }
    if (invitacion.email.toLowerCase() !== usuario.email.toLowerCase()) {
      throw new ForbiddenException('Esta invitación fue emitida para otro correo');
    }

    const clave = {
      usuarioId_organizacionId: {
        usuarioId: usuario.id,
        organizacionId: invitacion.organizacionId,
      },
    };
    const existente = await this.prisma.miembroOrganizacion.findUnique({ where: clave });
    if (existente?.estado === 'ACTIVO') {
      throw new ConflictException('Ya eres miembro de esta organización');
    }

    const datosMiembro = { rol: invitacion.rol, estado: 'ACTIVO' as const, fechaIngreso: new Date() };
    const [miembro] = await this.prisma.$transaction([
      this.prisma.miembroOrganizacion.upsert({
        where: clave,
        create: {
          usuarioId: usuario.id,
          organizacionId: invitacion.organizacionId,
          ...datosMiembro,
        },
        update: datosMiembro,
        include: { usuario: true },
      }),
      this.prisma.invitacion.update({
        where: { id: invitacion.id },
        data: { estado: 'ACEPTADA' },
      }),
    ]);

    const { usuarioId: _u, organizacionId: _o, ...respuesta } = miembro;
    return respuesta;
  }

  private validarInvitacion(body: unknown): { email: string; rol: RolMiembro } {
    const { email, rol } = (body ?? {}) as Record<string, unknown>;

    if (typeof email !== 'string' || email.length > 255 || !REGEX_EMAIL.test(email.trim())) {
      throw new BadRequestException('El correo no es válido.');
    }
    if (typeof rol !== 'string' || !ROLES_INVITABLES.includes(rol as RolMiembro)) {
      throw new BadRequestException('El rol debe ser ADMIN, SUPERVISOR o EMPLEADO.');
    }
    return { email: email.trim().toLowerCase(), rol: rol as RolMiembro };
  }

  private generarToken(): string {
    return Array.from(
      { length: LONGITUD_TOKEN },
      () => ALFABETO_TOKEN[randomInt(ALFABETO_TOKEN.length)],
    ).join('');
  }
}
