# Variables de Entorno

Las credenciales se agregan por fase, no todas desde el inicio. El archivo `.env` reside únicamente en el servidor (backend) y nunca se versiona; se mantiene un `.env.example` sin valores.

## Fase 1 — Núcleo (obligatorias para arrancar)

| Variable | Dónde | Descripción |
|---|---|---|
| `DATABASE_URL` | Backend | Cadena de conexión PostgreSQL |
| `CLERK_SECRET_KEY` | Backend | Verificación de JWT |
| `CLERK_WEBHOOK_SECRET` | Backend | Validación de firma del webhook de Clerk |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | App | Clave pública de Clerk |
| `EXPO_PUBLIC_API_URL` | App | URL base del backend (`/v1`) |

## Fase 2 — Asistencia avanzada

Sin credenciales nuevas.

## Fase 3 — Calendario, tareas y adjuntos

| Variable | Dónde | Descripción |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | Backend | — |
| `CLOUDINARY_API_KEY` | Backend | — |
| `CLOUDINARY_API_SECRET` | Backend | — |

## Fase 4 — Notificaciones

| Variable | Dónde | Descripción |
|---|---|---|
| `RABBITMQ_URL` | Backend | Ej. `amqp://sgh:sgh@localhost:5672` |
| `EXPO_ACCESS_TOKEN` | Backend | Envío por Expo Push Service (si se activa seguridad mejorada) |
| `VAPID_PUBLIC_KEY` | Backend / App | Web Push |
| `VAPID_PRIVATE_KEY` | Backend | Web Push |

## Fase 5 — Reportes y permisos avanzados

Sin credenciales nuevas previstas.

## Herramientas de desarrollo (máquina del desarrollador, no del backend)

| Variable | Dónde | Descripción |
|---|---|---|
| `STITCH_API_KEY` | Entorno del shell del desarrollador (OpenCode, Claude Code); config global de Antigravity | Clave del MCP oficial de Stitch. Nunca versionar |

OpenCode y Claude Code no cargan `.env` automáticamente: la variable debe estar definida en el entorno desde el que se lanza el agente. Ver `12-agentes-de-desarrollo.md`.

## Reglas

- Ninguna variable sin prefijo `EXPO_PUBLIC_` debe llegar al bundle de la app.
- Toda variable nueva se agrega primero a este documento y a `.env.example`.
