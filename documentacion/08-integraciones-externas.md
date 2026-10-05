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

- Desarrollo: contenedor Docker `rabbitmq:3-management` (ver `01-instalacion.md`).
- NestJS publica y consume con `@nestjs/microservices`, transporte `RMQ`.

## Stitch (MCP)

El diseño de interfaces avanza en paralelo al backend usando un proyecto de Stitch conectado por el servidor MCP oficial de Google (`https://stitch.googleapis.com/mcp`, cabecera `X-Goog-Api-Key`, puente `mcp-remote`), para generar pantallas de forma ligera. El servidor se registra como `StitchMCP` en Antigravity, OpenCode y Claude Code; la configuración exacta de cada uno está en `12-agentes-de-desarrollo.md`.

Flujo de trabajo:
1. Para cada pantalla (login, escaneo de QR, jornada de hoy, calendario, detalle de tarea, bandeja de notificaciones, administración de miembros), existe o se genera un diseño en Stitch.
2. El agente obtiene el diseño vía MCP y lo implementa en Expo con componentes de React Native + NativeWind.
3. No se diseña UI directamente en código sin pasar antes por Stitch.

Skills asociadas: ver `skills/README.md`.
Identificador del Proyecto de Stitch es: `projects/5696859764310583802`(PLANYX Mobile UI/UX Design System).
