# Modelo de Datos

Fuente de verdad: `database/schema.sql` (PostgreSQL 14+, 12 tablas, 8 enums, sin funciones/triggers/vistas). Este documento describe cada entidad; ante cualquier discrepancia, prevalece el SQL.


### 1. `Organizacion`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| nombre | string | Nombre de la organización |
| slug | string | Identificador único legible |
| zona_horaria | string | Timezone usada para cálculos de fecha/hora |
| logo_url | string, nullable | Logo de la organización |
| activa | boolean | Estado de la organización |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de última actualización |

### 2. `Usuario`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único interno |
| clerk_id | string | Identificador del usuario en Clerk |
| nombre | string | Nombre completo (nombres + apellidos), calculado al sincronizar con Clerk |
| nombres | string | Nombre(s), tomado de Clerk (`first_name`) |
| apellidos | string | Apellido(s), tomado de Clerk (`last_name`) |
| email | string | Correo principal, único |
| email_verificado | boolean | Si Clerk verificó el correo principal |
| avatar_url | string, nullable | Foto de perfil |
| activo | boolean | Estado del usuario |
| created_at | timestamp | Fecha de registro |
| updated_at | timestamp | Fecha de última actualización |

### 3. `MiembroOrganizacion`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| usuario_id | UUID (FK Usuario) | — |
| organizacion_id | UUID (FK Organizacion) | — |
| rol | enum | `SUPER_ADMIN`, `ADMIN`, `SUPERVISOR`, `EMPLEADO` |
| estado | enum | `ACTIVO`, `INVITADO`, `INACTIVO` |
| fecha_ingreso | timestamp, nullable | Fecha de activación |
| created_at | timestamp | Fecha de creación de la membresía |
| updated_at | timestamp | Fecha de última actualización |

Restricción: `UNIQUE(usuario_id, organizacion_id)`. Un usuario puede tener una fila por organización, cada una con rol independiente.

### 4. `Invitacion`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| organizacion_id | UUID (FK Organizacion) | — |
| email | string | Email del invitado |
| rol | enum | Rol a asignar al aceptar |
| token | string | Token único de invitación |
| invitado_por | UUID (FK Usuario) | — |
| estado | enum | `PENDIENTE`, `ACEPTADA`, `EXPIRADA`, `CANCELADA` |
| expira_en | timestamp | Vencimiento del token |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de última actualización |

### 5. `CodigoQR`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| organizacion_id | UUID (FK Organizacion) | — |
| fecha | date | Fecha de validez |
| token | string | Valor único codificado en el QR |
| generado_por | UUID (FK Usuario) | — |
| expira_en | timestamp | Fin de vigencia |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de última actualización |

Restricción: `UNIQUE(organizacion_id, fecha)`.

### 6. `JornadaAsistencia`
Representa la jornada de UN usuario en UNA fecha dentro de UNA organización. Cubre ambos casos de negocio descritos en la sección de asistencia del README (alcance funcional): jornada simple (1 `ENTRADA` + 1 `SALIDA`) y jornada con movimientos intermedios (múltiples pares `ENTRADA`/`SALIDA`).

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| usuario_id | UUID (FK Usuario) | — |
| organizacion_id | UUID (FK Organizacion) | — |
| codigo_qr_id | UUID (FK CodigoQR) | QR escaneado para la primera entrada del día |
| fecha | date | Fecha de la jornada |
| hora_inicio | timestamp | Hora del primer movimiento `ENTRADA` del día (inmutable) |
| hora_fin | timestamp, nullable | Hora del movimiento `SALIDA` más reciente; se actualiza con cada salida registrada |
| estado_actual | enum | `DENTRO`, `FUERA` — determina si el próximo movimiento esperado es `SALIDA` o `ENTRADA` (retorno) |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de última actualización |

Restricciones: `UNIQUE(usuario_id, fecha)` — una sola jornada por usuario y día. `CHECK(hora_fin >= hora_inicio)`.

### 7. `MovimientoAsistencia`
Cada fila es un evento puntual de escaneo (`ENTRADA`) o confirmación de salida (`SALIDA`) dentro de una jornada. La secuencia debe alternar (`ENTRADA`, `SALIDA`, `ENTRADA`, `SALIDA`, ...); esta alternancia se valida en la capa de aplicación usando `JornadaAsistencia.estado_actual`.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| jornada_id | UUID (FK JornadaAsistencia) | — |
| tipo | enum | `ENTRADA`, `SALIDA` |
| hora | timestamp | Momento del movimiento |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de última actualización |

