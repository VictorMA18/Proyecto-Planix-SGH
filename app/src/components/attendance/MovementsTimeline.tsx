import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import type { AttendanceToday } from '@/schemas/attendance.schema';
import { buildTimeline, type TimelineKind } from '@/utils/attendance';
import { formatClock12 } from '@/utils/format';

const ICON: Record<TimelineKind, keyof typeof Ionicons.glyphMap> = {
  ENTRADA: 'log-in-outline',
  PAUSA: 'pause-outline',
  RETORNO: 'refresh-outline',
  SALIDA: 'log-out-outline',
  PREVISTA: 'log-out-outline',
};

/** Línea de tiempo de los movimientos de hoy; la salida prevista aparece atenuada. */
export const MovementsTimeline: React.FC<{ today: AttendanceToday }> = ({ today }) => {
  const events = buildTimeline(today);

  return (
    <View style={{ borderCurve: 'continuous' }} className="w-full bg-cardBg rounded-3xl p-6 shadow-lg shadow-primary/10">
      <Text accessibilityRole="header" className="text-xl font-extrabold text-neutral">
        Movimientos de hoy
      </Text>

      {events.length === 0 ? (
        <Text className="mt-4 text-sm text-neutral-muted">
          Aún no registras movimientos hoy. Escanea el QR de tu sede para marcar tu entrada.
        </Text>
      ) : (
        <View className="mt-5">
          {events.map((event, index) => {
            const time = formatClock12(event.hora);
            return (
              <View
                key={event.id}
                accessible
                accessibilityLabel={`${event.title}${event.prevista ? ' (prevista)' : ''}, ${time}. ${event.detail}`}
                className="flex-row"
              >
                <View className="items-center mr-4">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${event.prevista ? 'bg-screenBg border border-dashed border-neutral-muted' : 'bg-tertiary'}`}
                  >
                    <Ionicons
                      name={ICON[event.kind]}
                      size={18}
                      color={event.prevista ? ThemeColors.mutedText : ThemeColors.primary}
                    />
                  </View>
                  {index < events.length - 1 ? <View className="w-0.5 flex-1 min-h-4 bg-tertiary my-1" /> : null}
                </View>

                <View className={`flex-1 flex-row justify-between gap-3 ${index < events.length - 1 ? 'pb-5' : ''}`}>
                  <View className="flex-1">
                    <Text className={`text-base font-bold ${event.prevista ? 'text-neutral-muted' : 'text-neutral'}`}>
                      {event.title}
                    </Text>
                    <Text className="mt-0.5 text-sm text-neutral-muted">{event.detail}</Text>
                  </View>
                  <Text className={`text-sm font-bold ${event.prevista ? 'text-neutral-muted' : 'text-neutral'}`}>
                    {time}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};
