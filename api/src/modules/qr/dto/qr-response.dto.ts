/** QR dinámico vigente: el texto a mostrar y hasta cuándo vale. */
export class QrResponseDto {
  token!: string;
  /** Fecha del QR del día (`YYYY-MM-DD`, zona de la organización). */
  fecha!: string;
  /** Fin de la ventana actual: luego el QR rota. */
  expiraEn!: Date;
  ventanaSeg!: number;

  static desde(datos: QrResponseDto): QrResponseDto {
    return Object.assign(new QrResponseDto(), datos);
  }
}
