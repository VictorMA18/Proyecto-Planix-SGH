import type { Ionicons } from '@expo/vector-icons';

import { ThemeStatus } from '@/constants/theme';
import type { PeriodType, PunctualityLevel, ReportFormat } from '@/schemas/metrics.schema';

/** Colaboradores por página en «Ver todos». */
export const COLLABORATORS_PAGE_SIZE = 6;

/** Días por página del registro diario (vista individual). */
export const DAILY_LOG_PAGE_SIZE = 5;

export const PERIOD_TYPES: { value: PeriodType; label: string }[] = [
  { value: 'SEMANA', label: 'Semana' },
  { value: 'MES', label: 'Mes' },
];

/** Etiqueta y colores del nivel de puntualidad (umbrales en el backend: 95 % y 85 %). */
export const PUNCTUALITY_LEVEL: Record<PunctualityLevel, { label: string; color: string; background: string }> = {
  EXCELENTE: { label: 'Excelente', color: ThemeStatus.success, background: ThemeStatus.successBg },
  BUENO: { label: 'Bueno', color: ThemeStatus.info, background: ThemeStatus.infoBg },
  MEJORABLE: { label: 'Mejorable', color: ThemeStatus.warningText, background: ThemeStatus.warningBg },
};

export const REPORT_FORMATS: {
  value: ReportFormat;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'PDF',
    label: 'Reporte PDF',
    description: 'Documento listo para imprimir o compartir',
    icon: 'document-text-outline',
  },
  {
    value: 'XLSX',
    label: 'Hoja de Excel',
    description: 'Datos en tablas para filtrar y calcular',
    icon: 'grid-outline',
  },
];

/** Color de las barras que no son la de mayor carga (igual que en «Puntualidad semanal»). */
export const BAR_SOFT_COLOR = '#A58BEA';
