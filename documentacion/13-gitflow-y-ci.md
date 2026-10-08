# GitFlow, CI y CD

Cómo se organiza el trabajo en Git y qué verifica GitHub Actions antes de integrar un cambio. Es la guía de referencia para personas y agentes; las reglas resumidas están en `AGENTS.md` (sección 12).

## Resumen

| Tema | Decisión |
|---|---|
| Modelo de ramas | **GitFlow**: `main`, `develop`, `feature/*`, `bugfix/*`, `release/*`, `hotfix/*` |
| Commits y títulos de PR | **Conventional Commits** en español: `tipo(ámbito): descripción` |
| Versionado | **SemVer** con tags `vMAJOR.MINOR.PATCH` sobre `main` |
| CI | GitHub Actions (`.github/workflows/ci.yml`), obligatorio en todo PR |
| CD (despliegue) | **Pendiente**: ver [CD](#cd-pendiente) |

## Ramas

| Rama | Para qué sirve | Sale de | Se integra en | Vida |
|---|---|---|---|---|
| `main` | Código en producción. Cada commit de `main` es una versión etiquetada | — | — | Permanente |
| `develop` | Integración de lo que se prepara para la siguiente versión | — | — | Permanente |
| `feature/<ámbito>-<descripción>` | Una funcionalidad nueva. Ej.: `feature/mobile-equipo-miembros` | `develop` | `develop` | Corta |
| `bugfix/<ámbito>-<descripción>` | Corrección de un error detectado en `develop` | `develop` | `develop` | Corta |
| `release/<versión>` | Preparar una versión: ajustes finales, versión y notas. Ej.: `release/1.2.0` | `develop` | `main` y de vuelta a `develop` | Días |
| `hotfix/<versión>` | Corrección urgente de producción. Ej.: `hotfix/1.2.1` | `main` | `main` y de vuelta a `develop` | Horas |

Reglas:
- **Nunca** se hace push directo a `main` ni a `develop`: todo entra por Pull Request.
- A `main` solo se llega desde `release/*` o `hotfix/*`. A `develop`, desde `feature/*`, `bugfix/*`, `release/*`, `hotfix/*` o `main` (re-sincronización). El CI lo comprueba.
- El ámbito de la rama coincide con el del commit (`api`, `mobile`, `database`, `docs`, `root`).

## Flujos paso a paso

### Funcionalidad (`feature/*`)

```bash
git switch develop && git pull
git switch -c feature/mobile-equipo-miembros
# ... trabajar y hacer commits convencionales ...
pnpm check                      # mismos chequeos que el CI (ver más abajo)
git push -u origin feature/mobile-equipo-miembros
# Abrir un PR hacia develop. Estrategia recomendada: "Squash and merge"
# (el título del PR se vuelve el commit, por eso también debe ser convencional).
```

### Versión (`release/*`)

```bash
git switch develop && git pull
git switch -c release/1.2.0
# Solo ajustes finales: versión en los package.json, notas, correcciones menores.
git commit -m "chore(release): preparar v1.2.0"
git push -u origin release/1.2.0
# PR hacia main (estrategia "Create a merge commit"). Tras el merge:
git switch main && git pull
git tag -a v1.2.0 -m "v1.2.0" && git push origin v1.2.0
# PR de release/1.2.0 (o de main) hacia develop para devolver los ajustes.
```

### Corrección urgente (`hotfix/*`)

```bash
git switch main && git pull
git switch -c hotfix/1.2.1
git commit -m "fix(api): corregir <el problema>"
git push -u origin hotfix/1.2.1
# PR hacia main; etiquetar v1.2.1; luego PR hacia develop.
```

## Commits y Pull Requests

Formato: `tipo(ámbito): descripción en español`, en minúsculas y sin punto final. Ejemplos reales del proyecto:

```
feat(mobile): agregar pestañas y pantalla de Equipo y Miembros con invitaciones
fix(api): ...
docs: proyectar el contrato de equipo e invitaciones
chore(root): ...
```

| Tipo | Úsalo para | Efecto en la versión |
|---|---|---|
| `feat` | Funcionalidad nueva | minor |
| `fix` | Corrección de un error | patch |
| `docs`, `chore`, `refactor`, `test`, `ci`, `perf`, `build`, `style`, `revert` | Lo demás | ninguno |
| cualquiera con `!` (`feat(api)!:`) | Cambio que rompe compatibilidad | **major** |

Ámbitos en uso: `api`, `mobile`, `database`, `root`; `docs` suele ir sin ámbito. Los commits de merge se ignoran en la validación.

Cada PR usa la plantilla de `.github/pull_request_template.md` (qué cambia, lista de verificación y cómo probarlo).

## CI (`.github/workflows/ci.yml`)

Se ejecuta en cada PR hacia `main`/`develop` y en cada push a `main`, `develop`, `release/**` y `hotfix/**`. Un push nuevo a la misma rama cancela la ejecución anterior. Versiones fijadas: Node 22 y pnpm 11.1.1.

| Job | Qué verifica | Reproducirlo en local |
|---|---|---|
| **Ramas (GitFlow)** (solo PR) | Origen y destino permitidos | `BASE_REF=main HEAD_REF=feature/x bash .github/scripts/check-branches.sh` |
| **Commits (Conventional Commits)** (solo PR) | Título del PR y commits | `PR_TITLE="feat(api): ..." BASE_SHA=<sha> HEAD_SHA=HEAD bash .github/scripts/check-commits.sh` |
| **Sin credenciales versionadas** | Patrones de tokens, claves y secretos en los archivos versionados | `bash .github/scripts/check-secrets.sh` |
| **Contrato OpenAPI** | YAML válido, `$ref` resueltos, tags declarados, respuestas y parámetros de ruta definidos | `python .github/scripts/validate_openapi.py` |
| **Backend (NestJS)** | `prisma generate`/`validate`, lint (ESLint), formato (Prettier), build, tests unitarios y **e2e contra PostgreSQL 16** creado con `database/schema.sql` | `pnpm check:api` y `pnpm test:e2e:api` |
| **App (Expo)** | `tsc --noEmit` y compilación de la exportación web (`expo export -p web`) | `pnpm check:app` |
| **CI OK** | Resumen: pasa si todos los anteriores pasaron o se omitieron | — |

Notas:
- Los e2e usan credenciales **ficticias** de Clerk (`sk_test_ci_placeholder`, `whsec_placeholder`) porque reemplazan el guard de Clerk y no llaman a su API. El CI nunca recibe secretos reales.
- Que los e2e corran sobre una base creada solo con `database/schema.sql` garantiza que ese archivo (la fuente de verdad del modelo) sea completo y válido.
- Los chequeos de la app no incluyen lint porque el proyecto móvil aún no tiene ESLint configurado.

### Chequeos locales antes de abrir un PR

```bash
pnpm check              # lint + formato + build + tests unitarios (api) y tsc (app)
pnpm test:e2e:api       # requiere PostgreSQL en marcha con el esquema aplicado (cd api && docker compose up -d)
```

Si falla el formato o el lint del backend: `pnpm --prefix api format` y `pnpm --prefix api lint` (ambos corrigen automáticamente).

## Protección de ramas (configuración única en GitHub)

Esto **no vive en el repositorio**: se configura una vez en *Settings → Branches* (o *Rules*) para `main` y `develop`.

1. Crear `develop` y publicarla: `git switch -c develop && git push -u origin develop`.
2. Cambiar la rama por defecto del repositorio a `develop` (*Settings → General → Default branch*) para que los PR apunten ahí por defecto.
3. En `main` y `develop`:
   - Requerir Pull Request antes de integrar.
   - Requerir el check de estado **`CI OK`** (es el único que hay que marcar; resume a los demás).
   - Bloquear force-push y borrado de la rama.
4. Activar *Automatically delete head branches* para limpiar las ramas ya integradas.

## Credenciales y secretos

- Las credenciales reales (Clerk, Cloudinary, RabbitMQ…) viven solo en variables de entorno de cada entorno; los `.env` están en `.gitignore`. Ver `documentacion/10-variables-de-entorno.md`.
- Nunca se escribe una credencial en un workflow. Cuando exista CD, se guardarán como *Secrets* de GitHub.
- El job de credenciales es una red de seguridad barata, no un escáner completo. Si algo se filtra: **revocarlo primero** en el servicio y luego quitarlo del repositorio (borrarlo del historial no basta).
- No dejes tokens en la URL del remoto (`https://usuario:token@github.com/...`): usa `gh auth login` o un *credential helper*.

## CD (pendiente)

Todavía **no hay despliegue continuo**: ningún workflow publica ni despliega nada. Según `documentacion/02-arquitectura.md`, el destino previsto es:

| Pieza | Destino previsto |
|---|---|
| API | Contenedor Docker en VPS / Railway / Render / AWS ECS |
| Web (PWA) | Hosting estático (Vercel / Netlify) |
| Móvil | EAS Build (Expo Application Services) |

Cuando se defina (proveedor, cuentas y secretos), se añadirá un workflow `cd.yml` disparado por los tags `v*` sobre `main`, y se actualizará esta sección y `documentacion/10-variables-de-entorno.md` con los secretos necesarios. Hasta entonces, no se inventan despliegues ni secretos.
