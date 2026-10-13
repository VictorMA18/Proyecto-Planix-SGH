# Integraciones Externas

Las integraciones se conectan de forma iterativa, según la fase del roadmap que las requiere. Las credenciales se listan por fase en `10-variables-de-entorno.md`.

| Servicio | Uso | Fase | Dónde viven las credenciales |
|---|---|---|---|
| Clerk | Login con credenciales y OAuth 2.0, sesiones, webhook de usuarios | 1 | Backend (secret key, webhook secret); app (publishable key, que es pública por diseño) |
| Cloudinary | Almacenamiento de imágenes y PDFs adjuntos a tareas | 3 | Solo backend |
| RabbitMQ | Cola de mensajes para envío asíncrono de push | 4 | Solo backend |
| Expo Push Service | Push a Android/iOS | 4 | Solo backend |
| Web Push (VAPID) | Push a navegadores | 4 | Backend (clave privada); la pública se entrega al cliente |
| Stitch (MCP oficial de Google) | Diseño de interfaces | Desde el inicio, en paralelo | Variable de entorno `STITCH_API_KEY` en la máquina del desarrollador; nunca en el repo |

## Clerk

- El cliente inicia sesión con `@clerk/clerk-expo` y envía el JWT al backend.
- El backend verifica el JWT con el SDK backend de Clerk; no emite tokens propios.
- `POST /webhooks/clerk` sincroniza `usuarios` con los eventos `user.created`, `user.updated`, `user.deleted`. La firma del webhook se valida antes de procesar.
- En desarrollo, el webhook requiere una URL pública (túnel local, ej. ngrok/cloudflared).

## Cloudinary

- El cliente envía el archivo al backend (`multipart/form-data`); nunca sube directo a Cloudinary.
- El backend valida tamaño (≤ 10 MB) y formato (`image/jpeg`, `image/png`, `image/webp`, `image/gif` para `IMAGEN`; `application/pdf` para `ARCHIVO`) antes de subir. Errores: `413` / `415`.
- Se guarda en `tareas.adjuntos` (JSONB) la `url` (`secure_url`) y el `cloudinaryPublicId`; este último no se expone al cliente y se usa para eliminar el asset.

## RabbitMQ

- Desarrollo: contenedor Docker `rabbitmq:3-management` (ver `01-instalacion.md`), con `RABBITMQ_URL=amqp://sgh:sgh@localhost:5672` en `api/.env`.
- NestJS publica (`ColaPushService`, `ClientRMQ`) y consume (`DespachoPushController`, microservicio RMQ conectado en `main.ts`) con `@nestjs/microservices`, en la cola durable `push_despacho`.
- Sin `RABBITMQ_URL` la API arranca igual: las notificaciones quedan en la bandeja y solo se omite el push. Los e2e reemplazan la cola por un doble en memoria.

## Expo Push Service (Android e iOS)

- El backend envía con `expo-server-sdk` (`ExpoPushService`); `EXPO_ACCESS_TOKEN` solo hace falta si se activa la seguridad mejorada del proyecto en Expo.
- La app obtiene el token con `expo-notifications` (`getExpoPushTokenAsync({ projectId })`) y lo registra con `POST /push-tokens`; al cerrar sesión lo da de baja con `DELETE /push-tokens`.
- **Expo Go en Android no recibe push remotos (desde el SDK 53):** para probarlo hace falta una development build. Pasos:
  1. `npx eas init` en `app/` (agrega `extra.eas.projectId` a `app.json`).
  2. Configurar FCM: crear el proyecto en Firebase con la app Android `com.planix.sgh`, descargar `google-services.json` a `app/` (no se versiona, está en `.gitignore`) y subir la clave de cuenta de servicio (FCM V1) a EAS (`npx eas credentials`). Esa clave no se guarda en el repo.
  3. Para EAS Build, subir `google-services.json` como variable de tipo archivo: `npx eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment development --visibility secret`. `app/app.config.js` la usa en lugar del archivo local.
  4. `npx eas build --profile development --platform android` (o `npx expo run:android` con el SDK de Android instalado) e instalar el APK. Luego se trabaja con `pnpm start` como siempre, abriendo la app de desarrollo en vez de Expo Go; solo se recompila al cambiar dependencias nativas o `app.json`.
- La app crea los canales de Android `alerta_sonido`, `alerta_vibracion` y `alerta_silencio`; el backend elige el canal según `modo_alerta`. Android no deja cambiar el sonido de un canal ya creado: si se cambia su configuración, hay que usar un ID nuevo y borrar el anterior.

## Web Push (VAPID)

- Claves: `npx web-push generate-vapid-keys` → `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` en `api/.env`, más `VAPID_SUBJECT` (`mailto:` o URL del responsable).
- La app web pide la clave pública con `GET /push-tokens/clave-web`, registra el service worker `app/public/sw.js`, se suscribe con `PushManager.subscribe` y envía la suscripción a `POST /push-tokens`.
- El backend envía con `web-push` (`WebPushService`); si el navegador anuló la suscripción (404/410), el token se desactiva.

## Stitch (MCP)

El diseño de interfaces avanza en paralelo al backend usando un proyecto de Stitch conectado por el servidor MCP oficial de Google (`https://stitch.googleapis.com/mcp`, cabecera `X-Goog-Api-Key`, puente `mcp-remote`), para generar pantallas de forma ligera. El servidor se registra como `StitchMCP` en Antigravity, OpenCode y Claude Code; la configuración exacta de cada uno está en `12-agentes-de-desarrollo.md`.

Flujo de trabajo:
1. Para cada pantalla (login, escaneo de QR, jornada de hoy, calendario, detalle de tarea, bandeja de notificaciones, administración de miembros), existe o se genera un diseño en Stitch.
2. El agente obtiene el diseño vía MCP y lo implementa en Expo con componentes de React Native + NativeWind.
3. No se diseña UI directamente en código sin pasar antes por Stitch.

Skills asociadas: ver `skills/README.md`.
Identificador del Proyecto de Stitch es: `projects/5696859764310583802`(PLANYX Mobile UI/UX Design System).
