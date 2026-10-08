# Guía para Agentes de Desarrollo

Este documento es el punto de entrada para cualquier agente (Antigravity, OpenCode, Claude Code u otro) que vaya a continuar el desarrollo de este proyecto. Es la **única fuente de instrucciones**: los archivos específicos de cada agente (`CLAUDE.md`, `opencode.json`, `.mcp.json`) solo apuntan aquí o configuran MCP. Léelo antes de escribir código.

## 1. Qué hacer antes de escribir código

1. Lee `README.md` para el panorama general.
2. Lee `documentacion/02-arquitectura.md` completo — define el stack, la estructura de carpetas y qué lógica va en el backend vs. la base de datos.
3. Revisa `database/schema.sql` — es la fuente de verdad del modelo de datos. No lo modifiques sin reflejar el cambio también en `api/openapi.yaml` y en `documentacion/03-modelo-de-datos.md`.
4. Revisa `api/openapi.yaml` — es la fuente de verdad del contrato de API. Cualquier endpoint que implementes debe coincidir con lo definido ahí (paths, schemas, códigos de respuesta).
5. Revisa `documentacion/11-roadmap.md` para saber en qué fase está el proyecto y qué sigue.

## 2. Reglas no negociables del diseño

Estas decisiones ya se tomaron y están justificadas en la documentación. No las reviertas sin que el usuario lo pida explícitamente:

- **Un solo codebase de frontend** (Expo + Expo Router) para Android, iOS y Web. No crear un proyecto Next.js separado.
- **Ninguna lógica de negocio en la base de datos.** Nada de triggers, funciones ni vistas con cálculos. Todo cálculo o regla (horas trabajadas, alternancia de movimientos de asistencia, fan-out de notificaciones, validación de adjuntos) va en servicios de NestJS. Ver tabla completa en `documentacion/02-arquitectura.md`.
- **Autenticación delegada a Clerk.** No implementar login/registro/JWT propios. El backend solo verifica el JWT de Clerk.
- **Las credenciales de servicios externos (Clerk, Cloudinary, RabbitMQ) viven únicamente en variables de entorno del backend.** El cliente nunca las recibe.
- **El rol de un usuario es por organización**, no global (`MiembroOrganizacion.rol`). Un usuario puede ser `ADMIN` en una organización y `EMPLEADO` en otra.
- **Multi-tenancy real:** toda consulta a entidades de negocio debe filtrar por `organizacion_id`. No existen consultas "globales" salvo para `SUPER_ADMIN`.
- **Los adjuntos de tareas son un campo `JSONB` embebido** en `tareas.adjuntos`, no una tabla relacional.
- **El modelo de asistencia es jornada + movimientos** (`JornadaAsistencia` + `MovimientoAsistencia`), no un solo registro de entrada/salida. Soporta tanto el caso simple (1 entrada + 1 salida) como jornadas con salidas/retornos intermedios.

## 3. Cómo extender el proyecto

### Agregar una entidad nueva
1. Agrégala a `database/schema.sql` (tabla, enums si aplica, índices, FKs).
2. Documéntala en `documentacion/03-modelo-de-datos.md` con la misma estructura que las entidades existentes.
3. Agrega los schemas y endpoints correspondientes en `api/openapi.yaml`.
4. Si introduce un flujo de negocio nuevo, documéntalo en `documentacion/06-flujos-de-negocio.md`.

### Agregar un endpoint a una entidad existente
1. Defínelo primero en `api/openapi.yaml` (contract-first).
2. Verifica que la respuesta de error use el código HTTP correcto (`404`, `409`, `413`, `415`, etc., no todo `400`).
3. Implementa en el backend respetando el schema ya definido.

### Conectar un servicio externo nuevo
Este proyecto avanza de forma iterativa: en las primeras fases solo se configuran las API keys estrictamente necesarias; el resto se conecta cuando la fase que las necesita empieza. Antes de pedir o asumir una credencial nueva, revisa `documentacion/10-variables-de-entorno.md` para confirmar en qué fase corresponde.

## 4. Diseño de interfaces (MCP Stitch)

Las pantallas de la app (mobile y web) se diseñan primero en **Stitch** (Google) a través del servidor MCP oficial (`StitchMCP`, endpoint `https://stitch.googleapis.com/mcp`), en paralelo al desarrollo del backend. Antes de construir una pantalla desde cero:
1. Revisa si ya existe un diseño de esa pantalla en el proyecto de Stitch asociado.
2. Si existe, impleméntala en Expo replicando esa referencia visual (ajustando a NativeWind/componentes RN).
3. Si no existe, genera el diseño en Stitch primero y luego impleméntalo — no diseñes la UI directamente en código sin pasar por Stitch.

