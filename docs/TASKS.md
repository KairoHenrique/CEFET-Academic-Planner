# 📝 CEFET Academic Planner — Roadmap e Tasks

Este documento contém todas as tasks do projeto, organizadas por fase. Cada task tem um status e detalhes suficientes para qualquer desenvolvedor (humano ou IA) entender e implementar.

**Legenda:**
- `[ ]` — Não iniciada
- `[/]` — Em progresso
- `[x]` — Concluída

---

## Fase 0: Planejamento e Documentação
- [x] Levantamento de requisitos com o stakeholder
- [x] Análise do portal SIGAA (estrutura, URLs, dados disponíveis)
- [x] Definição da stack tecnológica (Next.js + Playwright + SQLite)
- [x] Criação do README.md completo
- [x] Criação do SCOPE.md com todas as regras de negócio
- [x] Criação do TASKS.md (este arquivo)
- [x] Obter e indexar o PPC de Engenharia da Computação (PDF → dados estruturados)

---

## Fase 1: Setup da Infraestrutura

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

> **Progresso:** Etapas 1–2 ✅ · Etapa 3A backend (B9–B12) ✅ · próximo: F6–F8 (disciplinas no front).

Roadmap detalhado por blocos (back/front, ordem de execução): ver seção **[Roadmap por Blocos](#roadmap-por-blocos-ordem-de-execução)** abaixo.

---

## Roadmap por Blocos (ordem de execução)

Estratégia: **fatias verticais** — backend da feature primeiro, depois frontend que consome a API. Não fechar 100% do front antes do back.

**Legenda de tipo:** `B` = Backend · `F` = Frontend · `Int` = Integração (back + front)

**O que permanece no client (localStorage) durante o Bloco 1:**
- Layout modular de módulos (`useModuleLayout`)
- Extras na grade semanal (monitoria, estágio)
- Simulação de notas (modo "Simular" na disciplina)
- `/simulador` (Montar Grade) — continua mock até Bloco 2.4

---

## Checklist mestre (ordem linear)

Legenda rápida: linha `[x]` = fatia concluída · linha `[ ]` = pendente · `·` = tasks extras na mesma fatia.

### Bloco 1 — API + UI ↔ SQLite `🟡 em progresso (20/42)`

- [x] **BACK:**  B1 → B2 → B3 → B4 → B5
- [x] **BACK:**  B6 → B7 → B8
- [x] **FRONT:** F1 → F2 → F3 → F4 → F5 · F5b · F5c
- [x] **BACK:**  B9 → B10 → B11 → B12
- [ ] **FRONT:** F6 → F7 → F8
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

### Bloco 2 — Scraper SIGAA `⬜ não iniciado (0/10)`

- [ ] **BACK:**  B24 → B25 → B26
- [ ] **BACK:**  B27
- [ ] **BACK:**  B28 → B29
- [ ] **BACK:**  B30
- [ ] **BACK:**  B31
- [ ] **FRONT:** F18
- [ ] **FRONT:** F19

### Bloco 3 — Inteligência acadêmica `⬜ não iniciado (0/11)`

- [ ] **BACK:**  B32 → B33 → B34
- [ ] **FRONT:** F21 → F22 → F23
- [ ] **BACK:**  B35
- [ ] **FRONT:** F20
- [ ] **BACK:**  B36 → B37
- [ ] **FRONT:** F24

### Bloco 4 — Polimento e sync externa `⬜ não iniciado (0/5)`

> Export/import e tela de configurações estão no **Bloco 1, Etapa 4** (B20–F17).

- [ ] **FRONT:** F25 → F26 → F27
- [ ] **BACK:**  B38
- [ ] **FRONT:** F28

### Bloco 5 — Mobile (Fase 7) `⬜ futuro`

- [ ] **FRONT:** App React Native (Expo)
- [ ] **BACK:**  Integração Drive API para `.db`
- [ ] **FRONT:** Modo offline + UI mobile

### Resumo de progresso

| Bloco | Status | Concluído |
|-------|--------|-----------|
| 1 — API + SQLite | 🟡 Em progresso | 20 / 42 (Etapas 1–2 + 3A back ✅) |
| 2 — Scraper SIGAA | ⬜ Não iniciado | 0 / 10 |
| 3 — Inteligência acadêmica | ⬜ Não iniciado | 0 / 11 |
| 4 — Polimento | ⬜ Não iniciado | 0 / 5 |
| 5 — Mobile | ⬜ Futuro | 0 / 3 |

---

### Bloco 1 — API + UI ↔ SQLite

Objetivo: app deixa de ser só mock; dados fluem **SQLite → API → React**.

#### Etapa 1 — Fundação (só backend) ✅

| # | Tipo | Task | Status |
|---|------|------|--------|
| B1 | Back | Bootstrap do SQLite (`ensureDbReady`, migrations de colunas) | [x] |
| B2 | Back | CRUD completo em `lib/db/queries.ts` (todas as tabelas) | [x] |
| B3 | Back | `seed-demo.ts` — popular aluno/semestre a partir dos mocks | [x] |
| B4 | Back | Camada `lib/api/` (errors, response, validate, withDb) | [x] |
| B5 | Back | Tipos compartilhados em `lib/types/` (mocks reexportam) | [x] |

#### Etapa 2 — Sync + Dashboard ✅

| # | Tipo | Task | Status |
|---|------|------|--------|
| B6 | Back | Serviço `lib/sync/run-sync.ts` (pipeline mock, sem Playwright) | [x] |
| B7 | Back | `POST /api/sync` | [x] |
| B8 | Back | `GET /api/dashboard` | [x] |
| F1 | Front | `lib/api/client.ts` — fetch wrapper com tipos e erros | [x] |
| F2 | Front | `useSync` → `POST /api/sync` | [x] |
| F3 | Front | `LoginForm` passa credenciais reais para sync | [x] |
| F4 | Front | Dashboard lê `GET /api/dashboard` (header, stats, tarefas, disciplinas, integralização) | [x] |
| F5 | Front | Loading + estado vazio/erro no dashboard | [x] |
| F5b | Front | `LogoutButton` na navbar + limpar sessão/credenciais | [x] |
| F5c | Front | Credenciais salvas para re-sync na navbar (`lib/auth/credentials.ts`) | [x] |

> **F5 — escopo parcial:** `WeeklySchedulePreview` no dashboard ainda usa mock/localStorage (conclusão em **F13**).  
> **Data fetching:** hooks nativos em F1–F5; adotar **TanStack Query** a partir de **F6** (Etapa 3A).

**Ordem:** `B6 → B7 → B8` → depois `F1 → F2 → F3 → F4 → F5`

#### Etapa 3 — Demais telas (back → front)

> **3A Disciplinas:** backend ✅ (B9–B12) · front pendente (F6–F8)

##### 3A — Disciplinas

| # | Tipo | Task | Status |
|---|------|------|--------|
| B9 | Back | `GET /api/disciplinas` (listagem + busca/filtro) | [x] |
| B10 | Back | `GET /api/disciplinas/[code]` (detalhe: ementa, notas, faltas, tarefas, grupo) | [x] |
| B11 | Back | `PATCH /api/disciplinas/[code]/notas` — avaliação manual | [x] |
| B12 | Back | `PATCH /api/tarefas/[id]` — marcar concluída | [x] |
| F6 | Front | `/disciplinas` — `SubjectList` via API (introduzir **TanStack Query**) | [ ] |
| F7 | Front | `/disciplinas/[code]` — painéis via API | [ ] |
| F8 | Front | `useSubjectGrades` lê/escreve notas via API | [ ] |

##### 3B — Calendário

| # | Tipo | Task | Status |
|---|------|------|--------|
| B13 | Back | `GET /api/calendar` — tarefas, provas, datas acadêmicas | [ ] |
| B14 | Back | `POST /api/calendar/events` — evento manual | [ ] |
| B15 | Back | `PATCH /api/calendar/events/[id]` — concluir/editar | [ ] |
| F9 | Front | `useCalendarEvents` → API | [ ] |
| F10 | Front | `CalendarioView`, `CalendarAcademicDates`, `AddEventForm` | [ ] |

##### 3C — Integralização

| # | Tipo | Task | Status |
|---|------|------|--------|
| B16 | Back | `GET /api/integralizacao` | [ ] |
| B17 | Back | `POST /api/integralizacao` — horas manuais | [ ] |
| F11 | Front | `IntegrationTable` + `IntegrationProgress` via API | [ ] |

##### 3D — Mapa do curso

| # | Tipo | Task | Status |
|---|------|------|--------|
| B18 | Back | `GET /api/mapa` — disciplinas por período + status (histórico + requisitos) | [ ] |
| F12 | Front | `CourseMapGrid` via API | [ ] |

##### 3E — Grade semanal

| # | Tipo | Task | Status |
|---|------|------|--------|
| B19 | Back | `GET /api/schedule` — slots de `semestre_atual` | [ ] |
| F13 | Front | `WeeklyScheduleTable` via API (extras permanecem em localStorage) | [ ] |

##### 3F — Simulador de matrícula

| # | Tipo | Task | Status |
|---|------|------|--------|
| — | — | **Fora do Bloco 1** — `/simulador` continua mock até Bloco 2.4 | — |

**Ordem sugerida Etapa 3:** `B9–B12 → F6–F8` → `B13–B15 → F9–F10` → `B16–B17 → F11` → `B18 → F12` → `B19 → F13`

#### Etapa 4 — Configurações + backup (Bloco 1 + Fase 6.1/6.2)

| # | Tipo | Task | Status |
|---|------|------|--------|
| B20 | Back | `GET /api/config` + `PUT /api/config` (db_path, toggles PDF) | [ ] |
| B21 | Back | `POST /api/export` — dump JSON | [ ] |
| B22 | Back | `POST /api/import` — validar + importar | [ ] |
| B23 | Back | `lib/db/index.ts` — respeitar `DB_PATH` de `configuracoes` | [ ] |
| F14 | Front | Nova rota `/configuracoes` + link na navbar | [ ] |
| F15 | Front | Formulário: caminho do `.db`, dica Drive/OneDrive | [ ] |
| F16 | Front | Botões Exportar / Importar JSON | [ ] |
| F17 | Front | Aviso de reinício ao mudar caminho do banco | [ ] |

**Ordem:** `B20 → B21 → B22 → B23` → `F14 → F15 → F16 → F17`

> Checklist linear completo: ver **[Checklist mestre](#checklist-mestre-ordem-linear)** acima.

---

### Bloco 2 — Scraper SIGAA (Fase 2)

Objetivo: dados reais do SIGAA substituem `seed-demo` no `runSync`.

| # | Tipo | Task | Fase | Status |
|---|------|------|------|--------|
| B24 | Back | `lib/scraper/auth.ts` — login Playwright + sessão/cookies | 2.1 | [ ] |
| B25 | Back | Criptografia AES-256 para senha local (opcional) | 2.1 | [ ] |
| B26 | Back | Tratamento de erros: credenciais, timeout, SIGAA offline | 2.1 | [ ] |
| B27 | Back | Scraper portal do discente (RG, integralização, semestre, tarefas) | 2.2 | [ ] |
| B28 | Back | Scraper turma virtual por disciplina (notas, faltas, tarefas, grupo) | 2.3 | [ ] |
| B29 | Back | Download de PDFs/materiais → `docs-downloads/{disciplina}/` | 2.3 | [ ] |
| B30 | Back | Turmas ofertadas + calendário acadêmico + histórico PDF | 2.4 | [ ] |
| B31 | Back | Integrar scraper no `runSync` (substituir seed-demo) | 2.x | [ ] |
| F18 | Front | Remover simulação de erros mock no login (erros reais do scraper) | 2.1 | [ ] |
| F19 | Front | `/simulador` — turmas ofertadas via API | 2.4 | [ ] |

**Ordem:** `B24 → B25 → B26` → `B27` → `B28 → B29` → `B30` → `B31` → `F18` → `F19`

> Checklist: **[Bloco 2](#bloco-2--scraper-sigaa--não-iniciado-010)** no checklist mestre.

---

### Bloco 3 — Inteligência acadêmica (Fase 5)

Objetivo: regras de negócio com dados reais (pré-requisitos, matrícula, grafo).

| # | Tipo | Task | Fase | Status |
|---|------|------|------|--------|
| B32 | Back | Motor de elegibilidade (histórico + pré-requisitos) | 5.3 | [ ] |
| B33 | Back | Detecção de choque de horários na API | 5.3 | [ ] |
| B34 | Back | Persistir/exportar simulação de matrícula | 5.3 | [ ] |
| B35 | Back | `GET /api/mapa/grafo` — nós e arestas para react-flow | 5.2 | [ ] |
| B36 | Back | Alertas de integralização (limiar por categoria) | 5.4 | [ ] |
| B37 | Back | Alertas de calendário acadêmico (datas próximas) | 5.5 | [ ] |
| F20 | Front | Grafo interativo com `react-flow` (zoom, pan, setas pre/co) | 5.2 | [ ] |
| F21 | Front | Simulador: filtro de matérias elegíveis + drag-and-drop | 5.3 | [ ] |
| F22 | Front | Choque de horários — alerta visual na grade | 5.3 | [ ] |
| F23 | Front | Salvar / exportar simulação de matrícula | 5.3 | [ ] |
| F24 | Front | Alertas de integralização e calendário acadêmico | 5.4–5.5 | [ ] |

**Ordem:** `B32 → B33 → B34` → `F21 → F22 → F23` → `B35 → F20` → `B36 → B37 → F24`

> Checklist: **[Bloco 3](#bloco-3--inteligência-acadêmica--não-iniciado-011)** no checklist mestre.

---

### Bloco 4 — Polimento e sync externa (Fase 6)

Objetivo: UX de produção e backup/sync via pasta na nuvem.

| # | Tipo | Task | Fase | Status |
|---|------|------|------|--------|
| F25 | Front | Loading skeletons em todas as telas | 6.4 | [ ] |
| F26 | Front | Animações de transição entre páginas | 6.4 | [ ] |
| F27 | Front | Favicon e título personalizado | 6.4 | [ ] |
| B38 | Back | Detecção de `.db` em pasta Drive/OneDrive/Dropbox | 6.3 | [ ] |
| F28 | Front | Indicador de status da pasta sincronizada | 6.3 | [ ] |

**Ordem:** após Bloco 1 Etapa 4 → `F25 → F26 → F27` → `B38 → F28`

> Export/import JSON e tela de configurações estão no **Bloco 1, Etapa 4** (B20–B23, F14–F17).  
> Checklist: **[Bloco 4](#bloco-4--polimento-e-sync-externa--não-iniciado-04)** no checklist mestre.

---

### Visão geral dos blocos

```
Bloco 1 (API + SQLite)     →  Bloco 2 (Scraper SIGAA)
        ↓                              ↓
Bloco 3 (PPC, matrícula)   ←  dados reais
        ↓
Bloco 4 (Polimento)
        ↓
Fase 7 (Mobile — futuro)
```

---

## Fase 2: Motor de Scraping (SIGAA)

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

### 3.1 Tela de Login
- [x] Input de usuário e senha do SIGAA
- [/] Checkbox "Salvar senha localmente (criptografada)" — persiste credenciais; **criptografia AES = B25**
- [x] Botão "Entrar e Sincronizar"
- [x] Loading state com progresso da sincronização
- [x] Tratamento de erro visual (credenciais inválidas, SIGAA offline) — via API mock (`erro` / `offline`)

### 3.2 Dashboard Central
- [x] Header com saudação, nome do aluno e semestre atual — **via API** (`useDashboard`)
- [/] Card de RG com indicador visual (cor baseada na faixa) — RG numérico em `StatsRow`; **faixa de cores pendente**
- [x] Barra de integralização com breakdown por tipo de CH — **via API** (página `/integralizacao` ainda mock → F11)
- [/] Lista "Próximas Entregas" (5 próximas tarefas/avaliações) — lista pendentes da API; **limite de 5 pendente**
- [x] Modal com detalhes da tarefa ao clicar (descrição, entregáveis, link à disciplina)
- [x] Grid de cards de disciplinas (nota, faltas, próxima atividade por matéria) — **via API**
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
- [x] Template `/disciplinas` (listagem com busca e filtros)
- [x] Template `/disciplinas/[code]` (detalhe: notas, faltas, tarefas)
- [x] Template `/mapa` (grade curricular por período com status)
- [x] Template `/integralizacao` (resumo, barras e tabela de CH)
- [x] Template `/simulador` (montar grade / matrícula)
- [x] Página `not-found` customizada
- [x] Layout compartilhado (`PageHeader`, `PageGrid`) e mock data em `config/mock/`
- [x] Componentes UI base: `Modal`, `FilterBar`, `ActivityDetail`, `SectionHeader`, `Icon`

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

### 4.1 Página Individual da Disciplina
- [x] Header com nome completo, código, professor, CH, sala, horário traduzido (template mock)
- [x] Seção de Ementa (texto do PPC)
- [x] Card de Nota Atual (tabela de avaliações, pontos faltando — template mock)
- [x] Card de Faltas (barra de progresso até o limite, cores por zona de risco — template mock)
- [x] Lista de Tarefas (com data e tipo — template mock)
- [x] Clique na tarefa abre modal com descrição, instruções e entregáveis

### 4.2 Tabela de Notas Detalhada
- [x] Tabela com avaliações mock (PRO1, SEM, PRO2, Nota)
- [x] Coluna de "valor máximo" visível (não apenas no hover)
- [x] Botão "+ Adicionar Avaliação" para cadastro manual
- [x] Indicador de "faltam X pontos para distribuir"
- [x] Destaque da nota necessária para aprovação (banner + coluna Necessário)

### 4.3 Simulador de Notas
- [x] Mover simulador de notas para a página individual de cada disciplina
- [x] Campos editáveis para inserir notas hipotéticas (modo "Simular notas" na matéria)
- [x] Cálculo em tempo real da nota final
- [x] Indicador "Aprovado" ou "Reprovado" simulado
- [x] Impacto simulado no RG do semestre
- [x] Botão "Limpar Simulação" para voltar aos dados reais
- [x] Exibir quanto falta em cada avaliação para atingir aprovação (coluna "Necessário")

### 4.4 Tela de Frequência
- [x] Tabela cronológica de datas e status (Presente/Falta/Não Registrada)
- [x] Card resumo: "X faltas de Y permitidas (Z dias restantes)"
- [x] Indicador visual de zona de risco (verde → amarelo → vermelho)

### 4.5 Download Automático de PDFs
- [/] Toggle on/off por disciplina — **na página da disciplina** (`SubjectDownloadsPanel`); tela `/configuracoes` = F14
- [x] Indicador de "X arquivos baixados" por matéria
- [/] Link para abrir a pasta local `docs-downloads/{disciplina}/` — UI com `alert` placeholder; abertura real pendente

---

## Fase 5: Motor do PPC e Planejamento Acadêmico

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
- [ ] Alerta quando estiver perto de concluir uma categoria

### 5.5 Calendário Acadêmico
- [x] Tela com as datas oficiais do semestre (matrícula, trancamento, aulas, recessos)
- [ ] Alertas/notificações para datas próximas
- [ ] Verificação periódica de novas datas publicadas

---

## Fase 6: Sincronização e Polimento

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
- [ ] Adicionar animações de transição entre páginas
- [/] Adicionar loading skeletons em todas as telas — **só dashboard** (`DashboardSkeleton`); demais telas = F25
- [x] Responsividade básica (breakpoints mobile/tablet/desktop)
- [/] Favicon e título personalizado na aba do navegador — título em `layout.tsx` ✅; **favicon.ico pendente**

---

## Fase 7 (Futuro): App Mobile
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
10. **Auditoria de status:** tasks `[x]` nas Fases 3–6 significam **UI shell** (muitas ainda em `config/mock/`). Integração real com SQLite segue o [Checklist mestre](#checklist-mestre-ordem-linear) (Bloco 1: Etapas 1–2 + B9–B12 ✅; próximo: F6–F8). Última auditoria: 25/jun/2026.
