#!/usr/bin/env bash
# Reglas de GitFlow para las ramas de un PR:
#   -> main     solo desde release/* o hotfix/*
#   -> develop  desde feature/*, bugfix/*, release/*, hotfix/* o main (re-sincronización)
set -euo pipefail

base="${BASE_REF:?falta BASE_REF}"
head="${HEAD_REF:?falta HEAD_REF}"

case "$base" in
  main)
    if [[ ! "$head" =~ ^(release|hotfix)/.+ ]]; then
      echo "::error::A main solo se llega desde release/* o hotfix/* (esta rama es \"${head}\")."
      exit 1
    fi
    ;;
  develop)
    if [[ ! "$head" =~ ^(feature|bugfix|release|hotfix)/.+ && "$head" != "main" ]]; then
      echo "::error::A develop se llega desde feature/*, bugfix/*, release/*, hotfix/* o main (esta rama es \"${head}\")."
      exit 1
    fi
    ;;
esac
echo "Rama \"${head}\" -> \"${base}\": permitido por GitFlow."