La clave de Stitch se lee de la variable de entorno `STITCH_API_KEY`. **Nunca** escribas, imprimas ni versiones esa clave ni ninguna otra credencial. Más detalle en `documentacion/08-integraciones-externas.md` y `documentacion/12-agentes-de-desarrollo.md`.

## 5. Skills recomendadas

Antes de empezar tareas repetitivas (migraciones Prisma, generación de módulos NestJS, validación contra el OpenAPI, etc.), revisa `skills/README.md`. Instala y usa las skills ahí listadas en vez de reinventar el flujo manualmente.

## 6. Compatibilidad entre agentes

El proyecto se trabaja con Antigravity y OpenCode, y se soporta Claude Code. Dónde configura cada uno sus instrucciones, MCP y skills está en `documentacion/12-agentes-de-desarrollo.md`. No crees reglas propias de un agente que contradigan este archivo.

## 7. Qué NO asumir

- No existe aún ninguna decisión de testing framework más allá del que trae NestJS por defecto (Jest). Si vas a escribir tests, usa Jest salvo que el usuario indique otra cosa.
- El CI (GitHub Actions) y el modelo de ramas ya están definidos (ver sección 12 y `documentacion/13-gitflow-y-ci.md`). El **CD** (despliegue) todavía no: no lo inventes; pregunta o déjalo como pendiente explícito si el trabajo lo requiere.
- No asumas nombres de variables de entorno fuera de los listados en `documentacion/10-variables-de-entorno.md`; si falta una, agrégala ahí primero.

## 8. Orden de trabajo sugerido

Sigue las fases de `documentacion/11-roadmap.md` en orden. No empieces la Fase 3 (calendario y tareas) sin tener funcionando la Fase 1 (Clerk, organizaciones, membresías, QR y entrada/salida básica), ya que varias entidades dependen de ella (`AsignacionTarea` depende de `MiembroOrganizacion`, por ejemplo).

## 9. Reglas de Diseño e Implementación UI con Skills de Expo

Cualquier desarrollo de interfaz móvil o web debe consultar y aplicar estrictamente las skills de Expo instaladas (`expo-design-system`, `expo-native-ui`, `expo-router`, `expo-project-structure`).

### Prioridad de Aplicación:
1. **`expo-design-system`**: Decisiones de medidas, spacing (escala de 4pt), tipografía (`DM Sans`), colores, radius, tokens y consistencia visual.
2. **`expo-native-ui`**: Patrones de interfaz móvil, comportamiento nativo, accesibilidad (`accessibilityRole`, `accessibilityLabel`), responsive layout y diferencias entre plataformas.
3. **`expo-router`**: Navegación y estructura de rutas.
4. **`expo-project-structure`**: Organización de archivos y componentes (`src/components/`, `src/app/`, `src/screens/`).

### Directrices Obligatorias:
- **Medidas y Spacing**: Usar únicamente valores coherentes de la escala de spacing (4, 8, 12, 16, 20, 24, 32). Reutilizar tokens existentes.
- **Responsive & Safe Areas**: Usar Flexbox (`flex-1`, `flexGrow`), safe area insets y layouts adaptativos para diferentes pantallas. No usar posiciones absolutas para layouts completos ni alturas rígidas innecesarias.
- **Touch Targets & Accesibilidad**: Áreas táctiles cómodas para móviles en todos los elementos interactivos, con feedback visual de estado (`pressed`, `disabled`, `loading`) y atributos de accesibilidad.
- **NativeWind**: Solución principal de styling (`className="..."`). No modificar versiones de NativeWind/Tailwind ni configuraciones de Metro/Babel.
- **Stitch como Referencia**: Mantener la fidelidad al diseño de Stitch adaptándolo a patrones móviles reales y seguros.
- **Explicación previa**: Antes de realizar cambios importantes en UI, indicar brevemente qué skill de Expo se está aplicando y por qué.


## 10. Datos y estado en la app (Zod, Zustand, TanStack Query)

Toda pantalla de la app (`app/`) debe usar estas tres tecnologías, cada una para lo suyo. No las reemplaces por `useState` manual ni por validaciones sueltas.

