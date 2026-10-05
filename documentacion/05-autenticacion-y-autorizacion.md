# Autenticación y Autorización

### 1 Autenticación (Clerk)

- Clerk gestiona credenciales, proveedores OAuth 2.0 (Google, GitHub, Microsoft, etc.), emisión y renovación de tokens de sesión.
- El cliente Expo obtiene el JWT de sesión mediante `@clerk/clerk-expo` y lo envía en `Authorization: Bearer <token>` en cada request.
- El backend NestJS valida el JWT con el SDK backend de Clerk (firma + expiración) en cada request; no emite ni almacena tokens de sesión propios.
- La tabla `usuarios` almacena `clerk_id` como referencia a la identidad en Clerk. No almacena contraseñas.
- Un webhook (`POST /webhooks/clerk`) sincroniza `usuarios` ante los eventos `user.created`, `user.updated`, `user.deleted` de Clerk. La firma del webhook se valida antes de aplicar cambios.

### 2 Autorización (RBAC)

El rol se evalúa por membresía (`MiembroOrganizacion.rol`), no por usuario. Cada request a un recurso de organización valida el rol del usuario autenticado dentro de esa organización específica.

| Acción | SUPER_ADMIN | ADMIN | SUPERVISOR | EMPLEADO |
|---|:---:|:---:|:---:|:---:|
| Crear organización | ✅ | ✅ | ❌ | ❌ |
| Configurar organización | ✅ | ✅ | ❌ | ❌ |
| Invitar / gestionar usuarios | ✅ | ✅ | ❌ | ❌ |
| Asignar roles | ✅ | ✅ | ❌ | ❌ |
| Generar código QR del día | ✅ | ✅ | ❌ | ❌ |
| Escanear QR (marcar entrada) | ✅ | ✅ | ✅ | ✅ |
| Confirmar salida propia | ✅ | ✅ | ✅ | ✅ |
| Crear tareas / difusiones | ✅ | ✅ | ✅ | ❌ |
| Ver tareas propias asignadas | ✅ | ✅ | ✅ | ✅ |
| Ver reportes de su equipo | ✅ | ✅ | ✅ | ❌ |
| Ver reportes globales (multi-org) | ✅ | ❌ | ❌ | ❌ |
