# Worker Playwright (B54 + B72e) — PC home server

Processo **separado** do Next.js / Cloudflare. Roda **neste PC**: Chrome/Playwright,
sync de **todas as contas** (fila `sync_jobs`), staging SQLite local e **mirror → Supabase**.

O app na Cloudflare **não** abre browser — só despacha `POST /jobs` para
`SIGAA_WORKER_URL` (túnel público apontando para `localhost:8787`).

```
Cloudflare (acme-hub) ──HTTPS──► cloudflared (PC) ──► worker :8787
                                      │
                                      ├─ Chrome (SIGAA)
                                      ├─ staging SQLite (.data/users/<cpf>/)
                                      └─ mirror → Supabase (SYNC_MIRROR_POSTGRES)
```

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/health` | — | Health check |
| GET | `/status` | — | Slots ativos, fila interna, job atual |
| POST | `/jobs` | `Authorization: Bearer $WORKER_SHARED_SECRET` | Executa job (r1 / turmas / calendario) |

### POST /jobs (corpo)

```json
{
  "jobId": "uuid-ou-idempotency-key",
  "robot": "r1",
  "username": "12345678901",
  "passwordEnc": "senha-selada-aes-gcm",
  "mode": "full",
  "savePassword": false,
  "execution": "async"
}
```

- `robot`: `r1` (pipeline por usuário) · `turmas` / `calendario` (catálogo global).
- `execution`: `sync` (espera o fim) · `async` (**202**; status na fila Postgres
  `sync_jobs`). `async` exige `DATABASE_URL` + `SYNC_MIRROR_POSTGRES=true`.
- `passwordEnc` com a **mesma** `CREDENTIALS_ENCRYPTION_KEY` do app cloud.

## Subir o worker neste PC (path oficial)

### 1. `.env.local` (pasta `app/`)

```env
WORKER_SHARED_SECRET=...          # mín. 16 chars — mesmo valor no Cloudflare
CREDENTIALS_ENCRYPTION_KEY=...    # mesma chave do app cloud
DATABASE_URL=postgresql://...     # Supabase
SYNC_MIRROR_POSTGRES=true
WORKER_PORT=8787
SIGAA_BROWSER_CHANNEL=chrome      # Chrome instalado no Windows
SIGAA_SCRAPER_MOCK=false
SIGAA_HEADLESS=true               # false = ver o Chrome durante o sync
```

### 2. Terminal A — worker

```bash
cd app
npm run worker:home
# ou: npm run worker:dev
```

Smoke local: `curl http://127.0.0.1:8787/health` → `{ "ok": true, ... }`.

### 3. Terminal B — túnel Cloudflare (cloudflared)

Já instalado no PATH:

```bash
cd app
npm run worker:tunnel
```

O cloudflared imprime uma URL `https://….trycloudflare.com`. Copie-a.

> URL de quick tunnel **muda** a cada restart. Para hostname estável, use um
> [túnel nomeado](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
> (`cloudflared tunnel create planner-sigaa` + DNS no domínio).

### 4. Secrets no app Cloudflare

```bash
cd app
npx wrangler secret put SIGAA_WORKER_URL         # URL do túnel (https://…)
npx wrangler secret put WORKER_SHARED_SECRET     # mesmo valor do .env.local
```

Com os dois presentes, `/api/sync` e `/api/sync/queue` deixam de ser stub e
despacham para **este PC**.

### 5. Smoke ponta a ponta

```bash
cd app
PLANNER_APP_URL=https://acme-hub.khfm.workers.dev \
SIGAA_CPF=... SIGAA_PASSWORD=... npm run smoke:cloud-sync
```

Esperado: enqueue 202 → job `queued→running→completed` → linhas no Supabase.

## Termux (tablet Android) — mesma função do PC

O Termux roda o **mesmo** `npm run worker:home` (Playwright + mirror Postgres +
`POST /jobs` + `POST /email/send`) e publica o túnel em `SIGAA_WORKER_URL`.

### No PC (exportar env)

```bash
cd app
npm run termux:export-env
# gera app/.env.termux.local (gitignored) a partir do .env.local do PC
```

Copie `app/.env.termux.local` para o tablet (`app/.env.termux.local`).

### No Termux

```bash
cd ~/CEFET-Academic-Planner/app   # ou o path do clone
git pull origin main
bash scripts/termux-fix-env.sh      # aplica .env.termux.local + overrides Chromium
bash scripts/termux-servidor-acme.sh
```

Overrides Termux (iguais ao PC em função, diferentes só no browser):

| Var | PC | Termux |
|-----|----|--------|
| `SIGAA_BROWSER_CHANNEL` | `chrome` | *(vazio)* |
| `SIGAA_BROWSER_EXECUTABLE_PATH` | Chrome.exe | `…/chromium-browser` |
| `SYNC_MIRROR_POSTGRES` | `true` | `true` |
| `ACCOUNT_EMAIL_VIA_HOME_WORKER` | `true` | `true` |
| `WORKER_SHARED_SECRET` / `CREDENTIALS_ENCRYPTION_KEY` | iguais | iguais |

O script Termux: sobe worker + cloudflared (metrics), espera `/health` local e
público, atualiza `SIGAA_WORKER_URL`, re-aplica se a URL do quick tunnel mudar,
e dispara crons locais (reminders / account-emails / orchestrator).

> Se o PC e o Termux estiverem os dois no ar, o **último** `secret put` ganha.
> Deixe só um home-server ativo.

## Ligação local (só este PC, sem Cloudflare)

```bash
# Terminal 1
npm run worker:dev

# .env.local da API Next:
# SIGAA_WORKER_URL=http://127.0.0.1:8787
# SYNC_QUEUE_DISPATCH=  (não usar inline se quiser o processo worker)
npm run dev
```

## Docker / Fly (alternativa — não é o path oficial deste repo)

O path oficial é **PC + cloudflared**. Fly/Docker ficam como fallback se o PC
não estiver online 24/7 — ver `worker/fly.toml` e `Dockerfile`.

## Variáveis

| Var | Obrigatória | Uso |
|-----|-------------|-----|
| `WORKER_SHARED_SECRET` | ✅ | Bearer de `POST /jobs` (mín. 16 chars) |
| `CREDENTIALS_ENCRYPTION_KEY` | ✅ | Decripta `passwordEnc` (mesma do app) |
| `DATABASE_URL` | ✅ | Mirror B72 + fila `sync_jobs` |
| `SYNC_MIRROR_POSTGRES` | ✅ | `true` liga o mirror pós-sync |
| `SIGAA_BROWSER_CHANNEL` | PC | `chrome` / `msedge` — browser do sistema |
| `WORKER_PORT` | — | default `8787` |
| `SIGAA_WORKER_MAX_CONCURRENT` | — | default `1` (1 browser por vez) |
| `SIGAA_WORKER_JOB_TIMEOUT_MS` | — | default `480000` |
| `SIGAA_WORKER_SHUTDOWN_MS` | — | graceful shutdown, default `600000` |
| `PLANNER_DATA_ROOT` | — | raiz do staging SQLite (default `.data`) |
