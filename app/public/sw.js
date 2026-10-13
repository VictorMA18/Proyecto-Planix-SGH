// Service worker de Web Push (Planix). El backend envía { titulo, contenido, datos, silenciosa, vibrar };
// `datos.url` es la pantalla de la app que abre la notificación.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let carga = {};
  try {
    carga = event.data ? event.data.json() : {};
  } catch {
    carga = { titulo: 'Planix', contenido: event.data ? event.data.text() : '' };
  }
  const titulo = carga.titulo || 'Planix';
  const datos = carga.datos || {};

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(titulo, {
        body: carga.contenido || '',
        icon: '/favicon.ico',
        tag: datos.notificacionId,
        data: datos,
        silent: !!carga.silenciosa,
        vibrate: carga.vibrar ? [250, 150, 250] : undefined,
      }),
      // Las pestañas abiertas recargan la bandeja.
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((ventanas) => ventanas.forEach((v) => v.postMessage({ tipo: 'push' }))),
    ]),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/notificaciones';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => new URL(v.url).origin === self.location.origin);
      if (abierta) {
        abierta.postMessage({ tipo: 'abrir', url });
        return abierta.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
