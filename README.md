# ACME HUB

Planejador acadêmico **gratuito** (com anúncios opcionais no Android) para alunos do **CEFET-MG**.  
Sincroniza dados do [SIGAA](https://sig.cefetmg.br/) e concentra a vida acadêmica em uma interface moderna (**web** + **Android**).

> **ACME HUB** é o nome do produto. O repositório GitHub permanece `CEFET-Academic-Planner`. Para usar o app: [abrir o site](https://acmehub.com.br).

| | |
|---|---|
| **Site (produção)** | https://acmehub.com.br |
| **Pacote Android** | `br.cefethub.acme` |
| **Versão app** | `1.16` (`versionCode` 16) |
| **Repositório** | [github.com/KairoHenrique/CEFET-Academic-Planner](https://github.com/KairoHenrique/CEFET-Academic-Planner) |
| **Produto** | **ACME HUB** — site: https://acmehub.com.br |
| **Licença** | AGPL-3.0 |
| **Contato / LGPD** | acme.hubsuporte@gmail.com |
| **Privacidade** | https://acmehub.com.br/privacidade |
| **Termos** | https://acmehub.com.br/termos |

---

## Índice

1. [O que o produto faz](#1-o-que-o-produto-faz)
2. [Arquitetura](#2-arquitetura)
3. [Decisões de desenho (ADR leve)](#3-decisões-de-desenho-adr-leve)
4. [Estrutura do repositório](#4-estrutura-do-repositório)
5. [Mapa do código (`app/src/lib`)](#5-mapa-do-código-appsrclib)
6. [Pré-requisitos](#6-pré-requisitos)
7. [Clonar e configurar](#7-clonar-e-configurar)
8. [Rodar em desenvolvimento](#8-rodar-em-desenvolvimento)
9. [Servidor ACME (sync SIGAA)](#9-servidor-acme-sync-sigaa)
10. [Timeouts (Termux-first)](#10-timeouts-termux-first)
11. [APIs e robots do worker](#11-apis-e-robots-do-worker)
12. [Deploy (Cloudflare + banco)](#12-deploy-cloudflare--banco)
13. [App Android (Expo / EAS / Play Store)](#13-app-android-expo--eas--play-store)
14. [Testes](#14-testes)
15. [Variáveis de ambiente](#15-variáveis-de-ambiente)
16. [Fluxos principais](#16-fluxos-principais)
17. [Modelo de dados (visão)](#17-modelo-de-dados-visão)
18. [Segurança, LGPD e repo público](#18-segurança-lgpd-e-repo-público)
19. [Troubleshooting](#19-troubleshooting)
20. [Contribuindo](#20-contribuindo)
21. [Glossário](#21-glossário)

---

## 1. O que o produto faz

### Para o aluno

- **Cadastro / login** com CPF + senha do SIGAA (e-mail e telefone no cadastro + aceite legal).
- **Sync** de portal, notas, faltas, tarefas, calendário, histórico, turmas e saldo RU (quando habilitado).
- **Dashboard**, **disciplinas**, **calendário** (grade + agenda), **mapa do curso**, **integralização**, **simulador**.
- **Envio de tarefa** ao SIGAA (arquivo + comentário) via Servidor ACME.
- **Notificações** in-app e push (Android) para prazos e atualizações.
- **Produto gratuito** — funções acadêmicas sem paywall; anúncios no Android e na web; plano opcional remove anúncios (Play no app / PIX na web).

### Cursos / PPC

O mapa e a integralização usam o **PPC** do curso escolhido no cadastro (ex.: Engenharia da Computação).  
Seeds: `app/scripts/ppc_data*.txt` → `npm run db:seed-ppc` (com `DATABASE_URL`).

---

## 2. Arquitetura

```
┌──────────────────────┐     HTTPS / JWT      ┌─────────────────────────────┐
│  Web (Next.js)       │◄────────────────────►│  Cloudflare Workers         │
│  App Android (Expo)  │                      │  OpenNext · API Routes      │
└──────────────────────┘                      └──────────────┬──────────────┘
                                                             │
                                                             ▼
                                              ┌─────────────────────────────┐
                                              │  Supabase                   │
                                              │  Auth + PostgreSQL (+ RLS)  │
                                              └──────────────┬──────────────┘
                                                             │
                    preferido                                │ fila / health
         ┌───────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────┐         fallback (worker offline)
│  Servidor ACME              │         ┌─────────────────────┐
│  Termux (preferido) ou PC   │         │  App Android        │
│  Playwright + Chromium      │         │  HTTP nativo SIGAA  │
│  cloudflared → túnel        │         │  → ingest na cloud  │
│  mirror → Postgres          │         └─────────────────────┘
└─────────────────────────────┘
```

### Papéis

| Peça | Função | Onde vive |
|------|--------|-----------|
| **Cloud (Workers)** | API, auth, UI web, fila de sync, crons CF, push | `app/` → deploy OpenNext |
| **Supabase** | Contas, dados acadêmicos multi-tenant, RLS | `supabase/migrations/` |
| **Servidor ACME** | Login real no SIGAA com navegador, scrape, mirror, e-mail SMTP | `app/worker/` + scripts Termux/tray |
| **Mobile** | Mesma API; sync no aparelho quando o worker está offline | `mobile/` |

### Por que essa divisão?

A Cloudflare **não** abre o Chromium do SIGAA de forma confiável (limites TLS/edge; tentativa de scrape TLS no Worker gerou **Error 1102** e foi abandonada).  
O scrape “pesado” fica no **Servidor ACME** (Termux ou PC). A cloud **despacha** jobs e **persiste** o resultado no Postgres.

---

## 3. Decisões de desenho (ADR leve)

Cada item abaixo tem espelho curto no código (comentários de cabeçalho). Detalhe operacional nesta seção.

### D1 — Gratuito + ads opcional (set/2026+)

| | |
|---|---|
| **Onde** | `app/src/lib/billing/free-mode.ts`, `resolve-ads-free.ts` |
| **Flags** | `APP_IS_FREE = true`, `BILLING_ENFORCED = false`, `ADS_REMOVAL_CHECKOUT_ENABLED = true` |
| **Efeito** | Features acadêmicas sempre liberadas; checkout PIX (web) e Play Billing (APK) só para **remover anúncios**; entitlement `ads_free` unificado |
| **Preços (líquido alinhado)** | Web PIX: R$ 9,90 / mês · R$ 79,90 / ano · Play: R$ 11,90 / mês · R$ 93,90 / ano |
| **Por quê** | App forever-free com monetização leve; AGPL-3.0 no código |

### D2 — Sync híbrido (worker preferido → aparelho)

1. Cloud tenta `SIGAA_WORKER_URL` (túnel do Servidor ACME).
2. Se offline → **Android** faz HTTP no SIGAA e envia snapshot (`POST /api/sync/ingest`).
3. Web sem worker: mensagem de aguardar / usar o app (sem scrape no edge).

Arquivos: `app/src/lib/sync-queue/`, `run-device-fallback-sync-client.ts`, `device-sync/`.

### D3 — Credenciais SIGAA cifradas ponta a ponta

- Senha cifrada (AES-GCM) com `CREDENTIALS_ENCRYPTION_KEY` (mesma chave cloud ↔ worker).
- Preferir `passwordEnc` no payload do job; plaintext só em fluxos legados controlados.
- **Nunca** logar PII (CPF, senha, e-mail) em texto claro.

### D4 — Playwright no home-worker (não no edge)

- SIGAA é portal legado (sessão, JS, formulários).
- Playwright + Chromium no Termux (`pkg`) ou Chrome no PC é o caminho estável.
- Termux = paridade operacional com o tray Windows.

### D5 — Um único Servidor ACME ativo

PC **ou** Termux — nunca os dois. Ambos atualizam o secret `SIGAA_WORKER_URL` no Cloudflare; dois túneis = sync quebrado / 1016.

### D6 — Timeouts “Termux-first” (~15 min)

Chromium no Android/ARM é mais lento. Defaults de login/nav/job/poll foram alinhados para **não** declarar falha enquanto o scrape ainda corre. Ver [§10](#10-timeouts-termux-first).

### D7 — Postgres na cloud; SQLite só local/dev

- Produção: `PLANNER_DATABASE=postgres` + `PLANNER_CLOUD=true`.
- Guard: `o2-cloud-sqlite-guard` impede SQLite como fonte de verdade nos Workers.
- Mirror: `SYNC_MIRROR_POSTGRES=true` no worker grava o sync no mesmo Postgres.

### D8 — Jobs assíncronos (B72e)

`POST /jobs` com `execution: "async"` responde **202**; status em `sync_jobs` / `task_submissions`. Evita timeout HTTP na borda enquanto o Chromium trabalha.

### D9 — E-mail via home-worker

`ACCOUNT_EMAIL_VIA_HOME_WORKER=true` + Gmail SMTP no worker (`POST /email/send`). Útil quando o edge não deve guardar app password ou quando o Termux já está ligado 24/7.

---

## 4. Estrutura do repositório

```
CEFET-Academic-Planner/   (produto: ACME HUB)
├── README.md                 ← esta documentação
├── .gitignore
├── app/                      ← Next.js + API + scraper + home-worker + crons CF
│   ├── src/app/              ← App Router + /api/*
│   ├── src/components/       ← UI web
│   ├── src/lib/              ← domínio (ver §5)
│   ├── scripts/              ← migrate, deploy, Termux, tray
│   ├── worker/               ← HTTP Playwright (:8787)
│   ├── workers/              ← cron Workers Cloudflare
│   ├── tests/                ← tsx --test
│   ├── wrangler.jsonc        ← Worker acme-hub
│   └── .env.example
├── mobile/                   ← Expo Android
│   ├── app.json / app.config.js / eas.json
│   └── .env.example
├── packages/api-contracts/   ← tipos compartilhados web ↔ mobile
└── supabase/migrations/      ← SQL versionado (npm run db:migrate)
```

### Scripts Termux / PC (resumo)

| Script | Função | Seguro no repo público? |
|--------|--------|-------------------------|
| `termux-servidor-acme.sh` | Sobe worker + túnel + secret + crons; fica rodando | Sim (sem secrets) |
| `termux-form-env.sh` | Overrides Chromium/timeouts no `.env.local` | Sim (só flags/URLs públicas) |
| `termux-export-env-from-pc.mjs` | Gera `.env.termux.local` a partir do PC | Sim (o **arquivo gerado** não) |
| `termux-auto-update.sh` | Redireciona para o servidor (sem poll git) | Sim |
| `home-server-tray.ps1` / `HomeServerTray.cs` | Tray Windows | Sim |
| `start-home-worker.mjs` / `start-temp-worker.mjs` | Worker (+ túnel automatizado) | Sim |

---

## 5. Mapa do código (`app/src/lib`)

| Pasta | Responsabilidade |
|-------|------------------|
| `auth/` | Sessão, CPF, pós-login |
| `billing/` | Free mode + legado PIX/planos |
| `crypto/` | AES-GCM credenciais SIGAA |
| `db/` | Postgres / SQLite / bootstrap |
| `scraper/` | Playwright SIGAA (auth, portal, turma, histórico, calendário, RU, submit) |
| `worker/` | Config, job types, runners sync/async |
| `sync-queue/` | Fila, dispatch, poll, device fallback |
| `sync/`, `sync-mirror/`, `sync-ingest/`, `sync-orchestrator/`, `sync-policy/` | Pipeline de sync |
| `task-submissions/` | Envio de tarefa + poll de status |
| `push/`, `notifications/`, `email/` | Push, lembretes, SMTP |
| `device-sync/` | Sync HTTP no aparelho |
| `legal/` | Consentimento / páginas legais |
| `calendar/` | Expansão de eventos / sessões |

Pontos de decisão comentados no código:

- `billing/free-mode.ts`
- `scraper/constants.ts` (timeouts)
- `worker/config.ts` (job 15 min)
- `worker/server.ts` (endpoints)
- `sync-queue/poll-sync-job-client.ts`
- `task-submissions/poll-submission-status.ts`
- `scripts/termux-servidor-acme.sh`
- `scripts/termux-form-env.sh`

---

## 6. Pré-requisitos

- **Node.js** 20+ e **npm**
- Conta **Supabase** (`DATABASE_URL` do *Session pooler*)
- Conta **Cloudflare** (Workers) para deploy
- **Chromium** no Termux (`pkg`) **ou** Chrome/Playwright no PC
- Conta **Expo / EAS** para build Play Store
- `cloudflared` (túnel trycloudflare) no Termux/PC

---

## 7. Clonar e configurar

```bash
git clone https://github.com/KairoHenrique/CEFET-Academic-Planner.git
cd CEFET-Academic-Planner
```

### Web / API

```bash
cd app
npm install
npx playwright install chromium   # opcional no PC; Termux usa Chromium do pkg
cp .env.example .env.local
# Preencha .env.local — NUNCA commitar
```

### Mobile

```bash
cd mobile
npm install
cp .env.example .env
# EXPO_PUBLIC_API_BASE_URL=https://acmehub.com.br
# google-services.json via EAS secret GOOGLE_SERVICES_JSON (produção)
```

---

## 8. Rodar em desenvolvimento

### Site local

```bash
cd app
npm run dev
# http://localhost:3000
```

Com `PLANNER_DATABASE=sqlite` e `SIGAA_SCRAPER_MOCK=true` dá para explorar UI sem SIGAA real.

### Mobile (Expo)

```bash
cd mobile
npx expo start
```

---

## 9. Servidor ACME (sync SIGAA)

Processo que a cloud chama para scrapar o SIGAA. **Preferência atual: Termux 24/7.**

### Termux (recomendado)

```bash
pkg install -y git nodejs python make clang curl cloudflared chromium
# (chromium: pode precisar x11-repo)

cd ~
git clone https://github.com/KairoHenrique/CEFET-Academic-Planner.git
cd CEFET-Academic-Planner

# Trazer .env do PC (uma vez):
# No PC: cd app && npm run termux:export-env
# Copie app/.env.termux.local → tablet em app/.env.local

cd app
bash scripts/termux-form-env.sh      # Chromium + timeouts + mirror (sem secrets hardcoded)
bash scripts/termux-servidor-acme.sh # sobe e fica rodando
```

O que o script faz:

1. Mata processos antigos de worker/cloudflared  
2. Aplica `termux-form-env` se existir  
3. `npm install` + rebuild `better-sqlite3` se preciso  
4. Sobe `worker:home` em `:8787`  
5. Sobe `cloudflared` (metrics `127.0.0.1:20241`)  
6. Espera health **local** e **público**; só então `wrangler secret put SIGAA_WORKER_URL`  
7. Loops de cron locais (reminders **30m**, account-emails **60m**, orchestrator 15m) — alinhados aos Workers CF (antes era 5m e spamava push)  
8. Loop infinito: monitora rotação do quick tunnel  

Teclas com o servidor aberto:

| Tecla | Ação |
|-------|------|
| `[r]` | `git fetch` + `reset --hard origin/main` e reinicia (só sob demanda) |
| `[c]` | CPU/RAM + health local |
| `[q]` | Encerra worker/túnel/crons |

**Não** há auto-update de git a cada 5 min (foi desligado de propósito — igual “abrir e deixar rodando” no PC).

Alinhar clone divergente (após force-push / histórico limpo):

```bash
cd ~/CEFET-Academic-Planner
git fetch origin
git reset --hard origin/main
```

### Windows (PC / tray) — legado opcional

```bash
cd app
npm run worker:home
npm run worker:tunnel
# ou: npm run worker:temp  /  tray (home-server-tray.ps1)
```

### Health

- Local: `GET http://127.0.0.1:8787/health`  
- Público (cloud): `GET https://acmehub.com.br/api/sync/worker-health`

---

## 10. Timeouts (Termux-first)

Valores **default no código** (override via env). Alinhados para tablet lento + UI que não desiste cedo.

| Camada | Default | Env / arquivo |
|--------|---------|----------------|
| Login Playwright | **90 s** | `SIGAA_LOGIN_TIMEOUT_MS` → `scraper/constants.ts` |
| Navegação | **60 s** | `SIGAA_NAVIGATION_TIMEOUT_MS` |
| Submit tarefa (nav floor) | **≥ 90 s** | `submit-portal-tarefa.ts` |
| Job inteiro (worker) | **15 min** | `SIGAA_WORKER_JOB_TIMEOUT_MS` → `worker/config.ts` |
| Grace shutdown | **18 min** | `SIGAA_WORKER_SHUTDOWN_MS` |
| Poll sync (cliente web/app) | **15 min** | `poll-sync-job-client.ts` |
| Wait sync (servidor) | **15 min** | `wait-for-sync-job.ts` / `run-queued-sync.ts` |
| Poll envio de tarefa | **450 × 2 s ≈ 15 min** | `poll-submission-status.ts` |
| Probe health worker | **4 s** | `probe-sigaa-worker-health.ts` |

`termux-form-env.sh` e `termux-export-env-from-pc.mjs` também gravam esses timeouts no `.env.local` do tablet.

> Após mudar polls no app, é preciso **`npm run deploy:cf`** para a cloud usar os novos limites. O worker Termux pega defaults no restart.

---

## 11. APIs e robots do worker

Home-worker (`app/worker/server.ts`), porta default **8787**:

| Método | Path | Auth | Função |
|--------|------|------|--------|
| `GET` | `/health` | — | Liveness `{ ok, service }` |
| `GET` | `/status` | — | busy / acceptingJobs / slot |
| `POST` | `/jobs` | Bearer `WORKER_SHARED_SECRET` | Dispara robot (sync ou async 202) |
| `POST` | `/email/send` | Bearer | SMTP Gmail via home |

Robots (`job-types`): `r1` (sync principal), `turmas`, `calendario`, `turmas-selecionadas`, `submit-tarefa`, `ru`.

Cloud relevantes:

| Path | Função |
|------|--------|
| `POST /api/sync/queue` | Enfileira sync |
| `GET /api/sync/worker-health` | Sonda o túnel |
| `POST /api/sync/ingest` | Snapshot do device |
| `POST /api/cron/*` | Crons (Bearer `CRON_SECRET`) |

---

## 12. Deploy (Cloudflare + banco)

```bash
cd app
npm run build:cf      # OpenNext
npm run deploy:cf     # Worker name: acme-hub
npm run deploy:crons  # ping, e-mails, orchestrator, reminders, etc.
npm run db:migrate    # supabase/migrations via DATABASE_URL
```

Produção tipicamente exige:

- `PLANNER_CLOUD=true`, `PLANNER_DATABASE=postgres`
- `DATABASE_URL`, chaves Supabase, `CRON_SECRET`
- `CREDENTIALS_ENCRYPTION_KEY`, `WORKER_SHARED_SECRET` (**iguais** no Termux)
- `SIGAA_WORKER_URL` atualizado pelo script do túnel

Crons CF em `app/workers/`: `cron-ping`, `cron-account-emails`, `cron-notification-reminders`, `cron-sync-orchestrator`, `cron-app-update-notify`, `cron-ru-saldo`.

---

## 13. App Android (Expo / EAS / Play Store)

| Campo | Valor |
|-------|--------|
| Nome | ACME HUB |
| Package | `br.cefethub.acme` |
| version / versionCode | `1.16` / `16` (`mobile/app.json`) |

```powershell
cd mobile
npx eas-cli@latest build --platform android --profile production --non-interactive
```

- **production** → AAB (Play Store)  
- **preview** → APK interno  
- **development** → APK debug / dev client  

`app.config.js` injeta `GOOGLE_SERVICES_JSON` (secret EAS). Não versionar `google-services.json` real.

Bump: incrementar `version` + `versionCode` → commit → EAS → Play Console.

---

## 14. Testes

Rodam com **Node test runner** via `tsx` em `app/tests/`.

### Suite rápida (padrão)

```bash
cd app
npm test
# = parsers/UI domínio com SIGAA_SCRAPER_MOCK=true
```

### Suites nomeadas

```bash
npm run test:o1              # health
npm run test:o2              # guard SQLite na cloud
npm run test:worker          # worker B54
npm run test:sync-queue      # fila B55
npm run test:sync-b56-o3
npm run test:f31             # auth / free mode
npm run test:f32-f40         # UI billing (legado)
npm run test:t2              # RLS isolation (precisa .env.local)
npm run test:b39 / test:b40 / test:b41-b43
npm run test:b47 … test:b53  # billing legado
npm run test:b68d / b68e / b68f
npm run test:b69 / test:b74
npm run test:scraper:live    # SIGAA real (opcional, cuidado)
```

Smokes:

```bash
npm run smoke:cloud-sync
npm run smoke:cron
npm run smoke:t2
```

### Como pensar as categorias

| Tipo | Exemplos de arquivos | O que valida |
|------|----------------------|--------------|
| Parsers / domínio | `bloco-2a-*.test.ts`, `absence-risk.test.ts` | HTML/SIGAA → modelos |
| Calendário / lembretes | `calendar-event-reminders.test.ts`, `task-deadline-reminders.test.ts` | Lembretes e sessões |
| Worker / fila | `worker-b54.test.ts`, `sync-queue-b55.test.ts`, `sync-hybrid-b82-b83.test.ts` | Dispatch e híbrido |
| Postgres / RLS | `b39-*`, `b40-*`, `t2-rls-isolation.test.ts` | Schema e isolamento |
| Auth / free | `f31-billing-auth-flow.test.ts`, `l1-legal-consent.test.ts` | Pós-login e consent |
| Billing legado | `b47`…`b53`, `b69`, `b74` | Planos/PIX (dormante na UX) |
| Ops | `o1-health`, `o2-cloud-sqlite-guard` | Health e guard cloud |
| Push | `push-sent-history.test.ts`, `notification-fingerprint.test.ts` | Dedup / histórico |

**Não** commitar dumps HTML/PDF (`.data/`, `scrape-debug/`) — `.gitignore`.

---

## 15. Variáveis de ambiente

Modelo: `app/.env.example` → `app/.env.local`.

### Obrigatórias em produção

| Variável | Para quê |
|----------|----------|
| `CREDENTIALS_ENCRYPTION_KEY` | Cifrar senha SIGAA (≥ 16 chars) |
| `WORKER_SHARED_SECRET` | Bearer cloud ↔ worker (≥ 16) |
| `DATABASE_URL` | Postgres (Session pooler) |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente / auth |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou ANON) | Cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | Só servidor |
| `CRON_SECRET` | Protege `/api/cron/*` |
| `SIGAA_WORKER_URL` | Túnel vivo do Servidor ACME |
| `PLANNER_CLOUD=true` | Modo Workers |
| `PLANNER_DATABASE=postgres` | Backend de dados |

### Worker / Termux

| Variável | Para quê |
|----------|----------|
| `SYNC_MIRROR_POSTGRES=true` | Mirror no Postgres |
| `SIGAA_BROWSER_EXECUTABLE_PATH` | Chromium Termux |
| `SIGAA_HEADLESS=true` | Sem UI |
| `SIGAA_*_TIMEOUT_MS` / `SIGAA_WORKER_JOB_TIMEOUT_MS` | Ver §10 |
| `ACCOUNT_EMAIL_VIA_HOME_WORKER` | SMTP via worker |
| `GMAIL_SMTP_*` | Envio de e-mail |
| `CLOUDFLARE_API_TOKEN` | `wrangler secret put` do túnel |

### Mobile

| Variável | Para quê |
|----------|----------|
| `EXPO_PUBLIC_API_BASE_URL` | URL da API (sem `/` final) |
| `GOOGLE_SERVICES_JSON` | Secret EAS (arquivo Firebase) |

**Nunca** commitar `.env`, `.env.local`, `.env.termux.local`, `google-services.json` real ou scripts que **escrevem** secrets.

`termux-form-env.sh` é seguro no público: só flags, path do Chromium e URL pública do app.

---

## 16. Fluxos principais

### Cadastro

1. E-mail, telefone, CPF, curso, senha SIGAA + aceite legal.  
2. Cria usuário Auth + `app_profiles`.  
3. Acesso liberado (modo free).  
4. Sync inicial enfileirado (worker ou aparelho).

### Login

1. CPF + senha → JWT/sessão.  
2. Redirect para `/` (sem `/planos`).

### Sync

1. Cliente pede sync → API autentica → job na fila.  
2. Dispatch para Servidor ACME se `/health` OK.  
3. Senão → fallback device (Android) ou aviso na web.  
4. Snapshot → Postgres → UI.

### Envio de tarefa

1. App sobe arquivo → `task_submissions` queued.  
2. Cloud despacha `submit-tarefa` ao worker (async).  
3. Cliente faz poll até completed/failed/timeout (~15 min).

### Notificações / crons

Workers CF **e/ou** loops do Termux chamam:

- `POST /api/cron/notification-reminders`
- `POST /api/cron/account-emails`
- `POST /api/cron/sync-orchestrator`

Header: `Authorization: Bearer $CRON_SECRET`.

---

## 17. Modelo de dados (visão)

Sem listar todas as colunas — visão operacional:

| Área | Ideia |
|------|--------|
| Auth | Supabase Auth + `app_profiles` (CPF, curso, consent) |
| Acadêmico | Disciplinas, notas, faltas, tarefas, turmas (tenant = `user_id`) |
| Sync | `sync_jobs` (status, robot, erros) |
| Submissões | `task_submissions` (arquivo, status SIGAA) |
| Billing | Tabelas legado (planos/PIX) — UX não usa |
| Push | Tokens / fingerprints enviados |
| PPC | Grades/currículo para mapa e integralização |

RLS: isolamento por usuário; suite `test:t2` valida.

---

## 18. Segurança, LGPD e repo público

- Minimize PII em logs.  
- Secrets só em `.env.local` / Cloudflare Secrets / EAS.  
- Repo público: **não** versionar históricos escolares, dumps SIGAA, tokens, CPF reais em fixtures.  
- Se um secret vazar: **rotacione** (Supabase, Cloudflare, Gmail app password, AES) e limpe histórico se necessário.  
- LGPD: `/privacidade`, `/termos`; consentimento no cadastro (`legal/`).  
- Histórico Git já passou por purge de secrets/PII antes de tornar o repo público — ainda assim, rotacione credenciais antigas se houve exposição.

---

## 19. Troubleshooting

| Sintoma | Causa comum | Ação |
|---------|-------------|------|
| `worker-health` offline | Túnel morto / secret antigo | Reiniciar Termux script; checar health público |
| Sync web “aguarde” | Sem Servidor ACME | Ligar Termux (ou usar Android) |
| “Túnel público NÃO responde” | trycloudflare lento / IPv6 | Script já retenta; aguardar ou `[q]` e subir de novo |
| `git pull` divergent | Histórico local ≠ origin | `git fetch && git reset --hard origin/main` (preserva `.env.local`) |
| Sync “falhou” cedo | Cloud sem deploy dos polls 15 min | `npm run deploy:cf` |
| `password authentication failed` | `DATABASE_URL` velha | Regenerar senha Supabase |
| Checkout / “assine” | Build antigo | Confirmar free-mode + app ≥ 1.16 |
| Push não chega | Falta Firebase no EAS | Secret `GOOGLE_SERVICES_JSON` |
| Error 1102 no Workers | Bundle TLS pesado no edge | Não reintroduzir scrape TLS no Worker |
| better-sqlite3 no Termux | Binário errado | Script recompila com `npm rebuild` |

---

## 20. Contribuindo

1. Branch a partir de `main`.  
2. Não commitar `.env*`, `.data/`, APK/AAB, dumps.  
3. Rodar `npm test` (e suites relevantes) em `app/`.  
4. PR pequeno; descrever impacto em sync/auth/mobile/Termux.  
5. Commits no estilo conventional (`feat`, `fix`, `docs`, `chore`, `test`).  
6. Deploy cloud só com secrets corretos.

### Checklist rápido antes do push

- [ ] Sem secrets no diff  
- [ ] Timeouts/docs alinhados se mudou sync  
- [ ] Testes da área tocada  
- [ ] Termux: scripts ainda sem valores secretos  

---

## 21. Glossário

| Termo | Significado |
|-------|-------------|
| **Servidor ACME** | Processo home (Termux/PC) com Playwright + túnel |
| **Robot** | Tipo de job (`r1`, `submit-tarefa`, …) |
| **Mirror** | Gravar resultado do scrape direto no Postgres |
| **Ingest** | Device envia snapshot HTTP para a cloud |
| **Quick tunnel** | URL `*.trycloudflare.com` temporária |
| **Free mode** | Produto sem cobrança (`free-mode.ts`) |
| **OpenNext** | Adapter Next.js → Cloudflare Workers |

---

## Licença

AGPL-3.0 © contribuidores do ACME HUB
