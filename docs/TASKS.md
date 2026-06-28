# 📝 CEFET Academic Planner — Roadmap e Tasks

Este documento contém todas as tasks do projeto, organizadas por fase. Cada task tem um status e detalhes suficientes para qualquer desenvolvedor (humano ou IA) entender e implementar.

> ## Direção atual — Cloud + Assinatura PIX + Mobile
>
> App hospedado (Supabase), assinatura PIX, mobile Expo Go — ver [`docs/SCOPE-CLOUD.md`](./SCOPE-CLOUD.md).
>
> - **Regras acadêmicas:** [`docs/SCOPE.md`](./SCOPE.md)
> - **Ordem de execução:** [§ Ordem oficial](#ordem-oficial-de-execução-v2)
> - **Modo testes:** deploy global; RLS na fase 6c (antes do PIX)

**Navegação rápida:** [Ordem oficial v2](#ordem-oficial-de-execução-v2) · [Checklist BACK→FRONT](#checklist-mestre-ordem-de-execução) · [Detalhe por bloco](#detalhe-dos-blocos) · [Escopo cloud](./SCOPE-CLOUD.md)

**Legenda:**
- `[ ]` — Não iniciada
- `[/]` — Em andamento (marcar **antes** de codar)
- `[%]` — Commit local feito; **sem push** (aguardando revisão ou push)
- `[x]` — Finalizada (push feito ou aprovada 100%)

---

## Fase 0: Planejamento e Documentação

> **Resumo:** Definir escopo, stack e documentação base antes de codar. PPC de Eng. Computação indexado. Outros cursos **após mobile** (§6.2 SCOPE).

- [x] Levantamento de requisitos com o stakeholder
- [x] Análise do portal SIGAA (estrutura, URLs, dados disponíveis)
- [x] Definição da stack (Next.js + Supabase + Playwright worker + PIX + Expo) — ver `docs/SCOPE-CLOUD.md`
- [x] Criação do README.md completo
- [x] Criação do SCOPE.md com todas as regras de negócio
- [x] Criação do TASKS.md (este arquivo)
- [x] Obter e indexar o PPC de Engenharia da Computação (PDF → dados estruturados)
- [x] Documentar sequência multi-PPC (Mecatrônica/Moda **só pós-mobile**) e glossário de CH no `SCOPE.md` (§6.2, §6.4)

---

## Fase 1: Setup da Infraestrutura

> **Resumo:** Projeto Next.js, design Cruzeiro, schema SQLite completo e início da camada API. Bloco 1 começa aqui (B1–B8, F1–F5).

### 1.1 Inicialização do Projeto
- [x] Criar projeto Next.js com TypeScript (`npx create-next-app`)
- [x] Configurar estrutura de pastas (`src/app`, `src/components`, `src/lib/db`, `src/lib/engine`)
- [/] Pasta `src/lib/scraper` (prevista na estrutura; código do scraper = Bloco 2)
- [x] Instalar dependências: `better-sqlite3`, `playwright`, `crypto` (para criptografia de senha)

### 1.2 Design System (CSS)
- [x] Criar variáveis CSS com a paleta de cores do Cruzeiro (Azul `#0060B1`, Dourado `#D4A843`, etc.)
- [x] Configurar tipografia (Google Fonts: Inter e Outfit)
- [x] Criar componentes base: Button, Card, Badge, ProgressBar, Modal, Input, Table
  - Implementados como padrões CSS (`btn-gold`, `card`, `badge`, `progress-bar`, etc.) + componentes `Modal`, `Input`
- [x] Implementar dark mode como padrão (background `#0D1117`)
- [x] Adicionar micro-animações (hover, transitions, loading states)

### 1.3 Banco de Dados (SQLite)
- [x] Criar schema completo do banco de dados:
  - Tabela `aluno` (matricula, nome, curso, email, semestre_entrada, rg, status)
  - Tabela `disciplinas` (codigo, nome, tipo, carga_horaria, periodo, ementa)
  - Tabela `requisitos` (disciplina_id, requisito_id, tipo: 'pre' | 'co')
  - Tabela `historico` (disciplina_id, semestre, status, nota_final)
  - Tabela `semestre_atual` (disciplina_id, local, codigo_horario, horario_traduzido)
  - Tabela `notas` (disciplina_id, avaliacao_nome, nota_maxima, nota_obtida, manual: bool)
  - Tabela `faltas` (disciplina_id, data, status: 'presente' | 'falta' | 'nao_registrada')
  - Tabela `tarefas` (disciplina_id, titulo, descricao, data_inicio, data_fim, tipo: 'individual' | 'grupo', possui_nota: bool, concluida: bool, manual: bool)
  - Tabela `grupo_membros` (disciplina_id, nome, matricula, email, curso)
  - Tabela `integralizacao` (tipo_ch, total_necessario, concluido, pendente, manual: bool)
  - Tabela `calendario_academico` (evento, data_inicio, data_fim, semestre)
  - Tabela `configuracoes` (chave, valor — credenciais cifradas, toggles de download, etc.)
- [x] Criar funções CRUD para todas as tabelas
- [x] Criar migration/seed inicial
- [x] `DB_PATH` via variável de ambiente (`lib/db/index.ts`) — dev local; prod migra para Supabase (Bloco 6)

### 1.4 API e Integração UI ↔ SQLite

> **Progresso:** Etapas 1–2 ✅ · Etapa 3A ✅ (+ extensões F8g–F8i, B12d) · Etapa 3B ✅ · **próximo: 3C Integralização** (B16 → F11 → F11b).

Roadmap detalhado: ver **[Ordem oficial](#ordem-oficial-de-execução-v2)** e **[Checklist mestre](#checklist-mestre-ordem-de-execução)**.

---

## Ordem oficial de execução (v2)

> **Princípio:** terminar produto em SQLite → subir **global** para testes → dados reais (SIGAA) → cobrar (PIX) → mobile → inteligência → polimento.  
> **Modo testes global:** URL pública + Supabase free; **RLS/multi-tenant só na fase 6c**, antes do PIX.

```
FASE A   Bloco 1 (3C→3E)     SQLite local — integralização, mapa, grade (calendário ✅)
    ↓
FASE B   Bloco 6a            Supabase + deploy global (seed compartilhado, sem RLS rígido)
         Bloco 6b            Auth app + credenciais SIGAA cifradas
    ↓
FASE C   Bloco 2a            Scraper dev (B24–B31) — validar Playwright
         Bloco 2b            Worker servidor (B54–B56)
         Bloco 6c            RLS multi-tenant — obrigatório antes de cobrar
    ↓
FASE D   Bloco 7             Assinatura PIX
    ↓
FASE E   Bloco 8             Mobile Expo Go
    ↓
FASE F   Bloco 3             Inteligência acadêmica
         Bloco 4             Polimento UX (F25–F27)
```

| # | Fase | Bloco | O que fazer | Por quê nesta ordem |
|---|------|-------|-------------|---------------------|
| **0** | — | **0** | Planejamento | ✅ Concluído |
| **1** | A | **1** (3C→3E) | Integralização, mapa, grade semanal (calendário ✅) | UI completa; iteração rápida sem infra |
| **2** | B | **6a** | Supabase + PG + deploy URL pública | Testes globais; fim do localhost-only |
| **3** | B | **6b** | Auth + onboarding SIGAA | Contas do app; beta fechado |
| **4** | C | **2a** | Scraper B24–B31 (dev) | Validar antes do worker |
| **5** | C | **2b** | Worker B54–B56 | Sync em produção |
| **6** | C | **6c** | RLS por usuário | Segurança antes de abrir pagamento |
| **7** | D | **7** | PIX + gate de acesso | Monetização com produto estável |
| **8** | E | **8** | Expo Go | Mobile quando API cloud estiver ok |
| **9** | F | **3** | Grafo, matrícula, alertas | Precisa dados reais do scraper |
| **10** | F | **4** | Skeletons, transições, favicon | Acabamento final |
| **11** | — | **9** | Multi-PPC (Mecatrônica, Moda) | **Só após #8 mobile** com Eng. Computação completa |

### Modo global de testes (6a)

- Deploy Vercel com URL compartilhável.
- Supabase free; seed-demo ou dados de demonstração.
- RLS **permissivo ou desligado** — ok para beta fechado.
- Sync SIGAA ainda mock/seed até **2a** estar pronto.
- **6c obrigatório** antes do **Bloco 7** (PIX) e divulgação ampla.

---

## Roadmap por Blocos (referência)

Estratégia: **fatias verticais** — backend primeiro, depois frontend.

**Legenda:** `B` = Backend · `F` = Frontend · `M` = Mobile · `O` = Ops

### Resumo — blocos (numeração de referência)

| Bloco | Exec. # | Em uma linha |
|-------|---------|--------------|
| **0** | #0 | Planejamento ✅ |
| **1** | #1 | API + SQLite (falta 3C–3E) |
| **6** | #2–3, #6 | Cloud Supabase — 6a deploy → 6b auth → 6c RLS |
| **2** | #4–5 | Scraper — 2a dev → 2b worker |
| **7** | #7 | Assinatura PIX |
| **8** | #8 | Mobile Expo Go |
| **3** | #9 | Inteligência acadêmica |
| **4** | #10 | Polimento UX |
| **—** | #11 | Multi-PPC (Mecatrônica, Moda) 🔒 pós-mobile |

**O que permanece no client (localStorage) durante o Bloco 1:**
- Layout modular de módulos (`useModuleLayout`)
- Extras na grade semanal (monitoria, estágio)
- Simulação de notas (modo "Simular" na disciplina)
- Prioridade de matérias e tarefas (`useStoredPriorities`)
- Ordenação de tarefas (`useTaskSortMode`)
- Nota de recuperação por disciplina (`lib/recovery/storage.ts`)
- `/simulador` (Montar Grade) — continua mock até Bloco 2.4

---

## Checklist mestre (ordem de execução)

> Siga a **[Ordem oficial](#ordem-oficial-de-execução-v2)** (#0→#10).  
> **Regra:** dentro de cada fatia → **`BACK` (B) primeiro**, depois **`FRONT` (F)**. Detalhes nas [tabelas por bloco](#detalhe-dos-blocos).

Legenda: `[x]` finalizada · `[%]` commit local (sem push) · `[/]` andamento · `[ ]` pendente · `·` = task extra

---

### #1 — Bloco 1 · API + UI ↔ SQLite `🟡 41/49`

> Fatias verticais: **back → front** por etapa.

#### Etapa 1 — Fundação ✅
- [x] **BACK:**  B1 → B2 → B3 → B4 → B5

#### Etapa 2 — Sync + Dashboard ✅
- [x] **BACK:**  B6 → B7 → B7b → B8
- [x] **FRONT:** F1 → F2 → F3 → F4 → F5 · F5b · F5c · F5d

#### Etapa 3A — Disciplinas ✅
- [x] **BACK:**  B9 → B10 → B11 → B12 · B12b · B12c · B12d
- [x] **FRONT:** F6 → F7 → F8 · F6b · F8b · F8c · F8d · F8e · F8f · F8g · F8h · F8i

#### Etapa 3B — Calendário ✅
- [x] **BACK:**  B13 · B14 · B15 · B15b
- [x] **FRONT:** F9 · F10 · F10b

#### Etapa 3C — Integralização
- [ ] **BACK:**  B16 → B17
- [ ] **FRONT:** F11 · F11b

#### Etapa 3D — Mapa do curso
- [ ] **BACK:**  B18
- [ ] **FRONT:** F12

#### Etapa 3E — Grade semanal
- [ ] **BACK:**  B19
- [ ] **FRONT:** F13 *(fecha `WeeklySchedulePreview` no dashboard)*

**Ordem Bloco 1:** `B1–B5` → `B6–B8` → `F1–F5` → `B9–B12` → `F6–F8` → `B13–B15` → `F9–F10` → `B16–B17` → `F11` → `B18` → `F12` → `B19` → `F13`

---

### #2 — Bloco 6a · Cloud — deploy global (testes) `⬜ 0/8`

> Supabase + Postgres + URL pública. RLS flexível nesta fase.

- [ ] **PLAN:** Projeto Supabase free + env dev/prod
- [ ] **BACK:**  B39 → B41 → B42 → B43
- [ ] **OPS:**   O1 → O2
- [ ] **TEST:**  T1 — smoke: URL abre, seed carrega

**Ordem 6a:** `PLAN` → `B39 → B41 → B42 → B43` → `O1 → O2` → `T1`

---

### #3 — Bloco 6b · Cloud — Auth `⬜ 0/5`

- [ ] **BACK:**  B44 → B45 → B46
- [ ] **FRONT:** F29 → F30

**Ordem 6b:** `B44 → B45 → B46` → `F29 → F30`

---

### #4 — Bloco 2a · Scraper SIGAA — dev `⬜ 0/6`

> Validar Playwright localmente antes do worker.

- [ ] **BACK:**  B24 → B25 → B26
- [ ] **BACK:**  B27
- [ ] **BACK:**  B28 → B29
- [ ] **BACK:**  B30
- [ ] **BACK:**  B31
- [ ] **FRONT:** F18

**Ordem 2a:** `B24–B26` → `B27` → `B28–B29` → `B30` → `B31` → `F18`

---

### #5 — Bloco 2b · Scraper SIGAA — worker `⬜ 0/4`

- [ ] **BACK:**  B54 → B55 → B56
- [ ] **OPS:**   O3
- [ ] **FRONT:** F19

**Ordem 2b:** `B54 → B55 → B56` → `O3` → `F19`

---

### #6 — Bloco 6c · Cloud — multi-tenant `⬜ 0/2`

> **Obrigatório antes do Bloco 7 (PIX).**

- [ ] **BACK:**  B40
- [ ] **TEST:**  T2 — smoke 2 contas isoladas

**Ordem 6c:** `B40` → `T2`

---

### #7 — Bloco 7 · Assinatura PIX `⬜ 0/12`

> Preços TBD. Só após **6c**.

- [ ] **PLAN:** B47 → B48
- [ ] **BACK:**  B49 → B50 → B51 → B52 → B53
- [ ] **FRONT:** F31 → F32 → F33 → F34
- [ ] **LEGAL:** L1

**Ordem Bloco 7:** `B47–B48` → `B49–B53` → `F31–F34` → `L1`

---

### #8 — Bloco 8 · Mobile Expo Go `⬜ 0/10`

- [ ] **SETUP:** M1 → M2
- [ ] **FRONT:** M3
- [ ] **FRONT:** M4
- [ ] **FRONT:** M5
- [ ] **FRONT:** M6
- [ ] **FRONT:** M7
- [ ] **SHARED:** M8
- [ ] **TEST:**  M9
- [ ] **FUTURE:** M10

**Ordem Bloco 8:** `M1–M2` → `M3` → `M4` → `M5` → `M6` → `M7` → `M8` → `M9` → `M10`

---

### #9 — Bloco 3 · Inteligência acadêmica `⬜ 0/11`

> Depende de dados reais do Bloco 2.

- [ ] **BACK:**  B32 → B33 → B34
- [ ] **FRONT:** F21 → F22 → F23
- [ ] **BACK:**  B35
- [ ] **FRONT:** F20
- [ ] **BACK:**  B36 → B37
- [ ] **FRONT:** F24

**Ordem Bloco 3:** `B32–B34` → `F21–F23` → `B35` → `F20` → `B36–B37` → `F24`

---

### #10 — Bloco 4 · Polimento UX `⬜ 0/3`

- [ ] **FRONT:** F25 → F26 → F27

**Ordem Bloco 4:** `F25 → F26 → F27`

---

### #11 — Expansão multi-PPC (Mecatrônica + Moda) `🔒 0/4`

> **⛔ Não iniciar antes do #8 (Mobile Expo Go)** com Eng. Computação 100% funcional. Ver `SCOPE.md` §6.2.

- [ ] **PLAN:** Obter PPC oficial Eng. Mecatrônica (Divinópolis)
- [ ] **PLAN:** Obter PPC oficial Design de Moda (Divinópolis)
- [ ] **BACK:** Indexar disciplinas + requisitos + metas de CH (Mecatrônica e Moda)
- [ ] **BACK/FRONT:** `curso_id` no perfil + mapa/integralização multi-curso

**Ordem #11:** `PLAN PPCs` → `indexar seeds` → `curso_id` → smoke por curso

---

### Resumo de progresso (por ordem de execução)

| Exec. # | Bloco | Status | Progresso |
|---------|-------|--------|-----------|
| #0 | 0 — Planejamento | ✅ | Concluído |
| **#1** | **1 — SQLite (3C–3E)** | 🟡 **Atual** | 41 / 49 |
| #2–3 | 6 — Cloud Supabase | ⬜ | 0 / 14 |
| #4–5 | 2 — Scraper SIGAA | ⬜ | 0 / 14 |
| #7 | 7 — Assinatura PIX | ⬜ | 0 / 12 |
| #8 | 8 — Mobile Expo Go | ⬜ | 0 / 10 |
| #9 | 3 — Inteligência | ⬜ | 0 / 11 |
| #10 | 4 — Polimento | ⬜ | 0 / 3 |
| #11 | 9 — Multi-PPC | 🔒 | 0 / 4 *(após #8)* |

---

## Detalhe dos blocos

> Tabelas B/F detalhadas por feature. A **ordem de execução** é a do [Checklist mestre](#checklist-mestre-ordem-de-execução) acima.

### Bloco 1 — API + UI ↔ SQLite (detalhe)

**Objetivo:** app deixa de ser só mock; dados fluem **SQLite → API → React**.

| Etapa | Foco | O que entrega |
|-------|------|----------------|
| **1** | Fundação | Schema, CRUD, seed, camada API, tipos |
| **2** | Dashboard | Sync mock + `GET /dashboard` + login real + navbar |
| **3A** | Disciplinas | Listagem, detalhe, notas, tarefas, faltas via API |
| **3B** | Calendário | Eventos acadêmicos + tarefas/provas na agenda ✅ |
| **3C** | Integralização | CH por categoria + horas manuais |
| **3D** | Mapa | Grade PPC com status (concluída/cursando/trancada) |
| **3E** | Grade semanal | Horários do semestre vindos do banco |

#### Etapa 1 — Fundação (só backend) ✅

> **Resumo:** Prepara o SQLite (migrations, queries, seed demo) e a infraestrutura de API (`withDb`, validação, erros, tipos). Nada de UI ainda.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B1 | Back | Bootstrap do SQLite | Abre/migra o `.db` na inicialização | [x] |
| B2 | Back | CRUD em `queries.ts` | Leitura/escrita de todas as tabelas | [x] |
| B3 | Back | `seed-demo.ts` | Popula aluno e semestre a partir dos mocks | [x] |
| B4 | Back | Camada `lib/api/` | Errors, response, validate, withDb | [x] |
| B5 | Back | Tipos `lib/types/` | Contratos compartilhados back ↔ front | [x] |

#### Etapa 2 — Sync + Dashboard ✅

> **Resumo:** Pipeline de sync (mock por enquanto), endpoint do dashboard e front que consome: login sincroniza, home mostra stats, tarefas e disciplinas do banco.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B6 | Back | `run-sync.ts` | Orquestra sync (hoje seed; scraper no B31) | [x] |
| B7 | Back | `POST /api/sync` | Dispara sincronização com credenciais | [x] |
| B7b | Back | Prioridade dados usuário | Regra #1: sync não apaga/sobrescreve dados do aluno (`user-data-priority.ts`, `upsertSynced*`) | [x] |
| B8 | Back | `GET /api/dashboard` | Agrega header, stats, tarefas, matérias | [x] |
| F1 | Front | `lib/api/client.ts` | Fetch tipado + tratamento de erro | [x] |
| F2 | Front | `useSync` | Hook que chama sync e expõe loading/erro | [x] |
| F3 | Front | `LoginForm` | Envia credenciais reais para o sync | [x] |
| F4 | Front | Dashboard via API | Header, stats, cards de disciplinas | [x] |
| F5 | Front | Loading/erro/vazio | Estados de carregamento no dashboard | [x] |
| F5b | Front | `LogoutButton` | Sair e limpar sessão/credenciais | [x] |
| F5c | Front | Credenciais salvas | Re-sync rápido pela navbar | [x] |
| F5d | Front | Sync cruzado tarefas | `invalidate-task-sync.ts` — dashboard, disciplina, calendário | [x] |

> **F5 — escopo parcial:** `WeeklySchedulePreview` no dashboard ainda usa mock/localStorage (conclusão em **F13**).  
> **Data fetching:** TanStack Query no dashboard (**F8i**), disciplinas, calendário e mutations de notas/tarefas.

**Ordem:** `B6 → B7 → B7b → B8` → depois `F1 → F2 → F3 → F4 → F5` · `F5b` · `F5c` · `F5d`

#### Etapa 3 — Demais telas (back → front)

> **3B Calendário:** ✅ (push `93dd108`) · **próximo:** 3C (B16 → F11 → F11b)

##### 3A — Disciplinas

> **Resumo:** `/disciplinas` e página da matéria 100% no SQLite: listar, detalhe, editar notas (inline/extra), CRUD de tarefas e marcar faltas.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B9 | Back | `GET /api/disciplinas` | Lista matérias com busca/filtro | [x] |
| B10 | Back | `GET /api/disciplinas/[code]` | Detalhe: ementa, notas, faltas, tarefas, grupo | [x] |
| B11 | Back | `PATCH .../notas` | Add/update/delete, nota extra, override | [x] |
| B12 | Back | `PATCH /api/tarefas/[id]` | Toggle concluída, editar, excluir | [x] |
| B12b | Back | `POST .../tarefas` | Criar tarefa manual na disciplina | [x] |
| B12c | Back | `PATCH .../faltas` | Atualizar presença/falta por data | [x] |
| B12d | Back | `PATCH .../appearance` | Cor, apelido e nome de exibição da matéria | [x] |
| F6 | Front | `/disciplinas` | `SubjectList` via API + TanStack Query | [x] |
| F7 | Front | `/disciplinas/[code]` | Painéis de notas, faltas, tarefas via API | [x] |
| F8 | Front | `useSubjectGrades` | CRUD notas, inline, nota extra | [x] |
| F8b | Front | `SubjectTasksPanel` | CRUD tarefas + filtro Concluídas | [x] |
| F8c | Front | Faltas via API | `SubjectAbsencePanel` + hook de presença | [x] |
| F6b | Front | `SubjectList` UX | Filtros Risco/Crítico/Aprovados, colunas Sala/Horário, linha clicável | [x] |
| F8d | Front | Risco de nota + recuperação | `GradeRiskIndicator`, `RecoveryGradeEntry`, `grade-risk.ts` (recuperação em localStorage) | [x] |
| F8e | Front | Prioridade + selects | `PrioritySelect`, `PlannerSelect`, `useStoredPriorities`, `TaskSortSelect` | [x] |
| F8f | Front | Simulador (polish) | Menu overlay, layout estável com frequência, OK em Necessário, pré-preenche notas reais | [x] |
| F8g | Front | Aparência da matéria | `ColorDotPicker`, modal nome/apelido, `useSubjectAppearance` | [x] |
| F8h | Front | Validação de notas | Clamp pontos a distribuir, nota extra até 100, contador no modal | [x] |
| F8i | Front | TanStack Query dashboard | `useDashboard` migrado para Query + invalidação cruzada | [x] |

##### 3B — Calendário

> **Resumo:** Agenda mensal e datas acadêmicas **via API**; eventos, provas e tarefas do banco; criar/editar eventos manuais.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B13 | Back | `GET /api/calendar` | Tarefas, provas e datas do semestre | [x] |
| B14 | Back | `POST /api/calendar/events` | Inserir evento manual | [x] |
| B15 | Back | `PATCH .../events/[id]` | Editar ou marcar concluído | [x] |
| B15b | Back | Tipos de evento | Monitoria, estágio, estudo, outro + migration DB | [x] |
| F9 | Front | `useCalendarEvents` | Hook que alimenta o calendário | [x] |
| F10 | Front | Views do calendário | `CalendarioView`, datas acadêmicas, form | [x] |
| F10b | Front | Calendário (polish) | Checkbox concluída ao vivo, scroll painel eventos, tipos pessoais | [x] |

##### 3C — Integralização

> **Resumo:** Página `/integralizacao` lê CH real (obrigatória, optativa, extensão…) e permite cadastrar horas manuais. Inclui glossário “O que é cada tipo?” (SCOPE §6.4).

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B16 | Back | `GET /api/integralizacao` | Totais por tipo de CH (conforme PPC do curso) | [ ] |
| B17 | Back | `POST /api/integralizacao` | Registrar horas complementares manuais | [ ] |
| F11 | Front | Painéis integralização | Donut + tabela via API (hoje mock) | [ ] |
| F11b | Front | Glossário de CH | Bloco “Entenda suas horas” + tooltips (obrigatória, optativa/eletiva, complementar, extensão, flexibilizada) | [ ] |

##### 3D — Mapa do curso

> **Resumo:** `/mapa` mostra o PPC por período com status calculado (histórico + pré-requisitos).

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B18 | Back | `GET /api/mapa` | Disciplinas por período + status | [ ] |
| F12 | Front | `CourseMapGrid` | Grid visual consumindo a API | [ ] |

##### 3E — Grade semanal

> **Resumo:** Horários oficiais do semestre (`semestre_atual`) na grade; extras (monitoria) continuam no localStorage.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B19 | Back | `GET /api/schedule` | Slots Seg–Sex traduzidos do SIGAA | [ ] |
| F13 | Front | `WeeklyScheduleTable` | Grade na API (fecha F5 parcial) | [ ] |

##### 3F — Simulador de matrícula

> **Resumo:** `/simulador` (Montar Grade) **fica mock** até o Bloco 2.4 trazer turmas ofertadas reais.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| — | — | Fora do Bloco 1 | Mock até scraper B30 + front F19 | — |

**Ordem sugerida Etapa 3:** `B9–B12 → F6–F8` → `B13–B15 → F9–F10` → `B16–B17 → F11` → `B18 → F12` → `B19 → F13`

> Checklist linear: ver **[Checklist mestre](#checklist-mestre-ordem-de-execução)** acima.

---

### Bloco 6 — Cloud / Supabase (detalhe)

**Objetivo:** migrar SQLite → Postgres no Supabase; deploy global; auth; RLS antes do PIX.

#### 6a — Deploy global (testes)

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| — | Plan | Projeto Supabase | Free tier + env dev/prod | [ ] |
| B39 | Back | Schema Postgres | Tabelas + `user_id` (nullable em teste) | [ ] |
| B41 | Back | Seed PPC global | Disciplinas/requisitos read-only | [ ] |
| B42 | Back | Client Supabase | Adapter queries SQLite→PG | [ ] |
| B43 | Back | Migrar APIs | dashboard, disciplinas, sync stub | [ ] |
| O1 | Ops | Deploy Next.js | Vercel — URL pública global | [ ] |
| O2 | Ops | Remover `.db` local | Prod sem `app/.data/planner.db` | [ ] |
| T1 | Test | Smoke deploy | URL abre, seed carrega | [ ] |

**Ordem:** `B39 → B41 → B42 → B43` → `O1 → O2` → `T1`

#### 6b — Auth

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B44 | Back | Supabase Auth | Cadastro/login/recuperação (conta app) | [ ] |
| B45 | Back | SIGAA cifrado | Credenciais portal no perfil | [ ] |
| B46 | Back | Storage PDFs | Bucket por usuário | [ ] |
| F29 | Front | Auth UI | Login/cadastro Supabase | [ ] |
| F30 | Front | Onboarding | Vincular credenciais SIGAA | [ ] |

**Ordem:** `B44 → B45 → B46` → `F29 → F30`

#### 6c — Multi-tenant

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B40 | Back | RLS policies | `user_id = auth.uid()` | [ ] |
| T2 | Test | Isolamento | 2 contas não veem dados uma da outra | [ ] |

**Ordem:** `B40` → `T2`

---

### Bloco 7 — Assinatura PIX (detalhe)

**Objetivo:** plano por período; pagamento PIX no cadastro; gate de acesso.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B47 | Plan | Planos e preços | Semestre / ano / trial? (TBD) | [ ] |
| B48 | Plan | Gateway PIX | Mercado Pago, Asaas, etc. | [ ] |
| B49 | Back | Tabelas billing | `plans`, `subscriptions`, `payments` | [ ] |
| B50 | Back | Checkout PIX | `POST /api/billing/checkout` | [ ] |
| B51 | Back | Webhook | Confirmação → `subscription.active` | [ ] |
| B52 | Back | Gate middleware | Bloqueia `pending_payment` / `expired` | [ ] |
| B53 | Back | Renovação | Novo PIX + grace period (TBD) | [ ] |
| F31 | Front | Cadastro + plano | Escolha de plano no signup | [ ] |
| F32 | Front | Tela PIX | QR + copia-e-cola + aguardando | [ ] |
| F33 | Front | Renovação | Assinatura expirada | [ ] |
| F34 | Front | Minha assinatura | Plano, validade, histórico | [ ] |
| L1 | Legal | Termos + LGPD | Política de privacidade | [ ] |

**Ordem:** `B47 → B48` → `B49 → B50 → B51 → B52 → B53` → `F31 → F32 → F33 → F34` → `L1`

---

### Bloco 8 — Mobile Expo Go (detalhe)

**Objetivo:** testes no celular via Expo Go; mesmo backend Supabase.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| M1 | Setup | Projeto Expo | `mobile/` TypeScript | [ ] |
| M2 | Setup | Supabase client | Env + auth no Expo | [ ] |
| M3 | Front | Auth mobile | Login + checagem assinatura | [ ] |
| M4 | Front | Dashboard | Stats, entregas, cards | [ ] |
| M5 | Front | Disciplinas | Lista + detalhe | [ ] |
| M6 | Front | Calendário | Agenda mensal (leitura) | [ ] |
| M7 | Front | Mapa PPC | Grid estático | [ ] |
| M8 | Shared | Tipos | `packages/` ou copy types | [ ] |
| M9 | Test | Expo Go | Fluxo Android/iOS | [ ] |
| M10 | Future | EAS Build | Lojas (pós-MVP) | [ ] |

**Ordem:** `M1 → M2` → `M3 → M4 → M5 → M6 → M7` → `M8` → `M9` → `M10`

---

### Worker SIGAA — Bloco 2b (detalhe)

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B54 | Back | Worker Playwright | Container/VPS + fila de jobs | [ ] |
| B55 | Back | API fila sync | Enfileira + status polling/Realtime | [ ] |
| B56 | Back | Pipeline no worker | B24–B31 executam no servidor | [ ] |
| O3 | Ops | Rate limit | Sync por usuário (ex.: 1/5min) | [ ] |

**Ordem:** `B54 → B55 → B56` → `O3` → `F19` *(F19 na tabela Bloco 2)*

---

### Bloco 2 — Scraper SIGAA (detalhe)

**Objetivo:** dados reais do SIGAA substituem `seed-demo` no `runSync`.

#### 2a — Dev local (validar scraper)

| Fase scraper | O que raspa |
|--------------|-------------|
| **2.1 Auth** | Login Playwright, sessão, senha AES opcional, erros |
| **2.2 Portal** | RG, integralização, semestre, tarefas pendentes |
| **2.3 Turma** | Notas, faltas, grupo, tarefas, download PDFs |
| **2.4 Extra** | Turmas ofertadas, calendário acadêmico, histórico PDF |

| # | Tipo | Task | Resumo | Fase | Status |
|---|------|------|--------|------|--------|
| B24 | Back | `lib/scraper/auth.ts` | Login Playwright + cookies de sessão | 2.1 | [ ] |
| B25 | Back | Criptografia AES-256 | Senha salva cifrada (opcional) | 2.1 | [ ] |
| B26 | Back | Erros de auth | Credencial inválida, timeout, SIGAA offline | 2.1 | [ ] |
| B27 | Back | Scraper portal discente | RG, CH, matérias do semestre, atividades | 2.2 | [ ] |
| B28 | Back | Scraper turma virtual | Notas, faltas, tarefas e grupo por matéria | 2.3 | [ ] |
| B29 | Back | Download PDFs | Materiais → Supabase Storage | 2.3 | [ ] |
| B30 | Back | Turmas + calendário | Ofertas próximo sem + datas oficiais + histórico | 2.4 | [ ] |
| B31 | Back | Integrar no `runSync` | Troca seed-demo por pipeline real | 2.x | [ ] |
| F18 | Front | Erros reais no login | Remove simulação mock de falhas | 2.1 | [ ] |
| F19 | Front | `/simulador` via API | Montar grade com turmas ofertadas reais | 2.4 | [ ] |

**Ordem 2a:** `B24 → B25 → B26` → `B27` → `B28 → B29` → `B30` → `B31` → `F18`  
**Ordem 2b:** ver [Worker SIGAA](#worker-sigaa--bloco-2b-detalhe) → `F19`

> Checklist: **#4–#5** no [Checklist mestre](#checklist-mestre-ordem-de-execução)

---

### Bloco 3 — Inteligência acadêmica (detalhe)

**Objetivo:** regras de negócio com dados reais (pré-requisitos, matrícula, grafo, alertas).

| Área | O que resolve |
|------|----------------|
| **Matrícula** | Quais matérias o aluno pode cursar; choque de horário; salvar simulação |
| **Mapa PPC** | Grafo interativo com setas pré/co-requisito |
| **Alertas** | CH perto de completar; datas acadêmicas chegando |

| # | Tipo | Task | Resumo | Fase | Status |
|---|------|------|--------|------|--------|
| B32 | Back | Motor elegibilidade | Histórico + pré-requisitos → pode cursar? | 5.3 | [ ] |
| B33 | Back | Choque de horários | API detecta sobreposição na grade | 5.3 | [ ] |
| B34 | Back | Persistir simulação | Salvar/exportar grade montada | 5.3 | [ ] |
| B35 | Back | `GET /api/mapa/grafo` | Nós e arestas para react-flow | 5.2 | [ ] |
| B36 | Back | Alertas integralização | Limiar por categoria de CH | 5.4 | [ ] |
| B37 | Back | Alertas calendário | Datas acadêmicas próximas | 5.5 | [ ] |
| F20 | Front | Grafo react-flow | Zoom, pan, setas sólidas/pontilhadas | 5.2 | [ ] |
| F21 | Front | Simulador elegível | Filtro + drag-and-drop na grade | 5.3 | [ ] |
| F22 | Front | Alerta choque | Destaque visual de conflito | 5.3 | [ ] |
| F23 | Front | Salvar simulação | Botões salvar/exportar matrícula | 5.3 | [ ] |
| F24 | Front | Alertas na UI | Banners integralização + calendário | 5.4–5.5 | [ ] |

**Ordem:** `B32 → B33 → B34` → `F21 → F22 → F23` → `B35 → F20` → `B36 → B37 → F24`

> Checklist: **#9** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### Bloco 4 — Polimento UX (detalhe)

**Objetivo:** skeletons, transições de página e favicon.

| # | Tipo | Task | Resumo | Fase | Status |
|---|------|------|--------|------|--------|
| F25 | Front | Loading skeletons | Placeholders em todas as telas | 6.4 | [ ] |
| F26 | Front | Transições de página | Animações entre rotas | 6.4 | [ ] |
| F27 | Front | Favicon + título | Identidade na aba do browser | 6.4 | [ ] |

**Ordem:** `#10` → `F25 → F26 → F27`

> Checklist: **#10** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### Visão geral (ordem de execução v2)

```
#0  Bloco 0   Planejamento                    ✅
      ↓
#1  Bloco 1   SQLite 3C→3E (integralização…)  🟡 ← agora
      ↓
#2  Bloco 6a  Supabase + deploy global       (testes, sem RLS rígido)
#3  Bloco 6b  Auth app + SIGAA cifrado
      ↓
#4  Bloco 2a  Scraper dev (B24–B31)
#5  Bloco 2b  Worker servidor (B54–B56)
#6  Bloco 6c  RLS multi-tenant               (antes do PIX)
      ↓
#7  Bloco 7   Assinatura PIX
      ↓
#8  Bloco 8   Mobile Expo Go
      ↓
#9  Bloco 3   Inteligência acadêmica
#10 Bloco 4   Polimento UX
```

| Fase doc | Equivale a | Conteúdo principal |
|----------|------------|-------------------|
| **Fase 0** | Bloco 0 | Requisitos, SCOPE, TASKS, PPC |
| **Fase 1** | Bloco 1 (setup) | Next.js, design system, schema SQLite |
| **Fase 2** | Bloco 2 | Scraper Playwright |
| **Fase 3** | UI templates | Login, dashboard, calendário, rotas |
| **Fase 4** | Disciplinas UI | Notas, faltas, tarefas, simulador local |
| **Fase 5** | Bloco 3 + PPC | Mapa, matrícula, integralização |
| **Fase 6** | Bloco 4 | Polimento UX |
| **Fase 7** | Bloco 8 | App mobile Expo Go |
| **Fase 8** | Bloco 6 | Cloud Supabase |
| **Fase 9** | Bloco 7 | Assinatura PIX |

---

## Fase 2: Motor de Scraping (SIGAA)

> **Resumo:** Playwright automatiza login e extração de dados do SIGAA (portal + turmas). Corresponde ao **Bloco 2** (B24–B31, F18–F19).

### 2.1 Autenticação
- [ ] Implementar login no SIGAA via Playwright (POST para `verTelaLogin.do`)
- [ ] Gerenciar sessão/cookies após login bem-sucedido
- [ ] Implementar criptografia AES-256 para salvar senha local (opcional do usuário)
- [ ] Tratamento de erros: senha inválida, SIGAA fora do ar, timeout

### 2.2 Scraper: Portal do Discente
- [ ] Extrair dados institucionais (matrícula, curso, status, email, entrada)
- [ ] Extrair índices acadêmicos (RG)
- [ ] Extrair dados de integralização (CH Obrigatória, Optativa, Complementar, Extensão, Flexibilizada, % integralizado)
- [ ] Extrair componentes curriculares do semestre (nome, local, código de horário)
- [ ] Extrair atividades pendentes (data, tipo, disciplina)

### 2.3 Scraper: Turma Virtual (por disciplina)
- [ ] Navegar para cada disciplina da turma virtual
- [ ] Extrair frequência (Alunos → Frequência): lista de datas com status
- [ ] Extrair notas (Alunos → Ver Notas): PRO1, SEM, PRO2, Nota, Resultado, Faltas, Sit
- [ ] Extrair tooltip de cada nota (hover → "Avaliação: X | Nota Máxima: Y")
- [ ] Extrair grupo (Alunos → Ver Grupo): membros, matrícula, email
- [ ] Extrair tarefas (Atividades → Tarefas): individuais e em grupo, com links de download
- [ ] Download de materiais/PDFs (Materiais): gravar no Supabase Storage

### 2.4 Scraper: Funcionalidades Adicionais
- [ ] Consultar turmas ofertadas para o próximo semestre (Ensino → Consultar Turmas)
- [ ] Extrair calendário acadêmico (Ensino → Calendário Acadêmico)
- [ ] Emitir/baixar histórico escolar (PDF)

---

## Fase 3: Interface do Usuário — Telas Principais

> **Resumo:** Shell visual de login, dashboard, calendário, mapa, integralização e simulador. Integração SQLite: dashboard ✅ · disciplinas ✅ · calendário ✅ · integralização/mapa/grade semanal ainda mock ou parcial (F11, F12, F13).

### 3.1 Tela de Login
- [x] Input de usuário e senha do SIGAA
- [x] Senha com mostrar/ocultar (`PasswordInput`)
- [x] Toggle "Lembrar senha neste computador" — persiste credenciais; **criptografia AES = B25**
- [x] Botão "Entrar e Sincronizar"
- [x] Loading state com progresso da sincronização
- [x] Tratamento de erro visual (credenciais inválidas, SIGAA offline) — via API mock (`erro` / `offline`)
- [x] UI do login (card CEFET-MG, piping dourado, rodapé "Criar conta" → SIGAA, `LoginCard`, `PasswordInput`)

### 3.2 Dashboard Central
- [x] Header com saudação, nome do aluno e semestre atual — **via API** (`useDashboard`, TanStack Query)
- [/] Card de RG com indicador visual (cor baseada na faixa) — RG numérico em `StatsRow`; **faixa de cores pendente**
- [x] Barra de integralização com breakdown por tipo de CH — **via API** (página `/integralizacao` ainda mock → F11)
- [/] Lista "Próximas Entregas" (5 próximas tarefas/avaliações) — filtros via API (incl. Concluídas) + regra 3 dias após prazo; **limite de 5 pendente**
- [x] Modal com detalhes da tarefa ao clicar (descrição, entregáveis, link à disciplina)
- [x] Grid de cards de disciplinas (nota, faltas, próxima atividade por matéria) — **via API**
- [x] Indicador de risco de nota e badge Recuperação nos cards (`GradeRiskIndicator`; prioridade fora do `<Link>`)
- [x] Ordenação e prioridade em "Próximas Entregas" (`TaskSortSelect`, `PrioritySelect`)
- [x] Botão de re-sincronização na navbar (Sync SIGAA)
- [x] Botão Sair (`LogoutButton`) — extra F5b

### 3.3 Grade Semanal (Horário de Aulas)
- [x] Tabela visual: Segunda a Sexta × blocos de horário (M12, M34, M56, Almoço, T12, T34, Janta, N12, N34)
- [x] Tradução automática de códigos SIGAA (ex: `6M56` → Sexta, 10:50–12:30) (Baseado em dados mocados para preview)
- [x] Cada célula: nome abreviado da matéria + sala
- [x] Cores distintas por matéria
- [x] Clique na célula abre modal com detalhes (sala, professor, horário) e link para disciplina
- [x] Modo de edição para adicionar eventos extras (monitoria, estágio, estudo)

### 3.4 Agenda Mensal
- [x] Calendário mensal interativo (navegação entre meses)
- [x] Pills de tarefas, provas e eventos nos dias correspondentes
- [x] Filtros por tipo (tarefa / prova / evento / aula)
- [x] Modal ao clicar no dia ou no evento (detalhes + link para disciplina)
- [x] Checkbox para marcar tarefa como concluída
- [x] Modal para adicionar tarefa manual ao clicar em um dia
- [x] Indicadores visuais de densidade em dias com muitas atividades

### 3.5 Templates de Páginas (UI)
- [x] Template `/calendario` — calendário mensal, eventos e datas acadêmicas **via API** (F9–F10); grade semanal ainda mock (F13)
- [x] Template `/disciplinas` — listagem e detalhe **via API** (F6–F8); simulação de notas permanece local
- [x] Template `/mapa` (grade curricular por período com status)
- [/] Template `/integralizacao` — UI donut + barras douradas; **dados ainda mock** (F11)
- [x] Template `/simulador` (montar grade / matrícula)
- [x] Página `not-found` customizada
- [x] Layout compartilhado (`PageHeader`, `PageGrid`) e mock data em `config/mock/`
- [x] Componentes UI base: `Modal`, `FilterBar`, `ActivityDetail`, `SectionHeader`, `Icon`, `ToggleOption`, `PasswordInput`, `PlannerSelect`, `PrioritySelect`

### 3.6 Layout Modular de Módulos
- [x] Hook `useModuleLayout` com persistência em `localStorage`
- [x] Reordenar módulos (↑ ↓) nas páginas calendário e simulador
- [x] Ocultar / mostrar módulos e restaurar layout padrão
- [x] Aplicar layout modular no dashboard e integralização (calendário e simulador já tinham)
- [x] Arrastar e soltar módulos para reordenar (drag-and-drop)
- [x] Corrigir modal centralizado na tela (calendário e demais páginas)
- [x] Corrigir espaços vazios no calendário e integralização
- [x] Filtros globais visíveis na página do calendário
- [x] Aplicar layout modular em disciplinas e mapa

---

## Fase 4: Interface do Usuário — Gestão de Disciplinas

> **Resumo:** Página da matéria: notas (inline/extra), faltas, tarefas CRUD, simulador local de aprovação. Backend no **Bloco 1, Etapa 3A** ✅.

### 4.1 Página Individual da Disciplina
- [x] Header com nome, apelido (`shortLabel`), professor, CH, sala, horário — **via API** (F7 + F8g aparência)
- [x] Seção de Ementa (texto do PPC) — **via API**
- [x] Card de Nota Atual (tabela de avaliações, pontos faltando) — **via API**; add manual via F8
- [x] Card de Faltas (barra de progresso até o limite, cores por zona de risco) — **via API**
- [x] Lista de Tarefas (com data e tipo) — **via API**; CRUD manual + marcar concluída (`POST/PATCH` tarefas)
- [x] Clique na tarefa abre modal com descrição, instruções e entregáveis
- [x] Painéis Notas e Frequência alinhados em altura na página da disciplina

### 4.2 Tabela de Notas Detalhada
- [x] Tabela com avaliações (PRO1, SEM, PRO2, Nota…) — **dados SQLite via API**
- [x] Coluna de "valor máximo" visível (não apenas no hover)
- [x] Botão "+ Adicionar Avaliação" para cadastro manual
- [x] Indicador de "faltam X pontos para distribuir" (exclui notas extra)
- [x] Destaque da nota necessária para aprovação (banner + coluna Necessário)
- [x] Edição inline de nota (vírgula/ponto, validação min/max)
- [x] Toggle "Nota extra" (`ToggleOption`) — não entra em pontos a distribuir
- [x] Excluir qualquer avaliação (SIGAA ou manual)
- [x] Apelido e nome editável da matéria (`SubjectNicknameModal`, `PATCH .../appearance`)
- [x] Seletor de cor por matéria (`ColorDotPicker`)
- [x] Validação de nota máxima ao criar/editar avaliação (não ultrapassar pontos a distribuir)
- [x] Nota extra pode exceder máximo da linha, limitada ao total de 100 pts
- [x] Barra de risco com marca 60 acima da barra (painel) e pontos a distribuir só com nota lançada
- [x] Coluna Necessário com **OK** quando a meta da avaliação ou aprovação (≥ 60) é atingida
- [x] Recuperação inline (`RecoveryGradeEntry`) quando semestre encerrado (40–59 pts); média `(semestre + recuperação) ÷ 2`

### 4.3 Simulador de Notas
- [x] Mover simulador de notas para a página individual de cada disciplina
- [x] Campos editáveis para inserir notas hipotéticas (modo "Simular notas" na matéria)
- [x] Cálculo em tempo real da nota final
- [x] Indicador "Aprovado" ou "Reprovado" simulado
- [x] Botão "Limpar Simulação" para voltar aos dados reais
- [x] Exibir quanto falta em cada avaliação para atingir aprovação (coluna "Necessário")
- [x] Simulador sem impacto de RG no semestre (removido `RgImpactLabel`)
- [x] Ao simular: trigger mantém tamanho, menu em overlay, barra de risco permanece, campos pré-preenchidos com notas reais

### 4.4 Tela de Frequência
- [x] Tabela cronológica de datas e status (Presente/Falta/Não Registrada)
- [x] Card resumo: "X faltas de Y permitidas (Z dias restantes)"
- [x] Indicador visual de zona de risco (verde → amarelo → vermelho)
- [x] Atualização de presença via `PATCH /api/disciplinas/[code]/faltas`

### 4.5 Download Automático de PDFs
- [/] Toggle on/off por disciplina — **na página da disciplina** (`SubjectDownloadsPanel`); persistência via Supabase Storage (Bloco 6)
- [x] Indicador de "X arquivos baixados" por matéria
- [ ] Listar e baixar PDFs do Storage na UI (substitui placeholder de pasta local)

---

## Fase 5: Motor do PPC e Planejamento Acadêmico

> **Resumo:** Dados do PPC (disciplinas, requisitos), mapa do curso, simulador de matrícula, integralização e calendário acadêmico. Inteligência avançada = **Bloco 3**.

### 5.1 Indexação do PPC
- [x] Popular banco de dados com todas as disciplinas de Eng. Computação (DCDV):
  - Código, nome, tipo (Obrigatória/Optativa/Extensão), CH, período, ementa
- [x] Popular tabela de requisitos (pré-requisitos e co-requisitos)
- [x] Dados extraídos do mapa mental existente + PPC oficial
- [ ] *(Fase 2 — pós-mobile, #11)* Indexar PPC Eng. Mecatrônica
- [ ] *(Fase 2 — pós-mobile, #11)* Indexar PPC Design de Moda
- [ ] *(Fase 2 — pós-mobile, #11)* `curso_id` / seleção de curso no perfil

### 5.2 Mapa Mental / Grafo do Curso
- [x] Template estático: colunas por período com disciplinas e status (mock)
- [x] Cores dos nós por status: Concluída, Cursando, Desbloqueada, Trancada
- [x] Clique no nó navega para página da disciplina
- [ ] Renderizar grafo interativo (usar biblioteca como `react-flow` ou `d3.js`)
- [ ] Setas sólidas para pré-requisitos, pontilhadas para co-requisitos
- [ ] Zoom e pan para navegação

### 5.3 Simulador de Matrícula (Pré-horário)
- [x] Página dedicada apenas ao simulador de horários/matrícula (`/simulador` — Montar Grade)
- [ ] Buscar turmas ofertadas do SIGAA (scraper)
- [ ] Filtrar matérias elegíveis (cruza com histórico + pré-requisitos atendidos)
- [x] Lista de matérias com ícones: Desbloqueada / Trancada (template mock)
- [x] Alocar matéria desbloqueada em horário vazio da grade (clique — template)
- [x] Clique em aula da grade abre modal com detalhes e opção de remover
- [ ] Drag-and-drop de matérias para a grade semanal
- [ ] Detecção automática de choque de horários (alerta visual)
- [ ] Botão "Salvar Simulação" para referência futura
- [ ] Botão "Exportar" para levar na hora da matrícula

### 5.4 Gestão de Integralização (Horas)
- [x] Tabela com tipos de CH, total necessário, concluído, pendente (template mock)
- [x] Botão "+ Cadastrar Horas" (UI placeholder)
- [x] Barra de progresso visual por categoria
- [x] Donut "Total Integralizado" + cards alinhados em altura (`IntegrationDonutChart`)
- [x] Barras de progresso douradas unificadas no app
- [x] Documentar glossário de tipos de CH no `SCOPE.md` §6.4 (implementação → **F11b**)
- [ ] Glossário **“Entenda suas horas”** na UI (obrigatória, eletiva, complementar, extensão, flexibilizada) → **F11b**
- [ ] Alerta quando estiver perto de concluir uma categoria

### 5.5 Calendário Acadêmico
- [x] Tela com as datas oficiais do semestre (matrícula, trancamento, aulas, recessos)
- [ ] Alertas/notificações para datas próximas
- [ ] Verificação periódica de novas datas publicadas

---

## Fase 6: Polimento Visual

> **Resumo:** Skeletons, animações e favicon — **Bloco 4** (F25–F27).

### 6.1 Polimento Visual
- [x] Redesign visual paleta Cruzeiro (fundo jersey, dourado, ícones SVG, sem emojis)
- [x] Corrigir espaçamento vazio no dashboard (grid unificado)
- [x] Melhorar contraste e legibilidade (cards, badges, bordas)
- [x] Revisar telas calendário, integralização e modal para consistência visual
- [x] UI login refinada (card institucional, senha com olho, toggle lembrar senha)
- [x] Barras de progresso douradas (global `.progress-bar-fill`)
- [x] Caixas de seleção unificadas (pill escuro Cruzeiro, menu em overlay) — `PlannerSelect`, `PrioritySelect`
- [ ] Adicionar animações de transição entre páginas
- [/] Adicionar loading skeletons em todas as telas — **dashboard** + **disciplinas** (lista/detalhe); demais telas = F25
- [x] Responsividade básica (breakpoints mobile/tablet/desktop)
- [/] Favicon e título personalizado na aba do navegador — título em `layout.tsx` ✅; **favicon.ico pendente**

---

## Fase 7: App Mobile (Expo Go)

> **Resumo:** App mobile para testes via **Expo Go**, backend **Supabase** — **Bloco 8**. Escopo: [`docs/SCOPE-CLOUD.md`](./SCOPE-CLOUD.md) §7.

- [ ] Criar projeto Expo em `mobile/` (TypeScript)
- [ ] Integrar Supabase Auth + checagem de assinatura ativa
- [ ] Telas: dashboard, disciplinas, calendário, mapa
- [ ] Testar no Expo Go (Android/iOS)
- [ ] EAS Build para lojas (fase posterior — M10)

---

## Notas para Outros Agentes de IA

Se você é um agente de IA continuando este projeto, aqui estão informações cruciais:

1. **Leia `docs/SCOPE-CLOUD.md`** para arquitetura (cloud, PIX, mobile). **`docs/SCOPE.md`** mantém regras acadêmicas.
2. **`README.md`** — visão geral e como rodar em dev; arquitetura de produto em `SCOPE-CLOUD.md`.
3. **O mapa mental do curso** (grade curricular com pré/co-requisitos) foi fornecido como imagem e deve ser convertido em dados estruturados.
4. **O SIGAA é uma aplicação JSF (Java Server Faces).** Os formulários usam `javax.faces.ViewState` e IDs dinâmicos. O scraper deve usar Playwright (não requests simples) por causa do JavaScript.
5. **URLs do SIGAA mudam de sessão para sessão.** Sempre navegue pelo menu, não por URLs hardcoded.
6. **O design deve ser PREMIUM.** Cores do Cruzeiro (Azul #0060B1 + Dourado #D4A843), glassmorphism, micro-animações. Nada genérico.
7. **Atualize o `docs/TASKS.md` sempre que trabalhar em uma task:**
   - Ao **iniciar**: marque como `[/]` — em andamento.
   - Após **commit local**: marque como `[%]` — feito, sem push.
   - Após **push ou aprovação 100%**: marque como `[x]` — finalizada.
   - Faça **commit** ao concluir cada task (push só quando o usuário pedir).
   - **Obrigatório:** toda entrega de código ou escopo deve refletir no `TASKS.md` no mesmo ciclo de trabalho.
8. **Próximo passo do roadmap:** indique **somente após push** (tasks em `[x]`). Com commits locais `[%]` pendentes, **não** avance o roadmap na resposta.
9. **Ordem de execução:** seguir [Ordem oficial v2](#ordem-oficial-de-execução-v2) e [Checklist mestre](#checklist-mestre-ordem-de-execução) — **não** a numeração antiga 1→2→3→4. Dentro de cada fatia: `B` antes de `F`.
10. **Modo testes global (6a):** deploy com URL pública; Supabase free; RLS **só na 6c** (antes do PIX).
11. **Próximo passo:** **B16 → F11 → F11b** (integralização Eng. Computação). **Mecatrônica e Moda:** bloqueadas até **#11**, após **#8 mobile**.
12. **Código frontend** está em `app/src/` (não na raiz `src/`). Mock data em `app/src/config/mock/`.
