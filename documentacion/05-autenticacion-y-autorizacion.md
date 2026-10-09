# Autenticación y Autorización

### 1 Autenticación (Clerk)

- Clerk gestiona credenciales, proveedores OAuth 2.0 (Google, GitHub, Microsoft, etc.), emisión y renovación de tokens de sesión.
- El cliente Expo obtiene el JWT de sesión mediante `@clerk/clerk-expo` y lo envía en `Authorization: Bearer <token>` en cada request.
- El backend NestJS valida el JWT con el SDK backend de Clerk (firma + expiración) en cada request; no emite ni almacena tokens de sesión propios.
- La tabla `usuarios` almacena `clerk_id` como referencia a la identidad en Clerk. No almacena contraseñas.
- Un webhook (`POST /webhooks/clerk`) sincroniza `usuarios` ante los eventos `user.created`, `user.updated`, `user.deleted` de Clerk. La firma del webhook (Svix) se valida sobre el cuerpo crudo de la petición antes de aplicar cambios. `user.deleted` desactiva al usuario (`activo = false`) en lugar de borrarlo, para conservar su historial.
- Si una petición autenticada llega antes que el webhook (p. ej. en desarrollo sin el retransmisor), el backend crea el usuario local consultando a Clerk (`UsuariosService.obtenerOCrear`).
- Un usuario desactivado recibe `403` en cualquier endpoint.

### 2 Autorización (RBAC)

El rol se evalúa por membresía (`MiembroOrganizacion.rol`), no por usuario. Cada request a un recurso de organización valida el rol del usuario autenticado dentro de esa organización específica.

| Acción | SUPER_ADMIN | ADMIN | SUPERVISOR | EMPLEADO |
|---|:---:|:---:|:---:|:---:|
| Crear organización | ✅ | ✅ | ❌ | ❌ |
| Configurar organización | ✅ | ✅ | ❌ | ❌ |
| Invitar / gestionar usuarios | ✅ | ✅ | ❌ | ❌ |
| Asignar roles | ✅ | ✅ | ❌ | ❌ |
| Ver, proyectar y compartir el QR dinámico | ✅ | ✅ | ❌ | ❌ |
| Configurar turnos y tolerancia de entrada | ✅ | ✅ | ❌ | ❌ |
| Ver presencia del equipo hoy (Inicio) | ✅ | ✅ | ✅ | ❌ |
| Escanear QR (marcar entrada) | ✅ | ✅ | ✅ | ✅ |
| Confirmar salida propia | ✅ | ✅ | ✅ | ✅ |
| Crear tareas / difusiones | ✅ | ✅ | ✅ | ❌ |
| Ver tareas propias asignadas | ✅ | ✅ | ✅ | ✅ |
| Ver reporte individual | ✅ | ✅ | ✅ | ✅ |
| Ver reporte de horas del equipo | ✅ | ✅ | ❌ | ❌ |
| Ver reportes globales (multi-org) | ✅ | ❌ | ❌ | ❌ |
