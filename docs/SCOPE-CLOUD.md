# ☁️ CEFET Academic Planner — Escopo Cloud + Assinatura + Mobile

> **Complementa:** [`docs/SCOPE.md`](./SCOPE.md) (regras acadêmicas).  
> **Tasks:** [`docs/TASKS.md`](./TASKS.md)

---

## 1. Direção do produto

SaaS para alunos do CEFET-MG: app web hospedado, dados no **Supabase** (Postgres + Auth + Storage), sync SIGAA via **worker Playwright** no servidor, **assinatura por período via PIX**, e app **mobile Expo Go** consumindo o mesmo backend.

**Dev local:** SQLite em `app/.data/` para iterar o Bloco 1; produção migra para Supabase (Bloco 6).

---

## 2. Stack e arquitetura alvo

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clientes                                 │
│  ┌──────────────────┐              ┌──────────────────────────┐ │
│  │  Web (Next.js)   │              │  Mobile (Expo Go / RN)   │ │
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
| **Mobile** | Expo (React Native) + Expo Go | Dev/testes; produção = build EAS depois |
| **Scraper** | Playwright em worker dedicado | Não roda no browser nem no celular |

---

## 3. Modelo de assinatura (PIX por período)

> **Preços:** a definir. Este escopo descreve o **fluxo** e as **regras**, não valores.

### 3.1 Planos

Assinatura **por período de acesso** (v1):

| Plano | Duração | Observação |
|---|---|---|
| **Trial** | **7 dias** | **Uma vez por CPF** (login SIGAA); ver `SCOPE.md` §2.1 |
| **Semestre** | ~6 meses | Alinhado ao calendário acadêmico |
| **Ano** | 12 meses | Desconto vs. 2 semestres (TBD) |

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
| **E-mail** | Cadastro obrigatório; contato + notificações (§4.4) |
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

### 4.4 Notificações por e-mail

- Envio condicionado ao toggle em **Configurações** (avatar → menu) — `SCOPE.md` §2.5.
- Eventos mínimos v1: nova/atualizada tarefa relevante; nota de prova lançada.
- Implementação de fila/e-mail = tasks (Bloco 6b/7); regra de negócio aqui no escopo.

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

> **Rascunho / sugestão** — **não decidido**. Objetivo provável: não abrir Playwright por CPF para dados **idênticos entre alunos**. Implementação e lista final de tabelas = **task #6d (B68-orq)**, antes do mobile; schema Postgres (**B39**) deve considerar isso na migração.

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

- **Worker dedicado** (container/VPS ou serviço serverless com Playwright).
- Supabase Edge Functions **não** são ideais para Playwright completo — avaliar Railway, Fly.io, ou VPS barato.

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

> **Status: rascunho / sugestão — não decidido.** Fica documentado para consulta; **o stakeholder escolhe na task #6d (B68-orq)** quando chegar antes do mobile. Referência dev atual: `run-sync.ts`, `execute-live-sync-pipeline.ts`, `calendario-sync-plan.ts`, `useAutoSync`, `LoginForm`.

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

#### Modos R1 — sugestão do que entraria em cada sync

| Etapa | `full` (1º login) | `incremental` (login rápido / botão / auto) |
|---|---|---|
| Portal discente | sempre | sempre |
| Histórico PDF | sempre | só se `historico` vazio/incompleto **ou** `sync.historico_at + 7d` |
| Turma virtual | sempre (se portal OK) | sempre (se portal OK) |

TTL dev local hoje: histórico **24h** (`SYNC_HISTORICO_REFRESH_MS`); calendário **7d** (`SYNC_CALENDARIO_REFRESH_MS`); auto **30 min** (B65 — **substituir** por 3h na produção).

#### Botão “Sincronizar” — sugestão de escopo

**Sincroniza (R1 incremental):** matrículas do semestre, RG, tarefas portal, notas, faltas, grupo, tarefas turma.

