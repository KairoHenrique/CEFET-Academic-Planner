# 📝 CEFET Academic Planner — Roadmap e Tasks

Este documento contém todas as tasks do projeto, organizadas por fase. Cada task tem um status e detalhes suficientes para qualquer desenvolvedor (humano ou IA) entender e implementar.

**Navegação rápida:** [Resumo dos blocos](#resumo-rápido--o-que-cada-bloco-faz) · [Checklist mestre](#checklist-mestre-ordem-linear) · [Detalhe B/F por etapa](#bloco-1--api--ui--sqlite)

**Legenda:**
- `[ ]` — Não iniciada
- `[/]` — Em progresso
- `[x]` — Concluída

---

## Fase 0: Planejamento e Documentação

> **Resumo:** Definir escopo, stack e documentação base antes de codar. PPC de Eng. Computação indexado para o mapa curricular.

- [x] Levantamento de requisitos com o stakeholder
- [x] Análise do portal SIGAA (estrutura, URLs, dados disponíveis)
- [x] Definição da stack tecnológica (Next.js + Playwright + SQLite)
- [x] Criação do README.md completo
- [x] Criação do SCOPE.md com todas as regras de negócio
- [x] Criação do TASKS.md (este arquivo)
- [x] Obter e indexar o PPC de Engenharia da Computação (PDF → dados estruturados)

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
  - Tabela `configuracoes` (chave, valor — para senha criptografada, pasta do banco, toggles de download, etc.)
- [x] Criar funções CRUD para todas as tabelas
- [x] Criar migration/seed inicial
- [/] Configurar caminho do banco como variável de ambiente / configuração do usuário
  - [x] `DB_PATH` via variável de ambiente (`lib/db/index.ts`)
  - [ ] UI para o usuário escolher pasta (Bloco 1 → B23 / F15)

### 1.4 API e Integração UI ↔ SQLite

> **Progresso:** Etapas 1–2 ✅ · Etapa 3A ✅ (B9–B12 + extensões, F6–F8 + extensões) · próximo: **3B Calendário** (B13–F10).

Roadmap detalhado por blocos (back/front, ordem de execução): ver seção **[Roadmap por Blocos](#roadmap-por-blocos-ordem-de-execução)** abaixo.

---

## Roadmap por Blocos (ordem de execução)

Estratégia: **fatias verticais** — backend da feature primeiro, depois frontend que consome a API. Não fechar 100% do front antes do back.

**Legenda de tipo:** `B` = Backend · `F` = Frontend · `Int` = Integração (back + front)

### Resumo rápido — o que cada bloco faz

| Bloco | Em uma linha | Entrega principal |
|-------|----------------|-------------------|
| **0** | Planejamento | Requisitos, SCOPE, PPC indexado, stack definida |
| **1** | API + SQLite | App deixa de ser mock: `SQLite → API → React` em todas as telas |
| **2** | Scraper SIGAA | Playwright loga no SIGAA e popula o banco com dados reais |
| **3** | Inteligência | Pré-requisitos, elegibilidade, choque de horários, grafo, alertas |
| **4** | Polimento | Skeletons, animações, favicon, detecção de pasta na nuvem |
| **5** | Mobile | App Expo + `.db` na nuvem + offline (futuro) |

**O que permanece no client (localStorage) durante o Bloco 1:**
- Layout modular de módulos (`useModuleLayout`)
- Extras na grade semanal (monitoria, estágio)
- Simulação de notas (modo "Simular" na disciplina)
- Prioridade de matérias e tarefas (`useStoredPriorities`)
- Ordenação de tarefas (`useTaskSortMode`)
- Nota de recuperação por disciplina (`lib/recovery/storage.ts`)
- `/simulador` (Montar Grade) — continua mock até Bloco 2.4

---

## Checklist mestre (ordem linear)

Legenda rápida: linha `[x]` = fatia concluída · linha `[ ]` = pendente · `·` = tasks extras na mesma fatia.

### Bloco 1 — API + UI ↔ SQLite `🟡 em progresso (23/42)`

> **O que é:** Fatias verticais back→front até todas as rotas consumirem o SQLite local. Substitui `config/mock/` por APIs reais, mantendo no browser só layout modular, extras da grade e simulador de notas.

- [x] **BACK:**  B1 → B2 → B3 → B4 → B5
- [x] **BACK:**  B6 → B7 → B8
- [x] **FRONT:** F1 → F2 → F3 → F4 → F5 · F5b · F5c
- [x] **BACK:**  B9 → B10 → B11 → B12
- [x] **FRONT:** F6 → F7 → F8 · F6b · F8d · F8e · F8f
- [ ] **BACK:**  B13 → B14 → B15
- [ ] **FRONT:** F9 → F10
- [ ] **BACK:**  B16 → B17
- [ ] **FRONT:** F11
- [ ] **BACK:**  B18
- [ ] **FRONT:** F12
- [ ] **BACK:**  B19
- [ ] **FRONT:** F13
- [ ] **BACK:**  B20 → B21 → B22 → B23
- [ ] **FRONT:** F14 → F15 → F16 → F17

> **Parcial em F5:** grade semanal no dashboard (`WeeklySchedulePreview`) conclui em **F13**.  
> **Extensões 3A (fora do 23/42):** F6b, F8d–F8f documentadas na tabela abaixo.

### Bloco 2 — Scraper SIGAA `⬜ não iniciado (0/10)`

> **O que é:** Motor Playwright que faz login no SIGAA, raspa portal do discente + turmas virtuais e grava no SQLite via `runSync`. Troca o `seed-demo` por sync real; habilita PDFs, turmas ofertadas e `/simulador` com dados vivos.

- [ ] **BACK:**  B24 → B25 → B26
- [ ] **BACK:**  B27
- [ ] **BACK:**  B28 → B29
- [ ] **BACK:**  B30
- [ ] **BACK:**  B31
- [ ] **FRONT:** F18
- [ ] **FRONT:** F19

### Bloco 3 — Inteligência acadêmica `⬜ não iniciado (0/11)`

> **O que é:** Regras de negócio sobre dados reais: quem pode cursar o quê, choques de horário, grafo PPC interativo, alertas de integralização e calendário. Depende do Bloco 2 para histórico e turmas ofertadas.

- [ ] **BACK:**  B32 → B33 → B34
- [ ] **FRONT:** F21 → F22 → F23
- [ ] **BACK:**  B35
- [ ] **FRONT:** F20
- [ ] **BACK:**  B36 → B37
- [ ] **FRONT:** F24

### Bloco 4 — Polimento e sync externa `⬜ não iniciado (0/5)`

> **O que é:** Acabamento de UX (loading, transições, favicon) e indicador de que o `.db` está numa pasta Drive/OneDrive. Export/import e `/configuracoes` = **Bloco 1, Etapa 4** (B20–F17).

- [ ] **FRONT:** F25 → F26 → F27
- [ ] **BACK:**  B38
- [ ] **FRONT:** F28

### Bloco 5 — Mobile (Fase 7) `⬜ futuro`

> **O que é:** Mesmo planner no celular (Expo), lendo o `.db` sincronizado na nuvem, com UI adaptada e modo offline.

- [ ] **FRONT:** App React Native (Expo)
- [ ] **BACK:**  Integração Drive API para `.db`
- [ ] **FRONT:** Modo offline + UI mobile

### Resumo de progresso

| Bloco | Status | Concluído |
|-------|--------|-----------|
| 1 — API + SQLite | 🟡 Em progresso | 23 / 42 (Etapas 1–2 + 3A ✅) |
| 2 — Scraper SIGAA | ⬜ Não iniciado | 0 / 10 |
| 3 — Inteligência acadêmica | ⬜ Não iniciado | 0 / 11 |
| 4 — Polimento | ⬜ Não iniciado | 0 / 5 |
| 5 — Mobile | ⬜ Futuro | 0 / 3 |

---

### Bloco 1 — API + UI ↔ SQLite

**Objetivo:** app deixa de ser só mock; dados fluem **SQLite → API → React**.

| Etapa | Foco | O que entrega |
|-------|------|----------------|
| **1** | Fundação | Schema, CRUD, seed, camada API, tipos |
| **2** | Dashboard | Sync mock + `GET /dashboard` + login real + navbar |
| **3A** | Disciplinas | Listagem, detalhe, notas, tarefas, faltas via API |
| **3B** | Calendário | Eventos acadêmicos + tarefas/provas na agenda |
| **3C** | Integralização | CH por categoria + horas manuais |
| **3D** | Mapa | Grade PPC com status (concluída/cursando/trancada) |
| **3E** | Grade semanal | Horários do semestre vindos do banco |
| **4** | Config | Caminho do `.db`, export/import JSON, toggles |

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
| B8 | Back | `GET /api/dashboard` | Agrega header, stats, tarefas, matérias | [x] |
| F1 | Front | `lib/api/client.ts` | Fetch tipado + tratamento de erro | [x] |
| F2 | Front | `useSync` | Hook que chama sync e expõe loading/erro | [x] |
| F3 | Front | `LoginForm` | Envia credenciais reais para o sync | [x] |
| F4 | Front | Dashboard via API | Header, stats, cards de disciplinas | [x] |
| F5 | Front | Loading/erro/vazio | Estados de carregamento no dashboard | [x] |
| F5b | Front | `LogoutButton` | Sair e limpar sessão/credenciais | [x] |
| F5c | Front | Credenciais salvas | Re-sync rápido pela navbar | [x] |

> **F5 — escopo parcial:** `WeeklySchedulePreview` no dashboard ainda usa mock/localStorage (conclusão em **F13**).  
> **Data fetching:** dashboard usa hooks nativos (`useDashboard`); **TanStack Query** desde **F6** (disciplinas + mutations de notas/tarefas).

**Ordem:** `B6 → B7 → B8` → depois `F1 → F2 → F3 → F4 → F5`

#### Etapa 3 — Demais telas (back → front)

> **3A Disciplinas:** backend ✅ (B9–B12 + extensões) · front ✅ (F6–F8 + extensões F6b, F8b–F8f) · próximo: **3B Calendário** (B13–F15)

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
| F6 | Front | `/disciplinas` | `SubjectList` via API + TanStack Query | [x] |
| F7 | Front | `/disciplinas/[code]` | Painéis de notas, faltas, tarefas via API | [x] |
| F8 | Front | `useSubjectGrades` | CRUD notas, inline, nota extra | [x] |
| F8b | Front | `SubjectTasksPanel` | CRUD tarefas + filtro Concluídas | [x] |
| F8c | Front | Faltas via API | `SubjectAbsencePanel` + hook de presença | [x] |
| F6b | Front | `SubjectList` UX | Filtros Risco/Crítico/Aprovados, colunas Sala/Horário, linha clicável | [x] |
| F8d | Front | Risco de nota + recuperação | `GradeRiskIndicator`, `RecoveryGradeEntry`, `grade-risk.ts` (recuperação em localStorage) | [x] |
| F8e | Front | Prioridade + selects | `PrioritySelect`, `PlannerSelect`, `useStoredPriorities`, `TaskSortSelect` | [x] |
| F8f | Front | Simulador (polish) | Menu overlay, layout estável com frequência, OK em Necessário, pré-preenche notas reais | [x] |

##### 3B — Calendário

> **Resumo:** Agenda mensal e datas acadêmicas deixam o mock: eventos, provas e tarefas vêm do banco; criar/editar eventos manuais.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B13 | Back | `GET /api/calendar` | Tarefas, provas e datas do semestre | [ ] |
| B14 | Back | `POST /api/calendar/events` | Inserir evento manual | [ ] |
| B15 | Back | `PATCH .../events/[id]` | Editar ou marcar concluído | [ ] |
| F9 | Front | `useCalendarEvents` | Hook que alimenta o calendário | [ ] |
| F10 | Front | Views do calendário | `CalendarioView`, datas acadêmicas, form | [ ] |

##### 3C — Integralização

> **Resumo:** Página `/integralizacao` lê CH real (obrigatória, optativa, extensão…) e permite cadastrar horas manuais.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B16 | Back | `GET /api/integralizacao` | Totais por tipo de carga horária | [ ] |
| B17 | Back | `POST /api/integralizacao` | Registrar horas complementares manuais | [ ] |
| F11 | Front | Painéis integralização | Donut + tabela via API (hoje mock) | [ ] |

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

#### Etapa 4 — Configurações + backup (Bloco 1 + Fase 6.1/6.2)

> **Resumo:** Tela `/configuracoes`: onde fica o `.db` (Drive/OneDrive), backup JSON e toggles de download de PDF.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B20 | Back | `GET/PUT /api/config` | Caminho do banco + toggles PDF | [ ] |
| B21 | Back | `POST /api/export` | Dump completo em JSON | [ ] |
| B22 | Back | `POST /api/import` | Validar e restaurar backup | [ ] |
| B23 | Back | `DB_PATH` dinâmico | Banco lê pasta de `configuracoes` | [ ] |
| F14 | Front | Rota `/configuracoes` | Página + link na navbar | [ ] |
| F15 | Front | Form caminho `.db` | Campo + dica pasta na nuvem | [ ] |
| F16 | Front | Export/Import JSON | Botões na UI de config | [ ] |
| F17 | Front | Aviso de reinício | Modal ao mudar caminho do banco | [ ] |

**Ordem:** `B20 → B21 → B22 → B23` → `F14 → F15 → F16 → F17`

> Checklist linear completo: ver **[Checklist mestre](#checklist-mestre-ordem-linear)** acima.

---

### Bloco 2 — Scraper SIGAA (Fase 2)

**Objetivo:** dados reais do SIGAA substituem `seed-demo` no `runSync`.

| Fase scraper | O que raspa |
|--------------|-------------|
| **2.1 Auth** | Login Playwright, sessão, senha AES opcional, erros |
| **2.2 Portal** | RG, integralização, semestre, tarefas pendentes |
| **2.3 Turma** | Notas, faltas, grupo, tarefas, download PDFs |
| **2.4 Extra** | Turmas ofertadas, calendário acadêmico, histórico PDF |

| # | Tipo | Task | Resumo | Fase | Status |
|---|------|------|--------|------|--------|
| B24 | Back | `lib/scraper/auth.ts` | Login Playwright + cookies de sessão | 2.1 | [ ] |
| B25 | Back | Criptografia AES-256 | Senha salva local cifrada (opcional) | 2.1 | [ ] |
| B26 | Back | Erros de auth | Credencial inválida, timeout, SIGAA offline | 2.1 | [ ] |
| B27 | Back | Scraper portal discente | RG, CH, matérias do semestre, atividades | 2.2 | [ ] |
| B28 | Back | Scraper turma virtual | Notas, faltas, tarefas e grupo por matéria | 2.3 | [ ] |
| B29 | Back | Download PDFs | Materiais → `docs-downloads/{disciplina}/` | 2.3 | [ ] |
| B30 | Back | Turmas + calendário | Ofertas próximo sem + datas oficiais + histórico | 2.4 | [ ] |
| B31 | Back | Integrar no `runSync` | Troca seed-demo por pipeline real | 2.x | [ ] |
| F18 | Front | Erros reais no login | Remove simulação mock de falhas | 2.1 | [ ] |
| F19 | Front | `/simulador` via API | Montar grade com turmas ofertadas reais | 2.4 | [ ] |

**Ordem:** `B24 → B25 → B26` → `B27` → `B28 → B29` → `B30` → `B31` → `F18` → `F19`

> Checklist: **[Bloco 2](#bloco-2--scraper-sigaa--não-iniciado-010)** no checklist mestre.

---

### Bloco 3 — Inteligência acadêmica (Fase 5)

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

> Checklist: **[Bloco 3](#bloco-3--inteligência-acadêmica--não-iniciado-011)** no checklist mestre.

---

### Bloco 4 — Polimento e sync externa (Fase 6)

**Objetivo:** UX de produção e indicador de backup na nuvem (config/export ficam na Etapa 4 do Bloco 1).

| # | Tipo | Task | Resumo | Fase | Status |
|---|------|------|--------|------|--------|
| F25 | Front | Loading skeletons | Placeholders em todas as telas | 6.4 | [ ] |
| F26 | Front | Transições de página | Animações entre rotas | 6.4 | [ ] |
| F27 | Front | Favicon + título | Identidade na aba do browser | 6.4 | [ ] |
| B38 | Back | Detectar pasta nuvem | `.db` em Drive/OneDrive/Dropbox | 6.3 | [ ] |
| F28 | Front | Status da pasta | Indicador “sincronizado” na UI | 6.3 | [ ] |

**Ordem:** após Bloco 1 Etapa 4 → `F25 → F26 → F27` → `B38 → F28`

> Export/import JSON e tela de configurações estão no **Bloco 1, Etapa 4** (B20–B23, F14–F17).  
> Checklist: **[Bloco 4](#bloco-4--polimento-e-sync-externa--não-iniciado-04)** no checklist mestre.

---

### Visão geral dos blocos

```
Bloco 0 (Planejamento)      →  docs, PPC, stack
        ↓
Bloco 1 (API + SQLite)     →  telas consomem banco local (23/42)
        ↓
Bloco 2 (Scraper SIGAA)    →  sync real substitui seed-demo
        ↓
Bloco 3 (Inteligência)     →  PPC, matrícula, grafo, alertas
        ↓
Bloco 4 (Polimento)        →  UX produção + pasta na nuvem
        ↓
Bloco 5 (Mobile)           →  Expo + offline (futuro)
```

| Fase doc | Equivale a | Conteúdo principal |
|----------|------------|-------------------|
| **Fase 0** | Bloco 0 | Requisitos, SCOPE, TASKS, PPC |
| **Fase 1** | Bloco 1 (setup) | Next.js, design system, schema SQLite |
| **Fase 2** | Bloco 2 | Scraper Playwright |
| **Fase 3** | UI templates | Login, dashboard, calendário, rotas |
| **Fase 4** | Disciplinas UI | Notas, faltas, tarefas, simulador local |
| **Fase 5** | Bloco 3 + PPC | Mapa, matrícula, integralização |
| **Fase 6** | Bloco 1.4 + Bloco 4 | Config, export, polimento |
| **Fase 7** | Bloco 5 | App mobile |

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
- [ ] Download de materiais/PDFs (Materiais): salvar em `docs-downloads/{disciplina}/`

### 2.4 Scraper: Funcionalidades Adicionais
- [ ] Consultar turmas ofertadas para o próximo semestre (Ensino → Consultar Turmas)
- [ ] Extrair calendário acadêmico (Ensino → Calendário Acadêmico)
- [ ] Emitir/baixar histórico escolar (PDF)

---

## Fase 3: Interface do Usuário — Telas Principais

> **Resumo:** Shell visual de login, dashboard, calendário, mapa, integralização e simulador. Integração SQLite segue o [Bloco 1](#bloco-1--api--ui--sqlite) (dashboard ✅, disciplinas ✅; demais rotas ainda mock).

### 3.1 Tela de Login
- [x] Input de usuário e senha do SIGAA
- [x] Senha com mostrar/ocultar (`PasswordInput`)
- [x] Toggle "Lembrar senha neste computador" — persiste credenciais; **criptografia AES = B25**
- [x] Botão "Entrar e Sincronizar"
- [x] Loading state com progresso da sincronização
- [x] Tratamento de erro visual (credenciais inválidas, SIGAA offline) — via API mock (`erro` / `offline`)
- [x] UI do login (card CEFET-MG, piping dourado, rodapé "Criar conta" → SIGAA, `LoginCard`, `PasswordInput`)

### 3.2 Dashboard Central
- [x] Header com saudação, nome do aluno e semestre atual — **via API** (`useDashboard`)
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
- [x] Template `/calendario` (calendário mensal, eventos, datas acadêmicas, grade semanal)
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
- [x] Header com nome completo, código, professor, CH, sala, horário traduzido — **via API** (F7)
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
- [/] Toggle on/off por disciplina — **na página da disciplina** (`SubjectDownloadsPanel`); tela `/configuracoes` = F14
- [x] Indicador de "X arquivos baixados" por matéria
- [/] Link para abrir a pasta local `docs-downloads/{disciplina}/` — UI com `alert` placeholder; abertura real pendente

---

## Fase 5: Motor do PPC e Planejamento Acadêmico

> **Resumo:** Dados do PPC (disciplinas, requisitos), mapa do curso, simulador de matrícula, integralização e calendário acadêmico. Inteligência avançada = **Bloco 3**.

### 5.1 Indexação do PPC
- [x] Popular banco de dados com todas as disciplinas de Eng. Computação (DCDV):
  - Código, nome, tipo (Obrigatória/Optativa/Extensão), CH, período, ementa
- [x] Popular tabela de requisitos (pré-requisitos e co-requisitos)
- [x] Dados extraídos do mapa mental existente + PPC oficial

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
- [ ] Alerta quando estiver perto de concluir uma categoria

### 5.5 Calendário Acadêmico
- [x] Tela com as datas oficiais do semestre (matrícula, trancamento, aulas, recessos)
- [ ] Alertas/notificações para datas próximas
- [ ] Verificação periódica de novas datas publicadas

---

## Fase 6: Sincronização e Polimento

> **Resumo:** Backup JSON, caminho do `.db` na nuvem (Bloco 1 Etapa 4) + skeletons, animações e favicon (Bloco 4).

### 6.1 Exportação de Dados
- [ ] Botão "Exportar Dados (JSON)" nas configurações
- [ ] Botão "Importar Dados (JSON)" nas configurações
- [ ] Validação dos dados importados antes de sobrescrever

### 6.2 Configuração do Caminho do Banco
- [ ] Tela de configurações com campo para escolher a pasta do banco `.db`
- [ ] Instrução visual: "Coloque em uma pasta do Google Drive para sincronizar de graça"
- [ ] Reinicialização automática do app ao mudar o caminho

### 6.3 Sincronização via Google Drive
- [ ] O aluno aponta o banco para pasta sincronizada (Drive/OneDrive/Dropbox)
- [ ] O app detecta e usa o arquivo `.db` da pasta configurada

### 6.4 Polimento Visual
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

## Fase 7 (Futuro): App Mobile

> **Resumo:** Mesmo planner no celular via Expo, lendo `.db` sincronizado — **Bloco 5**.

- [ ] Criar projeto React Native (Expo) reaproveitando componentes
- [ ] Integrar Google Drive API para leitura do `.db`
- [ ] Implementar modo offline
- [ ] Adaptar UI para telas de celular

---

## Notas para Outros Agentes de IA

Se você é um agente de IA continuando este projeto, aqui estão informações cruciais:

1. **Leia o `docs/SCOPE.md`** antes de qualquer implementação. Ele contém todas as regras de negócio.
2. **O `README.md`** na raiz contém a arquitetura e a paleta de cores.
3. **O mapa mental do curso** (grade curricular com pré/co-requisitos) foi fornecido como imagem e deve ser convertido em dados estruturados.
4. **O SIGAA é uma aplicação JSF (Java Server Faces).** Os formulários usam `javax.faces.ViewState` e IDs dinâmicos. O scraper deve usar Playwright (não requests simples) por causa do JavaScript.
5. **URLs do SIGAA mudam de sessão para sessão.** Sempre navegue pelo menu, não por URLs hardcoded.
6. **O design deve ser PREMIUM.** Cores do Cruzeiro (Azul #0060B1 + Dourado #D4A843), glassmorphism, micro-animações. Nada genérico.
7. **Atualize o `docs/TASKS.md` sempre que trabalhar em uma task:**
   - Ao **iniciar**: marque como `[/]` — Em progresso (ou adicione a task se não existir).
   - Ao **concluir**: marque como `[x]` — Concluída.
   - Faça **commit** ao finalizar (push não é obrigatório).
8. **Código frontend** está em `app/src/` (não na raiz `src/`). Mock data em `app/src/config/mock/`.
9. **Roadmap por blocos** (back/front, ordem de execução) está na seção [Roadmap por Blocos](#roadmap-por-blocos-ordem-de-execução). **Checklist linear com progresso:** [Checklist mestre](#checklist-mestre-ordem-linear). Siga a ordem `B` antes de `F` dentro de cada etapa.
10. **Auditoria de status:** tasks `[x]` nas Fases 3–6 = **UI shell** quando a rota ainda usa `config/mock/` (calendário, mapa, simulador). Integralização: UI pronta, dados mock até F11. Integração SQLite: [Checklist mestre](#checklist-mestre-ordem-linear) — dashboard + disciplinas ✅ (23/42 no checklist linear; extensões 3A: B12b/c, F5b/c, F6b, F8b–F8f). Próximo bloco linear: **3B Calendário** (B13–F10). Última auditoria: 25/jun/2026.
