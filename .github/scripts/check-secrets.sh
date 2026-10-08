#!/usr/bin/env bash
# Busca credenciales con formato conocido en los archivos versionados.
# Es una red de seguridad barata, no un escáner completo.
set -uo pipefail

PATRONES=(
  'ghp_[A-Za-z0-9]{36}'                          # token personal de GitHub
  'github_pat_[A-Za-z0-9_]{50,}'                 # token de GitHub de granularidad fina
  'sk_(live|test)_[A-Za-z0-9]{20,}'              # clave secreta de Clerk / Stripe
  'whsec_[A-Za-z0-9+/=]{20,}'                    # secreto de webhook (Svix / Clerk)
  'AKIA[0-9A-Z]{16}'                             # clave de acceso de AWS
  '-----BEGIN ([A-Z]+ )?PRIVATE KEY-----'        # clave privada
  'postgres(ql)?://[^:/@ ]+:[^@ ]{6,}@[^/ ]*(rds|supabase|neon|railway|render)[^ ]*'  # BD gestionada con contraseña
)

# El propio script y los lockfiles contienen texto que no son credenciales.
EXCLUIR=(':!.github/scripts/check-secrets.sh' ':!*pnpm-lock.yaml')

encontrados=0
for patron in "${PATRONES[@]}"; do
  resultado=$(git grep -nIE -e "$patron" -- . "${EXCLUIR[@]}")
  codigo=$?
  case "$codigo" in
    0)
      echo "::error::Posible credencial versionada (patrón: ${patron})"
      # Se muestran archivo y línea, nunca el valor.
      echo "$resultado" | cut -d: -f1,2 | sed 's/^/  /'
      encontrados=1
      ;;
    1) ;; # sin coincidencias
    *)
      # Un fallo de git grep nunca debe pasar por "sin credenciales".
      echo "::error::git grep falló (código ${codigo}) con el patrón: ${patron}"
      exit 2
      ;;
  esac
done

if [[ "$encontrados" -eq 1 ]]; then
  echo
  echo "Quita la credencial del repositorio, revócala en el servicio y muévela a una variable de entorno."
  exit 1
fi
echo "Sin credenciales evidentes en los archivos versionados."
