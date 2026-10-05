# Sistema de Gestión de Horarios (SGH - Planix)

Plataforma multiplataforma (Android, iOS, Web) para control de asistencia mediante código QR, administración de organizaciones multi-tenant, gestión de usuarios con roles, calendario de tareas con asignación automática, y sistema de notificaciones push.

## Estado del proyecto

Fase actual: **Fase 1 — Núcleo (Autenticación con Clerk)**.
- **Frontend Expo:** Pantallas de Inicio de Sesión, Registro y Código de Verificación implementadas con `@clerk/clerk-expo` y persistencia en keychain (`tokenCache`).
- **Backend NestJS:** Servidor API con prefijo `/v1`, guard de JWT con SDK backend de Clerk y controlador de webhooks (`POST /v1/webhooks/clerk`).
- **Docker:** Contenedores activos para PostgreSQL 16 (puerto `5434`) y RabbitMQ 3 Management (puertos `5672` / `15672`).

---

## Cómo Ejecutar el Proyecto (Paso a Paso)

### 1. Requisitos Previos
- Node.js v20+
- `pnpm` (versión 10 u 11)
- Docker & Docker Compose
- Cuenta en Clerk (Plan Hobby / Gratis)

### 2. Levantar la Base de Datos y RabbitMQ en Docker
En la carpeta del backend se encuentra la configuración de Docker Compose:

```bash
cd api
docker compose up -d
```
> **Nota:** PostgreSQL se ejecuta en el puerto **`5434`** para evitar conflictos si tienes otra instancia local de Postgres en el puerto 5432. RabbitMQ expone su panel de administración en `http://localhost:15672` (usuario: `sgh`, clave: `sgh`).

---

### 3. Escuchar Webhooks de Clerk (Desarrollo Local)
En una ventana de terminal independiente, ejecuta el retransmisor de Clerk con el token permanente del proyecto:

```bash
pnpm dlx clerk webhooks listen --token xxaxaxasda --forward-to http://localhost:3000/v1/webhooks/clerk
```

---

### 4. Iniciar el Backend (NestJS)
En la raíz del proyecto o dentro de `api/`:

```bash
# Desde la raíz del monorepo:
pnpm start:api

# O dentro de la carpeta api/:
cd api
pnpm start:dev
```
El servidor NestJS responderá en `http://localhost:3000/v1`.

---

### 5. Iniciar la App Frontend (Expo)
En otra ventana de terminal, desde la raíz o la carpeta `app/`:

```bash
# Desde la raíz del monorepo:
pnpm start:app

# O dentro de la carpeta app/:
cd app
pnpm start
```
Presiona `w` para abrir en el navegador web, `a` para emulador Android o escanea el QR con Expo Go desde tu celular.

---

## Stack Tecnológico

- **Frontend:** Expo (React Native + Expo Router) — único codebase para Android, iOS y Web (PWA).
- **Backend:** NestJS + PostgreSQL + Prisma.
- **Autenticación:** Clerk (`@clerk/clerk-expo` en app / `@clerk/backend` en servidor).
- **Almacenamiento de archivos:** Cloudinary.
- **Cola de mensajes:** RabbitMQ (Docker en desarrollo).
- **Generación de interfaces:** MCP oficial de Stitch (ver `documentacion/08-integraciones-externas.md`).

---

## Estructura del Repositorio

```
sgh-proyecto/
├── README.md                    # Este archivo
├── AGENTS.md                    # Instrucciones para cualquier agente (fuente única)
├── CLAUDE.md                    # Claude Code: importa AGENTS.md
├── opencode.json                # OpenCode: MCP de Stitch
├── .mcp.json                    # Claude Code: MCP de Stitch
├── package.json                 # Monorepo pnpm workspace
├── docker-compose.yml           # (En api/docker-compose.yml)
├── documentacion/               # Documentación técnica, dividida por tema
├── skills/                      # Skills de agente recomendadas
├── database/
│   └── schema.sql               # Esquema PostgreSQL completo (fuente de verdad)
├── api/                         # Backend NestJS
│   ├── src/
│   ├── prisma/
│   └── openapi.yaml              # Contrato de API (OpenAPI 3.0.3)
└── app/                         # Frontend Expo Router
    ├── src/app/
    └── assets/                  # Logo Planix (Logo_Planix.png)
```

---

## Documentación Técnica

| Si necesitas... | Ve a... |
|---|---|
| Entender qué hace el sistema y por qué se tomó cada decisión técnica | `documentacion/02-arquitectura.md` |
| Instalar el entorno de desarrollo | `documentacion/01-instalacion.md` |
| Ver las tablas y relaciones de la base de datos | `documentacion/03-modelo-de-datos.md` + `database/schema.sql` |
| Ver los endpoints disponibles | `documentacion/04-api.md` + `api/openapi.yaml` |
| Entender el login y los permisos por rol | `documentacion/05-autenticacion-y-autorizacion.md` |
| Entender un flujo de negocio paso a paso (QR, tareas, notificaciones) | `documentacion/06-flujos-de-negocio.md` |
| Configurar las credenciales de servicios externos | `documentacion/10-variables-de-entorno.md` |
| Saber qué sigue y en qué orden | `documentacion/11-roadmap.md` |
| Retomar el desarrollo como agente (Antigravity, OpenCode, Claude Code u otro) | `AGENTS.md` |
