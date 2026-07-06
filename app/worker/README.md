# Worker Playwright (B54 + B72e)

Processo **separado** do Next.js — executa sync SIGAA com **1 browser por vez**
(configurável via `SIGAA_WORKER_MAX_CONCURRENT`) e espelha o resultado no
Supabase (**mirror B72**, `SYNC_MIRROR_POSTGRES=true`).

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/health` | — | Health check (Docker/K8s/Fly) |
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

- `robot`: `r1` (pipeline por usuário) · `turmas` / `calendario` (catálogo global, B72e).
- `execution`: `sync` (responde ao fim do job) · `async` (**202** imediato; status
  publicado na fila Postgres `sync_jobs`, consultada pelo app cloud em
  `GET /api/sync/queue/:id`). `async` exige `DATABASE_URL` + `SYNC_MIRROR_POSTGRES=true`.
- `passwordEnc` é selada com AES-GCM usando `CREDENTIALS_ENCRYPTION_KEY` — a
  **mesma chave** configurada no app cloud (que sela a senha do corpo ou usa a
  guardada em `app_profiles.sigaa_password_enc`).

## Dev local

```bash
cd app
# .env.local: WORKER_SHARED_SECRET=... (mín. 16 chars)
npm run worker:dev
```

## Docker (VPS / container)

```bash
cd app
docker build -f worker/Dockerfile -t planner-sigaa-worker .
docker run --rm -p 8787:8787 \
  -e WORKER_SHARED_SECRET=... \
  -e CREDENTIALS_ENCRYPTION_KEY=... \
  -e DATABASE_URL=postgresql://... \
  -e SYNC_MIRROR_POSTGRES=true \
  -v "$(pwd)/.data:/app/.data" \
  planner-sigaa-worker
```

Monte `.data` para persistir o staging SQLite por CPF entre restarts
(sem o volume o sync ainda funciona — apenas refaz o staging do zero).

## Fly.io (B72e)

```bash
cd app
fly launch --no-deploy -c worker/fly.toml     # 1ª vez
fly secrets set -c worker/fly.toml \
  WORKER_SHARED_SECRET=... \
  CREDENTIALS_ENCRYPTION_KEY=... \
  DATABASE_URL=postgresql://...
fly deploy -c worker/fly.toml
```

## Ligando o app cloud ao worker

No app Cloudflare (projeto OpenNext), configurar secrets:

```bash
cd app
wrangler secret put SIGAA_WORKER_URL        # ex.: https://planner-sigaa-worker.fly.dev
wrangler secret put WORKER_SHARED_SECRET    # mesmo valor do worker
```

Com os dois presentes, `/api/sync` e `/api/sync/queue` na URL pública deixam de
ser stub e despacham para o worker. Smoke end-to-end:

```bash
cd app
PLANNER_APP_URL=https://acme-hub.khfm.workers.dev \
SIGAA_CPF=... SIGAA_PASSWORD=... npm run smoke:cloud-sync
```

## Variáveis

| Var | Obrigatória | Uso |
|-----|-------------|-----|
| `WORKER_SHARED_SECRET` | ✅ | Bearer de `POST /jobs` (mín. 16 chars) |
| `CREDENTIALS_ENCRYPTION_KEY` | ✅ (cloud) | Decripta `passwordEnc` (mesma chave do app) |
| `DATABASE_URL` | ✅ (cloud) | Mirror B72 + fila `sync_jobs` (B72e) |
| `SYNC_MIRROR_POSTGRES` | ✅ (cloud) | `true` liga o mirror pós-sync |
| `WORKER_PORT` | — | default `8787` |
| `SIGAA_WORKER_MAX_CONCURRENT` | — | default `1` |
| `SIGAA_WORKER_JOB_TIMEOUT_MS` | — | default `480000` |
| `SIGAA_WORKER_SHUTDOWN_MS` | — | graceful shutdown, default `600000` |
| `PLANNER_DATA_ROOT` | — | raiz do staging SQLite (default `.data`) |
