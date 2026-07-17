# ☁️ CEFET Academic Planner — Escopo Cloud + Assinatura + Mobile

> **Complementa:** [`docs/SCOPE.md`](./SCOPE.md) (regras acadêmicas).  
> **Tasks:** [`docs/TASKS.md`](./TASKS.md)

---

## 1. Direção do produto

SaaS para alunos do CEFET-MG: app web hospedado, dados no **Supabase** (Postgres + Auth + Storage), sync SIGAA via **worker Playwright** no servidor, **assinatura por período via PIX**, app **mobile Android (Expo Go)** e **site mobile (F28)** consumindo o mesmo backend — **sem** publicação em lojas oficiais.

**Dev local:** SQLite em `app/.data/` para iterar o Bloco 1; produção migra para Supabase (Bloco 6).

---

## 2. Stack e arquitetura alvo

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clientes                                 │
│  ┌──────────────────┐              ┌──────────────────────────┐ │
│  │  Web (Next.js)   │              │  Mobile Android (Expo Go) │ │
│  │  app.cefetplanner│              │  testes no celular       │ │
│  └────────┬─────────┘              └────────────┬─────────────┘ │
└───────────┼─────────────────────────────────────┼───────────────┘
            │              HTTPS / JWT               │
            ▼                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (plano Free)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Auth        │  │ PostgreSQL   │  │ (sem PDFs — nuvem pessoal)│ │
