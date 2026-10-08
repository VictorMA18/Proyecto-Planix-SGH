## Qué cambia y por qué

<!-- Resume el cambio y el problema que resuelve. -->

## Tipo de cambio

- [ ] `feat` — funcionalidad nueva
- [ ] `fix` — corrección de un error
- [ ] `docs` / `chore` / `refactor` / `test` / `ci`

## Lista de verificación

- [ ] El título del PR sigue Conventional Commits: `tipo(ámbito): descripción en español`
- [ ] La rama de origen y de destino respetan GitFlow (ver `documentacion/13-gitflow-y-ci.md`)
- [ ] Ejecuté los chequeos locales (`pnpm check`) y pasan
- [ ] Si cambia la API: actualicé `api/openapi.yaml` **antes** de implementar y los docs 04 / 06
- [ ] Si cambia el modelo de datos: `database/schema.sql`, `api/prisma/schema.prisma` y `documentacion/03-modelo-de-datos.md` están sincronizados
- [ ] Agregué o actualicé pruebas (DTOs con `*.dto.spec.ts`, endpoints con e2e)
- [ ] No incluyo credenciales ni archivos `.env`

## Cómo probarlo

<!-- Pasos para verificarlo manualmente, si aplica. -->
