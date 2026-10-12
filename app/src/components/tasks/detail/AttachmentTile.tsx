import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { Attachment } from '@/schemas/task.schema';
import { formatBytes } from '@/utils/tasks';

interface AttachmentTileProps {
  attachment: Attachment;
  /** En el formulario: la «×» para quitarlo. */
  onRemove?: () => void;
}

/** Un adjunto (PDF o imagen): tocarlo lo abre; en el formulario se puede quitar. */
export const AttachmentTile: React.FC<AttachmentTileProps> = ({ attachment, onRemove }) => {
  const isPdf = attachment.tipo === 'ARCHIVO';
  const kind = isPdf ? 'PDF' : (attachment.mimeType.split('/')[1] ?? 'imagen').toUpperCase();

  return (
    <View className="flex-1 min-w-[140px]">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${attachment.nombreArchivo}, ${kind}, ${formatBytes(attachment.tamanoBytes)}`}
        onPress={() => Linking.openURL(attachment.url).catch(() => undefined)}
        style={{ borderCurve: 'continuous' }}
        className="min-h-16 flex-row items-center bg-inputBg border border-borderBg rounded-2xl p-3 active:opacity-80"
      >
        <View
          style={{ backgroundColor: isPdf ? ThemeStatus.errorBg : ThemeStatus.infoBg }}
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        >
          <Ionicons
            name={isPdf ? 'document-text' : 'image'}
            size={20}
            color={isPdf ? ThemeStatus.errorText : ThemeStatus.info}
          />
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-sm font-bold text-neutral">
            {attachment.nombreArchivo}
          </Text>
          <Text className="text-xs text-neutral-muted">
            {kind} • {formatBytes(attachment.tamanoBytes)}
          </Text>
        </View>
      </Pressable>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${attachment.nombreArchivo}`}
          onPress={onRemove}
          hitSlop={8}
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-cardBg border border-borderBg items-center justify-center active:opacity-70"
        >
          <Ionicons name="close" size={14} color={ThemeColors.mutedText} />
        </Pressable>
      ) : null}
    </View>
  );
};
