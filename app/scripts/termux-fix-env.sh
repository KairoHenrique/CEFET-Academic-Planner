#!/data/data/com.termux/files/usr/bin/bash

# Este script recria o arquivo .env.local com todas as variáveis limpas e corretas para o servidor no Termux.

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
cd "$DIR" || exit 1

echo "[*] Recriando o arquivo app/.env.local no Termux..."

cat << 'EOF' > .env.local
# Gerado localmente — não commitar (.gitignore)

# Cifra senha SIGAA salva no SQLite (mín. 16 caracteres)
CREDENTIALS_ENCRYPTION_KEY=***REMOVED***=

# Login real no SIGAA via Playwright (true/1 = mock offline, sem navegador)
SIGAA_SCRAPER_MOCK=false

# Salva HTML capturado em app/.data/scrape-debug/ (prioridade sobre shell)
SIGAA_SCRAPER_DEBUG=true

# Timeouts do scraper (ms)
SIGAA_LOGIN_TIMEOUT_MS=30000
SIGAA_NAVIGATION_TIMEOUT_MS=20000
SIGAA_TURMA_SCRAPE_DELAY_MS=400

# false = abre janela do Chromium (útil para debug de login)
SIGAA_HEADLESS=true

# --- Supabase Acme-Hub-dev ---
NEXT_PUBLIC_SUPABASE_URL=https://xxtdifoltfipaerexosq.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=***REMOVED***
SUPABASE_SERVICE_ROLE_KEY=***REMOVED***
DATABASE_URL=postgresql://postgres.xxtdifoltfipaerexosq:***REMOVED***@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
PLANNER_DATABASE=postgres

# Cron (mesmo valor no app Cloudflare + workers cron-ping / cron-account-emails)
CRON_SECRET=***REMOVED***
PLANNER_HEALTH_URL=https://acme-hub.khfm.workers.dev
PLANNER_APP_URL=https://acme-hub.khfm.workers.dev

# --- Painel /dev — operadores ---
EMAIL_DEV=dev@example.com
PASSWORD_DEV=***REMOVED***

# --- Billing / planos (B47) ---
BILLING_PRICE_MONTH_CENTS=3000
BILLING_PRICE_QUARTER_CENTS=5000
BILLING_PRICE_SEMESTER_CENTS=8500
BILLING_PRICE_YEAR_CENTS=15000
BILLING_PRICE_FIVE_YEAR_CENTS=70000

# --- Gateway PIX Mercado Pago (B48) ---
PIX_GATEWAY=mercadopago
MERCADOPAGO_ACCESS_TOKEN=***REMOVED***

# --- Sync Mirror Local / Worker ---
SYNC_MIRROR_POSTGRES=true
WORKER_SHARED_SECRET=***REMOVED***=
SIGAA_CPF=00000000000
SIGAA_PASSWORD=***REMOVED***
SIGAA_BROWSER_CHANNEL=chrome
WORKER_PORT=8787

# Home-gmail SMTP (não commitar)
GMAIL_SMTP_USER=dev@example.com
GMAIL_SMTP_APP_PASSWORD=***REMOVED***
EMAIL_FROM=ACME HUB <dev@example.com>

# Cloudflare Wrangler Token (Tablet Automations)
CLOUDFLARE_API_TOKEN="***REMOVED***"
EOF

echo "[+] Sucesso! O arquivo .env.local foi salvo e corrigido."
echo "Agora você pode iniciar o servidor ACME normalmente."
