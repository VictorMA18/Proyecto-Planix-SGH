import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import { useAttachmentActions } from '@/hooks/use-attachment-actions';
import type { Attachment } from '@/schemas/task.schema';
import { formatBytes } from '@/utils/tasks';

interface AttachmentViewerProps {
  taskId: string;
  /** Adjunto a mostrar; `null` cierra el visor. */
  attachment: Attachment | null;
  onClose: () => void;
}

/**
 * Visor de adjuntos: las imágenes se ven a pantalla completa; los PDF se abren en el visor del
 * sistema (en la web, en una pestaña nueva). Ambos se pueden descargar con su nombre original.
 */
export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({ taskId, attachment, onClose }) => {
  const insets = useSafeAreaInsets();
  const actions = useAttachmentActions(taskId);
  const isPdf = attachment?.tipo === 'ARCHIVO';

  // Al cambiar de adjunto se limpia el error del anterior.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => actions.clearError(), [attachment?.id]);

  if (!attachment) return null;

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }} className="flex-1 bg-neutral">
        <View className="flex-row items-center px-4 gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar el visor"
            onPress={onClose}
            className="w-11 h-11 rounded-full bg-white/10 items-center justify-center active:opacity-70"
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>
          <View className="flex-1">
            <Text accessibilityRole="header" numberOfLines={1} className="text-base font-bold text-white">
              {attachment.nombreArchivo}
            </Text>
            <Text className="text-xs text-white/60">
              {isPdf ? 'PDF' : (attachment.mimeType.split('/')[1] ?? 'imagen').toUpperCase()} •{' '}
              {formatBytes(attachment.tamanoBytes)}
            </Text>
          </View>
        </View>

        <View className="flex-1 items-center justify-center px-4 my-4">
          {isPdf ? (
            <View className="items-center gap-4 px-6">
              <View
                style={{ backgroundColor: ThemeStatus.errorBg }}
                className="w-24 h-24 rounded-3xl items-center justify-center"
              >
                <Ionicons name="document-text" size={48} color={ThemeStatus.errorText} />
              </View>
              <Text className="text-center text-sm text-white/80">
                {Platform.OS === 'web'
                  ? 'El PDF se abrirá en una pestaña nueva del navegador.'
                  : 'El PDF se abrirá en el visor de documentos de tu teléfono.'}
              </Text>
              <View className="w-full max-w-[320px]">
                <AppButton
                  title="Abrir PDF"
                  icon="open-outline"
                  isLoading={actions.busy === 'open'}
                  disabled={!!actions.busy}
                  onPress={() => actions.open(attachment)}
                />
              </View>
            </View>
          ) : (
            <Image
              source={{ uri: attachment.url }}
              contentFit="contain"
              accessibilityLabel={attachment.nombreArchivo}
              style={{ width: '100%', height: '100%' }}
              transition={150}
            />
          )}
        </View>

        <View className="px-4 gap-3 w-full max-w-[480px] self-center">
          {actions.error ? (
            <Text accessibilityRole="alert" className="text-center text-sm font-semibold text-red-300">
              {actions.error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Descargar ${attachment.nombreArchivo}`}
            accessibilityState={{ disabled: !!actions.busy }}
            disabled={!!actions.busy}
            onPress={() => actions.download(attachment)}
            style={{ borderCurve: 'continuous' }}
            className="min-h-12 flex-row items-center justify-center rounded-2xl bg-white/15 active:opacity-80"
          >
            {actions.busy === 'download' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                <Text className="ml-2 text-sm font-bold text-white">Descargar</Text>
              </>
            )}
          </Pressable>
          {!isPdf && Platform.OS !== 'web' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir en el visor de imágenes del teléfono"
              disabled={!!actions.busy}
              onPress={() => actions.open(attachment)}
              className="min-h-11 items-center justify-center active:opacity-70"
            >
              <Text style={{ color: ThemeColors.tertiary }} className="text-sm font-semibold">
                Abrir en otra app
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};
