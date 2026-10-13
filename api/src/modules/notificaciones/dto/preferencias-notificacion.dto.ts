import { ModoAlerta } from '@prisma/client';
import { IsBoolean, IsEnum } from 'class-validator';

/** Cuerpo de `PUT /me/preferencias-notificacion` (reemplazo completo). */
export class PreferenciasNotificacionDto {
  @IsBoolean({ message: 'Indica si quieres recibir notificaciones push.' })
  push!: boolean;

  @IsBoolean({ message: 'Indica si quieres los recordatorios de fichaje.' })
  recordatoriosFichaje!: boolean;

  @IsBoolean({ message: 'Indica si quieres las novedades de tus tareas.' })
  novedadesTareas!: boolean;

  @IsEnum(ModoAlerta, {
    message: 'El modo de alerta debe ser SONIDO, VIBRACION o SILENCIO.',
  })
  modoAlerta!: ModoAlerta;
}
