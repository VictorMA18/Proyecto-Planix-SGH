import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';

const MENSAJE = 'El archivo supera el tamaño máximo de 10 MB.';

/** El límite de multer responde en inglés: se traduce el `413` al mensaje en español de la API. */
@Catch(PayloadTooLargeException)
export class ArchivoDemasiadoGrandeFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost) {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(413)
      .json({ statusCode: 413, message: MENSAJE, error: 'Payload Too Large' });
  }
}
