import { useAuth } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { ThemeColors } from '@/constants/theme';
import { notificationKeys, useRegisterPushDevice } from '@/services/notifications';

type NotificationsModule = typeof import('expo-notifications');

/**
 * Expo Go en Android ya no recibe push remotos (SDK 53+): ahí no se carga `expo-notifications`
 * (evita su error al importarlo) y basta con la bandeja. Hace falta una development build.
 */
const pushDisponible = !(
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient
);

let modulo: Promise<NotificationsModule> | null = null;
const cargar = () => (modulo ??= import('expo-notifications'));

/** Canales de versiones anteriores: Android no deja cambiar el sonido de un canal ya creado. */
const CANALES_ANTIGUOS = ['sonido', 'vibracion', 'silencio'];

/**
 * Canales de Android, uno por modo de alerta: el backend envía `alerta_<modo>` (alerta.util.ts).
 * «Con sonido» no lleva `sound`: así usa el sonido del sistema (`'default'` buscaría un archivo propio).
 */
async function crearCanales(Notifications: NotificationsModule) {
  if (Platform.OS !== 'android') return;
  const base = { importance: Notifications.AndroidImportance.HIGH, lightColor: ThemeColors.primary };
  const vibracion = [0, 250, 150, 250];
  await Notifications.setNotificationChannelAsync('alerta_sonido', {
    ...base,
    name: 'Con sonido',
    enableVibrate: true,
    vibrationPattern: vibracion,
  });
  await Notifications.setNotificationChannelAsync('alerta_vibracion', {
    ...base,
    name: 'Solo vibración',
    sound: null,
    enableVibrate: true,
    vibrationPattern: vibracion,
  });
  await Notifications.setNotificationChannelAsync('alerta_silencio', {
    name: 'Silencio',
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    enableVibrate: false,
  });
  await Promise.all(CANALES_ANTIGUOS.map((id) => Notifications.deleteNotificationChannelAsync(id)));
}

/**
 * Push en Android e iOS: pide permiso, registra el token de Expo en el backend (`POST /push-tokens`),
 * muestra los avisos en primer plano, recarga la bandeja al llegar uno y, al tocarlo, abre su
 * pantalla (`datos.url`). Se monta una vez en el layout autenticado.
 */
export function usePushNotifications() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: registrar } = useRegisterPushDevice();

  // Registro del dispositivo.
  useEffect(() => {
    if (!isSignedIn) return;
    if (!pushDisponible) {
      if (__DEV__) console.info('[push] Expo Go en Android no recibe push: usa una development build.');
      return;
    }
    if (!Device.isDevice) return;

    let cancelado = false;
    (async () => {
      const Notifications = await cargar();
      // Un fallo en los canales no debe impedir registrar el dispositivo.
      await crearCanales(Notifications).catch((error) => {
        if (__DEV__) console.warn('[push] No se pudieron crear los canales:', error);
      });
      let { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
      if (status !== 'granted' || cancelado) return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        if (__DEV__) console.warn('[push] Falta el projectId de EAS (ejecuta `npx eas init`).');
        return;
      }
      const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
      if (!cancelado) {
        registrar({ plataforma: Platform.OS === 'ios' ? 'IOS' : 'ANDROID', expoPushToken: data });
      }
    })().catch((error) => {
      if (__DEV__) console.warn('[push] No se pudo registrar el dispositivo:', error);
    });
    return () => {
      cancelado = true;
    };
  }, [isSignedIn, registrar]);

  // Presentación, llegada y toque de las notificaciones.
  useEffect(() => {
    if (!pushDisponible) return;
    const suscripciones: { remove: () => void }[] = [];
    let activo = true;

    cargar().then((Notifications) => {
      if (!activo) return;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      const abrir = (url: unknown) => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        if (typeof url === 'string' && url.startsWith('/')) router.push(url as Href);
      };
      suscripciones.push(
        Notifications.addNotificationReceivedListener(() =>
          queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
        ),
        Notifications.addNotificationResponseReceivedListener((respuesta) =>
          abrir(respuesta.notification.request.content.data?.url),
        ),
      );
      // La app se abrió tocando una notificación.
      const ultima = Notifications.getLastNotificationResponse();
      if (ultima) {
        abrir(ultima.notification.request.content.data?.url);
        Notifications.clearLastNotificationResponse();
      }
    });

    return () => {
      activo = false;
      suscripciones.forEach((s) => s.remove());
    };
  }, [queryClient, router]);
}
