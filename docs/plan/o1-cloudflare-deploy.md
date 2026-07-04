# Plano O1 — Deploy Cloudflare + cron ping Supabase

> **Task:** **O1** do Bloco **6a** · [`docs/TASKS.md`](../TASKS.md)  
> **Pré-requisitos:** **B39–B43** ✅ · `PLANNER_DATABASE=postgres` em produção · seed PPC aplicado

---

## Arquitetura proposta

| Componente | Função |
|------------|--------|
| **Next.js + OpenNext** | App web + API Routes no Cloudflare Workers (`nodejs_compat`) |
| **`GET /api/health`** | Liveness público; `?deep=1` executa `SELECT 1` no Postgres (anti-pausa Supabase) |
| **Worker `acme-hub-cron-ping`** | Cron diário **15:00 UTC** (= **12:00 horário de Brasília**) → `fetch` no health deep |
| **Supabase Session pooler** | `DATABASE_URL` na Cloudflare (região `aws-1-sa-east-1` se aplicável) |

**Separação de responsabilidades:** o cron roda em worker mínimo (resiliência, sem acoplar ao bundle Next). O health deep exige secret quando `CRON_SECRET` está definido — evita abuso do ping ao Postgres.

---

## 0. Testar local (sem deploy)

**Passo 1 — instalar deps** (obrigatório após `git pull` do O1):

```powershell
cd app
npm install
npm run dev
```

Se aparecer `Cannot find module '@opennextjs/cloudflare'`, rode `npm install` de novo.

**Passo 2 — health no navegador**

| URL | Esperado |
|-----|----------|
| http://localhost:3000/api/health | `{ "ok": true, "service": "acme-hub", ... }` |
| http://localhost:3000/api/health?deep=1 | Com `PLANNER_DATABASE=postgres`: `"database": "ok"` |

**Passo 3 — testes automatizados**

```powershell
npm run test:o1
```

**Preview Cloudflare local** (opcional, exige deps instaladas):

```powershell
npm run preview:cf
```

---

## 1. Variáveis de ambiente (Cloudflare Workers — app `acme-hub`)

Configurar no dashboard **Workers & Pages → acme-hub → Settings → Variables** (Production):

| Variável | Obrigatória | Exemplo / notas |
|----------|-------------|-----------------|
| `PLANNER_DATABASE` | Sim | `postgres` |
| `DATABASE_URL` | Sim | Session pooler Supabase (porta 5432) |
| `PLANNER_CURSO_ID` | Sim | `eng-computacao` |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Acme-Hub-dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sim | Chave pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | **Secret** — só server |
| `CRON_SECRET` | Recomendado | Secret forte (≥16 chars) — mesmo valor no worker cron |
| `CREDENTIALS_ENCRYPTION_KEY` | Se sync | Mesma chave do dev (secret) |

**Não configurar em produção (O2):** paths SQLite locais · `better-sqlite3` não roda no Workers.

---

## 2. Deploy do app (CLI)

```powershell
cd app
npm install
npm run deploy:cf
```

Primeira vez: `npx wrangler login`

**GitHub (recomendado):** Workers Builds · root directory **`app`** · build command:

```bash
npm ci && npm run deploy:cf
```

Ou build + upload separado: `npm run build:cf` + `npm run upload:cf`.

---

## 3. Deploy do cron ping

Após o app estar no ar (anote a URL `https://acme-hub.<account>.workers.dev`):

```powershell
cd app
npx wrangler secret put CRON_SECRET --config workers/cron-ping/wrangler.jsonc
npx wrangler secret put PLANNER_HEALTH_URL --config workers/cron-ping/wrangler.jsonc
# PLANNER_HEALTH_URL = https://acme-hub.<account>.workers.dev

npm run deploy:cron-ping
```

Cron: **diário 15:00 UTC** (`0 15 * * *`) = **12:00 horário de Brasília (UTC−3)**.

> **Por que UTC?** Cloudflare Cron Triggers **só aceitam fuso UTC** — não dá para configurar “12h Brasília” direto. Convertemos: 15:00 UTC − 3h = 12:00 BRT. Qualquer horário dentro de 24–48 h mantém o Supabase free acordado.

---

## 4. Verificação manual

| URL | Esperado |
|-----|----------|
| `GET /api/health` | `{ "ok": true, "service": "acme-hub", "backend": "postgres", ... }` |
| `GET /api/health?deep=1` + `Authorization: Bearer <CRON_SECRET>` | `"database": "ok"` |
| `GET /api/disciplinas/01%2F1` | JSON PPC (`catalogOnly: true`) |

Smoke formal: task **T1** após **O2**.

---

## 5. Troubleshooting

| Problema | Ação |
|----------|------|
| Build OpenNext falha | `nodejs_compat` + `compatibility_date` ≥ 2024-09-23 no `wrangler.jsonc` |
| Postgres timeout no Workers | Usar **Session pooler**, não direct `db.*.supabase.co` |
| Cron 401 | Alinhar `CRON_SECRET` no app e no worker cron |
| Supabase pausa | Confirmar cron deployado e logs em Workers → acme-hub-cron-ping |

---

## 6. Ordem pós-O1

```
O1 ✅ → O2 (prod sem .db local) → T1 (smoke deploy)
```
