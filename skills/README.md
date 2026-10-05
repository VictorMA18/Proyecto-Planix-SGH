# Skills Recomendadas para el Proyecto

Lista referencial y mínima. Son skills de la comunidad/oficiales (formato Agent Skills, `SKILL.md`) que el agente debe instalar antes de trabajar en la fase indicada. Las skills propias del proyecto aún no existen; están listadas al final como pendientes.

> Los comandos y nombres de esta lista se verificaron el 2026-10-03 contra la documentación pública de cada proveedor. Los repositorios evolucionan: ante un error de instalación, ejecuta `npx skills add <repo> --list` para ver las skills vigentes.

## Instalación general

```bash
npx skills add <owner>/<repo> --skill <nombre-de-skill>
npx skills list     # ver skills instaladas en el proyecto
```

## Skills a instalar

| Prioridad | Fase | Origen | Skills | Para qué sirve en este proyecto |
|---|---|---|---|---|
| Alta | 1 | Clerk (oficial) — `clerk/skills` | `clerk-setup`, `clerk-expo`, `clerk-webhooks` | Integrar login en Expo, y sincronizar usuarios de Clerk con la tabla `usuarios` vía webhook |
| Alta | 1 | Prisma (oficial) — `prisma/skills` | `prisma-cli`, `prisma-client-api`, `prisma-database-setup` | Modelo Prisma, migraciones y consultas tipadas sobre PostgreSQL |
| Alta | 1 | Expo (oficial) — `expo/skills` (plugin `expo@claude-plugins-official` en Claude Code) | Conjunto completo | Convenciones de Expo y Expo Router; incluye `expo-deployment` y `upgrading-expo` para fases posteriores |
| Alta | Desde el inicio | Google Labs — `google-labs-code/stitch-skills` | `stitch-design`, `stitch-loop` | Generar y recuperar pantallas desde Stitch junto con el servidor MCP (ver abajo) |
| Media | Cuando se creen skills propias | Anthropic — `skill-creator` | `skill-creator` | Crear las skills propias del proyecto (sección "Pendientes") |

Comandos:

```bash
npx skills add clerk/skills --skill clerk-setup
npx skills add clerk/skills --skill clerk-expo
npx skills add clerk/skills --skill clerk-webhooks
npx skills add prisma/skills --skill prisma-cli
npx skills add prisma/skills --skill prisma-client-api
npx skills add prisma/skills --skill prisma-database-setup
npx skills add google-labs-code/stitch-skills --skill stitch-design
npx skills add google-labs-code/stitch-skills --skill stitch-loop
claude plugin install expo@claude-plugins-official --scope project   # solo Claude Code
npx skills add expo/skills                                           # Antigravity / OpenCode
```

Notas:
- Para Antigravity y OpenCode, `npx skills add expo/skills` instala las skills de Expo; si el CLI no las detecta, seguir las instrucciones de https://docs.expo.dev/skills.
- `expo/skills` incluye `expo-api-routes`; **no aplica** a este proyecto (el backend es NestJS, no API Routes de Expo).
- Clerk ofrece también un servidor MCP (`clerk mcp install`) y un CLI (`npx clerk@latest init`); opcionales.
- No se encontró una skill oficial para NestJS. No instalar skills de terceros de NestJS sin revisarlas: las skills pueden ejecutar código.

## MCP de Stitch

Se usa el servidor MCP oficial de Google (`https://stitch.googleapis.com/mcp`), registrado como `StitchMCP`. La configuración para Antigravity, OpenCode y Claude Code, y el manejo de la clave (`STITCH_API_KEY`), están en `documentacion/12-agentes-de-desarrollo.md`. Las skills `stitch-design` y `stitch-loop` de la tabla anterior se usan junto a este servidor.

## Skills propias pendientes de crear

Se generarán con `skill-creator` cuando el código base exista. Propuesta inicial (solo las que encapsulan reglas ya decididas):

| Skill propuesta | Qué encapsula |
|---|---|
| `sgh-modulo-nestjs` | Plantilla de módulo (controller, service, DTOs) alineada a `api/openapi.yaml` y con filtro obligatorio por `organizacion_id` |
| `sgh-sincronizar-contrato` | Verificar que `database/schema.sql`, `api/openapi.yaml` y `documentacion/03-modelo-de-datos.md` no se contradigan tras un cambio |
| `sgh-fanout-notificaciones` | Patrón de evento único + destinatarios + publicación en RabbitMQ |
| `sgh-pantalla-stitch` | Flujo para traer una pantalla de Stitch e implementarla en Expo + NativeWind |
