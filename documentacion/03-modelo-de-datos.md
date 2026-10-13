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
| tolerancia_entrada_min | smallint | Minutos de gracia tras el inicio del turno para que la entrada cuente como puntual (por defecto 15, entre 0 y 120) |
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
| plantilla_turno_id | UUID (FK PlantillaTurno), nullable | Turno asignado. Cada miembro tiene como máximo uno; al eliminar la plantilla queda en `NULL` |
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
| token | string | Secreto del día (nunca se muestra). El QR visible es un texto firmado con HMAC de este secreto que rota cada 2 minutos (ver flujo 1 de `06-flujos-de-negocio.md`) |
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
| turno_nombre | string, nullable | Copia del nombre de la plantilla vigente al registrar la primera entrada (`NULL` si ese día no tenía turno) |
| turno_inicio | timestamp, nullable | Inicio del turno de ese día (copia) |
| turno_fin | timestamp, nullable | Fin del turno de ese día (copia; puede ser del día siguiente si cruza la medianoche) |
| minutos_tarde | smallint, nullable | Minutos de la primera entrada después de `turno_inicio` (0 si llegó antes) |
| puntual | boolean, nullable | `minutos_tarde <= tolerancia_entrada_min` vigente al entrar |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de última actualización |

Restricciones: `UNIQUE(usuario_id, organizacion_id, fecha)` — una sola jornada por usuario, organización y día (un usuario puede marcar en varias organizaciones). `CHECK(hora_fin >= hora_inicio)`.

Las columnas `turno_*`, `minutos_tarde` y `puntual` son una copia tomada al entrar: el historial y los reportes no cambian si luego se edita la plantilla o la tolerancia. El cálculo lo hace el backend, no la base de datos.

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
| estado | enum | `PENDIENTE`, `EN_PROGRESO`, `REVISION`, `COMPLETADA`. Es de la tarea (no de cada asignación); cualquier miembro lo mueve |
| prioridad | enum | `ALTA` (urgente), `MEDIA` («Normal»), `BAJA` |
| ubicacion | string, nullable | Lugar donde se realiza (máx. 120) |
| etiquetas | text[] | Hasta 5 etiquetas de 24 caracteres (validadas en el backend) |
| completada_en | timestamp, nullable | Cuándo pasó a `COMPLETADA` |
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
| mimeType | string | Formato detectado por el contenido del archivo (no por su extensión) |
| tamanoBytes | integer | Tamaño del archivo en bytes; máximo 10 MB (10 485 760) |
| orden | integer | Posición de despliegue cuando hay varios adjuntos |
| createdAt | timestamp | Fecha en que se agregó el adjunto |

**Validación:** ocurre en el servicio del backend, no en la base de datos. El backend valida formato y tamaño **antes** de subir el archivo a Cloudinary; ningún archivo se sube sin pasar esta validación.
- Tamaño máximo: 10 MB.
- Formatos permitidos para `tipo = IMAGEN`: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Formatos permitidos para `tipo = ARCHIVO`: `application/pdf`.
- El formato se comprueba con los primeros bytes del archivo (firma de PDF, PNG, JPEG, GIF o WebP), no con el `Content-Type` que declara el cliente.
- Máximo 10 adjuntos por tarea. Duplicar una tarea no copia sus adjuntos; eliminarla borra sus archivos de Cloudinary.

### 9. `AsignacionTarea`
Persona asignada a una tarea. Quien crea o edita la tarea elige a qué miembros activos se asigna (uno o varios).

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| tarea_id | UUID (FK Tarea) | — |
| usuario_id | UUID (FK Usuario) | — |
| created_at | timestamp | Fecha de asignación |
| updated_at | timestamp | Fecha de última actualización |

Restricción: `UNIQUE(tarea_id, usuario_id)`.

### 9.1. `SubtareaTarea`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| tarea_id | UUID (FK Tarea, cascada) | — |
| titulo | string | Máx. 120 caracteres |
| completada | boolean | — |
| orden | integer | Posición en la lista |
| created_at / updated_at | timestamp | — |

### 9.2. `ComentarioTarea`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| tarea_id | UUID (FK Tarea, cascada) | — |
| usuario_id | UUID (FK Usuario) | Autor |
| texto | string | Máx. 1000 caracteres |
| created_at / updated_at | timestamp | — |

