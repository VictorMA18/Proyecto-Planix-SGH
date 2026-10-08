import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Usuario } from '@prisma/client';
import { DIAS_VIGENCIA_INVITACION } from '../../../common/constants/invitaciones.constants';
import { normalizarCodigo } from '../../../common/utils/codigo.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { MiembroResponseDto } from '../../organizaciones/dto/miembro-response.dto';
import { AccesoOrganizacionService } from '../../organizaciones/services/acceso-organizacion.service';
import { MiembrosService } from '../../organizaciones/services/miembros.service';
import { CrearInvitacionDto } from '../dto/crear-invitacion.dto';
import { InvitacionCreadaResponseDto } from '../dto/invitacion-response.dto';
import { InvitacionPendienteResponseDto } from '../dto/invitacion-pendiente-response.dto';
import { CodigosInvitacionService } from './codigos-invitacion.service';

const DIA_MS = 24 * 60 * 60 * 1000;

/** Invitaciones personales (correo + rol) y aceptación de cualquier código de invitación. */
@Injectable()
export class InvitacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acceso: AccesoOrganizacionService,
    private readonly miembros: MiembrosService,
    private readonly codigos: CodigosInvitacionService,
  ) {}

  async crear(
    usuario: Usuario,
    organizacionId: string,
    { email, rol }: CrearInvitacionDto,
  ): Promise<InvitacionCreadaResponseDto> {
    await this.acceso.exigirAdmin(usuario.id, organizacionId);

    const yaEsMiembro = await this.prisma.miembroOrganizacion.findFirst({
      where: { organizacionId, estado: 'ACTIVO', usuario: { email } },
    });
    if (yaEsMiembro)
      throw new ConflictException(
        'Ese correo ya es miembro de la organización',
      );

    const pendiente = await this.prisma.invitacion.findFirst({
      where: {
        organizacionId,
        email,
        estado: 'PENDIENTE',
        expiraEn: { gt: new Date() },
      },
    });
    if (pendiente) {
      throw new ConflictException(
        'Ya hay una invitación pendiente para ese correo. Puedes reenviarla.',
      );
    }

    const invitacion = await this.prisma.invitacion.create({
      data: {
        organizacionId,
        email,
        rol,
        token: await this.codigos.generarCodigoLibre(),
        invitadoPor: usuario.id,
        expiraEn: new Date(Date.now() + DIAS_VIGENCIA_INVITACION * DIA_MS),
      },
    });
    return InvitacionCreadaResponseDto.desdeCreada(invitacion);
  }

  /** Renueva la vigencia de una invitación que no se aceptó ni se canceló. */
  async reenviar(
    usuario: Usuario,
    invitacionId: string,
  ): Promise<InvitacionPendienteResponseDto> {
    const invitacion = await this.prisma.invitacion.findUnique({
      where: { id: invitacionId },
    });
    if (!invitacion) throw new NotFoundException('Invitación inexistente');

    await this.acceso.exigirAdmin(usuario.id, invitacion.organizacionId);

    if (invitacion.estado === 'ACEPTADA' || invitacion.estado === 'CANCELADA') {
      throw new GoneException('La invitación ya fue aceptada o cancelada');
    }

    const renovada = await this.prisma.invitacion.update({
      where: { id: invitacion.id },
      data: {
        estado: 'PENDIENTE',
        expiraEn: new Date(Date.now() + DIAS_VIGENCIA_INVITACION * DIA_MS),
      },
    });
    const invitado = await this.prisma.usuario.findUnique({
      where: { email: renovada.email },
      select: { nombre: true },
    });
    return InvitacionPendienteResponseDto.desde(renovada, invitado?.nombre);
  }

  /**
   * Acepta un código: primero se busca como invitación personal y, si no existe, como código
   * genérico de la organización.
   */
  async aceptar(
    usuario: Usuario,
    tokenRecibido: string,
  ): Promise<MiembroResponseDto> {
    const token = normalizarCodigo(tokenRecibido);
    const invitacion = await this.prisma.invitacion.findUnique({
      where: { token },
    });
    if (!invitacion) return this.codigos.canjear(usuario, token);

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
      throw new ForbiddenException(
        'Esta invitación fue emitida para otro correo',
      );
    }

    const miembro = await this.prisma.$transaction(async (tx) => {
      const activado = await this.miembros.activar(
        usuario.id,
        invitacion.organizacionId,
        invitacion.rol,
        tx,
      );
      await tx.invitacion.update({
        where: { id: invitacion.id },
        data: { estado: 'ACEPTADA' },
      });
      return activado;
    });
    return MiembroResponseDto.desde(miembro);
  }
}
