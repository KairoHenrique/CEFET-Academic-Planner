#!/data/data/com.termux/files/usr/bin/bash
# =============================================================================
# Servidor ACME no Termux — paridade com o tray/PC (worker:home + tunel).
#
# Por que: a cloud (Cloudflare Workers) nao scrapa o SIGAA com Chromium.
# Este script deixa o tablet como home-worker 24/7:
#   1) worker:home em :8787 (Playwright + Chromium do pkg)
#   2) cloudflared quick tunnel (metrics 127.0.0.1:20241)
#   3) health local + publico; so entao wrangler secret put SIGAA_WORKER_URL
#   4) crons locais (reminders 30m / account-emails 60m / sync-orchestrator 15m)
#   5) loop infinito (rotacao de URL do tunel) — sem auto-git a cada 5 min
#
# Git: so sob demanda com a tecla [r] (fetch + reset --hard origin/main).
# Regra: NAO rode PC tray e Termux ao mesmo tempo (brigam pelo secret).
#
# Pre-req: .env.local com secrets + bash scripts/termux-form-env.sh
# Docs: README.md §9 e §10
# =============================================================================

set -u

echo "Iniciando ServidorACME no Termux (paridade PC)..."

echo "[*] Encerrando processos antigos do worker e cloudflared..."
pkill -f "npm run worker:home" 2>/dev/null || true
pkill -f "scripts/start-home-worker" 2>/dev/null || true
pkill -f "tsx.*worker/main" 2>/dev/null || true
pkill -f "cloudflared" 2>/dev/null || true

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
cd "$DIR" || exit 1

CHROMIUM_BIN="/data/data/com.termux/files/usr/bin/chromium-browser"
WORKER_PORT=8787
METRICS_ADDR="127.0.0.1:20241"
APP_URL="https://acme-hub.khfm.workers.dev"

# --- deps sistema ---
if command -v pkg >/dev/null 2>&1; then
  echo "[*] Verificando dependências do sistema..."
  MISSING_PKGS=""
  command -v git >/dev/null 2>&1 || MISSING_PKGS="$MISSING_PKGS git"
  command -v node >/dev/null 2>&1 || MISSING_PKGS="$MISSING_PKGS nodejs"
  command -v python >/dev/null 2>&1 || MISSING_PKGS="$MISSING_PKGS python"
  command -v make >/dev/null 2>&1 || MISSING_PKGS="$MISSING_PKGS make"
  command -v clang >/dev/null 2>&1 || MISSING_PKGS="$MISSING_PKGS clang"
  command -v cloudflared >/dev/null 2>&1 || MISSING_PKGS="$MISSING_PKGS cloudflared"
  command -v curl >/dev/null 2>&1 || MISSING_PKGS="$MISSING_PKGS curl"
  if [ -n "$MISSING_PKGS" ]; then
    echo "[!] Instalando:$MISSING_PKGS"
    pkg install -y $MISSING_PKGS
  fi
  if ! command -v chromium-browser >/dev/null 2>&1; then
    echo "[!] Instalando Chromium..."
    pkg install -y x11-repo
    pkg install -y chromium
  fi
fi

# --- env ---
if [ ! -f .env.local ]; then
  echo "[-] .env.local ausente. Rode: bash scripts/termux-form-env.sh"
  exit 1
fi
# Reaplica overrides (idempotente)
if [ -x scripts/termux-form-env.sh ] || [ -f scripts/termux-form-env.sh ]; then
  bash scripts/termux-form-env.sh || exit 1
fi

read_env() {
  local key="$1"
  grep -E "^${key}=" .env.local 2>/dev/null | tail -n 1 | cut -d '=' -f 2- | tr -d '"' | tr -d "'" | tr -d '\r'
}

CF_TOKEN="$(read_env CLOUDFLARE_API_TOKEN)"
CRON_SECRET="$(read_env CRON_SECRET)"
WORKER_PORT_ENV="$(read_env WORKER_PORT)"
if [ -n "$WORKER_PORT_ENV" ]; then
  WORKER_PORT="$WORKER_PORT_ENV"
fi

if [ -z "$CF_TOKEN" ]; then
  echo "[-] CLOUDFLARE_API_TOKEN ausente em .env.local — secret put vai falhar."
  exit 1
fi
export CLOUDFLARE_API_TOKEN="$CF_TOKEN"