│  │ (conta app) │  │ (multi-tenant│  │                         │ │
│  └─────────────┘  │  RLS por user)│  └─────────────────────────┘ │
│                   └──────────────┘                                 │
│  ┌─────────────┐  ┌──────────────┐                               │
│  │ Edge Funcs  │  │ Realtime     │  (opcional, fase posterior)   │
│  │ (webhooks)  │  │              │                               │
│  └─────────────┘  └──────────────┘                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Worker de Sync SIGAA (Playwright)                   │
│  Fila / job assíncrono · credenciais SIGAA cifradas · logs       │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    https://sig.cefetmg.br
```

| Camada | Tecnologia | Observação |
|---|---|---|
| **Frontend Web** | Next.js (existente) | Deploy no Cloudflare Pages |
| **Backend / API** | Next.js API Routes + Supabase client | Dev local ainda usa SQLite; prod usa Postgres |
| **Banco** | Supabase PostgreSQL | RLS: cada aluno vê só seus dados |
| **Auth do app** | Supabase Auth | E-mail/senha ou magic link (definir) |
| **Auth SIGAA** | Credenciais do portal | Armazenadas cifradas, usadas só no worker |
| **Pagamentos** | PIX (gateway TBD) | Mercado Pago, Asaas, AbacatePay, etc. |
| **Mobile** | Expo (React Native) + Expo Go | **Android only** · dev/testes · **sem** Play/App Store · alternativa = site mobile (**F28**) |
| **Scraper** | Playwright em worker dedicado | Não roda no browser nem no celular |

---

## 3. Modelo de assinatura (PIX por período)

> **Preços:** a definir. Este escopo descreve o **fluxo** e as **regras**, não valores.

### 3.1 Planos

Assinatura **por período de acesso** (v1):

| Plano | Duração | Observação |
|---|---|---|
| **Trial** | **7 dias** | **Uma vez por CPF** (login SIGAA); ver `SCOPE.md` §2.1 |
| **Mensal** | **30 dias** | **R$ 30** (v1) |
| **Trimestre** | **3 meses** | **R$ 50** — desconto vs. 3 mensais |
| **Semestre** | **6 meses** | **R$ 85** — desconto vs. 2 trimestres |
| **Ano** | **12 meses** | **R$ 150** — desconto vs. 2 semestres |
| **5 anos** | **60 meses** | **R$ 700** — desconto vs. 5 anuais |

### 3.2 Fluxo de cadastro + trial + pagamento

```
1. Usuário acessa site → "Criar conta"
2. Preenche: e-mail + telefone + CPF + senha SIGAA + curso (Eng. Comp. / Mecatrônica / Moda)
3. Sistema valida CPF, curso e se o CPF já consumiu trial
4. Se CPF elegível → trial 7 dias (`trial_active`); conta já vinculada ao `curso_id` / PPC
5. Login posterior: **somente CPF + senha SIGAA** (e-mail/telefone não autenticam)
6. Após trial ou CPF já usou trial → PIX → `active`
7. Sync valida senha no SIGAA; mapa/integralização usam PPC do curso escolhido
```

**Estados da conta:**

| Status | Acesso ao app | Sync SIGAA |
|---|---|---|
| `trial_active` | Liberado (até fim dos 7 dias) | ✅ |
| `trial_expired` | Bloqueado → pagar | ❌ |
| `pending_payment` | Bloqueado (aguardando PIX) | ❌ |
| `active` | Liberado | ✅ |
| `expired` | Bloqueado (renovar) | ❌ |
| `cancelled` | Bloqueado | ❌ |

**Anti-abuso trial:** tabela/registro **`trial_por_cpf`** (ou equivalente): CPF → `trial_started_at` / `trial_used_at`. Mesmo CPF com e-mail diferente **não** ganha segundo trial.

### 3.3 Renovação

- Ao expirar, usuário vê tela de **renovação** com novo PIX.
- **Grace period e Exclusão de Dados:** O aluno tem um período de tolerância de **7 dias**. Se não renovar/pagar nesse prazo, todos os **dados acadêmicos são apagados** do banco (para economizar espaço no Supabase Free).
- O **CPF do usuário nunca é apagado** da tabela `trial_por_cpf`, garantindo que ele não possa usufruir do trial novamente caso crie outra conta.

### 3.4 Gateway PIX (a escolher)

Critérios para escolha (fase de implementação):

- Webhook confiável de confirmação
- Taxa baixa / plano gratuito para MVP
- Conformidade LGPD (dados mínimos)
- Suporte a PIX estático ou dinâmico

**Candidatos (não decidido):** Mercado Pago, Asaas, AbacatePay, Stripe (PIX BR).

**Decisão v1 (B48):** **Mercado Pago** — ver [`docs/plan/b48-pix-gateway.md`](./plan/b48-pix-gateway.md). Adapter `app/src/lib/billing/gateway/` · `GET /api/billing/gateway/status`. Asaas reservado (stub).

### 3.5 O que **não** entra na v1 de billing

- Cartão de crédito
- Boleto
- Cupons públicos / códigos de afiliado em massa (diferente de **chaves gift** operador — §3.6)
- Plano família / institucional
- Nota fiscal automática (pode ser manual no início)

### 3.6 Chaves de plano (gift card)

Complementa PIX e trial (`SCOPE.md` §2.1.1). Implementação cloud:

**Tabela `plan_gift_keys` (exemplo):**

| Campo | Tipo | Descrição |
|---|---|---|
| `code` | `char(8)` UNIQUE | Código normalizado uppercase |
| `plan_type` | enum | `semester` \| `year` \| `custom_days` |
| `duration_days` | int | Dias de acesso após resgate |
| `status` | enum | `available` \| `redeemed` \| `revoked` \| `expired` |
| `expires_at` | timestamptz nullable | Validade da **chave** (não do plano) |
| `redeemed_by_cpf` | text nullable | CPF que resgatou |
| `redeemed_at` | timestamptz nullable | |
| `created_by` | text | Operador (dev panel) |
| `internal_label` | text nullable | Ex.: “Beta testers jun/26” |

**Regras:**

- Geração: `crypto.randomBytes` → charset `A-Z0-9` → 8 chars; colisão → regerar.
- Resgate atômico: transação `UPDATE … WHERE status = 'available' AND code = ?` — falha se já usada.
- Após resgate: upsert em `subscriptions` com `source = 'gift_key'` e `expires_at = now() + duration_days`.
- **Não** reinicia trial por CPF; chave **adiciona** ou **substitui** período pago conforme regra de negócio (v1: estende a partir de `now()` se expirado, ou soma se ainda `active` — definir na implementação **B69**).

**API aluno:**

- `POST /api/billing/redeem-key` — body `{ code }` + sessão CPF autenticado.
- Rate limit por IP/CPF (anti brute-force de 8 chars).

**Promoções:** flag global `promotions_enabled` (config operador) controla banners em `/planos`; independente das chaves gift.

---

## 4. Autenticação (conta única: CPF + senha SIGAA)

### 4.1 Conta do produto

| Aspecto | Regra |
|---|---|
| **Login** | **CPF + senha SIGAA** — e-mail e telefone **não** autenticam |
| **E-mail** | Cadastro obrigatório; contato + envios §4.4 (promo + ciclo conta) |
| **Telefone** | Cadastro obrigatório; contato (suporte / canais futuros) |
| **Curso** | Cadastro obrigatório: Eng. Computação, Mecatrônica ou Moda → `curso_id` + PPC |
| **Senha do app** | **Não existe** separada — mesma senha do SIGAA |
| **Validação de senha** | **SIGAA** no sync (Playwright) |
| **Validação no app** | CPF + gate trial/assinatura + `curso_id` válido |
| **Armazenamento** | CPF, e-mail, telefone, `curso_id`, senha SIGAA **cifrada** *(meta produção — **B71**)* |
| **Identidade Auth** | **CPF** como identificador principal (não e-mail) — ver B44 |

Recuperação de acesso: por **e-mail** ou **telefone** cadastrados (não usa e-mail como login).

### 4.2 Credenciais SIGAA (sync)

- CPF + senha gravados no cadastro.
- **Fase beta (atual):** SQLite dev pode guardar senha recuperável para painel `/dev` (testadores consentientes); **B25** cifra opcional “lembrar senha” mas operador pode ver plaintext no painel.
- **Produção (B71):** senha **sempre** cifrada; worker Playwright descriptografa só em memória no worker; **nunca** log em texto claro.
- Opção “lembrar senha” no device = perfil no servidor, não plaintext no browser *(pós-B71)*.

### 4.3 Fluxo pós-login

1. Login (CPF + senha) + middleware verifica `trial_active` ou `active`.
2. Se bloqueado → tela PIX / renovação.
3. Sync dispara job assíncrono; **SIGAA** confirma ou rejeita senha.
4. Dashboard carrega dados do Postgres.

### 4.4 E-mail (promoções e ciclo de conta)

- **Sem e-mail acadêmico** — tarefas, notas e prazos = **somente in-app** (sino **F38**); ver `SCOPE.md` §2.5.
- **Promoções:** **sempre enviadas** ao e-mail de contato cadastrado — **sem opt-out** do aluno (**B62**).
- **Ciclo de conta (sempre envia):** cadastro/boas-vindas · fim do trial · plano perto de acabar · plano encerrado.
- **Contato (e-mail/tel):** editar no modal perfil (**F37** ✅ · `PATCH /api/perfil`); na cloud **B61** persiste em `app_profiles` — **sem** opt-out de promoções.
- Implementação de fila/provedor = **B62**; regra de negócio em `SCOPE.md` §2.5.

---

## 5. Dados e multi-tenancy (Supabase)

### 5.1 Migração SQLite → PostgreSQL

- Schema atual (`aluno`, `disciplinas`, `notas`, `faltas`, `tarefas`, etc.) vira tabelas Postgres.
- **Tabelas de dados do aluno** recebem `user_id UUID REFERENCES auth.users` — **exceto catálogo global** (§5.4).
- **Row Level Security (RLS):** políticas `user_id = auth.uid()` nas tabelas por aluno.

### 5.2 Dados de referência (PPC)

- Disciplinas e requisitos por **`curso_id`** = tabelas **globais** (read-only).
- Seed v1: **Eng. Computação** Divinópolis (indexado).
- **Mecatrônica** e **Moda:** indexação Bloco 9; cadastro já grava `curso_id` desde o Bloco 6b.
- Metas de integralização por categoria variam por PPC/curso.

### 5.3 Materiais SIGAA (fora de escopo)

> **Cancelado jun/2026:** não há upload de materiais da turma virtual para nuvem pessoal (**B57 · B29 · F35**). O app **não** persiste PDFs de materiais de aula. **Histórico escolar (B30)** continua sendo parseado do PDF oficial do SIGAA.

### 5.4 Catálogo global vs dados do aluno

> **Rascunho / referência** — catálogo global confirmado; policy operacional em **[§6.6](#66-política-de-sync--decisão-de-produto-jul2026)** · implementação **B68d–f**.

#### Tabelas globais (sem `user_id` · read-only para alunos)

| Tabela | Chave natural | Origem | TTL / refresh | Por quê global |
|---|---|---|---|---|
| `disciplinas` | `curso_id` + `codigo` | Seed PPC (**B41**) | Estático (reindex raro) | PPC é igual para todos do mesmo curso |
| `requisitos` | `curso_id` + par pré/co | Seed PPC | Estático | Grafo do mapa não muda por aluno |
| `ppc_metas_ch` *(ou colunas no seed)* | `curso_id` + tipo CH | Seed PPC | Estático | Totais de integralização por curso |
| `calendario_academico` | `semestre` (+ campus futuro) | Robô **R2** (B66) | **7 dias** ou virada de semestre | Calendário CEFET é o mesmo para todos |
| `turmas_ofertadas` | `curso_id` + `semestre` + turma | Robô **R3** (B67) | **24–48 h** | Oferta é institucional, não pessoal |
| `app_config` | chave (`promotions_enabled`, etc.) | Operador / seed | Manual | Flags de produto |

**Leitura no app:** APIs fazem `JOIN` por `curso_id` da conta + semestre atual — **sem** credencial SIGAA só para ler PPC/calendário.

#### Tabelas por aluno (`user_id` + RLS · Bloco 6c)

| Tabela | Robô | Notas |
|---|---|---|
| `aluno` | R1 portal | Snapshot institucional |
| `semestre_atual` | R1 portal | Matérias cursando agora |
| `notas`, `faltas`, `tarefas`, `grupo_membros` | R1 turma | Regra #1: `manual = true` protegido |
| `historico` | R1 histórico | PDF parseado; refresh raro |
| `integralizacao` | R1 portal + cálculo local | Linhas `manual` protegidas |
| `eventos_calendario` *(manual)* | Usuário | Não vem do SIGAA |
| `configuracoes` | Usuário + sync meta | `sync.last_at`, apelidos, toggles |
| credenciais SIGAA cifradas | Conta app | Worker **B56** |

#### Dev local (SQLite hoje)

- Um `.db` **por CPF** — PPC e calendário **duplicados** em cada arquivo (aceitável em dev).
- Na migração **6a:** extrair `disciplinas`/`requisitos`/`calendario_academico` para namespace global; manter só dados pessoais por `user_id`.

#### Anti-padrão (sugestão — evitar em produção)

- Raspar calendário acadêmico **a cada sync** de cada aluno (hoje o client dispara B66 pós-sync — **candidato** a job global na **#6d**).
- Guardar PPC dentro do SQLite por CPF sem seed centralizado no Postgres.

---

## 6. Scraper SIGAA (servidor)

### 6.1 Onde roda

- **Worker dedicado** — path oficial: **PC home server** com Playwright/Chrome + **Cloudflare Tunnel** (`cloudflared`) expondo `localhost:8787`. Implementação **B54/B72e:** `app/worker/` · `npm run worker:home` · ver `app/worker/README.md`. Fly/Docker ficam como fallback se o PC não estiver online.
- Supabase Edge Functions **não** são ideais para Playwright completo — o browser **nunca** roda na Cloudflare.

### 6.2 Fluxo

1. Usuário clica "Sincronizar" (ou sync automático pós-login).
2. API enfileira job `{ user_id, encrypted_sigaa_credentials, mode, priority }`.
3. Worker executa **um** Playwright por vez, grava no Postgres.
4. Front recebe status via polling ou Realtime (posição na fila, ETA opcional).

### 6.3 Fila de sync — decisão fechada (MVP worker)

> **Objetivo:** caber em **worker free/barato**, não sobrecarregar o SIGAA, fila justa entre alunos.

```
┌─────────────────────────────────────────────────────────┐
│  Worker: 1 browser Playwright por vez (1 job ativo)     │
└───────────────────────────▲─────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         │  Fila PRIORITÁRIA                    │
         │  · 1º login / conta sem snapshot     │
         └──────────────────┬──────────────────┘
                            │  (FIFO dentro de cada fila)
         ┌──────────────────┴──────────────────┐
         │  Fila NORMAL                         │
         │  · sync automático (background)      │
         │  · sync manual (botão / login rápido)│
         └─────────────────────────────────────┘
