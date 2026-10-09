import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

/** Cuerpo de `POST /asistencia/entrada`: el texto leído del QR (la organización sale de él). */
export class RegistrarEntradaDto {
  @Trim()
  @IsString({ message: 'El código QR no es válido.' })
  @IsNotEmpty({ message: 'Escanea el código QR de tu sede.' })
  @MaxLength(200, { message: 'El código QR no es válido.' })
  token!: string;
}
