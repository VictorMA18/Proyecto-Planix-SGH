import { PlataformaDispositivo } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsObject,
  IsString,
  IsUrl,
  Length,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class ClavesWebPushDto {
  @IsString({ message: 'Falta la clave p256dh de la suscripción.' })
  @Length(1, 255, { message: 'La clave p256dh no es válida.' })
  p256dh!: string;

  @IsString({ message: 'Falta la clave auth de la suscripción.' })
  @Length(1, 255, { message: 'La clave auth no es válida.' })
  auth!: string;
}

/** Suscripción Web Push del navegador (`PushSubscription.toJSON()` sin `expirationTime`). */
export class SuscripcionWebPushDto {
  @IsUrl(
    { protocols: ['https'], require_protocol: true, require_tld: false },
    { message: 'El endpoint de la suscripción debe ser una URL https.' },
  )
  endpoint!: string;

  @IsObject({ message: 'Faltan las claves de la suscripción.' })
  @ValidateNested()
  @Type(() => ClavesWebPushDto)
  keys!: ClavesWebPushDto;
}

/** Cuerpo de `POST /push-tokens`: token de Expo (móvil) o suscripción Web Push (web). */
export class RegistrarPushTokenDto {
  @IsEnum(PlataformaDispositivo, {
    message: 'La plataforma debe ser ANDROID, IOS o WEB.',
  })
  plataforma!: PlataformaDispositivo;

  @ValidateIf((o: RegistrarPushTokenDto) => o.plataforma !== 'WEB')
  @IsString({ message: 'Falta el token de Expo del dispositivo.' })
  @Length(1, 255, { message: 'El token de Expo no es válido.' })
  expoPushToken?: string;

  @ValidateIf((o: RegistrarPushTokenDto) => o.plataforma === 'WEB')
  @IsObject({ message: 'Falta la suscripción Web Push del navegador.' })
  @ValidateNested()
  @Type(() => SuscripcionWebPushDto)
  webPushSubscription?: SuscripcionWebPushDto;
}

/** Cuerpo de `DELETE /push-tokens`: el token de Expo o el endpoint web de este dispositivo. */
export class QuitarPushTokenDto {
  @ValidateIf((o: QuitarPushTokenDto) => o.endpoint === undefined)
  @IsString({ message: 'Indica el token de Expo o el endpoint web.' })
  @Length(1, 255, { message: 'El token de Expo no es válido.' })
  expoPushToken?: string;

  @ValidateIf((o: QuitarPushTokenDto) => o.expoPushToken === undefined)
  @IsString({ message: 'Indica el token de Expo o el endpoint web.' })
  @Length(1, 2048, { message: 'El endpoint no es válido.' })
  endpoint?: string;
}