```

| Regra | Comportamento |
|--------|----------------|
| **Concorrência global** | **1 sync por vez** no worker (1 IP, 1 sessão browser) |
| **Auto-sync** | Elegível só se `last_sync_at + 3h ≤ now` **por usuário** |
| **Sync manual** | Entra no **fim** da fila normal; cooldown **5 min** entre pedidos manuais (anti-spam) |
| **Após sync OK** | Próximo **auto-sync** só após **+3h** (timer reinicia) |
| **1º login / sem dados** | Fila **prioritária** (não vai pro fim); sync **full bloqueante** na UX (B31) |
| **Login rápido** | Entrada imediata no app; job **incremental** enfileirado na fila normal |
| **Job Playwright** | Abre browser → login SIGAA → pipeline B24–B31 → fecha (sem pool permanente por CPF) |
| **Timeout** | Por job (ex.: 8 min); falha parcial não apaga snapshot anterior |

**Não é DDoS:** tráfego serializado + limites por usuário ≈ poucos alunos acessando o portal; risco residual = ToS/bloqueio por IP do SIGAA (mitigar com fila lenta e incremental).

**Escala futura (pago):** subir para 2–5 slots paralelos no **mesmo** desenho de fila — só aumenta `max_concurrent`, sem mudar regras de cooldown.

### 6.5 Orquestração de robôs — timing e gatilhos (pré-mobile)

> **Decisões de produto (jul/2026):** **[§6.6](#66-política-de-sync--decisão-de-produto-jul2026)** · abaixo = referência histórica / mapa de robôs.

#### Mapa de robôs

| ID | Nome | Endpoint / pipeline | Persiste em |
|---|---|---|---|
| **R0** | Auth SIGAA | login Playwright (todas as sessões) | cookies efêmeros |
| **R1a** | Portal discente | `execute-live-sync-pipeline` → portal | `aluno`, `semestre_atual`, tarefas portal, integralização auxiliar |
| **R1b** | Histórico PDF | mesma sessão, etapa opcional | `historico` |
| **R1c** | Turma virtual | mesma sessão, pós-portal | `notas`, `faltas`, `tarefas`, `grupo_membros` |
| **R2** | Calendário acadêmico | `POST /api/sync/calendario` (**B66**) | `calendario_academico` **global** |
| **R3** | Turmas ofertadas | futuro **B67** | `turmas_ofertadas` **global** |

R1a+b+c = **job único por aluno** (1 login SIGAA por sync) — não fragmentar em browsers separados no MVP.

#### Matriz gatilho × robô (sugestão de referência)

| Gatilho | R1 full (portal+hist+turma) | R1 incremental | R2 calendário | R3 turmas |
|---|---|---|---|---|
| **1º login** (sem dados) | ✅ bloqueante · fila **prioritária** | — | ✅ se cache global vazio | — |
| **Login rápido** | — | ✅ background · fila normal | só se TTL global expirou | — |
| **Botão Sincronizar** | — | ✅ fim fila normal · cooldown 5 min | **não** (ler cache global) | — |
| **Auto-sync** (3h prod) | — | ✅ se elegível | **não** | — |
| **Abrir `/simulador`** | — | — | — | ✅ se TTL > 24h |
| **Cron operador** | — | — | ✅ 1×/semana ou virada semestre | ✅ 1×/dia na pré-matrícula |

#### Modos R1 — referência rápida

> **Decisão de produto (jul/2026):** escopos **`full` · `lite` · `deep`** — ver **[§6.6](#66-política-de-sync--decisão-de-produto-jul2026)**.

| Etapa | `full` (1º login) | `lite` (botão / auto diurno) | `deep` (batch noturno) |
|---|---|---|---|
| Portal discente | sempre | sempre (matérias do semestre) | sempre |
| Histórico PDF | sempre | só se TTL | se TTL |
| Turma virtual | completa | **só notas + tarefas** | completa (notas, faltas, grupo, tarefas) |

TTL **padrão** (override no painel `/dev` — §6.6 · **B70/F41**): histórico **7d** · calendário **7d** · turmas **24h** · auto **3h** · notas/tarefas **6h** · grupo **48h**. Dev local hoje ainda lê constantes em `sync-preferences.ts` até **B68f**.

#### Login — sugestão de escopo

```
1º acesso CPF
  → verify SIGAA (opcional fast-path off)
  → R1 FULL bloqueante (UX com progresso)
  → se calendario_global vazio → enfileira R2 (prioridade baixa, mesmo worker)

