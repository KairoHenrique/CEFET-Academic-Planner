# Plano T1 — Deploy Cloudflare + smoke (hora oficial do ar)

> **Task:** **T1** do Bloco **6a** · [`docs/TASKS.md`](../TASKS.md)  
> **Quando executar:** **agora** — após **O1** (código deploy) + **O2** (prod sem SQLite).  
> **Pré-requisitos:** `O1` `[@]` · `O2` `[%]` ou `[@]` no remoto · seed PPC já no Supabase (`npm run db:seed-ppc`).

---

## O que é T1?

**T1 não é mais código** — é a **operação** de colocar o app no ar e validar a URL pública.

| Task | O que entregou |
|------|----------------|
| **O1** | Scripts OpenNext, health, cron, runbook — *infra pronta* |
| **O2** | `PLANNER_CLOUD` bloqueia SQLite — *seguro para Workers* |
| **T1** | **`npm run deploy:cf`** + cron + smoke na URL pública |

---

## Checklist T1 (stakeholder / dev)

### 1. Git

- [ ] Push de **O2** (e fixes pendentes) para `main`

### 2. Variáveis no Cloudflare (`acme-hub` → Settings → Variables)

```
PLANNER_CLOUD=true
PLANNER_DATABASE=postgres
DATABASE_URL=postgresql://postgres.REF:...@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
PLANNER_CURSO_ID=eng-computacao
NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   (ou PUBLISHABLE_KEY)
SUPABASE_SERVICE_ROLE_KEY=...       (secret)
CRON_SECRET=...                     (secret, ≥16 chars)
```

### 3. Deploy app

```powershell
cd app
npm install
npx wrangler login
npm run deploy:cf
```

Anotar URL: `https://acme-hub.<account>.workers.dev`

### 4. Deploy cron anti-pausa Supabase

```powershell
npx wrangler secret put CRON_SECRET --config workers/cron-ping/wrangler.jsonc
npx wrangler secret put PLANNER_HEALTH_URL --config workers/cron-ping/wrangler.jsonc
npm run deploy:cron-ping
```

### 5. Smoke (substituir `<URL>`)

| Teste | URL | Esperado |
|-------|-----|----------|
| Health | `<URL>/api/health` | `{ "ok": true, "backend": "postgres" }` |
| Health deep | `<URL>/api/health?deep=1` + Bearer `CRON_SECRET` | `"database": "ok"` |
| PPC | `<URL>/api/disciplinas/01%2F1` | JSON `catalogOnly: true` |
| UI | `<URL>/` | Dashboard “Nenhum dado sincronizado” (sem sync ainda) |

### 6. Aprovar

- [ ] Stakeholder valida smoke → **T1** `[x]` · **O1** pode ir de `[@]` → `[x]`

---

## Fora do escopo T1 (normal)

- Sync SIGAA na nuvem (worker B54 externo)
- Dashboard com dados reais (precisa sync + auth 6b)
- Mapa / calendário na URL pública (`503 SQLITE_DISABLED` até migrar rotas)

---

## Depois de T1

**6b** (auth CPF) ou continuar dev local enquanto beta fechado.
