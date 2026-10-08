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

Implementados en el backend: `GET /auth/me`, `POST /webhooks/clerk`, `GET /me/membresias`, `POST /organizaciones`, `GET /organizaciones/{id}/equipo`, `GET|PATCH|DELETE /organizaciones/{id}/miembros/{miembroId}`, `POST /organizaciones/{id}/invitaciones`, `POST /organizaciones/{id}/codigos-invitacion`, `POST /invitaciones/{id}/reenviar` y `POST /invitaciones/{token}/aceptar`. El resto de endpoints del contrato se implementa por fases (ver `11-roadmap.md`).

Notas:
- **Códigos de invitación:** la invitación personal (correo + rol) dura 7 días; el código genérico (solo rol) dura 5, 10 o 15 minutos y puede canjearlo cualquier persona hasta que expire. Un usuario que ya es miembro recibe `409`.
- **Reenviar** renueva la vigencia de la invitación; el envío por correo no está implementado todavía (el administrador comparte el código a mano).
- **Equipo:** la unión de miembros e invitaciones se arma en memoria, pensada para equipos de cientos de personas.