### 8. `Tarea`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| organizacion_id | UUID (FK Organizacion) | — |
| titulo | string | — |
| descripcion | text, nullable | — |
| enlace | string, nullable | Link externo (ej. Google Meet) |
| fecha_inicio | timestamp | — |
| fecha_fin | timestamp, nullable | — |
| creado_por | UUID (FK Usuario) | — |
| adjuntos | JSONB | Arreglo de material gráfico/archivos que enriquecen la descripción (ver detalle abajo) |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de última actualización |

**Campo `adjuntos`:** embebido como JSONB, no como tabla relacional — se consulta siempre junto con la tarea. El backend sube cada archivo a Cloudinary (el cliente nunca sube directamente ni tiene acceso a sus credenciales) y agrega un objeto al arreglo con esta forma:

| Propiedad | Tipo | Descripción |
|---|---|---|
| id | string (UUID) | Generado por el backend al agregar el adjunto |
| tipo | string | `IMAGEN`, `ARCHIVO` |
| url | string | `secure_url` pública devuelta por Cloudinary |
| cloudinaryPublicId | string | Identificador interno del asset en Cloudinary; usado por el backend para eliminarlo. No se expone al cliente |
| nombreArchivo | string, nullable | Nombre original del archivo |
| tamanoBytes | integer | Tamaño del archivo en bytes; máximo 10 MB (10 485 760) |
| orden | integer | Posición de despliegue cuando hay varios adjuntos |
| createdAt | timestamp | Fecha en que se agregó el adjunto |

**Validación:** ocurre en el servicio del backend, no en la base de datos. El backend valida formato y tamaño **antes** de subir el archivo a Cloudinary; ningún archivo se sube sin pasar esta validación.
- Tamaño máximo: 10 MB.
- Formatos permitidos para `tipo = IMAGEN`: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Formatos permitidos para `tipo = ARCHIVO`: `application/pdf`.

### 9. `AsignacionTarea`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| tarea_id | UUID (FK Tarea) | — |
| usuario_id | UUID (FK Usuario) | — |
| estado | enum | `PENDIENTE`, `VISTA`, `COMPLETADA` |
| completado_en | timestamp, nullable | — |
| created_at | timestamp | Fecha de asignación |
| updated_at | timestamp | Fecha de última actualización |

Restricción: `UNIQUE(tarea_id, usuario_id)`.

### 10. `Notificacion`
Representa el contenido de un evento de notificación, una sola vez, independientemente del número de destinatarios.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| organizacion_id | UUID (FK Organizacion), nullable | — |
| tipo | enum | `TAREA_ASIGNADA`, `QR_DISPONIBLE`, `RECORDATORIO_SALIDA`, `SISTEMA` |
| titulo | string | — |
| contenido | text, nullable | — |
| referencia_id | UUID, nullable | Id de la entidad relacionada (tarea, jornada, etc.) |
| creado_por | UUID (FK Usuario), nullable | Null si el evento lo genera el sistema |
| created_at | timestamp | — |
| updated_at | timestamp | Fecha de última actualización |

### 11. `NotificacionUsuario`
Relación notificación–destinatario. Una fila por usuario que debe recibir el evento.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| notificacion_id | UUID (FK Notificacion) | — |
| usuario_id | UUID (FK Usuario) | — |
| leida | boolean | — |
| leida_en | timestamp, nullable | — |
| created_at | timestamp | — |
| updated_at | timestamp | Fecha de última actualización |

Restricción: `UNIQUE(notificacion_id, usuario_id)`.

### 12. `PushToken`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| usuario_id | UUID (FK Usuario) | — |
| plataforma | enum | `ANDROID`, `IOS`, `WEB` |
| expo_push_token | string, nullable | Requerido si plataforma es `ANDROID` o `IOS` |
| web_push_suscripcion | JSON, nullable | Requerido si plataforma es `WEB` (`endpoint` + claves) |
| activo | boolean | Validez técnica del token, no indica presencia del usuario |
| ultima_vez_usado | timestamp, nullable | — |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de última actualización |

Restricción: `CHECK` que exige `expo_push_token` XOR `web_push_suscripcion` según `plataforma`.

No existe tabla de sesiones/refresh tokens: la gestión de sesión la resuelve Clerk (ver `05-autenticacion-y-autorizacion.md`).
