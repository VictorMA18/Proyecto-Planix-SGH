# Flujos de Negocio

### 1. QR dinámico de asistencia
1. `ADMIN` pide el QR vigente (`GET /organizaciones/{id}/qr/hoy`, también incluido en el panel de Inicio).
2. Si no existe `CodigoQR` para `(organizacion_id, fecha_actual)` (fecha en la zona horaria de la organización), se crea con un **secreto aleatorio** en `token` y `expira_en = medianoche local`. El secreto nunca sale del backend.
3. El texto que se muestra en el QR es `PLX1.<codigoQrId>.<ventana>.<firma>`, donde `ventana` cambia cada 120 s y `firma` es un HMAC-SHA256 del id y la ventana con el secreto del día. La respuesta incluye `expiraEn` (fin de la ventana) para la cuenta atrás.
4. El administrador puede proyectarlo, compartirlo o descargarlo; la copia vale solo hasta que vence su ventana (la app lo indica: «Válido hasta HH:mm»). Por eso no se admite un QR impreso permanente.

### 2. Marcar entrada (primera del día o retorno)
1. El usuario escanea el QR y envía su `token` al backend (`POST /asistencia/entrada`). La organización sale del propio token.
2. Validaciones: formato, firma (comparación en tiempo constante), ventana actual o la anterior (margen de escaneo) y que el QR sea el de hoy (`400` si falla). El usuario debe ser miembro `ACTIVO` de esa organización (`404` si no).
3. Si no existe `JornadaAsistencia` para `(usuario_id, organizacion_id, fecha_actual)`:
   - Se crea la jornada con `hora_inicio = ahora`, `estado_actual = DENTRO`, `codigo_qr_id` del token escaneado.
   - Si el miembro tiene turno ese día, se copian `turno_nombre`, `turno_inicio` y `turno_fin` y se evalúa la **puntualidad**: `minutos_tarde = max(0, ahora − turno_inicio)` y `puntual = minutos_tarde ≤ tolerancia_entrada_min`.
   - Se crea un `MovimientoAsistencia` tipo `ENTRADA`.
4. Si ya existe una jornada para hoy y su `estado_actual = FUERA` (el usuario había registrado una salida intermedia):
   - Se crea un nuevo `MovimientoAsistencia` tipo `ENTRADA` (retorno) asociado a esa misma jornada.
   - Se actualiza `estado_actual = DENTRO`.
5. Si la jornada ya está en `estado_actual = DENTRO`, se rechaza la solicitud (ya hay un ciclo abierto).

### 3. Confirmar salida (intermedia o final)
1. El usuario confirma salida desde la app (no requiere escanear QR). La hora la pone siempre el servidor.
2. Debe existir una `JornadaAsistencia` en `estado_actual = DENTRO` (la de hoy o, si quedó abierta, la de ayer para turnos que cruzan la medianoche); si no, `404`.
3. Se crea un `MovimientoAsistencia` tipo `SALIDA` con `hora = ahora`.
4. Se actualiza la jornada: `hora_fin = ahora` (siempre queda con la última salida registrada), `estado_actual = FUERA`.
5. El sistema no distingue de antemano si esta salida es "final" o "intermedia": simplemente queda como la última hasta que ocurra un nuevo retorno (flujo 2) ese mismo día. Si el usuario no vuelve a escanear el QR, esa `hora_fin` es la salida oficial del día.
6. Un nuevo retorno exige un nuevo escaneo del QR vigente del día (flujo 2, punto 4).

### 4. Creación de organización
1. Un usuario autenticado crea una organización.
2. Se crea `Organizacion` y una fila en `MiembroOrganizacion` con `rol = ADMIN`, `estado = ACTIVO` para el usuario creador, en una sola operación atómica.
3. El `slug` se genera a partir del nombre (sin acentos, en minúsculas y con guiones); si ya existe se le añade un sufijo aleatorio.

### 5. Invitación de usuarios
1. `ADMIN` crea una `Invitacion` (email + rol) para su organización.
   - Solo un `ADMIN` (o `SUPER_ADMIN`) de esa organización puede invitar. No se puede invitar con rol `SUPER_ADMIN`.
   - La respuesta incluye el `token` (10 caracteres alfanuméricos, sin caracteres ambiguos) que el admin comparte con el invitado. Vigencia: 7 días.
