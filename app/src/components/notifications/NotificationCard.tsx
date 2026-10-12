import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { NOTIFICATION_ACTIONS, NOTIFICATION_TYPES } from '@/constants/notifications';
import { ThemeColors, ThemeStatus } from '@/constants/theme';
import type { AppNotification } from '@/schemas/notification.schema';
import { formatNotificationTime, highlightActor } from '@/utils/notifications';

interface NotificationCardProps {
  notification: AppNotification;
  now: number;
  /** Tocar la tarjeta: la marca como leída. */
  onPress: () => void;
  /** Botón «Ver turno» / «Abrir tarea». */
  onAction: () => void;
}

/**
 * Una notificación: icono por tipo, título, hora, contenido con el nombre de quien la provocó
 * resaltado y, según el tipo, el botón que lleva a su pantalla o el detalle de la asistencia.
 * Las pendientes llevan el icono relleno con un punto, la hora en morado y el botón sólido.
 */
export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, now, onPress, onAction }) => {
  const type = NOTIFICATION_TYPES[notification.tipo];
  const action = type.action ? NOTIFICATION_ACTIONS[type.action] : null;
  const unread = !notification.leida;
  const time = formatNotificationTime(notification.createdAt, now);
  const parts = notification.contenido ? highlightActor(notification.contenido, notification.actor?.nombre) : [];

  const tint = unread ? '#FFFFFF' : ThemeColors.primary;

  // El área que marca como leída y el botón de acción son hermanos, no anidados: en la web un
  // Pressable dentro de otro queda como <button> dentro de <button>, que no es HTML válido.
  return (
    <View style={{ borderCurve: 'continuous', borderRadius: 24 }} className="bg-cardBg p-4 shadow-sm shadow-primary/10">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${unread ? 'No leída. ' : ''}${notification.titulo}. ${notification.contenido ?? ''} ${time}`}
        accessibilityHint={unread ? 'Marca la notificación como leída' : undefined}
        onPress={onPress}
        className="flex-row active:opacity-80"
      >
        <View>
          <View
            style={{ backgroundColor: unread ? ThemeColors.primary : ThemeColors.tertiary, borderRadius: 22 }}
            className="w-11 h-11 items-center justify-center"
          >
            <Ionicons name={type.icon} size={20} color={tint} />
          </View>
          {unread ? (
            <View className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-violet-300 border-2 border-white" />
          ) : null}
        </View>

        <View className="flex-1 ml-3">
          <View className="flex-row items-start">
            <Text className="flex-1 text-base font-bold text-neutral">{notification.titulo}</Text>
            <Text
              style={{ color: unread ? ThemeColors.primary : ThemeColors.neutral }}
              className="ml-2 mt-0.5 text-xs font-bold"
            >
              {time}
            </Text>
          </View>

          {parts.length > 0 ? (
            <Text className="mt-1 text-sm leading-5 text-neutral-muted">
              {parts.map((part, i) => (
                <Text key={i} className={part.bold ? 'font-bold text-neutral' : undefined}>
                  {part.text}
                </Text>
              ))}
            </Text>
          ) : null}

          {notification.asistencia ? (
            <View className="mt-2 flex-row flex-wrap items-center gap-2">
              <View
                style={{
                  backgroundColor: notification.asistencia.puntual ? ThemeColors.tertiary : ThemeStatus.warningBg,
                  borderRadius: 999,
                }}
                className="flex-row items-center px-2.5 py-1"
              >
                <Ionicons
                  name={notification.asistencia.puntual ? 'checkmark-circle-outline' : 'time-outline'}
                  size={14}
                  color={notification.asistencia.puntual ? ThemeColors.primary : ThemeStatus.warningText}
                />
                <Text
                  style={{ color: notification.asistencia.puntual ? ThemeColors.primary : ThemeStatus.warningText }}
                  className="ml-1 text-xs font-bold"
                >
                  {notification.asistencia.puntual ? 'Puntual' : 'Tarde'}
                </Text>
              </View>
              <Text className="text-sm text-neutral">{notification.asistencia.turno}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${action.label}: ${notification.titulo}`}
          onPress={onAction}
          className="self-start mt-3 ml-14 active:opacity-75"
        >
          <View
            style={{
              borderCurve: 'continuous',
              borderRadius: 12,
              backgroundColor: unread ? ThemeColors.primary : ThemeColors.tertiary,
            }}
            className="min-h-11 flex-row items-center px-4"
          >
            {type.action === 'TAREA' ? (
              <Ionicons name={action.icon} size={16} color={tint} style={{ marginRight: 6 }} />
            ) : null}
            <Text style={{ color: tint }} className="text-sm font-bold">
              {action.label}
            </Text>
            {type.action === 'TURNO' ? (
              <Ionicons name={action.icon} size={16} color={tint} style={{ marginLeft: 6 }} />
            ) : null}
          </View>
        </Pressable>
      ) : null}
    </View>
  );
};