Login rápido (canFastLogin)
  → verify SIGAA (senha)
  → sessão app imediata
  → R1 incremental background (fila normal)
  → UI mostra lastSyncAt + “atualizando…” discreto

Login com senha errada
  → dados locais/cloud preservados (nunca apagar snapshot)
```

#### Job global R2 (calendário) — sugestão de desenho

1. Worker usa **conta reserva** ou **primeiro job do dia** que precisar do calendário (decisão B68).
2. Grava em `calendario_academico` **sem** `user_id`.
3. Todas as contas leem via API read-only; `shouldRunCalendarioSync` vira checagem **no servidor** contra `calendario_sync_meta.updated_at`.
4. Remover `postCalendarioSync({ force: true })` após **cada** sync pessoal (`useSync`) — hoje isso multiplica raspagens.

#### Pontos ainda abertos na #6d (B68-orq)

- [ ] Conta SIGAA “sistema” para R2/R3 vs. piggyback no primeiro aluno do dia
- [ ] R3 turmas: só simulador vs. também auto na pré-matrícula
- [ ] Onde persistir `sync_meta` global (`calendario_sync_meta`, `turmas_sync_meta`)

> **Fechado (jul/2026):** matriz robô × gatilho · TTLs por camada · botão **lite** · batch noturno · paralelismo por CPF · policy editável no painel dev — **[§6.6](#66-política-de-sync--decisão-de-produto-jul2026)** · tasks **B68a–c** `[x]`.

### 6.6 Política de sync — decisão de produto (jul/2026)

> **Status:** decisão documentada pelo stakeholder · implementação **B68d–f** + leitura da policy em **B54–B56** · cadência editável no painel **`/dev`** (**B70** · **F41**) sem alterar código.

#### Princípios

1. **Dados globais** (`calendario_academico`, `turmas_ofertadas`, PPC) — **1 job por escopo** (campus/semestre ou `curso_id`); todos leem cache; **não** repetir por CPF no sync pessoal.
2. **Dados do aluno** (R1) — por CPF; **1 sessão SIGAA por job** (R1a+b+c na mesma sessão — não fragmentar em browsers paralelos **do mesmo CPF**).
3. **Paralelismo worker** — até **`max_concurrent` CPFs diferentes** ao mesmo tempo (ex.: 2–3 slots); **nunca** 2 browsers com o **mesmo** CPF.
4. **Botão “Sincronizar” (navbar)** — **`R1-lite` apenas** (portal + turma **notas + tarefas**); **não** é sync geral.
5. **Sync completo** — **`R1-full`** no 1º login (bloqueante) · **`R1-deep`** no batch noturno ou opção “Sync completo” no perfil (futuro **B68f**).

#### Escopos R1

| Modo | Quando | Portal | Histórico | Turma virtual |
|---|---|---|---|---|
| **`full`** | 1º login / conta sem snapshot | ✅ | ✅ | ✅ completa |
| **`lite`** | Botão Sync · auto-sync diurno · login rápido (background) | ✅ | ❌ (salvo TTL) | ✅ **notas + tarefas** |
| **`deep`** | Batch noturno · “Sync completo” perfil | ✅ | se TTL | ✅ completa (notas, faltas, grupo, tarefas) |

**Fora do clique do aluno:** R2 calendário · R3 turmas ofertadas · PPC (seed) — cache global com TTL próprio.

#### Cadência por camada (padrões · override no `/dev`)

| Camada | Robô | Padrão | Modo no painel |
|---|---|---|---|
| Auto-sync R1-lite | R1 | **3 h** / usuário | intervalo (horas) |
| Notas + tarefas | R1c parcial | **6 h** | intervalo |
| Faltas | R1c | **12 h** | intervalo |
| Grupo | R1c | **48 h** | intervalo |
| Histórico PDF | R1b | **7 dias** | intervalo |
| Calendário | R2 global | **7 dias** | intervalo **ou** data/hora fixa |
| Turmas ofertadas | R3 por `curso_id` | **24 h** | intervalo **ou** data/hora fixa |
| Cooldown manual (botão) | O3 | **5 min** | intervalo (dev/prod) |

**Data fixa:** operador define “próximo refresh em `2026-08-01 03:00`”; após executar, volta ao intervalo. Útil para virada de semestre e pré-matrícula.

#### Batch noturno (sugestão **B68e**)

Janela padrão **03:00–06:00** (configurável no `/dev`):

1. R2 calendário (1× global)
2. R3 turmas (1× por `curso_id` ativo)
3. Fila **R1-deep** por usuário com credencial válida (serial ou até `max_concurrent` CPFs em paralelo)

De dia o aluno abre o app com dados já frescos; o botão dispara só **lite** se a camada quente expirou.

#### Matriz gatilho × robô (fechada)

| Gatilho | R1 full | R1 lite | R1 deep | R2 | R3 |
|---|---|---|---|---|---|
| 1º login | ✅ prioritário | — | — | se cache vazio | — |
| Login rápido | — | ✅ background | — | ❌ ler cache | ❌ |
| Botão Sync | — | ✅ | — | ❌ | ❌ |
| Auto-sync (TTL) | — | ✅ se elegível | — | ❌ | ❌ |
| Batch noturno | — | — | ✅ | ✅ antes | ✅ antes |
| Abrir `/simulador` | — | — | — | ❌ | ✅ se TTL |
| Painel `/dev` manual | ✅ | ✅ | ✅ | ✅ | ✅ (sem cooldown) |

#### Policy operacional — storage (`app_config` global)

Chaves (prefixo `sync.policy.*`) — lidas pelo worker/orquestrador; **fallback** = constantes atuais em código:

| Chave | Tipo | Exemplo |
|---|---|---|
| `sync.policy.button_scope` | `lite` \| `full` | `lite` |
| `sync.policy.auto_interval_hours` | number | `3` |
| `sync.policy.layer.notas_tarefas_hours` | number | `6` |
| `sync.policy.layer.faltas_hours` | number | `12` |
| `sync.policy.layer.grupo_hours` | number | `48` |
| `sync.policy.layer.historico_days` | number | `7` |
| `sync.policy.global.calendario` | `{ mode, days?, at? }` | intervalo ou data fixa |
| `sync.policy.global.turmas.{curso_id}` | idem | por curso |
| `sync.policy.nightly.enabled` | boolean | `true` |
| `sync.policy.nightly.window` | `"HH:MM-HH:MM"` | `"03:00-06:00"` |
| `sync.policy.worker.max_concurrent` | 1–5 | `2` |

**Dev local:** `.data/ops-sync-policy.json` ou tabela `app_config` fora do `.db` por CPF. **Produção:** Postgres global (sem `user_id`).

#### APIs painel dev (**B70**)

| Endpoint | Função |
|---|---|
| `GET /api/dev/sync-policy` | Lê policy efetiva (merge defaults + overrides) |
| `PATCH /api/dev/sync-policy` | Grava overrides; auditoria obrigatória |
| `POST /api/dev/sync-policy/reset` | Restaura padrões de §6.6 |

UI (**F41**): seção **Orquestração sync** — formulário da tabela acima + **Restaurar padrões** + preview “próximo run estimado”. Disparo manual (**robots/run**) **ignora TTL** (já previsto).

#### Anti-padrões (remover na implementação)

- `postCalendarioSync({ force: true })` após **cada** sync pessoal (`useSync`)
- Botão navbar com `mode: "full"`
- Raspar calendário/turmas **por CPF** quando cache global válido
- Paralelizar **mesmo CPF** em múltiplos browsers

### 6.4 Limites e segurança

- **Auto-sync:** mínimo **3h** entre syncs concluídos por usuário (substitui intervalo fixo de 30 min do dev local — ver Apêndice B65 em `TASKS.md`).
- **Manual:** cooldown **5 min** entre pedidos; cada pedido vai ao **fim** da fila normal.
- Timeout por job.
- Logs **sem PII** (sem senha, sem matrícula em texto claro nos logs).
- Credenciais SIGAA nunca retornam ao client.

---

## 7. App mobile (Android · Expo Go)

### 7.1 Objetivo da fase mobile

- **Testes no celular Android** durante o desenvolvimento usando **Expo Go**.
- **Pré-requisito:** site web Eng. Computação maduro (**#9 inteligência + #10 polimento**, incl. **F28 site mobile**) — mobile é cliente fino da API estável, não laboratório de UX.
- **Quem não instalar** (ou não puder instalar) usa o **site adaptado ao celular** (**F28** · Bloco 4) — zero custo de loja.
- Mesmas telas principais: dashboard, disciplinas, calendário, mapa.
- Consome **Supabase** diretamente (ou via API Next.js — definir na implementação).

### 7.2 Escopo mobile v1 (MVP testável)

| Inclui | Não inclui (v1) |
|---|---|
| Login conta app + checagem assinatura | Sync SIGAA no device |
| Dashboard, disciplinas, calendário | Download automático de PDFs na nuvem pessoal |
| Leitura/edição de notas e tarefas manuais | Simulador de matrícula completo |
| Expo Go para dev (**Android only**) | **iOS** · **Play Store** · **App Store** |
| *(Opcional pós-MVP)* APK sideload pelo site | Publicação em lojas oficiais |

### 7.3 Estrutura do monorepo (proposta)

```
/
├── app/          # Next.js web (existente)
├── mobile/       # Expo (novo · Android only)
└── packages/     # (opcional) tipos e utils compartilhados
```

### 7.4 Distribuição (sem lojas)

- **Padrão:** testar e usar via **Expo Go** (Android).
- **Opcional (M10):** gerar **APK sideload** — link de download no site; **sem** Play Store (zero taxa de loja).
- **Alternativa web:** **F28** — site responsivo/touch no browser; não exige instalar app.
- Mesmo backend Supabase em todos os canais.

---

## 8. Painel Dev (operador)

> Regras de produto: `SCOPE.md` §10. Implementação **somente server-side** com credencial de operador.

### 8.1 Autenticação do operador

| Mecanismo | Detalhe |
|---|---|
| **Rota** | `/dev` (Next.js route group `(dev)` ou middleware) |
| **Login** | Formulário **email + senha** — obrigatório **sempre** que não houver sessão operador |
| **Validação** | Server-side: comparar com **todos** os pares definidos no env (nunca no client, nunca em DB) |
| **1º operador (dev)** | `EMAIL_DEV` + `PASSWORD_DEV` em `.env.local` |
| **Operadores adicionais** | `PLANNER_DEV_2_EMAIL` + `PLANNER_DEV_2_PASSWORD`, … — **cadastro manual** no env (comentado até autorizar) |
| **Sessão** | Cookie **httpOnly** após `POST /api/dev/auth/login` OK |
| **Produção** | Pares só em **secrets** do deploy; painel **desligado** se nenhum par configurado; 404 para não vazar existência |
| **Fora de escopo** | UI ou API para cadastrar operadores — **só env manual** (LGPD / PoLP) |

> **Substitui** `PLANNER_DEV_SECRET` e `PLANNER_DEV_CPFS`.

Alunos **nunca** veem link para `/dev`.

**Fase testes:** painel dev **lista senha SIGAA em claro** por conta (operador only) — para abrir o SIGAA manualmente e validar sync/scraper. Testadores são voluntários informados.

**Pós-B71:** painel dev **não** exibe senha; apenas status `credential_saved` + ações de re-sync.

### 8.2 APIs operador (service role)

Prefixo: `/api/dev/*` — middleware exige **sessão operador** (cookie httpOnly) antes do handler.

| Endpoint | Função |
|---|---|
| `POST /api/dev/auth/login` | `{ email, password }` → sessão httpOnly se par válido no env |
| `POST /api/dev/auth/logout` | Invalida sessão operador |
| `GET /api/dev/accounts` | Lista contas + assinatura + último sync + **senha SIGAA (fase testes)**; query `?q=` nome/CPF |
| `POST /api/dev/robots/run` | Disparo manual **R1/R2/R3** — `{ scope: individual\|global, cpf?, robots: { r1, r2, r3 } }`; **sem cooldown** |
| `GET /api/dev/gift-keys` | Lista chaves gift |
| `POST /api/dev/gift-keys` | Cria N chaves com pacote |
| `PATCH /api/dev/gift-keys/[code]` | Revogar chave disponível |
| `PATCH /api/dev/accounts/[cpf]/subscription` | Simular expirar/estender |
| `POST /api/dev/accounts/[cpf]/sync` | Enfileirar sync (worker) — legado; preferir `robots/run` |
| `PATCH /api/dev/config/promotions` | Toggle promoções globais |
| `GET /api/dev/sync-policy` | Policy de orquestração sync (§6.6) — merge defaults + overrides |
| `PATCH /api/dev/sync-policy` | Grava cadências/TTL/janela noturna/`max_concurrent` |
| `POST /api/dev/sync-policy/reset` | Restaura padrões §6.6 |
| `GET /api/dev/audit-log` | Ações sensíveis recentes |

**Robôs (ops manual):**

| ID | Endpoint | Escopo |
|---|---|---|
| **R1** | `POST /api/sync` / pipeline live | Por CPF — portal, turma virtual, histórico |
| **R2** | `POST /api/sync/calendario` | Global — calendário acadêmico |
| **R3** | `POST /api/sync/turmas` | Global — turmas ofertadas |

Todas as rotas usam **`SUPABASE_SERVICE_ROLE_KEY`** (bypass RLS) com validação explícita de operador.

### 8.3 Simulação de mapa (aluno)

Persistência por `user_id`:

- Tabela `mapa_simulacao` ou JSON em `user_preferences`: `disciplina_id[]` simuladas como concluídas.
- API: `GET/PATCH /api/mapa/simulacao` — merge no `GET /api/mapa?simulacao=1` ou campo separado no response.
- **Dev local (SQLite):** mesma lógica em `configuracoes` ou tabela dedicada antes da cloud.

---

## 9. Deploy e ambientes

> **Plano operacional 6a:** [`docs/plan/6a-supabase-plan.md`](./plan/6a-supabase-plan.md) (PLAN Bloco 6a — projetos, env, free tier).

| Ambiente | Web | Supabase | Worker |
|---|---|---|---|
| **Dev** | `localhost:3000` | Projeto Supabase dev (free) | Local ou staging |
| **Staging** | Preview Cloudflare Pages | Branch DB ou projeto separado | Staging worker |
| **Prod** | Cloudflare Pages (Domínio TBD) | Supabase prod (free) + Cron job de ping | Worker prod |

**Variáveis de ambiente (exemplos):**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (só server)
- `PIX_GATEWAY_*` (TBD)
- `SIGAA_WORKER_URL` / fila
- `EMAIL_DEV` + `PASSWORD_DEV` (1º operador painel `/dev` — dev local)
- `PLANNER_DEV_2_EMAIL` + `PLANNER_DEV_2_PASSWORD` (operadores extras — **manual** no env)

---

## 10. Segurança e LGPD

1. **Minimização:** coletar só o necessário (e-mail, nome, credenciais SIGAA cifradas).
2. **Criptografia:** SIGAA em repouso (AES/Vault); HTTPS em trânsito.
3. **RLS:** isolamento estrito por `user_id`.
4. **Logs:** sem senhas, CPF ou e-mail em texto claro.
5. **Retenção:** Dados acadêmicos são apagados automaticamente 7 dias após a expiração do plano ou trial sem pagamento. O registro de CPF permanece para controle anti-abuso. Exclusão antecipada sob demanda (direito do titular).
6. **Termos de uso + política de privacidade** antes do go-live com pagamento.
7. **Painel dev:** login operador email+senha (pares **manuais no env**); audit log obrigatório; **fase testes** pode exibir senha SIGAA ao operador; **B71** remove exibição antes do go-live.

---

## 11. Fases de implementação (ordem oficial v3)

> Detalhamento completo em `docs/TASKS.md` — [Ordem oficial v3](./TASKS.md#ordem-oficial-de-execução-v3).

| # | Fase | Bloco | Entrega |
|---|------|-------|---------|
| 1 | A | **1** (3D→3E) | Terminar telas no SQLite local |
| 2 | B | **2a** | Scraper dev + OAuth nuvem + PDFs (**sync real — prioridade semestre**) |
| 3 | B | **2b** | Worker servidor + fila sync |
| 4 | C | **6a** | Supabase + deploy **global** (testes, RLS flexível) — **após sync validado** |
| 5 | C | **6b** | Auth app + credenciais SIGAA cifradas |
| 6 | C | **6c** | RLS multi-tenant (**antes do PIX**) |
| 7 | D | **7** | Assinatura PIX + gift keys + painel dev |
| 7b | D | **7** | **B71** endurecimento credenciais — **última task antes do go-live** |
| 9 | F | **3** | Inteligência acadêmica *(antes do mobile)* |
| 10 | F | **4** | Polimento UX + **site mobile (F28)** *(antes do mobile)* |
| 8 | E | **8** | Mobile Android (Expo Go · **sem lojas**) |

### Modo global de testes (6a)

Durante beta/testes com URL pública:

- Um projeto Supabase free; dados migrados do SQLite ou seed pós-scraper.
- **RLS desligado ou permissivo** — aceitável para beta fechado.
- Sync SIGAA já validado no **Bloco 2a** (local) antes de subir cloud.
- **6c (RLS) é obrigatório** antes do Bloco **7** (PIX) e divulgação ampla.

---

## 12. Decisões em aberto (TBD)

- [x] **Catálogo canônico de planos** (trial / trimestre / semestre / ano) — `app/src/lib/billing/` + `GET /api/billing/plans` (**B47**)
- [x] **Preços base v1:** R$ 30 (1m) · R$ 50 (3m) · R$ 85 (6m) · R$ 150 (12m) · R$ 700 (5a) — override via `BILLING_PRICE_*` env
- [x] Gateway PIX v1 — **Mercado Pago** + mock dev (`docs/plan/b48-pix-gateway.md`, **B48**)

- [ ] **Orquestração sync + catálogo global** — policy **§6.6** (jul/2026); implementar **B68d–f** + worker **B54–B56**; painel policy **B70/F41**
- [ ] Onde hospedar worker Playwright (Railway / Fly.io / VPS — ver §6.3 fila 1×)
- [x] Política de fila: 1 job global, auto 3h/usuário, manual fim da fila + cooldown 5 min, prioridade 1º login (§6.3)
- [ ] Mobile: Supabase client direto vs. API Next.js
- [ ] Provedor de e-mail transacional (Resend, SES, etc.)
- [ ] **Provedor de nuvem v1 para PDFs:** Google Drive vs. Dropbox vs. OneDrive (ou todos)

### Decisões fechadas

- [x] **Trial gratuito: 7 dias, uma vez por CPF** (login SIGAA)
- [x] **Login só com CPF + senha SIGAA** (e-mail/telefone não autenticam)
- [x] **Cadastro: e-mail + telefone + CPF + senha SIGAA + curso (Comp/Meca/Moda)**
- [x] **Validação de senha delegada ao SIGAA** (sync Playwright)
- [x] **E-mail:** promoções (**sempre**) + ciclo conta (cadastro, trial, plano) — **sem** opt-out · **sem** alertas acadêmicos por e-mail; in-app **F38**
- [x] **Materiais SIGAA:** download automático **fora de escopo** (cancelado jun/2026); histórico escolar PDF (**B30**) permanece
- [x] **Chaves de plano (gift):** 8 chars, uso único, emissão só operador (`SCOPE.md` §2.1.1)
- [x] **Simulação de mapa:** overlay local; não altera histórico sync (`SCOPE.md` §6.1.1)
- [x] **Painel dev:** `/dev` + login **email+senha** (pares env manuais); chavinhas robôs R1/R2/R3; **fase testes** exibe senhas SIGAA ao operador; **B71** endurece antes da produção
- [x] **Hosting Web:** Cloudflare Pages (Frontend) + Supabase (Backend/Auth) + Ping script/cron (Anti-inatividade do DB free)

---

## 12. Referências

- Regras acadêmicas (notas, faltas, PPC): `docs/SCOPE.md`
- Tasks e checklist: `docs/TASKS.md`
