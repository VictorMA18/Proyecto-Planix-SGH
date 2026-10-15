import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { TeamPagination } from '@/components/team';
import { ProgressBar, StatusChip } from '@/components/ui';
import { DAILY_LOG_PAGE_SIZE } from '@/constants/metrics';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { DailyLogEntry, MetricsPeriod } from '@/schemas/metrics.schema';
import { formatClock24 } from '@/utils/format';
import { formatHoursShort, formatLogDay } from '@/utils/metrics';

/** Chip del día: puntual, tarde, ausente (tenía turno y no vino), sin turno o libre. */
function dayStatus(day: DailyLogEntry): { text: string; color: string; background: string } {
  if (!day.entrada) {
    return day.conTurno
      ? { text: 'Ausente', color: ThemeStatus.errorText, background: ThemeStatus.errorBg }
      : { text: 'Libre', color: ThemeColors.mutedText, background: ThemeColors.inputBg };
  }
  if (day.puntual === null) return { text: 'Sin turno', color: ThemeStatus.info, background: ThemeStatus.infoBg };
  return day.puntual
    ? { text: 'Puntual', color: ThemeStatus.success, background: ThemeStatus.successBg }
    : { text: `Tarde · ${day.minutosTarde ?? 0} min`, color: ThemeStatus.warningText, background: ThemeStatus.warningBg };
}

/** Una lectura del QR: hora y si fue entrada o salida. */
const ScanChip: React.FC<{ scan: DailyLogEntry['escaneos'][number] }> = ({ scan }) => {
  const isEntry = scan.tipo === 'ENTRADA';
  return (
    <View
      style={{ borderCurve: 'continuous', backgroundColor: isEntry ? ThemeColors.tertiary : ThemeColors.inputBg }}
      className="flex-row items-center gap-1 rounded-full px-2 py-1"
    >
      <Ionicons
        name={isEntry ? 'log-in-outline' : 'log-out-outline'}
        size={12}
        color={isEntry ? ThemeColors.primary : ThemeColors.mutedText}
      />
      <Text
        style={{ color: isEntry ? ThemeColors.primary : ThemeColors.neutral, fontVariant: ['tabular-nums'] }}
        className="text-[11px] font-bold"
      >
        {formatClock24(scan.hora)}
      </Text>
    </View>
  );
};

const DayRow: React.FC<{ day: DailyLogEntry; last: boolean }> = ({ day, last }) => {
  const status = dayStatus(day);
  const worked = !!day.entrada;
  const scans = day.escaneos
    .map((s) => `${s.tipo === 'ENTRADA' ? 'entrada' : 'salida'} ${formatClock24(s.hora)}`)
    .join(', ');

  return (
    <View
      accessible
      accessibilityLabel={`${formatLogDay(day.fecha)}: ${status.text}${worked ? `, ${day.horas} horas` : ''}${
        scans ? `. Escaneos: ${scans}` : ''
      }`}
      style={{ opacity: worked || day.conTurno ? 1 : 0.55 }}
      className={`py-3 ${last ? '' : 'border-b border-borderBg'}`}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-sm font-bold text-neutral">{formatLogDay(day.fecha)}</Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-extrabold text-neutral" style={{ fontVariant: ['tabular-nums'] }}>
            {worked ? formatHoursShort(day.horas) : '—'}
          </Text>
          <StatusChip text={status.text} color={status.color} background={status.background} />
        </View>
      </View>
      {day.escaneos.length > 0 ? (
        <View className="flex-row flex-wrap items-center gap-1.5 mt-2">
          <Ionicons name="qr-code-outline" size={13} color={ThemeColors.mutedText} />
          {day.escaneos.map((scan) => (
            <ScanChip key={scan.hora} scan={scan} />
          ))}
          {day.horasExtra > 0 ? (
            <Text style={{ color: ThemeStatus.success }} className="text-[11px] font-bold">
              +{formatHoursShort(day.horasExtra)} extra
            </Text>
          ) : null}
        </View>
      ) : (
        <Text className="mt-1 text-xs text-neutral-muted">Sin escaneos</Text>
      )}
    </View>
  );
};

interface DailyLogSectionProps {
  log: DailyLogEntry[];
  tasks: MetricsPeriod['tareas'];
}

/**
 * Vista individual: en lugar del detalle de colaboradores, cada día del periodo (estado, horas y
 * los escaneos QR) y el avance de sus tareas. Va paginado para no alargar la pantalla.
 */
export const DailyLogSection: React.FC<DailyLogSectionProps> = ({ log, tasks }) => {
  const [page, setPage] = useState(1);
  const first = log[0]?.fecha;

  // Otro periodo u otra persona: vuelve a la primera página.
  useEffect(() => {
    setPage(1);
  }, [first, log.length]);

  const visible = log.slice((page - 1) * DAILY_LOG_PAGE_SIZE, page * DAILY_LOG_PAGE_SIZE);

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
        Registro diario
      </Text>

      {tasks && tasks.total > 0 ? (
        <View style={{ borderCurve: 'continuous' }} className="bg-cardBg rounded-2xl p-4 shadow-sm shadow-primary/10">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkbox-outline" size={18} color={ThemeColors.primary} />
              <Text className="text-sm font-bold text-neutral">Tareas del periodo</Text>
            </View>
            <Text className="text-sm font-extrabold text-primary">
              {tasks.completadas}/{tasks.total}
            </Text>
          </View>
          <ProgressBar className="mt-3" value={(tasks.completadas / tasks.total) * 100} color={ThemeColors.primary} />
        </View>
      ) : null}

      <View style={{ borderCurve: 'continuous' }} className="bg-cardBg rounded-3xl px-5 py-1 shadow-sm shadow-primary/10">
        {log.length === 0 ? (
          <Text className="py-4 text-sm text-neutral-muted">Este periodo aún no empieza.</Text>
        ) : (
          visible.map((day, i) => <DayRow key={day.fecha} day={day} last={i === visible.length - 1} />)
        )}
      </View>

      {log.length > DAILY_LOG_PAGE_SIZE ? (
        <TeamPagination page={page} pageSize={DAILY_LOG_PAGE_SIZE} total={log.length} onChange={setPage} />
      ) : null}
    </View>
  );
};
