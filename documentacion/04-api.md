# API

Contrato completo: `api/openapi.yaml` (OpenAPI 3.0.3). Es la fuente de verdad; este documento resume las convenciones.

## Visualizar el contrato

Importar `api/openapi.yaml` en Swagger Editor, Postman o Insomnia. En NestJS se recomienda servirlo con `@nestjs/swagger` en `/docs`.

## Convenciones

- **Base URL:** `/v1`.
- **Formato:** JSON, campos en `camelCase`.
- **Autenticación:** `Authorization: Bearer <JWT de Clerk>` en todos los endpoints, excepto `POST /webhooks/clerk` (valida la firma del webhook).
- **Fechas:** ISO 8601 en UTC (`date-time`), salvo `fecha` (`date`).
- **Paginación:** parámetros `page` (desde 1) y `pageSize` (máx. 100, por defecto 20).
- **Identificadores:** UUID.

## Códigos de respuesta usados

| Código | Uso |
|---|---|
| `200` / `201` / `204` | Éxito (lectura/actualización, creación, sin contenido) |
| `400` | Validación fallida o regla de negocio incumplida (ej. QR inválido, movimiento fuera de secuencia) |
| `401` | JWT ausente o inválido |
| `403` | Rol insuficiente en la organización |
| `404` | Recurso inexistente (ej. sin jornada hoy en `GET /asistencia/hoy`) |
| `409` | Conflicto (ej. QR del día ya generado) |
| `413` | Archivo excede 10 MB |
| `415` | Formato de archivo no permitido |

## Grupos de endpoints

| Tag | Contenido |
|---|---|
| Auth | `GET /auth/me`, `POST /webhooks/clerk` |
| Organizaciones | `GET /me/membresias` (membresías del usuario con su organización, rol y n.º de miembros activos), `POST /organizaciones` |
| Invitaciones | `POST /organizaciones/{id}/invitaciones` (personal, devuelve el `token`), `POST /organizaciones/{id}/codigos-invitacion` (código genérico), `POST /invitaciones/{id}/reenviar`, `POST /invitaciones/{token}/aceptar` (sirve para ambos tipos de código) |
| Miembros | `GET /organizaciones/{id}/equipo` (miembros activos + invitaciones pendientes, con búsqueda, filtro y paginación); `GET`, `PATCH` (rol) y `DELETE` de `/organizaciones/{id}/miembros/{miembroId}` (ver perfil, cambiar rol y quitar del equipo) |
| QR | Obtener / generar el QR del día |
| Asistencia | Entrada, salida, jornada de hoy, historial |
| Tareas | CRUD de tareas, adjuntos (`multipart/form-data`), estado de asignación |
| Notificaciones | Bandeja, marcar leída, difusión a la organización, registro de push tokens |
| Reportes | Horas trabajadas por usuario y rango de fechas |

## Regla contract-first

Todo endpoint nuevo se define primero en `api/openapi.yaml`; luego se implementa. Los schemas de entidad incluyen siempre `createdAt` y `updatedAt`.

## Validación y DTOs

El backend valida toda entrada con **DTOs** (`class-validator` + `class-transformer`) y un `ValidationPipe` global (`src/app.setup.ts`): se descartan los campos desconocidos y se rechazan con `400` (`forbidNonWhitelisted`), los textos se recortan y los parámetros numéricos de la URL se convierten. Los mensajes de error están en español y la respuesta es `{ statusCode, message, error }` (con `message` como texto o como lista). Las respuestas también son DTOs (clases en `dto/` con un mapeador `desde(...)`), de modo que nunca se devuelven las entidades de Prisma tal cual.

## Estado de implementación

Implementados en el backend:
- Auth y organizaciones: `GET /auth/me`, `POST /webhooks/clerk`, `GET /me/membresias`, `POST /organizaciones`.
- Equipo e invitaciones: `GET /organizaciones/{id}/equipo`, `GET|PATCH|DELETE /organizaciones/{id}/miembros/{miembroId}`, `POST /organizaciones/{id}/invitaciones`, `POST /organizaciones/{id}/codigos-invitacion`, `POST /invitaciones/{id}/reenviar` y `POST /invitaciones/{token}/aceptar`.
- **Fase 2 (asistencia):** `GET /organizaciones/{id}/qr/hoy`, `POST /asistencia/entrada`, `POST /asistencia/salida`, `GET /asistencia/hoy`, `GET /asistencia/historial`, `GET|POST /organizaciones/{id}/turnos`, `PATCH|DELETE /organizaciones/{id}/turnos/{turnoId}`, `PATCH /organizaciones/{id}/turnos/tolerancia`, `GET /organizaciones/{id}/inicio/mio`, `GET /organizaciones/{id}/inicio/panel` y `GET /organizaciones/{id}/reportes/asistencia`.

El resto del contrato (tareas, notificaciones, push tokens) se implementa por fases (ver `11-roadmap.md`).

### Proyectados de la Fase 3 (tareas)

La pestaña «Tareas», el detalle y el formulario de crear y editar ya funcionan con datos de ejemplo (`app/src/mocks/tasks.ts`, una base en memoria con la semana anterior, la actual y la siguiente) que respetan estos contratos:

- `GET /organizaciones/{id}/tareas?desde&hasta[&miembroId]` (todos los roles: cualquier miembro ve las tareas de los demás) → `TareaCalendario[]`. `GET /me/tareas` devuelve la misma forma solo con las propias.
- `GET /tareas/{id}` → `TareaDetalle` (subtareas, adjuntos). `POST /organizaciones/{id}/tareas`, `PATCH /tareas/{id}`, `DELETE /tareas/{id}` y `POST /tareas/{id}/duplicar`: solo ADMIN y SUPERVISOR.
- `PATCH /tareas/{id}/estado` y `PATCH /tareas/{id}/subtareas/{subtareaId}`: cualquier miembro, también EMPLEADO, desde el detalle (sin pasar por la edición).
- `GET|POST /tareas/{id}/comentarios` (cualquier miembro) y `GET /tareas/{id}/actividad`.
- Adjuntos: solo PDF e imágenes de hasta 10 MB (los `POST|DELETE /tareas/{id}/adjuntos` ya definidos).

Cambios de modelo que pedirá el backend: en `tareas`, las columnas `estado` (`PENDIENTE`, `EN_PROGRESO`, `REVISION`, `COMPLETADA`), `prioridad`, `ubicacion` y `etiquetas`; tablas nuevas para subtareas, comentarios y actividad; y la asignación a un subconjunto de miembros (`miembroIds`, adelanta parte de la Fase 5). El estado deja de ser por asignación: es de la tarea y lo mueve cualquier miembro. Toda acción queda registrada en la actividad. Los filtros de prioridad y estado se aplican en la app sobre el mes cargado.
