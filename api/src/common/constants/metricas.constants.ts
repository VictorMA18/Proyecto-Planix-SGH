/** Periodos de la pestaña Métricas y del reporte exportable. */
export const TIPOS_PERIODO = ['SEMANA', 'MES'] as const;
export type TipoPeriodo = (typeof TIPOS_PERIODO)[number];

export const FORMATOS_REPORTE = ['PDF', 'XLSX'] as const;
export type FormatoReporte = (typeof FORMATOS_REPORTE)[number];

/** Umbrales (en %) del nivel de puntualidad que se muestra junto al índice. */
export const NIVEL_PUNTUALIDAD = { EXCELENTE: 95, BUENO: 85 } as const;
export type NivelPuntualidad = 'EXCELENTE' | 'BUENO' | 'MEJORABLE';

/** Colaboradores destacados en el resumen del equipo. */
export const COLABORADORES_DESTACADOS = 3;

/** Paginación de «Ver todos». */
export const COLABORADORES_PAGINA = 10;
export const COLABORADORES_PAGINA_MAX = 50;
