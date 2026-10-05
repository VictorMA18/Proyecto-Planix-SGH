# Arquitectura

## Visión general

```
        ┌───────────────────────────────┐
        │     App única (Expo Router)    │
        │    Android · iOS · Web (PWA)   │
        └────────────────┬───────────────┘
                          │
                   HTTPS / REST
                          │
                ┌─────────▼─────────┐
                │     API NestJS     │
                │    (REST + WS)     │
                │  Verifica JWT de   │
                │      Clerk         │
                └─────────┬──────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
   ┌──────▼──────┐  ┌─────▼─────┐  ┌──────▼──────┐
   │  PostgreSQL  │  │ RabbitMQ  │  │  Expo Push  │
   │ (multi-tenant)│ │ (Docker)  │  │ / Web Push  │
   └──────────────┘  └───────────┘  └─────────────┘
```

Servicios externos: Clerk (autenticación), Cloudinary (archivos). Ver `08-integraciones-externas.md`.

**Multi-tenancy:** toda entidad de negocio está asociada a una `organizacion_id`. Toda consulta del backend filtra explícitamente por esta columna.

## Stack tecnológico

### Frontend
| Componente | Tecnología |
|---|---|
| Framework | Expo (React Native) + Expo Router |
| Plataformas | Android, iOS, Web (exportación con `react-native-web`) |
| Web como PWA | Manifest + service worker generados en la exportación web de Expo |
| Escaneo QR | `expo-camera` / `expo-barcode-scanner` (mobile); cámara del navegador (web) |
| Notificaciones push (cliente) | `expo-notifications` (mobile); Web Push API (web) |
| Estado remoto | TanStack Query |
| Estado local | Zustand |
| Estilos | NativeWind |
| Calendario | Componente propio basado en `View` / `FlatList` |
| Autenticación (cliente) | `@clerk/clerk-expo` |
| Diseño de interfaces | Stitch vía MCP (ver `08-integraciones-externas.md`) |
| Identidad visual / Logo | `assets/Logo_Planix.png` (incorporado en UI de Autenticación y navegación) |

### Backend
| Componente | Tecnología |
|---|---|
| Framework | NestJS (Node.js + TypeScript) |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Cola de mensajes | RabbitMQ, consumido desde NestJS vía `@nestjs/microservices` (transporte `RMQ`) |
| Autenticación (servidor) | Verificación de JWT de Clerk vía SDK backend de Clerk |
| Tiempo real | Nest Gateway (WebSockets) |
| Archivos | Cloudinary (subida desde el backend) |

### Infraestructura
| Componente | Servicio |
|---|---|
| API | Contenedor Docker en VPS / Railway / Render / AWS ECS |
| Build y distribución mobile | EAS Build (Expo Application Services) |
| Hosting build web (PWA) | Vercel / Netlify / hosting estático |
| Base de datos gestionada | Supabase / RDS / Railway |
| Cola de mensajes (desarrollo) | Docker, imagen `rabbitmq:3-management` |

## Estructura del proyecto

```
sgh-proyecto/
├── api/                # NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── organizaciones/
│   │   │   ├── miembros/
│   │   │   ├── qr/
│   │   │   ├── asistencia/
│   │   │   ├── tareas/
│   │   │   └── notificaciones/
│   │   └── prisma/
│   └── package.json
└── app/                # Expo (Android, iOS, Web)
    ├── app/            # Rutas (Expo Router)
    ├── src/
    │   ├── components/
    │   ├── hooks/
    │   ├── services/    # Cliente API
    │   ├── schemas/     # Validaciones (Zod)
    │   └── types/
    └── package.json
```

## Lógica de negocio en el backend (no en la base de datos)

La base de datos es almacenamiento puro: sin funciones, triggers ni vistas con reglas de negocio. Esa lógica vive en servicios de NestJS, versionada y testeada junto al resto del código.

| Regla de negocio | Dónde se implementa |
|---|---|
| Mantenimiento de `updated_at` en cada tabla | Prisma (`@updatedAt`), no un trigger |
| Cálculo de horas trabajadas (suma de tramos `ENTRADA → SALIDA` por jornada) | `ReportesService.calcularHorasTrabajadas()` — consulta `MovimientoAsistencia` ordenado por `hora` y empareja los tramos en código |
| Validación de alternancia de movimientos según `JornadaAsistencia.estado_actual` | `AsistenciaService` |
| Validación de formato y tamaño de adjuntos antes de subir a Cloudinary | `TareasService` |
| Fan-out de notificaciones (evento único + destinatarios) | `NotificacionesService` |
| Verificación de firma y procesamiento del webhook de Clerk | `AuthService` / controlador de webhooks |

La base de datos conserva únicamente integridad estructural: claves foráneas, `UNIQUE`, `CHECK` de rangos de fechas.
