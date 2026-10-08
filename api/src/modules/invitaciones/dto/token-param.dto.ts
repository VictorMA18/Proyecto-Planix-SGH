import { IsString, Length } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

/** Parámetro de ruta `:token` (código de invitación personal o genérico). */
export class TokenParamDto {
  @Trim()
  @IsString({ message: 'El código no es válido.' })
  @Length(4, 64, { message: 'El código no es válido.' })
  token!: string;
}
