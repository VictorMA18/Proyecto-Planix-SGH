import React from 'react';
import { Text, View } from 'react-native';

import { StatusChip } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { AdminHome } from '@/schemas/home.schema';

const BAR_HEIGHT = 96;
const GOAL = 90;

/** Puntualidad de lunes a viernes: una barra por día y el promedio de la semana. */
export const WeeklyPunctuality: React.FC<{ semana: AdminHome['puntualidadSemanal'] }> = ({ semana }) => {
  const lastWithData = semana.dias.reduce((last, day, i) => (day.valor !== null ? i : last), -1);

  return (
    <View
      style={{ borderCurve: 'continuous' }}
      className="w-full bg-cardBg rounded-3xl p-5 shadow-sm shadow-primary/10"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
            Puntualidad Semanal
          </Text>
          <Text className="text-xs text-neutral-muted">Promedio ponderado Lun - Vie</Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] font-bold tracking-wider text-neutral-muted">PROMEDIO</Text>
          <Text className="text-2xl font-extrabold text-primary">{semana.promedio.toFixed(1)}%</Text>
          {semana.promedio >= GOAL ? (
            <StatusChip
              className="mt-1"
              text="Meta cumplida"
              color={ThemeStatus.success}
              background={ThemeStatus.successBg}
            />
          ) : (
            <StatusChip
              className="mt-1"
              text="Bajo la meta"
              color={ThemeStatus.warningText}
              background={ThemeStatus.warningBg}
            />
          )}
        </View>
      </View>

      <View className="flex-row justify-between gap-3 mt-6">
        {semana.dias.map((day, i) => {
          // La barra va de 60 % (vacía) a 100 % (llena) para que las diferencias se noten.
          const height = day.valor === null ? 0 : Math.max(8, BAR_HEIGHT * ((day.valor - 60) / 40));
          const isLast = i === lastWithData;

          return (
            <View
              key={day.dia}
              accessible
              accessibilityLabel={`${day.dia}: ${day.valor === null ? 'sin datos' : `${day.valor} por ciento`}`}
              className="flex-1 items-center"
            >
              <Text className="mb-2 text-[11px] font-bold text-neutral-muted">
                {day.valor === null ? '—' : `${Math.round(day.valor)}%`}
              </Text>
              <View
                style={{ height: BAR_HEIGHT }}
                className="w-full justify-end rounded-xl bg-inputBg overflow-hidden"
              >
                <View
                  style={{
                    height,
                    backgroundColor: isLast ? ThemeColors.primary : '#A58BEA',
                    borderCurve: 'continuous',
                  }}
                  className="w-full rounded-xl"
                />
              </View>
              <Text className="mt-2 text-xs font-bold text-neutral">{day.dia}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
