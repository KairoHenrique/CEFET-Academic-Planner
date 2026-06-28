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
| **Frontend Web** | Next.js (existente) | Deploy em Vercel ou similar |
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

Assinatura **por período de acesso**, não mensalidade recorrente automática (v1):

| Plano (exemplo) | Duração sugerida | Observação |
|---|---|---|
| **Semestre** | ~6 meses | Alinhado ao calendário acadêmico |
| **Ano** | 12 meses | Desconto vs. 2 semestres (TBD) |
| **Trial** | 7–14 dias | Opcional; decidir se haverá |

Períodos e nomes finais serão definidos antes da implementação.

### 3.2 Fluxo de cadastro + pagamento

```
1. Usuário acessa site → "Criar conta"
2. Preenche: nome, e-mail, senha do app (≠ senha SIGAA)
3. Escolhe plano (semestre / ano)
4. Sistema gera cobrança PIX (QR Code + copia-e-cola)
5. Usuário paga no app do banco
6. Gateway confirma pagamento (webhook)
7. Conta muda para status "ativa" → libera login e sync SIGAA
8. Redireciona para onboarding (vincular credenciais SIGAA)
```

**Estados da conta:**

| Status | Acesso ao app | Sync SIGAA |
|---|---|---|
| `pending_payment` | Bloqueado (só tela de pagamento) | ❌ |
| `active` | Liberado | ✅ |
| `expired` | Bloqueado (renovar assinatura) | ❌ |
| `cancelled` | Bloqueado | ❌ |

### 3.3 Renovação

- Ao expirar, usuário vê tela de **renovação** com novo PIX.
- Dados acadêmicos **permanecem** no Supabase (não apagar ao expirar).
- Grace period (ex.: 3 dias) — **a definir**.

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
- Cupons / afiliados
- Plano família / institucional
- Nota fiscal automática (pode ser manual no início)

---

## 4. Autenticação (duas camadas)

### 4.1 Conta do app (Supabase Auth)

- Identidade do **produto** (quem paga e acessa o planner).
- JWT gerenciado pelo Supabase.
- Recuperação de senha via e-mail.

### 4.2 Credenciais SIGAA (sync acadêmico)

- Login/senha do **portal institucional** — separados da conta do app.
- Armazenadas **cifradas** (AES-256 ou Supabase Vault / coluna cifrada).
- Usadas **somente** pelo worker Playwright no servidor.
- Opção "lembrar credenciais" = salvar cifradas no perfil do usuário.
- **Nunca** logar senha SIGAA em texto claro.

### 4.3 Fluxo pós-ativação

1. Login no app (Supabase Auth).
2. Se assinatura `active` e SIGAA não vinculado → tela de vincular SIGAA.
3. Primeiro sync dispara job assíncrono.
4. Dashboard carrega dados do Postgres.

---

## 5. Dados e multi-tenancy (Supabase)

### 5.1 Migração SQLite → PostgreSQL

- Schema atual (`aluno`, `disciplinas`, `notas`, `faltas`, `tarefas`, etc.) vira tabelas Postgres.
- **Toda tabela de dados do aluno** recebe `user_id UUID REFERENCES auth.users`.
- **Row Level Security (RLS):** políticas `user_id = auth.uid()`.

### 5.2 Dados de referência (PPC)

- Disciplinas e requisitos do PPC = tabelas **globais** (read-only para todos).
- Seed inicial e **único curso até o mobile:** **Eng. Computação** Divinópolis (indexado).
- **Expansão multi-PPC** (Eng. Mecatrônica, Design de Moda): **somente após** Bloco 8 (mobile) com Eng. Computação 100% funcional — ver `SCOPE.md` §6.2.
- Metas de integralização por categoria de CH variam por PPC/curso.

### 5.3 PDFs — nuvem pessoal do aluno (não Supabase Storage)

> **Decisão fechada:** não usamos Supabase Storage para materiais do SIGAA.

| Aspecto | Regra |
|---|---|
| **Onde ficam os PDFs** | Conta de nuvem **do aluno** (Google Drive, Dropbox, OneDrive) |
| **Autenticação** | OAuth por provedor; refresh tokens **cifrados** no Postgres/SQLite |
| **Pasta raiz** | `CEFET Academic Planner/` (nome do app) |
| **Organização** | `{semestre}/{disciplina}/*.pdf` |
| **Quem faz upload** | Worker/scraper após download do SIGAA (**B29**) |
| **Servidor do app** | Só buffer temporário durante upload; **não** persiste PDFs |
| **LGPD** | Arquivos na conta do titular; permissão mínima na pasta do app |

