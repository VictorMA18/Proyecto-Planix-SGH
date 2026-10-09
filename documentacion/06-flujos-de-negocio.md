# Flujos de Negocio

### 1. Generación de QR diario
1. `ADMIN` solicita el QR del día para su organización.
2. Si no existe `CodigoQR` para `(organizacion_id, fecha_actual)`, se genera uno con `expira_en = fin del día` en la zona horaria de la organización.
3. Si ya existe, se retorna el existente.

### 2. Marcar entrada (primera del día o retorno)
1. El usuario escanea el QR y envía su `token` al backend.
2. Validaciones: el token pertenece a la organización del usuario y está vigente para la fecha actual.
3. Si no existe `JornadaAsistencia` para `(usuario_id, fecha_actual)`:
   - Se crea la jornada con `hora_inicio = ahora`, `estado_actual = DENTRO`, `codigo_qr_id` del token escaneado.
   - Se crea un `MovimientoAsistencia` tipo `ENTRADA`.
4. Si ya existe una jornada para hoy y su `estado_actual = FUERA` (el usuario había registrado una salida intermedia):
   - Se crea un nuevo `MovimientoAsistencia` tipo `ENTRADA` (retorno) asociado a esa misma jornada.
   - Se actualiza `estado_actual = DENTRO`.
5. Si la jornada ya está en `estado_actual = DENTRO`, se rechaza la solicitud (ya hay un ciclo abierto).

### 3. Confirmar salida (intermedia o final)
1. El usuario confirma salida desde la app (no requiere escanear QR).
2. Debe existir una `JornadaAsistencia` del día en `estado_actual = DENTRO`.
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
La pestaña Inicio cambia según el rol del usuario en la organización activa. Todas muestran la fecha y un saludo con su nombre.
- **EMPLEADO:** su turno, el **tiempo activo de hoy** (cronómetro desde la hora de entrada, con el progreso y el tiempo restante del turno), las métricas de la semana (horas, puntualidad, tareas completadas), las tareas de hoy y los compañeros en turno.
- **SUPERVISOR:** lo mismo que el empleado, más dos accesos rápidos debajo del tiempo activo: **Nueva tarea** y **Difundir aviso**.
- **ADMIN** (y SUPER_ADMIN): su propio **tiempo activo** (la misma jornada que los demás roles) y, debajo, un **panel de control**: el QR de asistencia vigente (con cuenta atrás y botón para proyectarlo), los mismos accesos rápidos, presencia en directo (presentes frente a esperados y su distribución), tareas de la organización, puntualidad semanal y asistencias recientes.

Hoy los datos de asistencia, métricas y tareas son de ejemplo (contratos `GET /organizaciones/{id}/inicio/mio` y `/inicio/panel`, ver `04-api.md`) y la pantalla lo avisa; el nombre, el rol, la organización y los compañeros son reales. Los accesos rápidos y «Proyectar» se activarán con las fases de tareas, notificaciones y QR.

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
