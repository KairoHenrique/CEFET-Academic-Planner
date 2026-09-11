#!/data/data/com.termux/files/usr/bin/bash
# Aplica overrides Termux no .env.local (Chromium, mirror, timeouts).
#
# Seguro no repositorio PUBLICO: nao contem tokens/senhas — so paths e flags.
# Secrets vem do .env.local / .env.termux.local que NAO devem ser commitados.
#
# Preferencia: .env.termux.local (npm run termux:export-env no PC).
# Senao: patchia o .env.local existente (nao apaga valores secretos).
# Docs: README.md §9 / §15

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
cd "$DIR" || exit 1

CHROMIUM_BIN="/data/data/com.termux/files/usr/bin/chromium-browser"

upsert_env() {
  local key="$1"
  local value="$2"
  local file="$3"
  touch "$file"
  if grep -qE "^${key}=" "$file"; then
    local tmp
    tmp="$(mktemp)"
    awk -v k="$key" -v v="$value" '
      BEGIN { done=0 }
      $0 ~ "^"k"=" { print k"="v; done=1; next }
      { print }
      END { if (!done) print k"="v }
    ' "$file" > "$tmp"
    mv "$tmp" "$file"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$file"
  fi
}

if [ -f .env.termux.local ]; then
  echo "[*] Aplicando .env.termux.local -> .env.local (export do PC)..."
  cp .env.termux.local .env.local
  echo "[+] .env.local atualizado a partir do export do PC."
else
  echo "[*] .env.termux.local ausente — aplicando so overrides Termux no .env.local existente."
  if [ ! -f .env.local ]; then
    echo "[-] Nao existe .env.local nem .env.termux.local."
    echo "    No PC: cd app && node scripts/termux-export-env-from-pc.mjs"
    echo "    Copie app/.env.termux.local para o tablet (pasta app/) e rode este script de novo."
    exit 1
  fi
fi

echo "[*] Forcando overrides Termux (Chromium + home-worker + timeouts)..."
upsert_env "SIGAA_BROWSER_CHANNEL" "" ".env.local"
upsert_env "SIGAA_BROWSER_EXECUTABLE_PATH" "$CHROMIUM_BIN" ".env.local"
upsert_env "SIGAA_HEADLESS" "true" ".env.local"
upsert_env "SIGAA_LOGIN_TIMEOUT_MS" "90000" ".env.local"
upsert_env "SIGAA_NAVIGATION_TIMEOUT_MS" "60000" ".env.local"
upsert_env "SIGAA_WORKER_JOB_TIMEOUT_MS" "900000" ".env.local"
upsert_env "SIGAA_WORKER_SHUTDOWN_MS" "1080000" ".env.local"
upsert_env "WORKER_PORT" "8787" ".env.local"
upsert_env "SYNC_MIRROR_POSTGRES" "true" ".env.local"
upsert_env "PLANNER_DATABASE" "postgres" ".env.local"
upsert_env "ACCOUNT_EMAIL_VIA_HOME_WORKER" "true" ".env.local"
upsert_env "PLANNER_HEALTH_URL" "https://acme-hub.khfm.workers.dev" ".env.local"
upsert_env "PLANNER_APP_URL" "https://acme-hub.khfm.workers.dev" ".env.local"

# Remove URL de tunel do PC — o servidor Termux regenera.
if grep -qE '^SIGAA_WORKER_URL=' .env.local; then
  tmp="$(mktemp)"
  grep -vE '^SIGAA_WORKER_URL=' .env.local > "$tmp" || true
  mv "$tmp" .env.local
fi

MISSING=0
for key in CREDENTIALS_ENCRYPTION_KEY WORKER_SHARED_SECRET DATABASE_URL CLOUDFLARE_API_TOKEN CRON_SECRET; do
  if ! grep -qE "^${key}=.+" .env.local; then
    echo "[-] Falta $key no .env.local"
    MISSING=1
  fi
done
if [ "$MISSING" = "1" ]; then
  echo "    Gere no PC: node scripts/termux-export-env-from-pc.mjs"
  exit 1
fi

echo "[+] Env Termux alinhado (mirror, secrets, e-mail, Chromium, timeouts 15min)."
echo "    Proximo: bash scripts/termux-servidor-acme.sh"
