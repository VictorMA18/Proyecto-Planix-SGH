import React from 'react';
import { View } from 'react-native';

interface ProgressBarProps {
  /** Porcentaje, de 0 a 100. */
  value: number;
  color: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, color, className = '' }) => (
  <View
    accessibilityRole="progressbar"
    accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.min(100, Math.max(0, value))) }}
    className={`h-2 rounded-full bg-tertiary overflow-hidden ${className}`}
  >
    <View
      style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      className="h-full rounded-full"
    />
  </View>
);
