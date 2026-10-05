# Instalación y Entorno de Desarrollo

## Requisitos

- Node.js 20 LTS o superior
- pnpm
- Docker y Docker Compose
- Cuenta de Clerk (desarrollo)
- Cuenta de Cloudinary (desarrollo)
- Expo CLI (`npm install -g expo-cli`) y la app Expo Go en un dispositivo o emulador, para probar mobile

## 1. Clonar y estructurar el proyecto

```
sgh-proyecto/
├── api/                # NestJS
└── app/                # Expo (Android, iOS, Web)
```

Ver la estructura completa de carpetas en `02-arquitectura.md`.

## 2. Servicios locales con Docker

Levantar PostgreSQL y RabbitMQ en desarrollo:

```bash
docker compose up -d
```

`docker-compose.yml` de referencia (crear en la raíz del backend):

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: sgh
      POSTGRES_PASSWORD: sgh
      POSTGRES_DB: sgh
    ports:
      - "5432:5432"
    volumes:
      - sgh_postgres_data:/var/lib/postgresql/data

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"   # panel de administración
    environment:
      RABBITMQ_DEFAULT_USER: sgh
      RABBITMQ_DEFAULT_PASS: sgh

volumes:
  sgh_postgres_data:
```

## 3. Backend (NestJS)

```bash
cd api
pnpm install
cp .env.example .env    # completar valores, ver 10-variables-de-entorno.md
pnpm prisma migrate dev
pnpm start:dev
```

Aplicar el esquema inicial: `database/schema.sql` es la fuente de verdad del modelo de datos. El modelo de Prisma (`schema.prisma`) debe reflejarlo exactamente; generarlo con `prisma db pull` contra una base ya creada con `schema.sql`, o mantenerlo a mano en paralelo.

## 4. Frontend (Expo)

```bash
cd app
pnpm install
cp .env.example .env    # URL del backend, claves públicas de Clerk, etc.
pnpm start               # abre el menú de Expo: Android, iOS, Web
```

Para la build web como PWA:

```bash
pnpm expo export --platform web
```

## 5. Verificar que todo corre

- Backend: `GET http://localhost:3000/v1/auth/me` (con un JWT de Clerk válido) debe responder `200`.
- RabbitMQ: panel de administración en `http://localhost:15672` (usuario/clave definidos en el compose).
- App: la pantalla de login debe mostrar las opciones de Clerk (credenciales + proveedores OAuth configurados).

## 6. Configurar el agente de desarrollo

1. Definir `STITCH_API_KEY` en el entorno del shell (ver `.env.example`).
2. Antigravity: añadir `StitchMCP` a su `mcp_config.json` global. OpenCode y Claude Code ya traen la configuración en `opencode.json` y `.mcp.json`.
3. Instalar las skills de `skills/README.md`.

Detalle por agente en `12-agentes-de-desarrollo.md`.

## 7. Orden recomendado de configuración de credenciales

No se requieren todas las credenciales desde el día uno. Ver el detalle por fase en `10-variables-de-entorno.md`.