Fluxo:

```
1. Aluno conecta nuvem (F35 / B57)
2. Sync baixa lista de materiais no SIGAA (B28)
3. Para cada matéria com toggle ativo, upload em CEFET Academic Planner/{semestre}/{matéria}/
4. UI mostra contagem + link para abrir na nuvem
```

---

## 6. Scraper SIGAA (servidor)

### 6.1 Onde roda

- **Worker dedicado** (container/VPS ou serviço serverless com Playwright).
- Supabase Edge Functions **não** são ideais para Playwright completo — avaliar Railway, Fly.io, ou VPS barato.

### 6.2 Fluxo

1. Usuário clica "Sincronizar" (ou sync automático pós-login).
2. API enfileira job `{ user_id, encrypted_sigaa_credentials }`.
3. Worker executa Playwright, grava no Postgres.
4. Front recebe status via polling ou Realtime.

### 6.3 Limites e segurança

- Rate limit por usuário (ex.: 1 sync / 5 min).
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

## 8. Deploy e ambientes

| Ambiente | Web | Supabase | Worker |
|---|---|---|---|
| **Dev** | `localhost:3000` | Projeto Supabase dev (free) | Local ou staging |
| **Staging** | Preview Vercel | Branch DB ou projeto separado | Staging worker |
| **Prod** | Domínio final (TBD) | Projeto Supabase prod (free → paid se necessário) | Worker prod |

**Variáveis de ambiente (exemplos):**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (só server)
- `PIX_GATEWAY_*` (TBD)
- `SIGAA_WORKER_URL` / fila

---

## 9. Segurança e LGPD

1. **Minimização:** coletar só o necessário (e-mail, nome, credenciais SIGAA cifradas).
2. **Criptografia:** SIGAA em repouso (AES/Vault); HTTPS em trânsito.
3. **RLS:** isolamento estrito por `user_id`.
4. **Logs:** sem senhas, CPF ou e-mail em texto claro.
5. **Retenção:** dados mantidos após expiração; exclusão sob demanda (direito do titular).
6. **Termos de uso + política de privacidade** antes do go-live com pagamento.

---

## 10. Fases de implementação (ordem oficial v3)

> Detalhamento completo em `docs/TASKS.md` — [Ordem oficial v3](./TASKS.md#ordem-oficial-de-execução-v3).

| # | Fase | Bloco | Entrega |
|---|------|-------|---------|
| 1 | A | **1** (3D→3E) | Terminar telas no SQLite local |
| 2 | B | **2a** | Scraper dev + OAuth nuvem + PDFs (**sync real — prioridade semestre**) |
| 3 | B | **2b** | Worker servidor + fila sync |
| 4 | C | **6a** | Supabase + deploy **global** (testes, RLS flexível) — **após sync validado** |
| 5 | C | **6b** | Auth app + credenciais SIGAA cifradas |
| 6 | C | **6c** | RLS multi-tenant (**antes do PIX**) |
| 7 | D | **7** | Assinatura PIX |
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

## 11. Decisões em aberto (TBD)

- [ ] Preços dos planos (semestre / ano)
- [ ] Gateway PIX definitivo
- [ ] Haverá trial gratuito?
- [ ] Domínio e hosting web (Vercel?)
- [ ] Onde hospedar worker Playwright
- [ ] Mobile: Supabase client direto vs. API Next.js
- [ ] Método de auth app: e-mail/senha vs. magic link vs. OAuth Google
- [ ] **Provedor de nuvem v1 para PDFs:** Google Drive vs. Dropbox vs. OneDrive (ou todos)

### Decisões fechadas

- [x] **PDFs não vão para Supabase Storage** — nuvem pessoal do aluno (`CEFET Academic Planner/{semestre}/{matéria}/`)
- [x] **Sync SIGAA (Bloco 2) antes do Supabase (Bloco 6)** — validar com semestre ativo

---

## 12. Referências

- Regras acadêmicas (notas, faltas, PPC): `docs/SCOPE.md`
- Tasks e checklist: `docs/TASKS.md`
