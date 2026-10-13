import type { Ionicons } from '@expo/vector-icons';

import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { ShiftStatus } from '@/utils/attendance';

/** Etiqueta, icono y colores del estado del turno de hoy. */
export const SHIFT_STATUS: Record<
  ShiftStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; background: string }
> = {
  LIBRE: { label: 'HOY LIBRE', icon: 'cafe-outline', color: ThemeColors.mutedText, background: '#F1F0F5' },
  PROXIMO: { label: 'POR EMPEZAR', icon: 'time-outline', color: ThemeStatus.warningText, background: ThemeStatus.warningBg },
  EN_CURSO: { label: 'EN CURSO', icon: 'radio-button-on', color: ThemeStatus.success, background: ThemeStatus.successBg },
  TERMINADO: { label: 'TERMINADO', icon: 'checkmark-done', color: ThemeStatus.info, background: ThemeStatus.infoBg },
};