# --- git sync (Termux = espelho do remoto; evita "divergent branches") ---
# Define GIT_UPDATED=1 quando HEAD mudou. Retorna 0 ok / 1 falha.
sync_git_to_origin() {
  GIT_UPDATED=0
  if ! command -v git >/dev/null 2>&1; then
    return 0
  fi
  echo "[*] Sincronizando com origin/main..."
  # .env.local é gitignored — reset não apaga secrets locais
  if ! git fetch origin main; then
    echo "[-] git fetch falhou — seguindo com versão local."
    return 1
  fi
  local remote
  remote="$(git rev-parse origin/main 2>/dev/null || true)"
  if [ -z "$remote" ]; then
    echo "[-] origin/main ausente — seguindo com versão local."
    return 1
  fi
  local local_head
  local_head="$(git rev-parse HEAD 2>/dev/null || echo "")"
  if [ "$local_head" = "$remote" ]; then
    echo "[+] Já em sync com origin/main (${remote:0:7})."
    return 0
  fi
  echo "[!] Local ${local_head:0:7} ≠ remoto ${remote:0:7} — reset --hard origin/main"
  git checkout -B main origin/main >/dev/null 2>&1 || true
  if git reset --hard origin/main; then
    echo "[+] Código alinhado a origin/main (${remote:0:7})."
    GIT_UPDATED=1
    return 0
  fi
  echo "[-] git reset falhou — seguindo com versão local."
  return 1
}
# Git só sob demanda ([r]) — na subida sobe direto, igual ServidorACME do PC.

# --- npm ---
echo "[*] Verificando npm deps..."
if command -v npm >/dev/null 2>&1; then
  npm install --no-fund --no-audit --ignore-scripts
  if [ -d "node_modules/better-sqlite3" ]; then
    if [ ! -f "node_modules/.better-sqlite3-termux-compiled" ]; then
      echo "[*] Recompilando better-sqlite3..."
      export GYP_DEFINES="android_ndk_path=''"
      export npm_config_build_from_source=true
      npm rebuild better-sqlite3 --build-from-source && touch "node_modules/.better-sqlite3-termux-compiled"
    else
      echo "[*] better-sqlite3 já compilado."
    fi
  fi
fi

# --- worker ---
echo "[*] Iniciando worker:home (porta $WORKER_PORT)..."
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export SIGAA_BROWSER_CHANNEL=""
export SIGAA_BROWSER_EXECUTABLE_PATH="$CHROMIUM_BIN"
export SYNC_MIRROR_POSTGRES=true
export ACCOUNT_EMAIL_VIA_HOME_WORKER=true
export WORKER_PORT="$WORKER_PORT"
npm run worker:home > termux-worker.log 2>&1 &
WORKER_PID=$!
echo "Worker PID: $WORKER_PID"

# --- tunnel (igual PC: metrics quicktunnel) ---
echo "[*] Iniciando cloudflared tunnel + metrics $METRICS_ADDR..."
> termux-cloudflared.log
cloudflared tunnel --url "http://127.0.0.1:${WORKER_PORT}" --metrics "$METRICS_ADDR" \
  > termux-cloudflared.log 2>&1 &
TUNNEL_PID=$!
echo "Tunnel PID: $TUNNEL_PID"

normalize_url() {
  printf '%s' "$1" | tr -d '\r\n' | sed 's:/*$::' | tr '[:upper:]' '[:lower:]'
}

