/** Segundos que dura cada versión del QR dinámico antes de rotar. */
export const QR_VENTANA_SEG = 120;

/** Ventanas anteriores que se siguen aceptando (margen para quien escanea justo al rotar). */
export const QR_VENTANAS_DE_GRACIA = 1;

/** Caracteres hexadecimales de la firma HMAC que viajan en el QR. */
export const QR_LONGITUD_FIRMA = 20;

/** Prefijo y versión del formato del QR: `PLX1.<codigoQrId>.<ventana>.<firma>`. */
export const QR_PREFIJO = 'PLX1';

/** Rango máximo de días de un reporte de asistencia. */
export const REPORTE_MAX_DIAS = 92;

/** Tolerancia de entrada permitida, en minutos. */
export const TOLERANCIA_MAX_MIN = 120;

/** Roles que ven el panel de presencia del equipo en «Inicio» (el QR solo lo ven los administradores). */
export const ROLES_CON_PANEL = ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] as const;