### 9.3. `ActividadTarea`
Historial de una tarea: el backend registra un evento por cada acción (crear, editar con el detalle de qué cambió, mover el estado, marcar subtareas, comentar, adjuntar, duplicar).

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| tarea_id | UUID (FK Tarea, cascada) | — |
| usuario_id | UUID (FK Usuario), nullable | Quién lo hizo (`SET NULL` si se borra el usuario) |
| tipo | enum | `CREADA`, `EDITADA`, `ESTADO`, `ASIGNADOS`, `SUBTAREA`, `COMENTARIO`, `ADJUNTO`, `DUPLICADA` |
| descripcion | string | Texto legible, p. ej. «cambió la prioridad a Alta» |
| created_at / updated_at | timestamp | — |

### 10. `Notificacion`
Representa el contenido de un evento de notificación, una sola vez, independientemente del número de destinatarios.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| organizacion_id | UUID (FK Organizacion), nullable | — |
| tipo | enum | `TURNO_ASIGNADO`, `TURNO_ACTUALIZADO`, `TAREA_ASIGNADA`, `TAREA_ACTUALIZADA`, `ASISTENCIA_REGISTRADA`, `QR_DISPONIBLE`, `RECORDATORIO_ENTRADA`, `RECORDATORIO_SALIDA`, `AVISO`, `MIEMBRO_NUEVO`, `SISTEMA` |
| titulo | string | — |
| contenido | text, nullable | — |
| referencia_id | UUID, nullable | Id de la entidad relacionada (tarea, plantilla de turno o jornada) |
| datos | JSON, nullable | Detalle propio del tipo: `{ puntual, turno }` en `ASISTENCIA_REGISTRADA`, `{ fecha }` en `RECORDATORIO_ENTRADA` |
| creado_por | UUID (FK Usuario), nullable | Quien provocó el evento (la app lo muestra como autor); null si lo genera el sistema o si se eliminó el usuario |
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

Restricción: `CHECK` que exige `expo_push_token` XOR `web_push_suscripcion` según `plataforma`. `expo_push_token` es único: si otra cuenta inicia sesión en el mismo dispositivo, el token pasa a esa cuenta. Las suscripciones web se reconocen por su `endpoint` en el backend. El backend marca `activo = false` cuando el proveedor informa que el token ya no es válido o al cerrar sesión.

### 12.1. `PreferenciasNotificacion`
Canales y modo de alerta de cada usuario. Sin fila, el backend aplica los valores por defecto.

| Campo | Tipo | Descripción |
|---|---|---|
| usuario_id | UUID (PK, FK Usuario) | — |
| push | boolean | Recibir notificaciones push (por defecto `true`); la bandeja se llena igual |
| recordatorios_fichaje | boolean | Recordatorios 15 min antes del inicio y del término del turno |
| novedades_tareas | boolean | Avances, comentarios y subtareas de las tareas propias (la asignación siempre llega) |
| modo_alerta | enum | `SONIDO`, `VIBRACION`, `SILENCIO`: cómo suena el push en el dispositivo |
| created_at / updated_at | timestamp | — |

No existe tabla de sesiones/refresh tokens: la gestión de sesión la resuelve Clerk (ver `05-autenticacion-y-autorizacion.md`).

### 13. `CodigoInvitacion`
Código genérico de invitación (no va ligado a un correo). Lo puede usar cualquier persona mientras no expire; quien lo use entra a la organización con `rol`. La invitación personal (correo + rol) es `Invitacion`.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| organizacion_id | UUID (FK Organizacion) | — |
| codigo | string | Código único (10 caracteres alfanuméricos), se canjea con `POST /invitaciones/{token}/aceptar` |
| rol | enum | Rol que recibe quien use el código (`ADMIN`, `SUPERVISOR` o `EMPLEADO`) |
| creado_por | UUID (FK Usuario) | Administrador que lo generó |
| expira_en | timestamp | Vencimiento (5, 10 o 15 minutos desde su creación) |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de última actualización |

### 14. `PlantillaTurno`
Horario recurrente de una organización (p. ej. «Turno Mañana»), asignable a sus miembros (`MiembroOrganizacion.plantilla_turno_id`).

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| organizacion_id | UUID (FK Organizacion) | — |
| nombre | string | Nombre visible (2 a 60 caracteres) |
| hora_inicio | time | Hora local de inicio en la zona de la organización |
| hora_fin | time | Hora local de fin; si es menor o igual que `hora_inicio`, el turno cruza la medianoche |
| dias | smallint[] | Días en que aplica: 1 = lunes … 7 = domingo |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de última actualización |