**Não sincroniza no clique:** histórico (salvo TTL), calendário acadêmico (cache global), turmas ofertadas (salvo `/simulador`), PPC (seed estático).

**Não é “sync tudo”:** evita 3–5 min toda vez; histórico e calendário têm cadência própria.

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

#### Pontos para decidir na #6d (B68-orq)

- [ ] Conta SIGAA “sistema” para R2/R3 vs. piggyback no primeiro aluno do dia
- [ ] TTL histórico incremental: **7 dias** *(sugestão)* vs. 24h (dev)
- [ ] Botão sync: **incremental only** *(sugestão)* vs. opção “Sync completo” no perfil
- [ ] R3 turmas: só simulador vs. também auto na pré-matrícula
- [ ] Onde persistir `sync_meta` global (`calendario_sync_meta`, `turmas_sync_meta`)

### 6.4 Limites e segurança

- **Auto-sync:** mínimo **3h** entre syncs concluídos por usuário (substitui intervalo fixo de 30 min do dev local — ver Apêndice B65 em `TASKS.md`).
- **Manual:** cooldown **5 min** entre pedidos; cada pedido vai ao **fim** da fila normal.
- Timeout por job.
- Logs **sem PII** (sem senha, sem matrícula em texto claro nos logs).
- Credenciais SIGAA nunca retornam ao client.

---

## 7. App mobile (Expo Go)

### 7.1 Objetivo da fase mobile

- **Testes no celular** durante o desenvolvimento usando **Expo Go** (familiaridade do time).
- Mesmas telas principais: dashboard, disciplinas, calendário, mapa.
- Consome **Supabase** diretamente (ou via API Next.js — definir na implementação).

### 7.2 Escopo mobile v1 (MVP testável)

| Inclui | Não inclui (v1) |
|---|---|
| Login conta app + checagem assinatura | Sync SIGAA no device |
| Dashboard, disciplinas, calendário | Download automático de PDFs na nuvem pessoal |
| Leitura/edição de notas e tarefas manuais | Simulador de matrícula completo |
| Expo Go para dev | Publicação App Store / Play Store |

### 7.3 Estrutura do monorepo (proposta)

```
/
├── app/          # Next.js web (existente)
├── mobile/       # Expo (novo)
└── packages/     # (opcional) tipos e utils compartilhados
```

### 7.4 Produção mobile (futuro)

- Build com **EAS Build** quando sair do Expo Go.
- Mesmo backend Supabase.

---

## 8. Painel Dev (operador)

> Regras de produto: `SCOPE.md` §10. Implementação **somente server-side** com credencial de operador.

### 8.1 Autenticação do operador

| Mecanismo | Detalhe |
|---|---|
| **Rota** | `/dev` (Next.js route group `(dev)` ou middleware) |
| **Segredo** | `PLANNER_DEV_SECRET` (header ou cookie httpOnly após login operador) |
| **Allowlist** | Opcional: `PLANNER_DEV_CPFS` — CPF do operador autorizado |
| **Produção** | Painel **desligado** se env ausente; 404 para não vazar existência |

Alunos **nunca** veem link para `/dev`.

**Fase testes:** painel dev **lista senha SIGAA em claro** por conta (operador only) — para abrir o SIGAA manualmente e validar sync/scraper. Testadores são voluntários informados.

**Pós-B71:** painel dev **não** exibe senha; apenas status `credential_saved` + ações de re-sync.

### 8.2 APIs operador (service role)

Prefixo sugerido: `/api/dev/*` — middleware valida segredo antes de handler.

