import { BadRequestException, Injectable } from '@nestjs/common';
import type { CodigoQR, Organizacion, Usuario } from '@prisma/client';
import { randomBytes } from 'crypto';
import {
  QR_VENTANAS_DE_GRACIA,
  QR_VENTANA_SEG,
} from '../../../common/constants/asistencia.constants';
import { RelojService } from '../../../common/reloj/reloj.service';
import { esUnicoDuplicado } from '../../../common/utils/prisma-error.util';
import {
  comoFechaDb,
  desdeFechaDb,
  fechaLocal,
  instanteLocal,
  sumarDias,
} from '../../../common/utils/zona-horaria.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccesoOrganizacionService } from '../../organizaciones/services/acceso-organizacion.service';
import { QrResponseDto } from '../dto/qr-response.dto';
import {
  crearTokenQr,
  finDeVentana,
  firmaValida,
  leerTokenQr,
  ventanaDe,
} from '../utils/qr-token.util';

const QR_INVALIDO =
  'El código QR no es válido o ya expiró. Escanea el código vigente.';

@Injectable()
export class QrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acceso: AccesoOrganizacionService,
    private readonly reloj: RelojService,
  ) {}

  /** `GET /organizaciones/{id}/qr/hoy`: solo ADMIN. */
  async vigente(
    usuario: Usuario,
    organizacionId: string,
  ): Promise<QrResponseDto> {
    await this.acceso.exigirAdmin(usuario.id, organizacionId);
    const organizacion = await this.prisma.organizacion.findUniqueOrThrow({
      where: { id: organizacionId },
    });
    return this.generar(organizacion, usuario.id);
  }

  /** QR dinámico de la ventana actual (crea el QR del día si aún no existe). Sin control de acceso. */
  async generar(
    organizacion: Organizacion,
    generadoPor: string,
  ): Promise<QrResponseDto> {
    const ahora = this.reloj.ahora();
    const fecha = fechaLocal(ahora, organizacion.zonaHoraria);
    const codigo = await this.delDia(organizacion, fecha, generadoPor);
    const ventana = ventanaDe(ahora);
    const finVentana = finDeVentana(ventana);

    return QrResponseDto.desde({
      token: crearTokenQr(codigo.id, codigo.token, ventana),
      fecha,
      // La última ventana del día termina a medianoche, cuando cambia el QR del día.
      expiraEn: finVentana < codigo.expiraEn ? finVentana : codigo.expiraEn,
      ventanaSeg: QR_VENTANA_SEG,
    });
  }

  /**
   * Comprueba el texto escaneado: formato, firma, ventana actual (o la anterior, como margen) y
   * que el QR sea el de hoy en la zona de la organización. Lanza `400` si algo no cuadra.
   */
  async validar(
    token: string,
  ): Promise<CodigoQR & { organizacion: Organizacion }> {
    const leido = leerTokenQr(token);
    if (!leido) throw new BadRequestException(QR_INVALIDO);

    const codigo = await this.prisma.codigoQR.findUnique({
      where: { id: leido.codigoQrId },
      include: { organizacion: true },
    });
    if (!codigo || !firmaValida(codigo.token, leido))
      throw new BadRequestException(QR_INVALIDO);

    const ahora = this.reloj.ahora();
    const actual = ventanaDe(ahora);
    const enVentana =
      leido.ventana <= actual &&
      leido.ventana >= actual - QR_VENTANAS_DE_GRACIA;
    const deHoy =
      desdeFechaDb(codigo.fecha) ===
      fechaLocal(ahora, codigo.organizacion.zonaHoraria);
    if (!enVentana || !deHoy) throw new BadRequestException(QR_INVALIDO);

    return codigo;
  }

  private async delDia(
    organizacion: Organizacion,
    fecha: string,
    generadoPor: string,
  ) {
    const where = {
      organizacionId_fecha: {
        organizacionId: organizacion.id,
        fecha: comoFechaDb(fecha),
      },
    };
    const existente = await this.prisma.codigoQR.findUnique({ where });
    if (existente) return existente;

    try {
      return await this.prisma.codigoQR.create({
        data: {
          organizacionId: organizacion.id,
          fecha: comoFechaDb(fecha),
          token: randomBytes(32).toString('hex'),
          generadoPor,
          expiraEn: instanteLocal(
            sumarDias(fecha, 1),
            0,
            organizacion.zonaHoraria,
          ),
        },
      });
    } catch (err) {
      // Otra petición lo creó a la vez: se usa ese.
      if (esUnicoDuplicado(err))
        return this.prisma.codigoQR.findUniqueOrThrow({ where });
      throw err;
    }
  }
}
