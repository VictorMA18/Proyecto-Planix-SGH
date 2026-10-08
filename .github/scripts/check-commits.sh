#!/usr/bin/env bash
# Valida que el título del PR y los commits sigan Conventional Commits:
#   tipo(ámbito): descripción      p. ej.  feat(mobile): agregar pantalla de equipo
# Los commits de merge (Merge branch ...) se ignoran.
set -euo pipefail

TIPOS='feat|fix|docs|chore|refactor|test|ci|perf|build|style|revert'
REGEX="^(${TIPOS})(\([a-z0-9._-]+\))?!?: .{3,}$"

errores=0

comprobar() {
  local etiqueta="$1" mensaje="$2"
  if [[ ! "$mensaje" =~ $REGEX ]]; then
    echo "::error::${etiqueta} no sigue Conventional Commits: \"${mensaje}\""
    errores=$((errores + 1))
  fi
}

comprobar "El título del PR" "${PR_TITLE:?falta PR_TITLE}"

while IFS= read -r asunto; do
  [[ -z "$asunto" ]] && continue
  comprobar "El commit" "$asunto"
done < <(git log --no-merges --format=%s "${BASE_SHA:?falta BASE_SHA}..${HEAD_SHA:?falta HEAD_SHA}")

if [[ "$errores" -gt 0 ]]; then
  echo
  echo "Formato esperado: tipo(ámbito): descripción en español"
  echo "Tipos válidos: ${TIPOS//|/, }"
  exit 1
fi
echo "Título del PR y commits válidos."