- **Zod — todo esquema.** Formularios (`schema.safeParse(...)` con errores por campo, como en `login.tsx`), respuestas de la API (`schema.parse(...)` en la capa de servicio) y filtros. Los tipos se infieren con `z.infer`: no escribas a mano interfaces de datos que ya tienen esquema. Los esquemas viven en `src/schemas/<dominio>.schema.ts` y se reexportan en `src/schemas/index.ts`. Mensajes de error en español.
- **Zustand — estado local y de UI.** Filtros, búsqueda, página, preferencias y organización activa. Stores en `src/stores/use<Nombre>Store.ts`. Persiste solo preferencias, con `persistStorage` (`src/stores/storage.ts`) y `partialize`. **No guardes en Zustand datos que vienen del servidor.**
- **TanStack Query — estado remoto.** Un hook por recurso en `src/services/<dominio>.ts`. Las claves incluyen `userId` y `organizacionId` para que no se mezclen datos entre cuentas u organizaciones; las mutaciones invalidan las consultas afectadas.
- **Mocks.** Mientras no exista el endpoint, los datos de ejemplo viven en `src/mocks/` y **solo** los consume `src/services/`, con la misma firma y la misma forma (validada con Zod) que tendrá la respuesta real, y un comentario `Backend: <MÉTODO> <ruta>` en cada función. Las pantallas y los componentes nunca importan `src/mocks/`; así el cambio a la API real se hace solo en el servicio.
- **Contract-first.** Todo endpoint proyectado se define primero en `api/openapi.yaml` y se marca como «proyectado» en `documentacion/04-api.md` hasta que se implemente.

## 11. Backend NestJS: DTOs y estructura de carpetas

- **DTOs obligatorios.** Toda entrada del backend (body, query y parámetros de ruta) se recibe como una **clase DTO** con `class-validator` y `class-transformer`; no se valida a mano dentro de controladores ni servicios. El `ValidationPipe` global se configura una sola vez en `src/app.setup.ts` (`configureApp`), que usan `main.ts` y los tests e2e: `whitelist`, `forbidNonWhitelisted` y `transform`. Mensajes de error en español.
- **Respuestas también como DTO.** Los controladores devuelven clases `*ResponseDto` con un mapeador estático `desde(...)`; nunca se devuelven entidades de Prisma directamente (así no se filtran campos internos y la forma coincide con `api/openapi.yaml`).
- **Un módulo, varios directorios.** Cada módulo de `src/modules/<módulo>/` reparte sus archivos en subcarpetas y no deja todo en una sola: `controllers/` (solo HTTP), `services/` (reglas de negocio), `dto/` (entrada y respuesta), y `utils/`, `validators/` o `interfaces/` solo si hacen falta, más `<módulo>.module.ts` en la raíz del módulo. Lo transversal va en `src/common/` (`guards/`, `decorators/`, `interfaces/`, `constants/`, `utils/`); el cliente de Clerk en `src/clerk/` y Prisma en `src/prisma/`.
- **Nombres:** archivos en kebab-case con el sufijo de su rol (`crear-invitacion.dto.ts`, `equipo.service.ts`, `equipo.controller.ts`); un DTO por archivo, salvo respuestas muy acopladas.
- **Pruebas:** DTOs con tests unitarios (`*.dto.spec.ts` junto al DTO) y endpoints con e2e en `api/test/e2e/`, con el guard de Clerk reemplazado y limpiando todo lo que creen en la base de desarrollo.

## 12. Git, GitFlow y CI

Guía completa en `documentacion/13-gitflow-y-ci.md`.

- **GitFlow.** Ramas: `main` (producción), `develop` (integración), `feature/*`, `bugfix/*`, `release/*` y `hotfix/*`. **Nunca** hagas push directo a `main` ni a `develop`: todo entra por Pull Request. A `main` solo se llega desde `release/*` o `hotfix/*`.
- **Conventional Commits en español**: `tipo(ámbito): descripción` (tipos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`, `build`, `style`, `revert`; ámbitos habituales: `api`, `mobile`, `database`, `root`). El título del PR sigue el mismo formato. Agrupa los commits por capa y evita commits de un solo archivo.
- **Antes de abrir un PR** ejecuta `pnpm check` (lint, formato, build y tests unitarios del backend, y tipos de la app) y, si tocaste el backend, `pnpm test:e2e:api`.
- **El CI debe pasar** (check `CI OK` de `.github/workflows/ci.yml`). No lo desactives, no lo debilites ni lo saltes para que pase: arregla la causa. Si cambias un comando de build, lint o test, actualiza el workflow y `documentacion/13-gitflow-y-ci.md` en el mismo cambio.
- **Coherencia que el CI protege:** `api/openapi.yaml` debe ser válido, `database/schema.sql` debe crear la base que usan los e2e, y el backend debe pasar ESLint y Prettier.
- **Credenciales:** nunca en el repositorio ni en workflows (el CI las busca). Los valores del CI son ficticios.

