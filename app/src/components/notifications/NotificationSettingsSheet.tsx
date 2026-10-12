import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ToggleSwitch } from '@/components/ui';
import { ALERT_MODES, DEFAULT_NOTIFICATION_PREFERENCES, NOTIFICATION_CHANNELS } from '@/constants/notifications';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { NotificationPreferences } from '@/schemas/notification.schema';

interface NotificationSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Preferencias guardadas (`undefined` mientras cargan). */
  preferences: NotificationPreferences | undefined;
  saving: boolean;
  error: string | null;
  onSave: (preferences: NotificationPreferences) => void;
}

/**
 * Ajustes de notificaciones: canales (push, recordatorios de fichaje, novedades de tareas) y modo
 * de alerta. Se edita un borrador; nada cambia hasta «Guardar preferencias».
 */
export const NotificationSettingsSheet: React.FC<NotificationSettingsSheetProps> = ({
  visible,
  onClose,
  preferences,
  saving,
  error,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<NotificationPreferences>(preferences ?? DEFAULT_NOTIFICATION_PREFERENCES);

  // Cada vez que se abre, el borrador parte de lo guardado.
  useEffect(() => {
    if (visible && preferences) setDraft(preferences);
  }, [visible, preferences]);

  const isDefault = (Object.keys(DEFAULT_NOTIFICATION_PREFERENCES) as (keyof NotificationPreferences)[]).every(
    (key) => draft[key] === DEFAULT_NOTIFICATION_PREFERENCES[key],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Cerrar ajustes"
          onPress={onClose}
          className="absolute top-0 right-0 bottom-0 left-0 bg-black/40"
        />

        <View
          accessibilityViewIsModal
          style={{ borderCurve: 'continuous', paddingBottom: Math.max(insets.bottom, 0) + 16 }}
          className="w-full max-w-[480px] max-h-[90%] self-center bg-cardBg rounded-t-3xl"
        >
          <View className="items-center pt-3">
            <View className="w-10 h-1 rounded-full bg-borderBg" />
          </View>

          <View className="flex-row items-center px-5 pt-3 pb-4 border-b border-borderBg">
            <View className="flex-1">
              <Text accessibilityRole="header" className="text-lg font-extrabold text-neutral">
                Ajustes de notificaciones
              </Text>
              <Text className="text-xs text-neutral-muted">Personaliza tus alertas y canales</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="w-11 h-11 rounded-full bg-tertiary items-center justify-center"
            >
              <Ionicons name="close" size={20} color={ThemeColors.neutral} />
            </Pressable>
          </View>

          {preferences ? (
            <ScrollView contentContainerClassName="px-5 pt-4 pb-2" showsVerticalScrollIndicator={false}>
              <Text className="mb-2 text-xs font-bold tracking-wider text-primary">CANALES Y ALERTAS</Text>
              <View className="gap-2">
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <View
                    key={channel.key}
                    style={{ borderCurve: 'continuous' }}
                    className="min-h-16 flex-row items-center rounded-2xl border border-borderBg bg-inputBg px-3 py-3"
                  >
                    <View className="w-10 h-10 rounded-full bg-tertiary items-center justify-center">
                      <Ionicons name={channel.icon} size={18} color={ThemeColors.primary} />
                    </View>
                    <View className="flex-1 mx-3">
                      <Text className="text-sm font-bold text-neutral">{channel.label}</Text>
                      <Text className="text-xs text-neutral-muted">{channel.description}</Text>
                    </View>
                    <ToggleSwitch
                      accessibilityLabel={`${channel.label}. ${channel.description}`}
                      value={draft[channel.key]}
                      onValueChange={(value) => setDraft((current) => ({ ...current, [channel.key]: value }))}
                    />
                  </View>
                ))}
              </View>

              <Text className="mt-5 mb-2 text-xs font-bold tracking-wider text-primary">MODO DE SONIDO Y ALERTA</Text>
              <View
                accessibilityRole="radiogroup"
                style={{ borderCurve: 'continuous', borderRadius: 16 }}
                className="flex-row bg-tertiary p-1"
              >
                {ALERT_MODES.map((mode) => {
                  const selected = draft.modoAlerta === mode.value;
                  return (
                    <Pressable
                      key={mode.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={mode.label}
                      onPress={() => setDraft((current) => ({ ...current, modoAlerta: mode.value }))}
                      className="flex-1 active:opacity-80"
                    >
                      {/* Remontar al cambiar y fondo nunca transparente: en Android, si no, pierde el
                          redondeado al seleccionarse. */}
                      <View
                        key={selected ? 'on' : 'off'}
                        style={{
                          borderCurve: 'continuous',
                          borderRadius: 12,
                          backgroundColor: selected ? ThemeColors.primary : ThemeColors.tertiary,
                        }}
                        className="min-h-14 items-center justify-center py-2"
                      >
                        <Ionicons name={mode.icon} size={18} color={selected ? '#FFFFFF' : ThemeColors.neutral} />
                        <Text
                          style={{ color: selected ? '#FFFFFF' : ThemeColors.neutral }}
                          className="mt-1 text-xs font-bold"
                        >
                          {mode.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {error ? (
                <Text style={{ color: ThemeStatus.errorText }} className="mt-3 text-xs font-medium">
                  {error}
                </Text>
              ) : null}
            </ScrollView>
          ) : (
            <View className="py-12 items-center">
              <ActivityIndicator color={ThemeColors.primary} />
            </View>
          )}

          <View className="flex-row gap-3 px-5 pt-4 mt-2 border-t border-borderBg">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Restablecer los valores por defecto"
              accessibilityState={{ disabled: isDefault || saving }}
              disabled={isDefault || saving}
              onPress={() => setDraft(DEFAULT_NOTIFICATION_PREFERENCES)}
              style={{ borderCurve: 'continuous', ...(isDefault || saving ? { opacity: 0.5 } : null) }}
              className="flex-1 min-h-12 items-center justify-center rounded-2xl bg-tertiary px-3 active:opacity-75"
            >
              <Text className="text-sm font-bold text-neutral">Restablecer</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Guardar preferencias"
              accessibilityState={{ disabled: !preferences || saving, busy: saving }}
              disabled={!preferences || saving}
              onPress={() => onSave(draft)}
              style={{ borderCurve: 'continuous', ...(!preferences || saving ? { opacity: 0.6 } : null) }}
              className="flex-[1.6] min-h-12 flex-row items-center justify-center rounded-2xl bg-primary px-3 active:opacity-80"
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text className="ml-1.5 text-sm font-bold text-white">Guardar preferencias</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
