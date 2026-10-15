import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View } from 'react-native';

import { BAR_SOFT_COLOR } from '@/constants/metrics';
import { ThemeColors } from '@/constants/theme';
import type { ChartBar } from '@/schemas/metrics.schema';
import { formatHoursShort } from '@/utils/metrics';

const BAR_HEIGHT = 120;
const STAGGER_MS = 60;

interface BarProps {
  bar: ChartBar;
  ratio: number;
  highlighted: boolean;
  index: number;
  /** Cambia al elegir otro periodo o persona: las barras vuelven a crecer desde cero. */
  animationKey: string;
}

/** «Reducir movimiento» del sistema: las barras aparecen sin animación. */
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduce)
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => subscription.remove();
  }, []);
  return reduce;
}

const Bar: React.FC<BarProps & { reduceMotion: boolean }> = ({
  bar,
  ratio,
  highlighted,
  index,
  animationKey,
  reduceMotion,
}) => {
  const height = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = bar.horas > 0 ? Math.max(6, ratio * BAR_HEIGHT) : 0;
    height.stopAnimation();
    if (reduceMotion) {
      height.setValue(target);
      return;
    }
    height.setValue(0);
    const animation = Animated.timing(height, {
      toValue: target,
      duration: 650,
      delay: index * STAGGER_MS,
      easing: Easing.out(Easing.cubic),
      // La altura no la anima el driver nativo; son pocas barras.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animationKey, bar.horas, ratio, index, reduceMotion, height]);

  return (
    <View
      accessible
      accessibilityLabel={`${bar.etiqueta}: ${bar.horas > 0 ? `${bar.horas} horas` : 'sin horas'}`}
      className="flex-1 items-center"
    >
      <View style={{ height: BAR_HEIGHT }} className="w-full justify-end">
        <Animated.View
          style={[
            {
              width: '100%',
              height,
              borderRadius: 12,
              borderCurve: 'continuous',
              backgroundColor: highlighted ? ThemeColors.primary : BAR_SOFT_COLOR,
            },
          ]}
        />
      </View>
      <Text
        style={{ color: highlighted ? ThemeColors.primary : ThemeColors.mutedText }}
        className="mt-2 text-xs font-bold"
      >
        {bar.etiqueta}
      </Text>
    </View>
  );
};

interface AnimatedBarChartProps {
  bars: ChartBar[];
  animationKey: string;
}

/**
 * Horas por día (semana) o por semana (mes). Las barras crecen escalonadas al aparecer y al cambiar
 * de periodo; la de mayor carga va en el color principal. Respeta «reducir movimiento».
 */
export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({ bars, animationKey }) => {
  const reduceMotion = useReduceMotion();
  const max = Math.max(0, ...bars.map((b) => b.horas));
  const highlightIndex = max > 0 ? bars.findIndex((b) => b.horas === max) : -1;

  return (
    <View>
      {highlightIndex >= 0 ? (
        <Text className="mb-1 text-[11px] font-bold text-primary" style={{ fontVariant: ['tabular-nums'] }}>
          Máx. {formatHoursShort(max)}
        </Text>
      ) : null}
      <View className="flex-row gap-2">
        {bars.map((bar, i) => (
          <Bar
            key={bar.desde}
            bar={bar}
            ratio={max > 0 ? bar.horas / max : 0}
            highlighted={i === highlightIndex}
            index={i}
            animationKey={animationKey}
            reduceMotion={reduceMotion}
          />
        ))}
      </View>
    </View>
  );
};
