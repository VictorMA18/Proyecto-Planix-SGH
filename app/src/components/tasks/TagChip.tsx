import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { tagColor } from '@/constants/tasks';

interface TagChipProps {
  tag: string;
  /** Muestra la «×» para quitarla (formulario). */
  onRemove?: () => void;
  small?: boolean;
}

/** Etiqueta de una tarea; cada texto conserva siempre su color. */
export const TagChip: React.FC<TagChipProps> = ({ tag, onRemove, small = false }) => {
  const { color, background } = tagColor(tag);
  const body = (
    <View
      style={{ backgroundColor: background, borderCurve: 'continuous' }}
      className={`flex-row items-center rounded-lg ${small ? 'px-2 py-0.5' : 'px-2.5 py-1.5'}`}
    >
      <Text style={{ color }} className={`${small ? 'text-[11px]' : 'text-xs'} font-bold`}>
        {tag}
      </Text>
      {onRemove ? <Ionicons name="close" size={14} color={color} style={{ marginLeft: 4 }} /> : null}
    </View>
  );

  if (!onRemove) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Quitar la etiqueta ${tag}`}
      onPress={onRemove}
      hitSlop={6}
      className="min-h-11 justify-center active:opacity-70"
    >
      {body}
    </Pressable>
  );
};
