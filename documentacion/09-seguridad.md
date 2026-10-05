# Seguridad

- Autenticación delegada a Clerk; el backend no almacena contraseñas ni tokens de sesión propios.
- El webhook de Clerk valida su firma antes de aplicar cambios sobre `usuarios`.
- Las credenciales de Cloudinary residen únicamente en variables de entorno del backend; el cliente nunca las recibe ni sube archivos directamente a Cloudinary. Toda subida pasa primero por el backend, que valida formato y tamaño antes de reenviar el archivo.
- `CodigoQR.token` es aleatorio y no adivinable (UUID v4); se valida contra `organizacion_id` y `fecha` en cada escaneo.
- Los cálculos de vigencia de QR y de horas de entrada/salida usan la zona horaria de la organización, no la del dispositivo del cliente.
- La creación de `AsignacionTarea` y `NotificacionUsuario` para todos los miembros de una organización se ejecuta dentro de una transacción de base de datos.
- Toda consulta del backend filtra explícitamente por `organizacion_id` para evitar acceso cruzado entre organizaciones.
- Las claves de herramientas de agentes (ej. `STITCH_API_KEY`) viven solo en el entorno del desarrollador o en la configuración global del agente. Los archivos versionados (`.mcp.json`, `opencode.json`) únicamente referencian la variable. Una clave expuesta se rota de inmediato.
