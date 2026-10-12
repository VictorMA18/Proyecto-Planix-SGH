# Roadmap

### Fase 1 — Núcleo ✅
- Integración con Clerk (login, OAuth, webhook de sincronización).
- Organizaciones y membresías con roles.
- Generación de QR diario y ciclo de entrada/salida.

### Fase 2 — Asistencia avanzada ✅
- Múltiples ciclos de entrada/salida por día sobre una misma jornada (`JornadaAsistencia` + `MovimientoAsistencia`).
- QR dinámico (rota cada 2 min), turnos por plantilla con tolerancia de entrada y puntualidad.
- Inicio por rol con datos reales (presencia del equipo para ADMIN y SUPERVISOR).
- Historial de jornadas y reporte de horas trabajadas (ADMIN).

### Fase 3 — Calendario y tareas ✅
- Calendario dinámico, creación y edición de tareas asignadas a uno o varios miembros (adelanta parte de la Fase 5).
- Flujo de estado, prioridad, ubicación, etiquetas, subtareas, comentarios y actividad.
- Adjuntos (PDF e imágenes) en Cloudinary.
- Tareas reales en Inicio.
- Pendiente para la Fase 4: notificar a las personas asignadas.

### Fase 4 — Notificaciones
- Push mobile (Expo) y web (Web Push).
- Difusión general a organización.
- Centro de notificaciones in-app.

### Fase 5 — Reportes y permisos avanzados
- Reportes exportables (PDF/Excel).
- Asignación de tareas a subconjuntos de usuarios (no solo a toda la organización).
