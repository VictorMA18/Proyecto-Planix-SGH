import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

/** Query de `GET /tareas/{id}/adjuntos/{adjuntoId}/archivo`. */
export class ArchivoQueryDto {
  /** `true`: se descarga (`attachment`); por defecto se muestra en el visor (`inline`). */
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    value === 'true' || value === '1'
      ? true
      : value === 'false' || value === '0'
        ? false
        : value,
  )
  @IsBoolean({ message: 'El parámetro «descargar» debe ser true o false.' })
  descargar?: boolean;
}
