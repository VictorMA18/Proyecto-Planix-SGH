# Sistema de Notificaciones

## Modelo

| Tabla | Rol |
|---|---|
| `notificaciones` | Contenido del evento (título, contenido, tipo, referencia). Una sola fila por evento. |
| `notificaciones_usuario` | Una fila liviana por destinatario, con su propio estado de lectura (`leida`, `leida_en`). |
| `push_tokens` | Identificador de cada dispositivo/navegador del usuario para enviarle push. |

Una difusión a 500 miembros crea **1** fila en `notificaciones` y **500** filas livianas en `notificaciones_usuario`, sin duplicar el texto.

## Tipos de notificación

`TAREA_ASIGNADA`, `QR_DISPONIBLE`, `RECORDATORIO_SALIDA`, `SISTEMA`.

## Flujo de envío (fan-out)

1. `NotificacionesService` crea una fila en `notificaciones`.
2. Crea una fila en `notificaciones_usuario` por cada destinatario (miembros con `estado = ACTIVO`), dentro de una transacción.
3. Publica un mensaje en RabbitMQ por cada destinatario (o por lote).
4. Un consumer dedicado consulta los `push_tokens` con `activo = true` del usuario:
   - `ANDROID` / `IOS` → Expo Push Service (`expo_push_token`).
   - `WEB` → Web Push API (`web_push_suscripcion`).
5. Si el proveedor reporta un token inválido, se marca `push_tokens.activo = false` (no se reintenta ni se borra la fila).
6. El usuario consulta su bandeja (`GET /notificaciones`, JOIN `notificaciones` + `notificaciones_usuario`) y al abrir una notificación se marca `leida = true`, `leida_en = ahora`.

## Reglas

- El push llega aunque el usuario no tenga la app abierta. `push_tokens.activo` indica solo la validez técnica del token, no la presencia del usuario.
- Un usuario puede tener varios `push_tokens` (uno por dispositivo/navegador).
- `expo_push_token` XOR `web_push_suscripcion` según `plataforma` (`CHECK` en la tabla).
- El fan-out se usa tanto en la creación de tareas como en `POST /organizaciones/{id}/notificaciones/difusion`.
