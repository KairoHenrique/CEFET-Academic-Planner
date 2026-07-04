# Plano 6a — Supabase + ambientes dev/prod

> **Task:** PLAN do Bloco **6a** (`docs/TASKS.md`)  
> **Escopo:** definir projeto Supabase, ambientes e variáveis **antes** de **B39** (schema Postgres).  
> **Referências:** [`SCOPE-CLOUD.md` §5–§9](../SCOPE-CLOUD.md) · [`TASKS.md` §#4](../TASKS.md)

---

## 1. Objetivo deste plano

Fechar **como** o app sai do SQLite local (`app/.data/`) e passa a usar **Supabase Postgres** em modo **testes global** (URL pública, beta fechado), **sem** RLS rígido ainda (isso é **6c**, antes do PIX).

**Entregável do PLAN (este doc):**

- Estratégia de ambientes (local / cloud preview / prod)
- Checklist para criar projeto(s) Supabase free
- Mapa de variáveis de ambiente (dev vs prod)
- Limites do free tier e mitigação (ping anti-pausa)
- Critérios de “PLAN ok → iniciar B39”

**Fora do PLAN:** migrations SQL, adapter de queries, deploy — tasks **B39–B43**, **O1–O2**, **T1**.

---

## 2. Decisões já fechadas (não reabrir no PLAN)

| Tópico | Decisão |
|--------|---------|
| Banco prod | Supabase PostgreSQL (free tier MVP) |
| Dev local Bloco 1–2 | SQLite continua até **B43** migrar APIs |
| RLS na 6a | **Permissivo ou desligado** — beta fechado |
| RLS obrigatório | **6c**, antes do Bloco **7** (PIX) |
| Auth app | Supabase Auth — implementação **6b** (não na 6a) |
| Worker Playwright | Processo separado (**B54**); **não** Edge Functions |
| Fila sync | SQLite `sync-queue.db` na API até migrar ops (pode permanecer na 6a) |
| Web deploy | Cloudflare Pages (**O1**) |
| Catálogo global | PPC, calendário, turmas **sem** `user_id` — schema **B39** + **B68d** |

---

## 3. Ambientes

```
┌─────────────────────────────────────────────────────────────────┐
│  LOCAL (hoje — mantém até B42/B43)                              │
│  Next.js :3000 · SQLite por CPF · sync-queue.db · worker local │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼  (6a — modo testes global)
┌─────────────────────────────────────────────────────────────────┐
│  PREVIEW / PROD WEB (Cloudflare Pages)                          │
│  NEXT_PUBLIC_* → Supabase · API Routes no edge/server           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────────┐                         ┌───────────────────┐
│ Supabase DEV      │                         │ Supabase PROD     │
│ (free)            │   ou projeto único      │ (free + ping cron)│
│ testes / branch   │   no MVP beta fechado   │ URL pública beta  │
└───────────────────┘                         └───────────────────┘
        │                                               │
        └───────────────────┬───────────────────────────┘
                            ▼
                 ┌─────────────────────┐
                 │ Worker sync (B54)   │
                 │ Railway/Fly/VPS TBD │
                 └─────────────────────┘
```

### Recomendação MVP (beta fechado)

| Ambiente | Web | Supabase | Worker |
|----------|-----|----------|--------|
| **Local** | `localhost:3000` | Opcional: mesmo projeto DEV (só server keys) | `npm run worker:dev` |
| **Preview** | Cloudflare Pages (branch `main` ou PR) | **1 projeto DEV** compartilhado | Staging URL ou inline |
| **Prod beta** | Cloudflare Pages (domínio TBD) | **Mesmo projeto** ou **PROD** separado quando abrir beta amplo | Worker dedicado |

**MVP enxuto:** **1 projeto Supabase free** (`planner-dev`) para 6a–6b; criar **`planner-prod`** só antes de beta amplo ou PIX (**6c+**).

**Desenvolvimento diário:** continuar SQLite local — Supabase só quando testar deploy ou migrar API (**B42+**).

---

## 4. Checklist — criar projeto Supabase

Executar **uma vez** (stakeholder ou dev com acesso):

- [ ] Conta [supabase.com](https://supabase.com) (org pessoal ou CEFET-adjacente)
- [ ] Novo projeto: nome sugerido `cefet-planner-dev`
- [ ] Região: **`South America (São Paulo)`** (`sa-east-1`) — latência BR
- [ ] Senha do Postgres: gerador forte → guardar no **password manager** (nunca no git)
- [ ] Anotar no painel:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (**só servidor**)
  - **Database connection string** (URI) → migrations/CLI (**B39**)
- [ ] Auth: deixar e-mail habilitado (6b); **não** exigir confirmação de e-mail no dev
- [ ] Desligar ou não usar Storage na 6a (sem PDFs de materiais)
- [ ] **Não** ativar RLS nas tabelas na 6a — políticas entram em **B40 (6c)**
- [ ] Convites: só e-mails do time beta

### Projeto prod (quando separar)

- [ ] Clone config ou segundo projeto `cefet-planner-prod`
- [ ] Cron de ping (ver §6) no projeto prod

---

## 5. Variáveis de ambiente

Copiar `app/.env.example` → `app/.env.local`. Novas chaves Supabase (6a):

| Variável | Onde usar | Dev local | Cloudflare Pages |
|----------|-----------|-----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | `.env.local` | Environment variables (Production + Preview) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | `.env.local` | Idem (pública por design) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Só** API Routes / worker admin | `.env.local` | **Production only** — nunca Preview público se possível |
| `DATABASE_URL` | Migrations / scripts **B39** | `.env.local` | CI ou local only |

**`DATABASE_URL` (Windows / free tier):** use **Connect → Session pooler** (porta **5432**, user `postgres.[project-ref]`). Direct (`db.[ref].supabase.co`) costuma ser **só IPv6** → `getaddrinfo ENOENT`. O host do pooler pode ser **`aws-1-`** (não assuma `aws-0-`) — copie do dashboard do projeto.

**Manter do Bloco 2b (worker/fila):**

| Variável | Notas 6a |
|----------|----------|
| `CREDENTIALS_ENCRYPTION_KEY` | Mesma chave dev/prod; rotacionar só com migração de secrets |
| `SIGAA_WORKER_URL` | URL pública do worker quando sair do localhost |
| `WORKER_SHARED_SECRET` | Bearer entre API e worker |
| `SYNC_QUEUE_DB_PATH` | Pode ficar SQLite na API na 6a |
| `SYNC_COOLDOWN_PROFILE` | `production` na URL pública |

**Futuro (não preencher na 6a):**

- `PIX_GATEWAY_*` — Bloco **7**
- Supabase JWT custom claims — **6b**

### Onde **não** commitar

- `.env.local`, `.env.production`
- `service_role`, `DATABASE_URL`, `WORKER_SHARED_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`
- Pares `EMAIL_DEV` / `PASSWORD_DEV`

---

## 6. Free tier — limites e mitigação

| Recurso | Limite típico free | Mitigação Planner |
|---------|-------------------|-------------------|
| Postgres | ~500 MB | Grace 7d apaga dados acadêmicos (**SCOPE-CLOUD** §3.3); catálogo global compacto |
| Pausa por inatividade | ~7 dias | **O1:** cron ping (Cloudflare Cron ou UptimeRobot) → `GET /api/health` ou Supabase REST |
| Egress | Moderado | Cache global R2/R3; sync lite diurno (**§6.6**) |
| Auth MAU | Generoso p/ beta | Ok na 6a–6b |

**Ping sugerido (O1):** job a cada **24–48 h** batendo endpoint que faz `SELECT 1` no Postgres.

---

## 7. Modo testes global (6a) — regras

Conforme `TASKS.md` / `SCOPE-CLOUD.md` §10:

1. URL pública (Cloudflare) com beta fechado (convite / lista CPF).
2. Postgres no Supabase; seed PPC (**B41**) + dados de teste ou sync real.
3. **RLS off ou permissivo** — aceitável só enquanto beta fechado.
4. **6c (B40) obrigatório** antes de PIX e divulgação ampla.
5. Sync SIGAA já validado localmente (**2a** ✅) e fila (**2b** ✅).

---

## 8. Worker Playwright na cloud (TBD — não bloqueia PLAN)

O Next.js na Cloudflare **não** roda Playwright. Opções para **O1+**:

| Opção | Prós | Contras |
|-------|------|---------|
| **Railway** | Deploy simples, Docker B54 | Custo após free |
| **Fly.io** | Container, região SA | Config extra |
| **VPS barata** | Controle total | Ops manual |

**Decisão adiada** até **O1**; PLAN só exige definir `SIGAA_WORKER_URL` quando houver URL.

Enquanto isso: `SYNC_QUEUE_DISPATCH=inline` no preview **não** é ideal em serverless — worker externo é o caminho.

---

## 9. Critérios — PLAN concluído → B39

- [x] Este documento revisado pelo stakeholder
- [x] Projeto Supabase **Acme-Hub-dev** criado (região São Paulo)
- [x] Chaves anotadas em local seguro + `app/.env.local`
- [x] MVP **1 projeto** dev confirmado
- [x] **B39** — schema aplicado (`npm run db:migrate` no Acme-Hub-dev)

**Próxima task:** **B41** — seed PPC global (EngComp v3).

---

## 10. Ordem das tasks 6a (referência)

```
PLAN (este doc) ✅
  → B39  schema Postgres + migrations ✅
  → B41  seed PPC global ✅
  → B42  client Supabase + adapter PG ✅
  → B43  migrar APIs principais ✅
  → O1   deploy Cloudflare + cron ping [%]
  → O2   prod sem .db local [%]
  → T1   smoke: URL abre, seed carrega
```

Depois: **6b** (auth CPF) · **6c** (RLS) · **#6d** B68d–f (orquestração + catálogo global).

---

## 11. Ações imediatas (stakeholder)

1. ~~Criar projeto Supabase (**§4**).~~ ✅ **Acme-Hub-dev**
2. ~~Preencher `app/.env.local` (**§5**).~~ ✅
3. ~~Confirmar MVP **1 projeto**.~~ ✅
4. ~~**B39** schema + `npm run db:migrate`.~~ ✅

**Próximo:** **T1** — smoke deploy · runbook [`o2-prod-postgres.md`](./o2-prod-postgres.md).