2. El invitado acepta mediante el token (`POST /invitaciones/{token}/aceptar`, pantalla «Unirme con código»): se crea o activa su `MiembroOrganizacion` con el rol definido en la invitación y la invitación pasa a `ACEPTADA`.
   - El token se normaliza (mayúsculas, sin espacios).
   - Solo lo puede aceptar el usuario cuyo correo coincide con el de la invitación (`403` en otro caso).
   - `404` si el código no existe, `410` si ya se usó, fue cancelado o expiró (en ese caso pasa a `EXPIRADA`), `409` si ya es miembro activo.
3. **Dos formas de invitar** (pantalla «Equipo y Miembros», botón «Invitar nuevo miembro», solo `ADMIN`):
   - **Personal** (`POST /organizaciones/{id}/invitaciones`): se indica el correo y el rol; el código solo lo puede usar ese correo y dura 7 días. No se puede crear otra invitación pendiente para el mismo correo (`409`): se reenvía la existente.
   - **Código genérico** (`POST /organizaciones/{id}/codigos-invitacion`, tabla `codigos_invitacion`): se indica el rol y la vigencia (5, 10 o 15 minutos); cualquier persona que lo use entra con ese rol, sin importar su correo. No se consume al usarlo: lo puede canjear cada persona una vez hasta que expire (`410` después).
   - En ambos casos un modal muestra el código para copiarlo o compartirlo, y se canjea en el mismo endpoint (`POST /invitaciones/{token}/aceptar`): primero se busca como invitación personal y, si no existe, como código genérico.
4. **Reenviar** (`POST /invitaciones/{id}/reenviar`): un `ADMIN` renueva 7 días la vigencia de una invitación personal pendiente o expirada (`410` si ya se aceptó o canceló). Por ahora no se envía correo.
5. **Ver el equipo** (`GET /organizaciones/{id}/equipo`): cualquier miembro ve a los miembros activos y las invitaciones pendientes, con búsqueda por nombre o correo, filtro por rol o pendientes y paginación.

### 5.1. Gestión de miembros (pantalla «Equipo y Miembros», menú ⋮ de cada miembro)
1. **Ver perfil** (`GET /organizaciones/{id}/miembros/{miembroId}`): cualquier miembro ve la identidad, el rol, el estado y la fecha de ingreso (con su antigüedad). La credencial digital y las métricas del perfil son, por ahora, datos de ejemplo marcados como tales: dependen de asistencia y tareas.
2. **Cambiar rol** (`PATCH` con `{ rol }`): solo `ADMIN`. Pide confirmación y el cambio es inmediato. No se puede cambiar el propio rol, ni el de un `SUPER_ADMIN` (salvo siendo `SUPER_ADMIN`), ni asignar `SUPER_ADMIN`; si el miembro ya tiene ese rol responde `409`.
3. **Quitar del equipo** (`DELETE`): solo `ADMIN`. Pide confirmación; la membresía pasa a `INACTIVO` (se conserva el historial), la persona pierde el acceso y deja de aparecer en el equipo. Puede volver con una nueva invitación o código. No se puede quitar a uno mismo.
4. Como quien administra nunca es el propio objetivo, la organización siempre conserva al menos un administrador.

### 5.2. Pestaña «Inicio» según el rol
La pestaña Inicio cambia según el rol del usuario en la organización activa. Todas muestran la fecha, un saludo con su nombre y su turno de hoy (`GET /organizaciones/{id}/inicio/mio`).
- **EMPLEADO:** el **tiempo activo de hoy** (suma de tramos de la jornada real, con el progreso del turno), las métricas de la semana (horas frente a la semana anterior y puntualidad), las tareas de hoy (ejemplo hasta la Fase 3) y los compañeros.
- **SUPERVISOR:** lo mismo, más los accesos rápidos **Nueva tarea** y **Difundir aviso** (próximamente) y la **presencia del equipo** y las **asistencias recientes** (`/inicio/panel`, sin QR).
- **ADMIN** (y SUPER_ADMIN): su propio tiempo activo y el **panel de control**: el QR dinámico (cuenta atrás, proyectar, compartir y descargar), presencia en directo, puntualidad semanal, asistencias recientes y acceso al **reporte de horas**.

