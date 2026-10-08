import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';
import { EsZonaHoraria } from '../validators/es-zona-horaria.validator';

export class CrearOrganizacionDto {
  @Trim()
  @IsString({ message: 'El nombre es obligatorio.' })
  @Length(2, 150, { message: 'El nombre debe tener entre 2 y 150 caracteres.' })
  nombre!: string;

  @IsOptional()
  @IsString({ message: 'La zona horaria no es válida.' })
  @MaxLength(64, { message: 'La zona horaria no es válida.' })
  @EsZonaHoraria()
  zonaHoraria: string = 'America/Lima';
}
