# ACME HUB

Planejador acadêmico **100% gratuito** para alunos do **CEFET-MG**.  
Sincroniza dados do [SIGAA](https://sig.cefetmg.br/) e concentra a vida acadêmica em uma interface moderna (web + Android).

| | |
|---|---|
| **Site (produção)** | https://acme-hub.khfm.workers.dev |
| **Pacote Android** | `br.cefethub.acme` |
| **Versão app** | 1.15 (`versionCode` 15) |
| **Repositório** | [`acme-hub`](https://github.com/KairoHenrique/acme-hub) *(renomear no GitHub se ainda aparecer o nome antigo)* |
| **Licença** | MIT |
| **Contato / LGPD** | acme.hubsuporte@gmail.com |
| **Privacidade** | https://acme-hub.khfm.workers.dev/privacidade |
| **Termos** | https://acme-hub.khfm.workers.dev/termos |

---

## Índice

1. [O que o produto faz](#1-o-que-o-produto-faz)
2. [Arquitetura](#2-arquitetura)
3. [Decisões de desenho](#3-decisões-de-desenho)
4. [Estrutura do repositório](#4-estrutura-do-repositório)
5. [Pré-requisitos](#5-pré-requisitos)
6. [Clonar e configurar](#6-clonar-e-configurar)
7. [Rodar em desenvolvimento](#7-rodar-em-desenvolvimento)
8. [Servidor ACME (sync SIGAA)](#8-servidor-acme-sync-sigaa)
9. [Deploy (Cloudflare + banco)](#9-deploy-cloudflare--banco)
10. [App Android (Expo / EAS / Play Store)](#10-app-android-expo--eas--play-store)
11. [Testes](#11-testes)
12. [Variáveis de ambiente](#12-variáveis-de-ambiente)
13. [Fluxos principais](#13-fluxos-principais)
14. [Segurança e dados pessoais](#14-segurança-e-dados-pessoais)
15. [Troubleshooting](#15-troubleshooting)
16. [Contribuindo](#16-contribuindo)

---

## 1. O que o produto faz

### Para o aluno

- **Cadastro / login** com CPF + senha do SIGAA (e-mail e telefone no cadastro).
- **Sync** de portal, notas, faltas, tarefas, calendário, histórico e turmas.
- **Dashboard**, **disciplinas**, **calendário** (grade + agenda), **mapa do curso**, **integralização**, **simulador**.
- **Notificações** in-app e push (Android) para prazos e atualizações.
- **Produto gratuito** — sem assinatura, sem PIX, sem paywall.

### Cursos

O mapa e a integralização usam o **PPC** do curso escolhido no cadastro (ex.: Engenharia da Computação). Seeds de PPC ficam em scripts/`ppc_data*.txt` e migrations/seeds via `npm run db:seed-ppc`.

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
┌─────────────────────────────┐         fallback (PC offline)
│  Servidor ACME              │         ┌─────────────────────┐
│  PC ou Termux               │         │  App Android        │
│  Playwright + Chromium      │         │  HTTP nativo SIGAA  │
│  cloudflared → túnel        │         │  → ingest na cloud  │
│  mirror → Postgres          │         └─────────────────────┘
└─────────────────────────────┘
```

### Papéis

| Peça | Função |
|------|--------|
| **Cloud (Workers)** | API, auth, UI web, fila de sync, crons, push |
| **Supabase** | Contas, dados acadêmicos multi-tenant, RLS |
| **Servidor ACME** | Login real no SIGAA com navegador, scrape, mirror no Postgres |
| **Mobile** | Mesma API; sync no aparelho quando o PC/Termux está offline |

A Cloudflare **não** abre o Chromium do SIGAA de forma confiável (limites TLS/edge). Por isso o scrape “pesado” fica no Servidor ACME.

---

## 3. Decisões de desenho

### App 100% gratuito

- Flag central: `app/src/lib/billing/free-mode.ts` → `APP_IS_FREE = true`, `BILLING_ENFORCED = false`.
- Gate de assinatura, checkout PIX e e-mails de “fim de trial / renove o plano” ficam **dormantes**.
- Código de billing permanece no repo como legado (possível reativar no futuro), mas a UX e a API tratam todo mundo como acesso liberado.
- Cadastro mostra “100% gratuito”, não “trial 7 dias”.

### Sync híbrido (PC preferido → aparelho)

1. Cloud tenta o worker em `SIGAA_WORKER_URL` (túnel do Servidor ACME).
2. Se offline → **Android** faz HTTP no SIGAA e envia snapshot (`ingest`).
3. Web sem Servidor ACME: mensagem de aguardar / usar o app (tentativa de TLS completo no edge causou **Error 1102** no Workers e foi abandonada).

### Credenciais SIGAA

- Senha do portal é cifrada (AES-GCM) com `CREDENTIALS_ENCRYPTION_KEY` (mesma chave no cloud e no worker).
- Nunca logar PII em texto claro.

### Por que Playwright no PC/Termux

- SIGAA é um portal legado com sessão, JS e captchas ocasionais.
- Playwright + Chrome/Chromium no ambiente do aluno (ou tablet) é o caminho estável.
- Termux espelha o PC: Chromium do `pkg` + `cloudflared` + mesmos crons locais.

### Postgres na cloud, SQLite só local/dev

- Produção: `PLANNER_DATABASE=postgres` + `PLANNER_CLOUD=true`.
- SQLite de planner por usuário é para dev/local; Workers não usam `planner.db` como fonte de verdade.

---

## 4. Estrutura do repositório

```
acme-hub/
├── README.md                 ← esta documentação
├── .gitignore
├── app/                      ← Next.js + API + scraper + workers CF
│   ├── src/app/              ← rotas App Router + /api/*
│   ├── src/components/       ← UI web
│   ├── src/lib/              ← domínio (auth, billing free, sync, scraper…)
│   ├── scripts/              ← migrate, deploy, Termux, Servidor ACME
│   ├── worker/               ← processo home Playwright
│   ├── workers/              ← cron Workers (ping, e-mails, etc.)
│   ├── tests/                ← testes Node (tsx --test)
│   └── .env.example
├── mobile/                   ← Expo Android
│   ├── src/                  ← telas, auth, sync, push
│   ├── app.json              ← versão / package / ícones
│   ├── eas.json              ← perfis EAS (production = AAB)
│   └── .env.example
├── packages/api-contracts/   ← tipos compartilhados web ↔ mobile
└── supabase/migrations/      ← SQL versionado (rodar via npm run db:migrate)
```

---

## 5. Pré-requisitos

- **Node.js** 20+ (recomendado)
- **npm**
- Conta **Supabase** (projeto + `DATABASE_URL` do *Session pooler*)
- Conta **Cloudflare** (Workers) para deploy
- **Playwright / Chrome** no PC (ou Chromium no Termux) para sync real
- **Expo account** + **EAS** para build Play Store
- **Java** não é obrigatório no dia a dia (EAS builda na nuvem)

---

## 6. Clonar e configurar

> Após renomear o repo no GitHub para **`acme-hub`**, use a URL abaixo.  
> Se ainda estiver com o nome antigo, troque só o final do path.

```bash
git clone https://github.com/KairoHenrique/acme-hub.git
cd acme-hub
```

### Web / API

```bash
cd app
npm install
npx playwright install chromium
cp .env.example .env.local
# Preencha .env.local (nunca commitar)
```

### Mobile

```bash
cd mobile
npm install
cp .env.example .env
# EXPO_PUBLIC_API_BASE_URL=https://acme-hub.khfm.workers.dev
cp google-services.json.example google-services.json
# Preencha google-services.json real (Firebase) — arquivo gitignored
```

---

## 7. Rodar em desenvolvimento

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

Use um device/emulador Android (Expo Go ou dev client). A API aponta para `EXPO_PUBLIC_API_BASE_URL`.

---

## 8. Servidor ACME (sync SIGAA)

É o processo que a cloud chama para scrapar o SIGAA.

### No Windows (PC)

```bash
cd app
# .env.local com DATABASE_URL, CREDENTIALS_ENCRYPTION_KEY,
# WORKER_SHARED_SECRET, CLOUDFLARE_API_TOKEN, etc.
npm run worker:home          # :8787
# em outro terminal (ou use start-temp-worker / tray):
npm run worker:tunnel        # cloudflared → URL trycloudflare.com
# Coloque a URL em secret SIGAA_WORKER_URL do Worker acme-hub
```

Scripts úteis:

| Script | Uso |
|--------|-----|
| `npm run worker:home` | Sobe o worker Playwright |
| `npm run worker:temp` | Worker + túnel + secret (fluxo automatizado) |
| `scripts/termux-servidor-acme.sh` | Paridade no tablet Termux |
| `scripts/termux-export-env-from-pc.mjs` | Gera `.env.termux.local` a partir do PC |
| `scripts/termux-fix-env.sh` | Ajusta Chromium/flags no Termux |

### No Termux (Android)

```bash
pkg install -y git nodejs python make clang curl cloudflared chromium
cd ~
git clone https://github.com/KairoHenrique/acme-hub.git
cd acme-hub/app
# Copie .env (export do PC) → .env.local  OU use termux-fix-env.sh
bash scripts/termux-fix-env.sh
bash scripts/termux-servidor-acme.sh
```

O script sobe worker, túnel, atualiza `SIGAA_WORKER_URL` e loops de cron locais (`notification-reminders`, `account-emails`, `sync-orchestrator`).

**Só um** Servidor ACME ativo (PC **ou** Termux), senão o túnel/secret conflita.

Health público:

`GET https://acme-hub.khfm.workers.dev/api/sync/worker-health`

---

## 9. Deploy (Cloudflare + banco)

```bash
cd app
# secrets/vars já configurados no wrangler / dashboard
npm run deploy:cf          # OpenNext → Worker acme-hub
npm run deploy:crons       # workers de cron (se usar)
npm run db:migrate         # aplica supabase/migrations via DATABASE_URL
```

Build sem publicar:

```bash
npm run build:cf
```

Produção tipicamente exige:

- `PLANNER_CLOUD=true`
- `PLANNER_DATABASE=postgres`
- `DATABASE_URL`, chaves Supabase, `CRON_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, `WORKER_SHARED_SECRET`
- `SIGAA_WORKER_URL` apontando para o túnel vivo do Servidor ACME

---

## 10. App Android (Expo / EAS / Play Store)

### Identidade

| Campo | Valor |
|-------|--------|
| Nome | ACME HUB |
| Package | `br.cefethub.acme` |
| version | `1.15` (em `mobile/app.json`) |
| versionCode | `15` |
| EAS project | ver `extra.eas.projectId` em `app.json` |

### Build de produção (AAB para Play Store)

```powershell
cd mobile
npx eas-cli@latest build --platform android --profile production --non-interactive
```

Perfis em `eas.json`:

- **production** → App Bundle (`.aab`)
- **preview** → APK interno
- **development** → APK debug / dev client

### Subir versão

1. Bump `version` + `versionCode` em `mobile/app.json`
2. Commit / push
3. Rodar o comando EAS acima
4. Enviar o AAB na Play Console

### Notas da versão (exemplo Play Console)

```xml
<pt-BR>
Novidades desta versão:
• App 100% gratuito — sem assinatura nem pagamento
• Login com CPF e sincronização com o SIGAA
• Dashboard, disciplinas, notas, faltas e tarefas
• Calendário acadêmico e grade de horários
• Mapa do curso, integralização e simulador
• Notificações de prazos e atualizações
</pt-BR>
```

---

## 11. Testes

Os testes da API/domínio ficam em `app/tests/` e rodam com **Node test runner** via `tsx`.

### Suite rápida (padrão)

```bash
cd app
npm test
```

Usa `SIGAA_SCRAPER_MOCK=true` (não bate no SIGAA real).

### Suites nomeadas (exemplos)

```bash
npm run test:o1              # health
npm run test:o2              # guard SQLite na cloud
npm run test:worker          # worker B54
npm run test:sync-queue      # fila B55
npm run test:f31             # pós-auth / free mode
npm run test:b59             # (via tsx --test tests/b59-access-gate.test.ts)
npm run test:t2              # isolamento RLS (precisa .env.local)
```

Lista completa: veja a seção `"scripts"` em `app/package.json` (`test:*`, `smoke:*`).

### Como pensar os testes

| Tipo | O que cobre |
|------|-------------|
| Unit / domínio | Parsers SIGAA, mapa, faltas, fingerprints de notificação |
| Auth / free mode | Redirect pós-login sempre `/`, gate nunca bloqueia |
| Schema / RLS | Migrations e isolamento por `user_id` |
| Sync | Fila, cooldowns, worker health |
| Smoke | Scripts `smoke-*.mjs` contra ambiente configurado |

**Não** commitar dumps HTML/PDF de scrape (`.data/`, `scrape-debug/`) — estão no `.gitignore`.

---

## 12. Variáveis de ambiente

Modelo: `app/.env.example` → copie para `app/.env.local`.

### Obrigatórias em produção (resumo)

| Variável | Para quê |
|----------|----------|
| `CREDENTIALS_ENCRYPTION_KEY` | Cifrar senha SIGAA (≥ 16 chars) |
| `WORKER_SHARED_SECRET` | Bearer cloud ↔ worker |
| `DATABASE_URL` | Postgres (Session pooler Supabase) |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente / auth |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou ANON) | Cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | Só servidor |
| `CRON_SECRET` | Protege `/api/cron/*` |
| `SIGAA_WORKER_URL` | Túnel do Servidor ACME |
| `PLANNER_CLOUD=true` | Modo Workers |
| `PLANNER_DATABASE=postgres` | Backend de dados |

### Úteis no worker / Termux

| Variável | Para quê |
|----------|----------|
| `SYNC_MIRROR_POSTGRES=true` | Grava sync no Postgres |
| `SIGAA_BROWSER_EXECUTABLE_PATH` | Chromium Termux |
| `SIGAA_HEADLESS=true` | Sem UI |
| `ACCOUNT_EMAIL_VIA_HOME_WORKER` | SMTP Gmail via PC/Termux |
| `GMAIL_SMTP_*` | Envio de e-mail |
| `CLOUDFLARE_API_TOKEN` | `wrangler secret put` do túnel |

### Mobile

| Variável | Para quê |
|----------|----------|
| `EXPO_PUBLIC_API_BASE_URL` | URL da API (sem `/` final) |

**Nunca** commitar `.env`, `.env.local`, `google-services.json` real ou scripts com secrets.

---

## 13. Fluxos principais

### Cadastro

1. E-mail, telefone, CPF, curso, senha SIGAA + aceite legal.
2. Cria usuário Auth + `app_profiles`.
3. Acesso liberado imediatamente (modo free).
4. Sync inicial enfileirado (worker ou aparelho).

### Login

1. CPF + senha.
2. JWT / sessão cloud.
3. Redirect para home (`/`) — sem `/planos`.

### Sync

1. Cliente pede sync → API autentica → job na fila.
2. Dispatch para Servidor ACME se online.
3. Senão → fallback device (Android) ou aviso na web.
4. Snapshot ingerido → Postgres → UI atualiza.

### Notificações / crons

- Workers Cloudflare **e/ou** loops do `termux-servidor-acme.sh` / tray do PC chamam:
  - `POST /api/cron/notification-reminders`
  - `POST /api/cron/account-emails`
  - `POST /api/cron/sync-orchestrator`
- Header/Bearer: `CRON_SECRET`.

---

## 14. Segurança e dados pessoais

- Minimize PII em logs.
- Secrets só em `.env.local` / Cloudflare Secrets / EAS secrets.
- Repo público: **não** versionar históricos escolares, dumps SIGAA, tokens, CPF reais em fixtures.
- Se um secret vazar no Git: **rotacione** (Supabase, Cloudflare, Gmail app password, chaves AES) e reescreva histórico se necessário.
- LGPD: páginas de privacidade/termos no site; consentimento no cadastro.

---

## 15. Troubleshooting

| Sintoma | Causa comum | Ação |
|---------|-------------|------|
| `worker-health` offline | Túnel morto / secret antigo | Subir Servidor ACME; atualizar `SIGAA_WORKER_URL` |
| Sync web “aguarde” | Sem PC/Termux | Ligar Servidor ACME ou usar Android |
| `password authentication failed` no Postgres | `DATABASE_URL` velha | Regenerar senha no Supabase + atualizar env |
| Checkout / “assine” | Build antigo ou flag | Confirmar `BILLING_ENFORCED=false` e app ≥ 1.15 |
| Push não chega | Falta `google-services.json` | Copiar do Firebase (gitignored) |
| Termux scripts não existem | Clone desatualizado | `git pull` / `git reset --hard origin/main` |
| Error 1102 no Workers | Bundle TLS pesado | Não reintroduzir scrape TLS no edge |

---

## 16. Contribuindo

1. Crie branch a partir de `main`.
2. Não commitar `.env*`, `.data/`, APK/AAB, dumps.
3. Rode `npm test` (e suites relevantes) em `app/`.
4. PR pequeno e focado; descreva impacto em sync/auth/mobile.
5. Deploy cloud só com secrets corretos (`deploy:cf`).

### Comentários no código

Pontos de decisão já documentados perto do código:

- `app/src/lib/billing/free-mode.ts` — produto gratuito
- `app/src/lib/sync-queue/run-queued-sync-client.ts` — flip híbrido
- `app/src/lib/sync/probe-sigaa-worker-health.ts` — health do worker
- `app/scripts/termux-servidor-acme.sh` — paridade PC/Termux + crons

---

## Licença

MIT © contribuidores do ACME HUB