### 5.3. Turnos y puntualidad
1. Un `ADMIN` crea plantillas de turno (nombre, hora de inicio y fin locales, días de la semana) y les asigna miembros activos. **Cada miembro tiene como máximo un turno:** asignarlo a una plantilla lo saca de la anterior; eliminar una plantilla deja a sus miembros sin turno.
2. La **tolerancia de entrada** es de la organización (por defecto 15 min, entre 0 y 120).
3. Los **esperados** de un día son los miembros activos cuya plantilla incluye ese día de la semana. **Presentes** son los que están `DENTRO`; **pendientes**, los esperados sin jornada ese día.
4. La puntualidad semanal de un día es el porcentaje de primeras entradas puntuales entre las jornadas con turno.
5. Si a alguien se le asigna un turno después de registrar su entrada del día, «hoy» ya muestra ese turno (progreso y salida prevista), pero la puntualidad de esa entrada queda sin evaluar: solo se calcula al registrar la primera entrada.

### 5.4. Historial y reporte de horas
1. **Historial** (`GET /asistencia/historial`): cada persona ve sus jornadas, de la más reciente a la más antigua, con entrada, salida, minutos trabajados y puntualidad.
2. **Reporte** (`GET /organizaciones/{id}/reportes/asistencia`, solo `ADMIN`): por miembro, en un rango de hasta 92 días: días trabajados, minutos trabajados (suma de tramos `ENTRADA → SALIDA`, calculada en `ReportesService`), puntuales, tardanzas y minutos de retraso. Incluye a todos los miembros activos, aunque no hayan trabajado, y a los inactivos con jornadas en el rango.

### 6. Creación de tarea con asignación automática
1. `ADMIN` o `SUPERVISOR` crea una `Tarea`.
2. El backend obtiene todos los `MiembroOrganizacion` con `estado = ACTIVO` de la organización.
3. Se crea una `AsignacionTarea` por cada miembro.
4. Se crea una `Notificacion` (tipo `TAREA_ASIGNADA`) y una `NotificacionUsuario` por cada miembro (ver flujo 9).

### 7. Adjuntar material gráfico a una tarea
1. `ADMIN` o `SUPERVISOR` envía el archivo al backend (`multipart/form-data`), nunca directamente a Cloudinary.
2. El backend valida, en este orden: tamaño (máximo 10 MB) y formato contra la lista permitida según `tipo` (ver entidad `Tarea` en `03-modelo-de-datos.md`). Si falla, responde `413` (tamaño) o `415` (formato) sin subir nada. Esta validación ocurre en el servicio del backend, no en la base de datos.
3. Si pasa la validación, el backend sube el archivo a Cloudinary usando credenciales que residen únicamente en variables de entorno del servidor (nunca se envían ni se generan para el cliente).
4. El backend agrega un objeto al arreglo `adjuntos` de la `Tarea` con la `url` (`secure_url`) y el `cloudinaryPublicId` devueltos por Cloudinary, más `tipo`, `nombreArchivo`, `tamanoBytes` y `orden`.
5. Al eliminar un adjunto, el backend usa el `cloudinaryPublicId` almacenado para borrar el asset en Cloudinary antes de quitar el objeto del arreglo `adjuntos`.
6. Los adjuntos se listan ordenados por `orden` al consultar el detalle de la tarea.

### 8. Difusión general a la organización
1. `ADMIN` o `SUPERVISOR` crea una notificación de tipo `SISTEMA` sin asociarla a una tarea.
2. Se aplica el mismo mecanismo de fan-out del flujo 9.

### 9. Envío de notificaciones (fan-out)
1. Se crea una única fila en `Notificacion` con el contenido del evento.
2. Se crea una fila en `NotificacionUsuario` por cada destinatario.
3. Por cada destinatario, se consultan sus `PushToken` con `activo = true`.
4. Se despacha el push: Expo Push Service si `plataforma` es `ANDROID`/`IOS`; Web Push API si es `WEB`. El despacho se encola vía RabbitMQ (NestJS publica el mensaje; un consumer dedicado lo procesa de forma asíncrona).
5. Si el proveedor reporta un token inválido, se actualiza `PushToken.activo = false`.
6. El usuario consulta su bandeja (`Notificacion` JOIN `NotificacionUsuario` por `usuario_id`) y marca `leida = true`, `leida_en = ahora` al abrir la notificación.
