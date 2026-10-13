import { useAuth } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';

import { notificationKeys, useRegisterPushDevice, useWebPushKey } from '@/services/notifications';

/** Clave VAPID en base64url → bytes, como la pide `PushManager.subscribe`. */
function claveABytes(clave: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (clave.length % 4)) % 4);
  const binario = atob((clave + relleno).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(binario.length));
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

const soportado = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/**
 * Web Push: registra el service worker (`public/sw.js`), se suscribe con la clave VAPID del backend
 * y envía la suscripción a `POST /push-tokens`. El service worker avisa a la página cuando llega un
 * push (recarga la bandeja) o cuando se toca la notificación (abre su pantalla).
 */
export function usePushNotifications() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: registrar } = useRegisterPushDevice();
  const clave = useWebPushKey(!!isSignedIn && soportado());

  useEffect(() => {
    if (!isSignedIn || !soportado() || !clave.data) return;
    const clavePublica = clave.data;
    let cancelado = false;

    const suscribir = async () => {
      const registro = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const suscripcion =
        (await registro.pushManager.getSubscription()) ??
        (await registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: claveABytes(clavePublica),
        }));
      const { endpoint, keys } = suscripcion.toJSON();
      if (!endpoint || !keys?.p256dh || !keys.auth || cancelado) return;
      registrar({ plataforma: 'WEB', webPushSubscription: { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } } });
    };
    const fallo = (error: unknown) => {
      if (__DEV__) console.warn('[push] No se pudo suscribir el navegador:', error);
    };

    // Firefox y Safari solo muestran el permiso tras un gesto del usuario (y Chrome puede silenciarlo):
    // si aún no se decidió, se pide en el primer clic o tecla dentro de la app.
    const pedirPermiso = () => {
      quitarGesto();
      Notification.requestPermission()
        .then((permiso) => (permiso === 'granted' && !cancelado ? suscribir() : undefined))
        .catch(fallo);
    };
    const quitarGesto = () => {
      document.removeEventListener('click', pedirPermiso, true);
      document.removeEventListener('keydown', pedirPermiso, true);
    };

    if (Notification.permission === 'granted') suscribir().catch(fallo);
    else if (Notification.permission === 'default') {
      document.addEventListener('click', pedirPermiso, true);
      document.addEventListener('keydown', pedirPermiso, true);
    }

    return () => {
      cancelado = true;
      quitarGesto();
    };
  }, [isSignedIn, clave.data, registrar]);

  useEffect(() => {
    if (!soportado()) return;
    const alMensaje = (evento: MessageEvent) => {
      const mensaje = evento.data as { tipo?: string; url?: string } | undefined;
      if (mensaje?.tipo !== 'push' && mensaje?.tipo !== 'abrir') return;
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      if (mensaje.tipo === 'abrir' && mensaje.url?.startsWith('/')) router.push(mensaje.url as Href);
    };
    navigator.serviceWorker.addEventListener('message', alMensaje);
    return () => navigator.serviceWorker.removeEventListener('message', alMensaje);
  }, [queryClient, router]);
}
