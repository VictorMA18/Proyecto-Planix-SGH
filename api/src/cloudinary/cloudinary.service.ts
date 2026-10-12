import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

export interface ArchivoSubido {
  url: string;
  publicId: string;
}

/**
 * Cliente de Cloudinary para los adjuntos de tareas. Las credenciales viven solo en el entorno del
 * backend (documentacion/10) y se leen al usarse: la API y el CI arrancan aunque no estén.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private configurado = false;

  private configurar() {
    if (this.configurado) return;
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env;
    if (
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      throw new ServiceUnavailableException(
        'Los adjuntos no están disponibles: falta configurar Cloudinary en el servidor.',
      );
    }
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    this.configurado = true;
  }

  /** Sube el archivo (las imágenes como `image`, los PDF como `raw`) y devuelve su URL segura. */
  async subir(
    buffer: Buffer,
    carpeta: string,
    esImagen: boolean,
  ): Promise<ArchivoSubido> {
    this.configurar();
    try {
      const resultado = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { folder: carpeta, resource_type: esImagen ? 'image' : 'raw' },
              (error, respuesta) =>
                error || !respuesta
                  ? reject(
                      Object.assign(
                        new Error(error?.message ?? 'Cloudinary no respondió.'),
                        { httpCode: error?.http_code },
                      ),
                    )
                  : resolve(respuesta),
            )
            .end(buffer);
        },
      );
      return { url: resultado.secure_url, publicId: resultado.public_id };
    } catch (err) {
      // Un rechazo de Cloudinary no es un error del servidor: se explica en lugar de un 500.
      const { message, httpCode } = err as Error & { httpCode?: number };
      this.logger.error(
        `Cloudinary rechazó la subida (${httpCode ?? '?'}): ${message}`,
      );
      throw new BadGatewayException(
        httpCode === 401 || httpCode === 403
          ? 'Cloudinary rechazó la subida: la clave de API no tiene permiso para subir archivos. Revisa sus permisos en Cloudinary.'
          : 'No se pudo subir el archivo a Cloudinary. Inténtalo de nuevo.',
      );
    }
  }

  /**
   * Descarga un archivo ya subido. Los PDF se guardan sin extensión (Cloudinary bloquea la entrega
   * de `.pdf` en cuentas gratuitas) y se sirven como `octet-stream` con un nombre interno: la API
   * los reenvía con su tipo y su nombre original (ver AdjuntosService.archivo).
   */
  async descargar(url: string): Promise<Buffer> {
    const respuesta = await fetch(url).catch(() => null);
    if (!respuesta?.ok) {
      this.logger.error(
        `No se pudo descargar ${url} de Cloudinary (${respuesta?.status ?? 'sin respuesta'})`,
      );
      throw new BadGatewayException(
        'No se pudo obtener el archivo de Cloudinary. Inténtalo de nuevo.',
      );
    }
    return Buffer.from(await respuesta.arrayBuffer());
  }

  /** Borra un archivo. Un fallo se registra pero no interrumpe la operación que lo pidió. */
  async eliminar(publicId: string, esImagen: boolean): Promise<void> {
    try {
      this.configurar();
      await cloudinary.uploader.destroy(publicId, {
        resource_type: esImagen ? 'image' : 'raw',
      });
    } catch (err) {
      this.logger.warn(
        `No se pudo borrar ${publicId} de Cloudinary: ${(err as Error).message}`,
      );
    }
  }
}
