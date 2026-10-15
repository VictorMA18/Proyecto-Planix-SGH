import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ActionSheet, ActionSheetItem } from '@/components/ui';
import { REPORT_FORMATS } from '@/constants/metrics';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { ReportFormat } from '@/schemas/metrics.schema';

interface ExportReportCardProps {
  isTeam: boolean;
  busy: ReportFormat | null;
  error: string;
  onExport: (format: ReportFormat) => void;
}

/** «Exportar reporte»: elige PDF o Excel; el archivo lo arma el backend. */
export const ExportReportCard: React.FC<ExportReportCardProps> = ({ isTeam, busy, error, onExport }) => {
  const [open, setOpen] = useState(false);

  const choose = (format: ReportFormat) => {
    setOpen(false);
    // Se espera a que la hoja termine de cerrarse antes de abrir la de compartir (iOS).
    setTimeout(() => onExport(format), 300);
  };

  return (
    <View className="gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Exportar reporte en PDF o Excel"
        accessibilityState={{ disabled: !!busy, busy: !!busy }}
        disabled={!!busy}
        onPress={() => setOpen(true)}
        className="active:opacity-80"
      >
        <View
          style={{ borderCurve: 'continuous', borderRadius: 16, borderWidth: 1.5, borderColor: ThemeColors.primary }}
          className="min-h-14 flex-row items-center justify-center gap-2 bg-cardBg px-4"
        >
          {busy ? (
            <ActivityIndicator color={ThemeColors.primary} />
          ) : (
            <Ionicons name="download-outline" size={20} color={ThemeColors.primary} />
          )}
          <Text className="text-base font-bold text-primary">
            {busy ? `Generando ${busy === 'PDF' ? 'PDF' : 'Excel'}…` : 'Exportar reporte (PDF / Excel)'}
          </Text>
        </View>
      </Pressable>
      {error ? (
        <Text style={{ color: ThemeStatus.errorText }} className="text-center text-xs font-semibold">
          {error}
        </Text>
      ) : (
        <Text className="text-center text-xs text-neutral-muted">
          Incluye resumen de horas, marcas de QR y {isTeam ? 'desglose por colaborador' : 'registro diario'}.
        </Text>
      )}

      <ActionSheet
        visible={open}
        onClose={() => setOpen(false)}
        header={
          <View>
            <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
              Exportar reporte
            </Text>
            <Text className="text-sm text-neutral-muted">Del periodo y la vista que estás mirando.</Text>
          </View>
        }
      >
        {REPORT_FORMATS.map((format) => (
          <ActionSheetItem
            key={format.value}
            icon={format.icon}
            label={format.label}
            description={format.description}
            onPress={() => choose(format.value)}
          />
        ))}
      </ActionSheet>
    </View>
  );
};
