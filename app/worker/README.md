# Worker Playwright (B54)

Processo **separado** do Next.js — executa sync SIGAA com **1 browser por vez** (configurável via `SIGAA_WORKER_MAX_CONCURRENT`).

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/health` | — | Health check (Docker/K8s) |
| GET | `/status` | — | Slots ativos, fila interna, job atual |
| POST | `/jobs` | `Authorization: Bearer $WORKER_SHARED_SECRET` | Executa job **R1** (sync portal/turma/histórico) |

### POST /jobs (corpo)

```json
{
  "jobId": "uuid-ou-idempotency-key",
  "robot": "r1",
  "username": "12345678901",
  "password": "senha-sigaa",
  "mode": "full",
  "savePassword": false
}
```

## Dev local

```bash
cd app
# .env.local: WORKER_SHARED_SECRET=... (mín. 16 chars)
npm run worker:dev
```

## Docker (VPS free tier)

```bash
cd app
docker build -f worker/Dockerfile -t planner-sigaa-worker .
docker run --rm -p 8787:8787 \
  -e WORKER_SHARED_SECRET=... \
  -v "$(pwd)/.data:/app/.data" \
  planner-sigaa-worker
```

Monte `.data` para persistir SQLite por CPF até migrar Supabase (B39).

## Integração

- **B55** — Next.js enfileira jobs e faz polling em `/status` + POST `/jobs`
- **B56** — credenciais cifradas no servidor (sem password no body)

## Variáveis

Ver `.env.example` — `WORKER_PORT`, `WORKER_SHARED_SECRET`, `SIGAA_WORKER_MAX_CONCURRENT`, `SIGAA_WORKER_JOB_TIMEOUT_MS`, `SIGAA_WORKER_SHUTDOWN_MS`.