detect_tunnel_url() {
  local url=""
  # 1) metrics API (igual worker:temp no PC)
  if command -v curl >/dev/null 2>&1; then
    url=$(curl -fsS --max-time 3 "http://${METRICS_ADDR}/quicktunnel" 2>/dev/null \
      | grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' | head -n 1 || true)
    if [ -z "$url" ]; then
      # hostname sem scheme
      local host
      host=$(curl -fsS --max-time 3 "http://${METRICS_ADDR}/quicktunnel" 2>/dev/null \
        | grep -oE '"hostname"[[:space:]]*:[[:space:]]*"[^"]+"' | head -n 1 \
        | sed 's/.*"hostname"[[:space:]]*:[[:space:]]*"//;s/"$//' || true)
      if [ -n "$host" ]; then
        url="https://${host}"
      fi
    fi
  fi
  # 2) fallback log
  if [ -z "$url" ] && [ -f termux-cloudflared.log ]; then
    url=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' termux-cloudflared.log | head -n 1 || true)
  fi
  normalize_url "$url"
}

write_env_worker_url() {
  local tunnel_url="$1"
  if grep -qE '^SIGAA_WORKER_URL=' .env.local; then
    local tmp
    tmp="$(mktemp)"
    awk -v u="$tunnel_url" '
      BEGIN { done=0 }
      /^SIGAA_WORKER_URL=/ { print "SIGAA_WORKER_URL="u; done=1; next }
      { print }
      END { if (!done) print "SIGAA_WORKER_URL="u }
    ' .env.local > "$tmp"
    mv "$tmp" .env.local
  else
    printf '\nSIGAA_WORKER_URL=%s\n' "$tunnel_url" >> .env.local
  fi
}

patch_workerd_termux() {
  if [ -f "node_modules/workerd/lib/main.js" ]; then
    node << 'EOF'
const fs = require('fs');
const file = 'node_modules/workerd/lib/main.js';
let code = fs.readFileSync(file, 'utf8');
code = code.replace('let pkg;', 'let pkg = "dummy";');
code = code.replace('let subpath;', 'let subpath = "dummy";');
code = code.replace(/throw new Error/g, 'console.warn');
code = code.replace(/throw e;/g, 'return { binPath: __filename };');
fs.writeFileSync(file, code);
EOF
  fi
}

put_sigaa_worker_url() {
  local tunnel_url="$1"
  patch_workerd_termux
  printf '%s' "$tunnel_url" | npx wrangler secret put SIGAA_WORKER_URL --name acme-hub
}

wait_local_health() {
  echo "[*] Aguardando health local http://127.0.0.1:${WORKER_PORT}/health ..."
  local i
  for i in $(seq 1 90); do
    if curl -fsS --max-time 3 "http://127.0.0.1:${WORKER_PORT}/health" 2>/dev/null | grep -q '"ok"'; then
      echo "[+] Health local OK"
      return 0
    fi
    if ! kill -0 "$WORKER_PID" 2>/dev/null; then
      echo "[-] Worker morreu. Veja termux-worker.log"
      return 1
    fi
    sleep 1
  done
  echo "[-] Timeout health local"
  return 1
}

wait_public_health() {
  local tunnel_url="$1"
  # trycloudflare demora a propagar; Termux às vezes falha em IPv6 → força -4
  echo "[*] Testando health público ${tunnel_url}/health (até ~3 min)..."
  local i code body
  for i in $(seq 1 60); do
    body="$(curl -4 -sS --max-time 12 "${tunnel_url}/health" 2>/dev/null || true)"
    code="$(curl -4 -sS -o /dev/null -w '%{http_code}' --max-time 12 "${tunnel_url}/health" 2>/dev/null || echo 000)"
    if [ "$code" = "200" ] && printf '%s' "$body" | grep -q '"ok"'; then
      echo "[+] Túnel público OK"
      return 0
    fi
    if [ $((i % 10)) -eq 0 ]; then
      echo "    ainda aguardando... (${i}/60, http=${code})"
    fi
    sleep 3
  done
  echo "[-] Túnel público NÃO responde /health"
  return 1
}

restart_cloudflared() {
  echo "[*] Reiniciando cloudflared..." >&2
  kill "$TUNNEL_PID" 2>/dev/null || true
  pkill -f "cloudflared" 2>/dev/null || true
  sleep 2
  > termux-cloudflared.log
  cloudflared tunnel --url "http://127.0.0.1:${WORKER_PORT}" --metrics "$METRICS_ADDR" \
    > termux-cloudflared.log 2>&1 &
  TUNNEL_PID=$!
  echo "Tunnel PID: $TUNNEL_PID" >&2
  local i url=""
  for i in $(seq 1 90); do
    if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
      echo "[-] Cloudflared morreu no restart. Veja termux-cloudflared.log" >&2
      return 1
    fi
    url="$(detect_tunnel_url)"
    if [ -n "$url" ]; then
      printf '%s' "$url"
      return 0
    fi
    sleep 1
  done
  echo "[-] Restart sem URL do túnel." >&2
  return 1
}

apply_tunnel() {
  local tunnel_url="$1"
  local reason="$2"
  if [ -z "$tunnel_url" ]; then
    return 1
  fi
  if [ "$tunnel_url" = "${CURRENT_TUNNEL_URL:-}" ]; then
    return 0
  fi
  echo "[*] Nova URL do túnel ($reason): $tunnel_url"
  if ! wait_local_health; then
    return 1
  fi
  if ! wait_public_health "$tunnel_url"; then
    echo "    Secret NÃO atualizado (evita 1016)."
    return 1
  fi
  write_env_worker_url "$tunnel_url"
  echo "[*] Atualizando SIGAA_WORKER_URL no Cloudflare..."
  if put_sigaa_worker_url "$tunnel_url"; then
    CURRENT_TUNNEL_URL="$tunnel_url"
    echo "[+] Secret SIGAA_WORKER_URL=$tunnel_url"
    echo "[+] Servidor no ar (mesmas props do PC: mirror, jobs, /email/send, health)."
    return 0
  fi
  echo "[-] wrangler secret put falhou"
  echo "    printf '%s' '$tunnel_url' | npx wrangler secret put SIGAA_WORKER_URL --name acme-hub"
  return 1
}

echo "[*] Aguardando URL do trycloudflare.com..."
CURRENT_TUNNEL_URL=""
URL=""
for i in $(seq 1 90); do
  if ! kill -0 "$WORKER_PID" 2>/dev/null; then
    echo "[-] Worker parou. Veja termux-worker.log"
    kill "$TUNNEL_PID" 2>/dev/null || true
    exit 1
  fi
  if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "[-] Cloudflared parou. Veja termux-cloudflared.log"
    kill "$WORKER_PID" 2>/dev/null || true
    exit 1
  fi
  URL="$(detect_tunnel_url)"
  if [ -n "$URL" ]; then
    break
  fi
  sleep 1
done

if [ -z "$URL" ]; then
  echo "[-] Não detectei URL do túnel."
  kill "$TUNNEL_PID" 2>/dev/null || true
  kill "$WORKER_PID" 2>/dev/null || true
  exit 1
fi

if ! apply_tunnel "$URL" "inicial"; then
  echo "[!] Health público falhou — tentando 1× restart do túnel..."
  RETRY_URL="$(restart_cloudflared || true)"
  if [ -n "${RETRY_URL:-}" ] && apply_tunnel "$RETRY_URL" "retry"; then
    URL="$RETRY_URL"
  else
    kill "$TUNNEL_PID" 2>/dev/null || true
    kill "$WORKER_PID" 2>/dev/null || true
    exit 1
  fi
fi

# --- crons locais (alinhados aos Workers CF; evita spam de push) ---
# CF: notification-reminders */30 · account-emails hourly · orchestrator madrugada
echo "[*] Iniciando crons locais (reminders 30m · account-emails 60m · orchestrator 15m)..."
(
  while true; do
    sleep 1800
    echo "[cron] $(date '+%H:%M:%S') notification-reminders"
    curl -s -X POST "$APP_URL/api/cron/notification-reminders" \
      -H "Authorization: Bearer $CRON_SECRET" \
      -H "Content-Type: application/json" -o /dev/null &
  done
) &
CRON_NOTIF_PID=$!

(
  while true; do
    sleep 3600
    echo "[cron] $(date '+%H:%M:%S') account-emails"
    curl -s -X POST "$APP_URL/api/cron/account-emails" \
      -H "Authorization: Bearer $CRON_SECRET" \
      -H "Content-Type: application/json" -o /dev/null &
  done
) &
CRON_EMAIL_PID=$!

(
  while true; do
    sleep 900
    echo "[cron] $(date '+%H:%M:%S') sync-orchestrator"
    curl -s -X POST "$APP_URL/api/cron/sync-orchestrator" \
      -H "Authorization: Bearer $CRON_SECRET" \
      -H "Content-Type: application/json" -o /dev/null &
  done
) &
CRON_SYNC_PID=$!

cleanup() {
  echo ""
  echo "[*] Parando servidores..."
  kill "$TUNNEL_PID" 2>/dev/null || true
  kill "$WORKER_PID" 2>/dev/null || true
  kill "$CRON_NOTIF_PID" 2>/dev/null || true
  kill "$CRON_EMAIL_PID" 2>/dev/null || true
  kill "$CRON_SYNC_PID" 2>/dev/null || true
}
trap cleanup SIGINT SIGTERM

echo "--------------------------------------------------------"
echo " ServidorACME Termux = paridade PC (fica rodando)"
echo " [r] git update + reiniciar · [c] CPU/RAM · [q] sair"
echo "--------------------------------------------------------"

while true; do
  # Reaplica secret se a URL do quick tunnel mudar (igual tray PC)
  NEW_URL="$(detect_tunnel_url)"
  if [ -n "$NEW_URL" ] && [ "$NEW_URL" != "$CURRENT_TUNNEL_URL" ]; then
    apply_tunnel "$NEW_URL" "rotação" || true
  fi

  if read -t 20 -n 1 -s key; then
    case $key in
      r|R)
        echo -e "\n[*] Atualizando do GitHub..."
        sync_git_to_origin || true
        if [ "${GIT_UPDATED:-0}" = "1" ]; then
          if [ -f scripts/termux-form-env.sh ]; then
            bash scripts/termux-form-env.sh || true
          fi
          echo "[!] Código novo — reiniciando..."
          cleanup
          exec "$0"
        else
          echo "[+] Sem mudanças para reiniciar."
        fi
        ;;
      c|C)
        echo -e "\n--- MONITOR ---"
        free -h 2>/dev/null || true
        top -n 1 -b 2>/dev/null | head -n 15 || true
        echo "Worker health:"
        curl -fsS --max-time 3 "http://127.0.0.1:${WORKER_PORT}/health" || true
        echo ""
        echo "Tunnel: ${CURRENT_TUNNEL_URL:-?}"
        echo "----------------"
        ;;
      q|Q)
        echo -e "\n[*] Desligando..."
        cleanup
        exit 0
        ;;
    esac
  fi
done