| Endpoint | Função |
|---|---|
| `GET /api/dev/accounts` | Lista contas + assinatura + último sync + **senha SIGAA (fase testes)** |
| `GET /api/dev/gift-keys` | Lista chaves gift |
| `POST /api/dev/gift-keys` | Cria N chaves com pacote |
| `PATCH /api/dev/gift-keys/[code]` | Revogar chave disponível |
| `PATCH /api/dev/accounts/[cpf]/subscription` | Simular expirar/estender |
| `POST /api/dev/accounts/[cpf]/sync` | Enfileirar sync (worker) |
| `PATCH /api/dev/config/promotions` | Toggle promoções globais |
| `GET /api/dev/audit-log` | Ações sensíveis recentes |

Todas as rotas usam **`SUPABASE_SERVICE_ROLE_KEY`** (bypass RLS) com validação explícita de operador.

### 8.3 Simulação de mapa (aluno)

Persistência por `user_id`:

- Tabela `mapa_simulacao` ou JSON em `user_preferences`: `disciplina_id[]` simuladas como concluídas.
- API: `GET/PATCH /api/mapa/simulacao` — merge no `GET /api/mapa?simulacao=1` ou campo separado no response.
- **Dev local (SQLite):** mesma lógica em `configuracoes` ou tabela dedicada antes da cloud.

---

## 9. Deploy e ambientes

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
- `PLANNER_DEV_SECRET` (painel operador — §8)
- `PLANNER_DEV_CPFS` (opcional)

---

## 10. Segurança e LGPD

1. **Minimização:** coletar só o necessário (e-mail, nome, credenciais SIGAA cifradas).
2. **Criptografia:** SIGAA em repouso (AES/Vault); HTTPS em trânsito.
3. **RLS:** isolamento estrito por `user_id`.
4. **Logs:** sem senhas, CPF ou e-mail em texto claro.
5. **Retenção:** Dados acadêmicos são apagados automaticamente 7 dias após a expiração do plano ou trial sem pagamento. O registro de CPF permanece para controle anti-abuso. Exclusão antecipada sob demanda (direito do titular).
6. **Termos de uso + política de privacidade** antes do go-live com pagamento.
7. **Painel dev:** audit log obrigatório; **fase testes** pode exibir senha ao operador; **B71** remove exibição antes do go-live.

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
| 8 | E | **8** | Mobile Expo Go |
| 9 | F | **3** | Inteligência acadêmica |
| 10 | F | **4** | Polimento UX |

### Modo global de testes (6a)

Durante beta/testes com URL pública:

- Um projeto Supabase free; dados migrados do SQLite ou seed pós-scraper.
- **RLS desligado ou permissivo** — aceitável para beta fechado.
- Sync SIGAA já validado no **Bloco 2a** (local) antes de subir cloud.
- **6c (RLS) é obrigatório** antes do Bloco **7** (PIX) e divulgação ampla.

---

## 12. Decisões em aberto (TBD)

- [ ] Preços dos planos (semestre / ano)
- [ ] Gateway PIX definitivo

- [ ] **Orquestração sync + catálogo global** — sugestão em **§5.4 · §6.5 · #6d (B68-orq)**; **decidir na hora**, antes do mobile #8
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
- [x] **Notificações por e-mail** com opt-out em Configurações (avatar)
- [x] **Materiais SIGAA:** download automático **fora de escopo** (cancelado jun/2026); histórico escolar PDF (**B30**) permanece
- [x] **Chaves de plano (gift):** 8 chars, uso único, emissão só operador (`SCOPE.md` §2.1.1)
- [x] **Simulação de mapa:** overlay local; não altera histórico sync (`SCOPE.md` §6.1.1)
- [x] **Painel dev:** `/dev` + `PLANNER_DEV_SECRET`; **fase testes** exibe senhas ao operador; **B71** endurece antes da produção
- [x] **Hosting Web:** Cloudflare Pages (Frontend) + Supabase (Backend/Auth) + Ping script/cron (Anti-inatividade do DB free)

---

## 12. Referências

- Regras acadêmicas (notas, faltas, PPC): `docs/SCOPE.md`
- Tasks e checklist: `docs/TASKS.md`
