# 📝 CEFET Academic Planner — Roadmap e Tasks

Este documento contém todas as tasks do projeto, organizadas por fase. Cada task tem um status e detalhes suficientes para qualquer desenvolvedor (humano ou IA) entender e implementar.

> ## Direção atual — Sync SIGAA → Cloud → PIX → Mobile
>
> **Prioridade:** terminar Bloco 1 (SQLite) → **Scraper/sync real (Bloco 2) enquanto o semestre está ativo** → depois Supabase/deploy. ~~Download automático de materiais SIGAA~~ **fora de escopo** (cancelado jun/2026). Ver também [`docs/SCOPE-CLOUD.md`](./SCOPE-CLOUD.md).
>
> - **Regras acadêmicas:** [`docs/SCOPE.md`](./SCOPE.md)
> - **Ordem de execução:** [§ Ordem oficial](#ordem-oficial-de-execução-v3)
> - **Modo testes:** deploy global após sync validado; RLS na fase 6c (antes do PIX)
> - **Pré-mobile (#6d):** orquestração sync + catálogo global — policy **§6.6 `SCOPE-CLOUD`** (jul/2026) · **B68a–c** ✅ · implementar **B68d–f** + painel policy **B70/F41**

**Navegação rápida:** [Roadmap detalhado (#0→#11)](#roadmap-detalhado--ordem-de-execução-0--11) · [Sequência #0→#11](#sequência-completa--o-que-fazer-e-em-qual-ordem) · [Ordem oficial v3](#ordem-oficial-de-execução-v3) · [Checklist BACK→FRONT](#checklist-mestre-ordem-de-execução) · [Detalhe por bloco](#detalhe-dos-blocos) · [B68 orquestração sync](#6d--orquestração-sync--catálogo-global-pré-mobile) · [Escopo cloud](./SCOPE-CLOUD.md) · [Apêndice escopo futuro](#apêndice--escopo-futuro-fora-da-ordem-011) · [Apêndice B65 dev](#apêndice--b65-sync-automático-dev-remover-antes-de-produção) · [Apêndice gift + painel dev](#apêndice--chaves-gift-e-painel-dev-jun2026)

**Legenda:**
- `[ ]` — Não iniciada
- `[/]` — Em andamento (marcar **antes** de codar)
- `[%]` — Commit local feito; **sem push** (aguardando revisão ou push)
- `[@]` — **Push feito**; no remoto mas **sem aprovação 100%** (bugs/validação pendente — usuário avisa)
- `[x]` — Finalizada e **aprovada 100%** pelo stakeholder

> **⛔ Regra inviolável:** este arquivo deve estar **100% sincronizado** em **todas** as seções sempre que uma task mudar de status ou escopo — tabela B/F, checklist mestre, contador `X/49`, §1.4, bullets de UI, notas para agentes, **sem texto stale**. Fluxo completo: [`.cursor/rules/tasks-workflow.mdc`](../.cursor/rules/tasks-workflow.mdc) → **Sincronizar TASKS.md (10 pontos)** + **Verificação final**.

### Status `@` — push sem aprovação 100%

Use **`[@]`** quando o código já foi **enviado ao remoto** (`git push`), mas a task **ainda não está 100% validada** (bugs conhecidos, scraper parcial, UX a refinar).

| Situação | Marcação |
|----------|----------|
| Commit local, ainda sem push | `[%]` |
| Push feito; usuário avisa que **não** está 100% | **`[@]`** |
| Push feito **e** usuário aprova 100% | `[x]` |
| Task em `[@]`; usuário aprova depois | `[@]` → `[x]` |

**Regra:** o stakeholder **avisa explicitamente** quando a entrega **não** está 100% aprovada. Após push com ressalvas → **`[@]`**, nunca `[x]`.

**Tasks em `[@]` (jul/2026):** **B54** (worker Playwright — pendente validação VPS/Docker) · **F19** `[x]` · **B67** `[x]`.

**Polish pós-push (jun/2026, sem nova task):** `04887c9` — fix alerta nota nova pós-sync (baseline pré-sync) + nota obtida/máxima no sino · `5923e9c` — nome da disciplina no `SubjectCard` abre `/disciplinas/[código]`.

---

## Roadmap detalhado — ordem de execução (#0 → #11)

> **Próximo oficial:** **Bloco 2b** (B55). **B54** `[@]` · Back **B67** `[x]` · **F19** `[x]` · PPC EngComp **v3** reindexado (jul/2026).
> **Regra:** siga **#0 → #11** · dentro de cada bloco → **BACK (B) antes de FRONT (F)**. Checklist espelho: [Checklist mestre](#checklist-mestre-ordem-de-execução).

### #0 — Planejamento `✅`

- [x] Levantamento de requisitos com o stakeholder
- [x] Análise do portal SIGAA (estrutura, URLs, dados disponíveis)
- [x] Definição da stack (Next.js + Supabase + Playwright worker + PIX + Expo) — `SCOPE-CLOUD.md`
- [x] README.md · SCOPE.md · TASKS.md
- [x] PPC Eng. Computação indexado — **v3 (2026)** · `docs/referencias/PPC_EngComp-Div-v3.pdf`
- [x] Sequência multi-PPC (Mecatrônica/Moda **só pós-mobile**) + glossário CH (`SCOPE.md` §6.2, §6.4)

---

### #1 — Bloco 1 · API + UI ↔ SQLite `✅ 49/49`

> Fatias verticais: **back → front** por etapa. `/simulador` (3F) consome **B67** `[x]` via API (**F19** `[x]`).

#### Etapa 1 — Fundação ✅
- [x] **BACK:** B1 *(bootstrap SQLite — abre/migra `.db` na inicialização)*
- [x] **BACK:** B2 *(CRUD `queries.ts` — leitura/escrita de todas as tabelas)*
- [x] **BACK:** B3 *(`seed-demo.ts` — popula aluno e semestre a partir dos mocks)*
- [x] **BACK:** B4 *(camada `lib/api/` — errors, response, validate, withDb)*
- [x] **BACK:** B5 *(tipos `lib/types/` — contratos back ↔ front)*

#### Etapa 2 — Sync + Dashboard ✅
- [x] **BACK:** B6 *(`run-sync.ts` — orquestra sync; scraper real no B31)*
- [x] **BACK:** B7 *(`POST /api/sync` — dispara sincronização com credenciais)*
- [x] **BACK:** B7b *(prioridade dados usuário — sync não apaga/sobrescreve dados do aluno)*
- [x] **BACK:** B8 *(`GET /api/dashboard` — header, stats, tarefas, matérias)*
- [x] **FRONT:** F1 *(`lib/api/client.ts` — fetch tipado + tratamento de erro)*
- [x] **FRONT:** F2 *(`useSync` — loading/erro do sync)*
- [x] **FRONT:** F3 *(`LoginForm` — credenciais reais para o sync)*
- [x] **FRONT:** F4 *(dashboard via API — header, stats, cards)*
- [x] **FRONT:** F5 *(loading/erro/vazio no dashboard)*
- [x] **FRONT:** F5b *(`LogoutButton` — sair e limpar sessão)*
- [x] **FRONT:** F5c *(credenciais salvas — re-sync rápido pela navbar)*
- [x] **FRONT:** F5d *(invalidação cruzada tarefas — dashboard, disciplina, calendário)*

#### Etapa 3A — Disciplinas ✅
- [x] **BACK:** B9 *(`GET /api/disciplinas` — lista com busca/filtro)*
- [x] **BACK:** B10 *(`GET /api/disciplinas/[code]` — ementa, notas, faltas, tarefas, grupo)*
- [x] **BACK:** B11 *(`PATCH .../notas` — add/update/delete, nota extra, override)*
- [x] **BACK:** B12 *(`PATCH /api/tarefas/[id]` — toggle, editar, excluir)*
- [x] **BACK:** B12b *(`POST .../tarefas` — tarefa manual na disciplina)*
- [x] **BACK:** B12c *(`PATCH .../faltas` — presença/falta por data)*
- [x] **BACK:** B12d *(`PATCH .../appearance` — cor, apelido, sala, horário, professor, h/sem)*
- [x] **FRONT:** F6 *(`/disciplinas` — `SubjectList` via API + TanStack Query)*
- [x] **FRONT:** F7 *(`/disciplinas/[code]` — painéis notas, faltas, tarefas via API)*
- [x] **FRONT:** F8 *(`useSubjectGrades` — CRUD notas, inline, nota extra)*
- [x] **FRONT:** F6b *(`SubjectList` UX — filtros Risco/Crítico/Aprovados, colunas Sala/Horário)*
- [x] **FRONT:** F8b *(`SubjectTasksPanel` — CRUD tarefas + filtro Concluídas)*
- [x] **FRONT:** F8c *(`SubjectAbsencePanel` — faltas via API)*
- [x] **FRONT:** F8d *(risco de nota + recuperação — `GradeRiskIndicator`, localStorage)*
- [x] **FRONT:** F8e *(prioridade + selects — `PrioritySelect`, `TaskSortSelect`)*
- [x] **FRONT:** F8f *(simulador local polish — menu overlay, pré-preenche notas reais)*
- [x] **FRONT:** F8g *(aparência da matéria — cor, modal editar header, `useSubjectAppearance`)*
- [x] **FRONT:** F8h *(validação de notas — clamp pontos, nota extra até 100)*
- [x] **FRONT:** F8i *(TanStack Query dashboard — `useDashboard` + invalidação cruzada)*

#### Etapa 3B — Calendário ✅
- [x] **BACK:** B13 *(`GET /api/calendar` — tarefas, provas e datas do semestre)*
- [x] **BACK:** B14 *(`POST /api/calendar/events` — inserir evento manual)*
- [x] **BACK:** B15 *(`PATCH .../events/[id]` — editar ou marcar concluído)*
- [x] **BACK:** B15b *(tipos de evento — monitoria, estágio, estudo, outro + migration DB)*
- [x] **FRONT:** F9 *(`useCalendarEvents` — hook que alimenta o calendário)*
- [x] **FRONT:** F10 *(`CalendarioView`, datas acadêmicas, form)*
- [x] **FRONT:** F10b *(polish — checkbox concluída ao vivo, scroll painel eventos)*

#### Etapa 3C — Integralização ✅
- [x] **BACK:** B16 *(`GET /api/integralizacao` — totais por tipo de CH PPC + histórico local)*
- [x] **BACK:** B17 *(`POST /api/integralizacao` — horas complementares manuais)*
- [x] **BACK:** refino pós-B30 *(`build-integralizacao` + `resolveCategoryDoneHours` priorizam histórico PDF)*
- [x] **FRONT:** F11 *(painéis integralização — donut + tabela via API + cadastro de horas)*
- [x] **FRONT:** F11b *(glossário de CH — modal “Entenda suas horas” + ícone ?)*

#### Etapa 3D — Mapa do curso ✅
- [x] **BACK:** B18 *(`GET /api/mapa` — grade obrigatória PPC 1–10; status histórico + pré-requisitos)*
- [x] **FRONT:** F12 *(`CourseMapGrid` — layout 1–5/6–10 + ementas PPC)*

#### Etapa 3E — Grade semanal ✅
- [x] **BACK:** B19 *(`GET /api/schedule` — slots Seg–Sex do SIGAA)*
- [x] **FRONT:** F13 *(`WeeklyScheduleTable` + `useSchedule`; extras monitoria no localStorage)*

**Ordem Bloco 1:** `B1–B5` → `B6–B8` → `F1–F5` · `F5b–F5d` → `B9–B12d` → `F6–F8i` → `B13–B15b` → `F9–F10b` → `B16–B17` → `F11–F11b` → `B18` → `F12` → `B19` → `F13`

---

### #2 — Bloco 2a · Scraper SIGAA — dev `✅ 8/8`

> **⚠️ Prioridade pós-Bloco 1:** validar Playwright com **semestre ativo** antes do Supabase. Dev local + SQLite.

- [x] **BACK:** B24 → B25 → B26 *(auth: login Playwright `verTelaLogin.do` + cookies · B25 AES-256 “lembrar senha” · B26 erros credencial/timeout/SIGAA offline)*
- [x] **BACK:** B27 *(portal: semestre, RG, tarefas; CH portal auxiliar; apelidos auto)*
- [x] **BACK:** B65 *(sync automático 30 min + `sync.last_at`; manual sem rate limit — **dev**, ver [Apêndice B65](#apêndice--b65-sync-automático-dev-remover-antes-de-produção))*
- [x] **BACK:** B28 *(turma virtual: notas, faltas, grupo, tarefas; UI Ver grupo; nome do grupo; arredondamento nota final)*
- [x] **BACK:** B30 *(histórico escolar PDF — captura no menu, parser, `historico` + CH na integralização)*
- [x] **BACK:** B31 *(pipeline full/incremental, policies por etapa, login rápido, DB por CPF — commit `a7a02ac`, testes `bloco-2a-b31`)*
- [x] **FRONT:** F18 *(erros reais no login — credenciais inválidas, SIGAA offline, timeout API; mock removido; hint “primeiro acesso demora” no 1º sync bloqueante)*
- [x] **FRONT:** F37 *(modal perfil, tutorial, `/planos`, dados conta + assinatura dev; último sync via **B65**)*
- [x] **FRONT:** F38 *(sino in-app: tarefas/notas novas + lembretes 24h/1h; polish `04887c9` baseline pré-sync + nota obtida/máxima)*
- [x] **BACK:** B66 *(calendário acadêmico — robô isolado `POST /api/sync/calendario` + UI painel dual-semestre)*
- [x] **BACK:** B67 *(turmas ofertadas — Ensino → Consultar Turmas do Próx. Semestre; Atendida/Pendente; `curso` vs `optativas` PPC; `scheduleBlocker` ⛔; `POST /api/sync/turmas` + `GET /api/turmas-ofertadas`)*
- [x] **FRONT:** F19 *(`/simulador` via API — montar grade real; preview multi-horário; coreq par rollback+modal; cards uniformes; CH obr/opt/total; export JPEG)*

**Ordem 2a:** `B24→B26` → `B27` → `B65` → `B28` → `B30` → `B31` → `F18` → `F37` → `F38` → `B66` → `B67` → `F19` · **8/8** até `F37`

---

### #3 — Bloco 2b · Worker sync (servidor) `🟡 1/5`

> Fila §6.3 `SCOPE-CLOUD` — 1 job global, auto **3h/usuário**, manual **fim da fila** + cooldown **5 min**.

- [@] **BACK:** B54 *(worker Playwright — `app/worker/` · HTTP `/health` `/status` `/jobs` · `BrowserJobSlot` max 1 · Docker · graceful shutdown)*
- [ ] **BACK:** B55 *(API fila sync — filas prioritária + normal; enqueue; status/posição/ETA)*
- [ ] **BACK:** B56 *(pipeline B24–B31 no worker — credenciais cifradas no servidor)*
- [ ] **OPS:** O3 *(cooldowns produção — auto ≥3h/usuário; manual 5 min; manual → fim da fila; **exceção:** painel `/dev` **B70/F41** dispara robôs **sem cooldown**)*
- [ ] **FRONT:** F19 *(status fila na UI — substituir `useAutoSync`; alinhar **F37**; `/simulador` real **B67**)*

**Ordem 2b:** `B54 → B55 → B56` → `O3` → `F19`

---

### #4 — Bloco 6a · Supabase + deploy global `⬜ 0/8`

> **Só após B31 validado.** RLS flexível nesta fase (testes globais).

- [ ] **PLAN:** Projeto Supabase free + env dev/prod
- [ ] **BACK:** B39 *(schema Postgres — tabelas + `user_id` nullable em teste)*
- [ ] **BACK:** B41 *(seed PPC global — disciplinas/requisitos read-only)*
- [ ] **BACK:** B42 *(client Supabase — adapter queries SQLite→PG)*
- [ ] **BACK:** B43 *(migrar APIs — dashboard, disciplinas, sync stub)*
- [ ] **OPS:** O1 *(deploy Cloudflare Pages + cron ping Supabase)*
- [ ] **OPS:** O2 *(remover `.db` local em prod)*
- [ ] **TEST:** T1 *(smoke deploy — URL abre, seed carrega)*

**Ordem 6a:** `PLAN` → `B39 → B41 → B42 → B43` → `O1 → O2` → `T1`

---

### #5 — Bloco 6b · Auth (CPF login + cadastro) `⬜ 0/9`

> Cadastro = e-mail + telefone + CPF + curso + senha SIGAA · **login só CPF + senha** · trial 7d 1×/CPF.

- [ ] **BACK:** B44 *(conta do aluno — cadastro e-mail/tel/CPF/`curso_id`; login só CPF)*
- [ ] **BACK:** B45 *(credenciais cifradas AES no servidor — obrigatório para worker **B56**)*
- [ ] **BACK:** B58 *(trial por CPF — `trial_por_cpf` 7 dias uma vez; anti-abuso)*
- [ ] **BACK:** B63 *(`curso_id` — Comp/Meca/Moda; mapa/integralização filtram PPC)*
- [ ] **BACK:** B59 *(gate de acesso — middleware trial_active/active vs expirado → billing)*
- [ ] **FRONT:** F29 *(cadastro + login produção — CPF explícito no login)*
- [ ] **FRONT:** F36 *(menu Config no avatar — toggle notificações e-mail)*
- [ ] **BACK:** B61 *(`notificacoes_email_ativas` + PATCH configurações)*
- [ ] **BACK:** B62 *(e-mails transacionais — fila atividades + nota de prova; respeita toggle)*

**Ordem 6b:** `B44 → B45 → B58 → B63` → `B59` → `F29 → F36` → `B61 → B62`

---

### #6 — Bloco 6c · RLS multi-tenant `⬜ 0/2`

> **Obrigatório antes do Bloco 7 (PIX).**

- [ ] **BACK:** B40 *(RLS policies Postgres — `user_id = auth.uid()`)*
- [ ] **TEST:** T2 *(smoke isolamento — 2 contas não veem dados uma da outra)*

**Ordem 6c:** `B40` → `T2`

---

### #6d — Orquestração sync + catálogo global (pré-mobile) `🟡 3/6`

> **Policy fechada (jul/2026):** `SCOPE-CLOUD` **[§6.6](./SCOPE-CLOUD.md#66-política-de-sync--decisão-de-produto-jul2026)** · botão **lite** · global R2/R3 · batch noturno · policy editável no `/dev`.

- [x] **PLAN:** B68a *(matriz gatilho × robô — R1 full/lite/deep · R2 · R3 — §6.6)*
- [x] **PLAN:** B68b *(TTLs por camada + intervalo **ou** data fixa no painel dev — defaults §6.6)*
- [x] **PLAN:** B68c *(botão **Sincronizar** = **R1-lite** notas+tarefas; **R1-deep** batch noturno / “sync completo” perfil)*
- [ ] **BACK:** B68d *(schema global vs `user_id` — PPC, calendario_academico, turmas_ofertadas, `app_config` policy; **B39** depende)*
- [ ] **BACK:** B68e *(orquestrador — cron batch 03–06h · R2/R3 global · R1-deep fila · `max_concurrent` CPFs distintos · parar B66 pós-sync CPF)*
- [ ] **BACK:** B68f *(pipeline `lite`/`deep` · login rápido R1-lite · ler policy **B70** em runtime)*

**Ordem #6d:** `B68a → B68b → B68c` ✅ → `B68d` → `B68e → B68f`

---

### #7 — Bloco 7 · Assinatura PIX `⬜ 0/12`

> **Só após 6c.** Preços TBD.

- [ ] **PLAN:** B47 *(planos e preços — semestre/ano; trial 7d fechado 1×/CPF)*
- [ ] **PLAN:** B48 *(gateway PIX — Mercado Pago, Asaas, etc.)*
- [ ] **BACK:** B49 *(tabelas billing — `plans`, `subscriptions`, `payments`)*
- [ ] **BACK:** B50 *(`POST /api/billing/checkout` — checkout PIX)*
- [ ] **BACK:** B51 *(webhook — confirmação → `subscription.active`)*
- [ ] **BACK:** B52 *(gate middleware — bloqueia trial_expired/pending/expired → PIX)*
- [ ] **BACK:** B53 *(renovação — novo PIX + grace period TBD)*
- [ ] **BACK:** B69 *(chaves gift — gerar 8 chars + resgate único + `POST /api/billing/redeem-key`)*
- [ ] **BACK:** B70 *(painel dev API — `/api/dev/*`; login operador; contas, chaves, promoções; **`GET/PATCH /api/dev/sync-policy`** §6.6; disparo robôs **sem cooldown**)*
- [ ] **FRONT:** F31 *(cadastro + plano — após trial ou CPF já usado)*
- [ ] **FRONT:** F32 *(tela PIX — QR + copia-e-cola + aguardando)*
- [ ] **FRONT:** F33 *(renovação — assinatura expirada)*
- [ ] **FRONT:** F34 *(minha assinatura — plano, validade, histórico)*
- [ ] **FRONT:** F40 *(resgate chave plano — 8 chars em login/cadastro/`/planos`)*
- [ ] **FRONT:** F41 *(painel `/dev` — login operador; contas/chaves; chavinhas R1/R2/R3; **seção Orquestração sync** — TTLs, data fixa, batch noturno, `max_concurrent`; individual/global)*
- [ ] **LEGAL:** L1 *(termos + LGPD — política de privacidade)*
- [ ] **BACK:** B71 *(endurecimento credenciais — **última pré-go-live**; ocultar senhas no `/dev`)*

**Ordem Bloco 7:** `B47–B48` → `B49–B53` → `B69–B70` → `F31–F34` → `F40–F41` → `L1` → **`B71`**

---

### #8 — Bloco 8 · Mobile Expo Go `⬜ 0/10`

> **Requer #6d + #7.** Mesmo backend Supabase.

- [ ] **SETUP:** M1 *(projeto Expo TypeScript — pasta `mobile/`)*
- [ ] **SETUP:** M2 *(Supabase client — env + auth no Expo)*
- [ ] **FRONT:** M3 *(auth mobile — login + checagem assinatura)*
- [ ] **FRONT:** M4 *(dashboard mobile — stats, entregas, cards)*
- [ ] **FRONT:** M5 *(disciplinas — lista + detalhe)*
- [ ] **FRONT:** M6 *(calendário — agenda mensal leitura)*
- [ ] **FRONT:** M7 *(mapa PPC — grid estático)*
- [ ] **SHARED:** M8 *(tipos compartilhados — `packages/` ou copy types)*
- [ ] **TEST:** M9 *(Expo Go — fluxo Android/iOS)*
- [ ] **FUTURE:** M10 *(EAS Build — lojas pós-MVP)*

**Ordem Bloco 8:** `M1–M2` → `M3–M7` → `M8` → `M9` → `M10`

---

### #9 — Bloco 3 · Inteligência acadêmica `⬜ 0/11`

> Depende de dados reais do Bloco 2.

- [ ] **BACK:** B32 *(motor elegibilidade — histórico + pré-requisitos → pode cursar?)*
- [ ] **BACK:** B33 *(choque de horários — API detecta sobreposição na grade)*
- [ ] **BACK:** B34 *(persistir simulação — salvar/exportar grade montada)*
- [ ] **FRONT:** F21 *(simulador elegível — filtro + drag-and-drop na grade)*
- [ ] **FRONT:** F22 *(alerta choque — destaque visual de conflito)*
- [ ] **FRONT:** F23 *(salvar simulação — botões salvar/exportar matrícula)*
- [ ] **BACK:** B35 *(`GET /api/mapa/grafo` — nós e arestas para react-flow)*
- [ ] **FRONT:** F20 *(grafo react-flow — zoom, pan, setas sólidas/pontilhadas)*
- [ ] **BACK:** B36 *(alertas integralização — limiar por categoria de CH)*
- [ ] **BACK:** B37 *(alertas calendário — datas acadêmicas próximas)*
- [ ] **FRONT:** F24 *(alertas na UI — banners integralização + calendário)*

**Ordem Bloco 3:** `B32–B34` → `F21–F23` → `B35` → `F20` → `B36–B37` → `F24`

---

### #10 — Bloco 4 · Polimento UX `⬜ 0/3`

- [ ] **FRONT:** F25 *(loading skeletons — todas as telas)*
- [ ] **FRONT:** F26 *(transições de página entre rotas)*
- [ ] **FRONT:** F27 *(favicon + título na aba)*

**Ordem Bloco 4:** `F25 → F26 → F27`

---

### #11 — Multi-PPC (Mecatrônica + Moda) `🔒 0/4`

> **⛔ Só após #8** com Eng. Computação 100% funcional.

- [ ] **PLAN:** PPC Eng. Mecatrônica (Divinópolis)
- [ ] **PLAN:** PPC Design de Moda (Divinópolis)
- [ ] **BACK:** indexar disciplinas + requisitos + metas CH (Meca + Moda)
- [ ] **BACK/FRONT:** mapa/integralização por `curso_id` (cadastro grava curso no 6b)

**Ordem #11:** `PLAN PPCs` → `indexar seeds` → `curso_id` → smoke por curso

---

### Decisão — Integralização via histórico (jun/2026)

> **Fonte de verdade da CH concluída:** tabela `historico` (matérias aprovadas/cursadas) + PPC (`disciplinas.carga_horaria`) via `computeChDoneFromDisciplinas` — **não** os blocos “CH pendente” do portal SIGAA.

| Camada | Papel |
|--------|--------|
| **B27** (portal) | RG, semestre atual, tarefas, % integralizado e total currículo — **referência/auxiliar** |
| **B30** (histórico escolar) | Popular `historico` com matérias já passadas → alimenta mapa + integralização |
| **B16/B17** (já ✅) | API/UI; após B30, `build-integralizacao` passa a priorizar cálculo local |
| **Manual** | CH complementar/extensão/flexibilizada continua via `POST /api/integralizacao` |

**Pós-B30 (jun/2026):** `build-integralizacao` + `resolveCategoryDoneHours` priorizam histórico PDF (`fromHistoricoPdf`) e cálculo local (`computeChDoneFromDisciplinas`); portal SIGAA permanece auxiliar/fallback.

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
- [x] Pasta `src/lib/scraper` — B24–B26 ✅; B27 ✅ portal; B28 ✅ turma virtual; B30 ✅ histórico PDF (`lib/scraper/historico/`)
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

> **Progresso:** Bloco 1 ✅ (`49/49`) · **Bloco 2a** ✅ · **Bloco 2b** — **B54** `[@]` · pendente **B55–B56** · **O3** · **F19** (fila UI).
> **Próximo:** **B55** (fila sync API).

Roadmap detalhado: ver **[Roadmap #0→#11 no topo](#roadmap-detalhado--ordem-de-execução-0--11)** · [Ordem oficial v3](#ordem-oficial-de-execução-v3). **F19** `[x]` · **B67** `[x]`.

---

## Ordem oficial de execução (v3)

> **Princípio (jun/2025):** terminar Bloco 1 no SQLite → **sync SIGAA real (Bloco 2) antes do Supabase** — semestre acaba em breve e só com turma ativa dá para validar Playwright de verdade → depois cloud (6a/6b) → RLS (6c) → PIX → mobile → inteligência → polimento.  
> **Modo testes global (6a):** URL pública + Supabase free; **RLS/multi-tenant só na 6c**, antes do PIX.

```
FASE A   Bloco 1 (3E)          SQLite local — grade semanal ✅
    ↓
FASE B   Bloco 2a            Scraper dev (B24–B31) — sync REAL ⚠️ prioridade semestre
         Bloco 2b            Worker servidor (B54–B56)
    ↓
FASE C   Bloco 6a            Supabase + deploy global (seed, sem RLS rígido)
         Bloco 6b            Auth app + credenciais SIGAA cifradas
         Bloco 6c            RLS multi-tenant — obrigatório antes de cobrar
    ↓
         Bloco 2c            Orquestração sync + global (B68-orq) — policy §6.6
    ↓
FASE D   Bloco 7             Assinatura PIX
    ↓
FASE E   Bloco 8             Mobile Expo Go
    ↓
FASE F   Bloco 3             Inteligência acadêmica
         Bloco 4             Polimento UX (F25–F27)
    ↓
FASE G   Bloco 9             Multi-PPC (Mecatrônica, Moda) 🔒 só após mobile (#8)
```

| # | Fase | Bloco | O que fazer | Por quê nesta ordem |
|---|------|-------|-------------|---------------------|
| **0** | — | **0** | Planejamento | ✅ Concluído |
| **1** | A | **1** | SQLite local completo (3E ✅) | ✅ Fechado — iniciar sync |
| **2** | B | **2a** | Scraper B24–B31 (sync + histórico) | **Validar sync com SIGAA real antes do fim do semestre** |
| **3** | B | **2b** | Worker B54–B56 | Sync assíncrono em produção |
| **4** | C | **6a** | Supabase + PG + deploy URL pública | Testes globais **depois** do sync funcionar |
| **5** | C | **6b** | Auth: login CPF; cadastro e-mail/tel/curso | Contas + PPC + gate |
| **6** | C | **6c** | RLS por usuário | Segurança antes de abrir pagamento |
| **6d** | B | **2c** | Orquestração sync + catálogo global (**B68-orq**) | **Antes do mobile** — policy §6.6 · **B68a–c** ✅ |
| **7** | D | **7** | PIX + gate de acesso | Monetização com produto estável |
| **8** | E | **8** | Expo Go | Mobile após **#6d** + cloud estável |
| **9** | F | **3** | Grafo, matrícula, alertas | Precisa dados reais do scraper |
| **10** | F | **4** | Skeletons, transições, favicon | Acabamento final |
| **11** | — | **9** | Multi-PPC (Mecatrônica, Moda) | **Só após #8 mobile** com Eng. Computação completa |

### Sync antes da cloud (decisão de produto)

- Bloco **2a** roda em **dev local + SQLite** — não precisa Supabase para testar login SIGAA, portal e turmas.
- Objetivo: substituir `seed-demo` por pipeline Playwright **ainda com semestre ativo**.
- Supabase (**6a**) só depois que **B31** validado ✅ e **2b** fila desenhada.

### Modo global de testes (6a)

- Deploy Cloudflare Pages com URL compartilhável.
- Supabase free; seed-demo ou dados já sincronizados do scraper.
- RLS **permissivo ou desligado** — ok para beta fechado.
- **6c obrigatório** antes do **Bloco 7** (PIX) e divulgação ampla.

---

## Roadmap por Blocos (referência)

Estratégia: **fatias verticais** — backend primeiro, depois frontend.

**Legenda:** `B` = Backend · `F` = Frontend · `M` = Mobile · `O` = Ops

### Resumo — blocos (numeração de referência)

| Bloco | Exec. # | Em uma linha |
|-------|---------|--------------|
| **0** | #0 | Planejamento ✅ |
| **1** | #1 | API + SQLite ✅ |
| **2** | #2–3 | Scraper SIGAA — **prioridade pós-Bloco 1** |
| **6** | #4–6 | Cloud Supabase — **após sync validado** |
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
- `/simulador` (Montar Grade) — **F19** `[x]` via API + sync **B67** `[x]`

---

## Checklist mestre (ordem de execução)

> Siga **exatamente** a sequência **#0 → #11** abaixo. Não pule blocos (ex.: Supabase **#4** só depois do sync **#2–#3**).  
> **Regra:** dentro de cada bloco → **`BACK` (B) primeiro**, depois **`FRONT` (F)**. Detalhes nas [tabelas por bloco](#detalhe-dos-blocos).

Legenda: `[x]` aprovada 100% · `[@]` push sem aprovação total · `[%]` commit local (sem push) · `[/]` andamento · `[ ]` pendente · `·` = task extra

### Sequência completa — o que fazer e em qual ordem

| Exec. | Bloco | Nome | Fazer agora / depois | Status |
|-------|-------|------|----------------------|--------|
| **#0** | 0 | Planejamento | — | ✅ |
| **#1** | 1 | SQLite local (API + UI) | ✅ **Concluído** | 49/49 |
| **#2** | 2a | Scraper dev (Playwright local) | ✅ **8/8** · B67 `[x]` · **F19** `[x]` | 8/8 |
| **#3** | 2b | Worker sync (servidor) | Depois de #2a · fila §6.3 `SCOPE-CLOUD` | 1/5 |
| **#4** | 6a | Supabase + deploy global | Depois de #3 | 0/8 |
| **#5** | 6b | Auth: CPF login, cadastro completo | Depois de #4 | 0/9 |
| **#6** | 6c | RLS multi-tenant | **Obrigatório antes do PIX** | 0/2 |
| **#6d** | 2c | Orquestração sync + catálogo global | **Antes do mobile (#8)** · policy **§6.6** · **3/6** | 3/6 |
| **#7** | 7 | Assinatura PIX | Depois de #6 | 0/12 |
| **#8** | 8 | Mobile Expo Go | Depois de **#6d** + #7 | 0/10 |
| **#9** | 3 | Inteligência acadêmica | Depois de #2 (dados reais) | 0/11 |
| **#10** | 4 | Polimento UX | Por último (antes de multi-PPC) | 0/3 |
| **#11** | 9 | Multi-PPC (Mecatrônica, Moda) | **🔒 Só após #8** | 0/4 |

> **Atalho:** [Roadmap detalhado topo](#roadmap-detalhado--ordem-de-execução-0--11) · [Checklist #1](#1--bloco-1--api--ui--sqlite-4949) · [#2–#3](#2-3--bloco-2--scraper-sigaa-detalhe) · [#6d](#6d--orquestração-sync--catálogo-global-pré-mobile) · [#4–#6](#4-6--bloco-6--cloud--supabase-detalhe) · [#7](#7--bloco-7--assinatura-pix-detalhe) · [#8](#8--bloco-8--mobile-expo-go-detalhe) · [#9](#9--bloco-3--inteligência-acadêmica-detalhe) · [#10](#10--bloco-4--polimento-ux-detalhe) · [#11](#11--expansão-multi-ppc-detalhe)

---

### #1 — Bloco 1 · API + UI ↔ SQLite `✅ 49/49`

> Fatias verticais: **back → front** por etapa. **Detalhes completos:** [Roadmap #1 no topo](#1--bloco-1--api--ui--sqlite-4949).

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

#### Etapa 3C — Integralização ✅
- [x] **BACK:**  B16 → B17
- [x] **FRONT:** F11 · F11b

#### Etapa 3D — Mapa do curso ✅
- [x] **BACK:**  B18
- [x] **FRONT:** F12

#### Etapa 3E — Grade semanal ✅
- [x] **BACK:**  B19
- [x] **FRONT:** F13 *(dashboard + `/calendario` via `useSchedule` + extras localStorage)*

> **3F (Simulador de matrícula)** — **F19** `[x]` via `GET /api/turmas-ofertadas` + **B67** `[x]` (`POST /api/sync/turmas`).

---

### #2 — Bloco 2a · Scraper SIGAA — dev `✅ 8/8`

> **⚠️ Prioridade pós-Bloco 1:** validar Playwright com **semestre ativo** antes do Supabase. Dev local + SQLite.  
> **Detalhes completos:** [Roadmap #2 no topo](#2--bloco-2a--scraper-sigaa--dev-88).

- [x] **BACK:** B24 → B25 → B26 *(auth: login Playwright `verTelaLogin.do` + cookies de sessão · B25 AES-256 “lembrar senha” no SQLite · B26 erros credencial inválida, timeout, SIGAA offline)*
- [x] **BACK:** B27 *(portal: semestre, RG, tarefas; CH portal auxiliar; apelidos auto)*
- [x] **BACK:** B65 *(sync automático 30 min + `sync.last_at`; manual sem rate limit — **dev**, ver [Apêndice B65](#apêndice--b65-sync-automático-dev-remover-antes-de-produção))*
- [x] **BACK:** B28 *(turma virtual: notas, faltas, grupo, tarefas; UI Ver grupo; nome do grupo; arredondamento nota final)*
- [x] **BACK:** B30 *(histórico escolar PDF — captura no menu, parser, `historico` + CH na integralização)*
- [x] **BACK:** B31 *(pipeline full/incremental, policies por etapa, login rápido, DB por CPF — commit `a7a02ac`, testes `bloco-2a-b31`)*
- [x] **FRONT:** F18 *(erros reais no login — credenciais inválidas, SIGAA offline, timeout API; mock de falhas removido; hint “primeiro acesso demora” no 1º sync bloqueante)*
- [x] **FRONT:** F37 *(modal perfil, tutorial, `/planos`, dados conta + assinatura dev; último sync via **B65**)*
- [x] **FRONT:** F38 *(sino in-app: tarefas/notas novas + lembretes 24h/1h; polish `04887c9` baseline pré-sync + nota obtida/máxima)*
- [x] **BACK:** B66 *(calendário acadêmico — robô isolado `POST /api/sync/calendario` + UI painel dual-semestre)*
- [x] **BACK:** B67 *(turmas ofertadas — Ensino → Consultar Turmas do Próx. Semestre; Atendida/Pendente; `curso` vs `optativas` PPC; `scheduleBlocker` ⛔; `POST /api/sync/turmas` + `GET /api/turmas-ofertadas`)*
- [x] **FRONT:** F19 *(`/simulador` via API — montar grade real; preview multi-horário; coreq par rollback+modal; cards uniformes; CH obr/opt/total; export JPEG)*

**Ordem 2a (execução linear):** `B24→B26` → `B27` → `B65` → `B28` → `B30` → `B31` → `F18` → `F37` → `F38` → `B66` → `B67` → `F19`

**Contagem 8/8:** só os 8 primeiros grupos até **`F37`** · **`F38` · `B66` · `B67` · `F19`** = extras (fora do 8/8) · polish `04887c9`/`5923e9c` · modulação dashboard · fix mapa/histórico/notificações (jun/2026)

**Próximo:** **B55** (fila sync) · **#6d:** `B68-orq` fora desta fila — ver [#6d](#6d--orquestração-sync--catálogo-global-pré-mobile)

---

### #3 — Bloco 2b · Scraper SIGAA — worker `🟡 1/5`

> **Escopo fila:** [`SCOPE-CLOUD.md` §6.3](./SCOPE-CLOUD.md#63-fila-de-sync--decisão-fechada-mvp-worker) — 1 job global, auto **3h/usuário**, manual **fim da fila** + cooldown **5 min**, **prioridade** no 1º login.

- [@] **BACK:**  B54 — worker Playwright (`app/worker/` · slot 1 browser · Docker · POST `/jobs` R1)
- [ ] **BACK:**  B55 — API fila sync (prioritária + normal; posição/ETA; polling ou Realtime)
- [ ] **BACK:**  B56 — pipeline B24–B31 no worker (credenciais cifradas)
- [ ] **OPS:**   O3 — cooldowns produção (auto 3h · manual 5 min · reinicia timer pós-sync); **exceção** painel `/dev` **B70/F41**
- [ ] **FRONT:** F19 — status fila na UI (substituir `useAutoSync` client; alinhar **F37**)

**Ordem 2b:** `B54 → B55 → B56` → `O3` → `F19` *(UI fila antes ou junto de F37 produção)*

---

### #6d — Orquestração sync + catálogo global (pré-mobile) `🟡 3/6`

> **Policy fechada (jul/2026):** `SCOPE-CLOUD` **[§6.6](./SCOPE-CLOUD.md#66-política-de-sync--decisão-de-produto-jul2026)**.

- [x] **PLAN:**  B68a — matriz gatilho × robô (R1 full/lite/deep · R2 · R3)
- [x] **PLAN:**  B68b — TTLs por camada; intervalo **ou** data fixa via painel `/dev`
- [x] **PLAN:**  B68c — botão **Sincronizar** = **R1-lite** (notas+tarefas); deep = batch noturno
- [ ] **BACK:**  B68d — schema global vs `user_id` + `app_config` policy *(**B39** depende)*
- [ ] **BACK:**  B68e — orquestrador cron + fila R1-deep + R2/R3 global + `max_concurrent`
- [ ] **BACK:**  B68f — pipeline lite/deep + runtime lê policy **B70**

**Ordem #6d:** `B68a → B68b → B68c` ✅ → `B68d` → `B68e → B68f`

**Antes do mobile (#8):** concluir **B68d–f** + worker **B54–B56** consome policy.

---

### #4 — Bloco 6a · Cloud — deploy global (testes) `⬜ 0/8`

> Supabase + Postgres + URL pública. **Só após B31 validado.** RLS flexível nesta fase.

- [ ] **PLAN:** Projeto Supabase free + env dev/prod
- [ ] **BACK:**  B39 → B41 → B42 → B43
- [ ] **OPS:**   O1 → O2
- [ ] **TEST:**  T1 — smoke: URL abre, seed carrega

**Ordem 6a:** `PLAN` → `B39 → B41 → B42 → B43` → `O1 → O2` → `T1`

---

### #5 — Bloco 6b · Cloud — Auth `⬜ 0/9`

- [ ] **BACK:**  B44 → B45 → B58 → B63 → B59 → B61 → B62
- [ ] **FRONT:** F29 · F36

**Ordem 6b:** `B44 → B45 → B58 → B63` → `B59` → `F29 → F36` → `B61 → B62`

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

> **Pré-mobile:** **#6d (B68-orq)** — policy **§6.6** · **B68a–c** ✅ · pendente **B68d–f** + painel policy **B70/F41**.

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
- [ ] **BACK/FRONT:** indexar PPCs Meca/Moda + mapa/integralização por `curso_id` (cadastro já grava curso no 6b)

**Ordem #11:** `PLAN PPCs` → `indexar seeds` → `curso_id` → smoke por curso

---

### Resumo de progresso (por ordem de execução)

| Exec. # | Bloco | Status | Progresso |
|---------|-------|--------|-----------|
| #0 | 0 — Planejamento | ✅ | Concluído |
| **#1** | **1 — SQLite** | ✅ **Concluído** | 49 / 49 |
| **#2** | **2a — Scraper dev** | ✅ **8/8** · B67 `[x]` · **F19** `[x]` | 8 / 8 |
| **#3** | **2b — Worker sync** | 🟡 | 1 / 5 |
| #4 | 6a — Cloud deploy | ⬜ *(após #3)* | 0 / 8 |
| #5 | 6b — Cloud auth | ⬜ | 0 / 9 |
| #6 | 6c — RLS | ⬜ *(antes PIX)* | 0 / 2 |
| **#6d** | **2c — Orquestração sync** | 🟡 *(antes mobile)* | 3 / 6 |
| #7 | 7 — Assinatura PIX | ⬜ | 0 / 12 |
| #8 | 8 — Mobile Expo Go | ⬜ *(após #6d)* | 0 / 10 |
| #9 | 3 — Inteligência | ⬜ | 0 / 11 |
| #10 | 4 — Polimento UX | ⬜ | 0 / 3 |
| #11 | 9 — Multi-PPC | 🔒 *(após #8)* | 0 / 4 |

---

## Detalhe dos blocos

> **Ordem de leitura = ordem de execução:** #1 → #2–#3 → #4–#6 → **#6d** → #7 → #8 → #9 → #10 → (#11).  
> Checklist resumido: [Checklist mestre](#checklist-mestre-ordem-de-execução) · Diagrama: [Ordem oficial v3](#ordem-oficial-de-execução-v3).

| Exec. | Seção abaixo |
|-------|----------------|
| **#1** | [Bloco 1 — SQLite](#1--bloco-1--api--ui--sqlite-detalhe) |
| **#2–#3** | [Bloco 2 — Scraper SIGAA](#2-3--bloco-2--scraper-sigaa-detalhe) |
| **#4–#6** | [Bloco 6 — Cloud Supabase](#4-6--bloco-6--cloud--supabase-detalhe) |
| **#6d** | [Orquestração sync + catálogo global](#6d--orquestração-sync--catálogo-global-pré-mobile) |
| **#7** | [Bloco 7 — PIX](#7--bloco-7--assinatura-pix-detalhe) |
| **#8** | [Bloco 8 — Mobile](#8--bloco-8--mobile-expo-go-detalhe) |
| **#9** | [Bloco 3 — Inteligência](#9--bloco-3--inteligência-acadêmica-detalhe) |
| **#10** | [Bloco 4 — Polimento](#10--bloco-4--polimento-ux-detalhe) |
| **#11** | [Multi-PPC](#11--expansão-multi-ppc-detalhe) *(após mobile)* |

---

### #1 — Bloco 1 · API + UI ↔ SQLite (detalhe)

**Objetivo:** app deixa de ser só mock; dados fluem **SQLite → API → React**.

| Etapa | Foco | O que entrega |
|-------|------|----------------|
| **1** | Fundação | Schema, CRUD, seed, camada API, tipos |
| **2** | Dashboard | Sync mock + `GET /dashboard` + login real + navbar |
| **3A** | Disciplinas | Listagem, detalhe, notas, tarefas, faltas via API |
| **3B** | Calendário | Eventos acadêmicos + tarefas/provas na agenda ✅ |
| **3C** | Integralização | CH por categoria + horas manuais ✅ |
| **3D** | Mapa | Grade obrigatória PPC (1–10) + status via API (B18 · F12 ✅); optativas fora do mapa |
| **3E** | Grade semanal | Horários do semestre via `GET /api/schedule` + UI (B19 · F13 ✅) |
| **3F** | Simulador matrícula | **F19** `[x]` API real · **B67** `[x]` turmas ofertadas |

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

> **F5 — grade semanal:** ✅ via API (`useSchedule` · F13). Extras (monitoria/estágio) permanecem em localStorage (`useScheduleExtras`).
> **Data fetching:** TanStack Query no dashboard (**F8i**), disciplinas, calendário e mutations de notas/tarefas.

**Ordem:** `B6 → B7 → B7b → B8` → depois `F1 → F2 → F3 → F4 → F5` · `F5b` · `F5c` · `F5d`

#### Etapa 3 — Demais telas (back → front)

> **3C Integralização:** ✅ · **3D Mapa:** ✅ · **3E Grade:** ✅ · **3F Simulador:** F19 `[x]` · B67 `[x]`

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
| B12d | Back | `PATCH .../appearance` | Cor, apelido, nome, sala, horário, professor, horas/sem | [x] |
| F6 | Front | `/disciplinas` | `SubjectList` via API + TanStack Query | [x] |
| F7 | Front | `/disciplinas/[code]` | Painéis de notas, faltas, tarefas via API | [x] |
| F8 | Front | `useSubjectGrades` | CRUD notas, inline, nota extra | [x] |
| F8b | Front | `SubjectTasksPanel` | CRUD tarefas + filtro Concluídas | [x] |
| F8c | Front | Faltas via API | `SubjectAbsencePanel` + hook de presença | [x] |
| F6b | Front | `SubjectList` UX | Filtros Risco/Crítico/Aprovados, colunas Sala/Horário, linha clicável | [x] |
| F8d | Front | Risco de nota + recuperação | `GradeRiskIndicator`, `RecoveryGradeEntry`, `grade-risk.ts` (recuperação em localStorage) | [x] |
| F8e | Front | Prioridade + selects | `PrioritySelect`, `PlannerSelect`, `useStoredPriorities`, `TaskSortSelect` | [x] |
| F8f | Front | Simulador (polish) | Menu overlay, layout estável com frequência, OK em Necessário, pré-preenche notas reais | [x] |
| F8g | Front | Aparência da matéria | Cor, modal editar header (nome/apelido/sala/horário/h·sem/professor), `useSubjectAppearance` | [x] |
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

> **Resumo:** Página `/integralizacao` — **CH concluída calculada no app** (`historico` + PPC + semestre atual; ver [decisão integralização](#decisão--integralização-via-histórico-jun2026)). Portal SIGAA = % e total currículo (auxiliar). Horas manuais complementares/extensão. Glossário SCOPE §6.4.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B16 | Back | `GET /api/integralizacao` | Totais por tipo de CH (PPC + histórico local) | [x] |
| B17 | Back | `POST /api/integralizacao` | Registrar horas complementares manuais | [x] |
| — | Decisão | CH via histórico | Primário = `historico` sync (**B30**); portal = auxiliar | [x] |
| — | Back | Refino pós-B30 | `build-integralizacao` + `resolveCategoryDoneHours` priorizam histórico PDF | [x] |
| F11 | Front | Painéis integralização | Donut + tabela via API + cadastro de horas | [x] |
| F11b | Front | Glossário de CH | Modal “Entenda suas horas” + ícone ? (obrigatória, optativa/eletiva, complementar, extensão, flexibilizada) | [x] |

##### 3D — Mapa do curso

> **Resumo:** `/mapa` — grade **obrigatória** PPC (períodos 1–5 / 6–10), status via API, `useMapa`, perfil PPC com ementas ao clicar. **Optativas/eletivas ficam fora do mapa** (catálogo mutável no SIGAA) — acompanhe em `/integralizacao` + histórico sync. **Simulação what-if:** `SCOPE.md` §6.1.1.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B18 | Back | `GET /api/mapa` | Disciplinas por período + status (histórico + pré-requisitos); exclui catálogo optativa | [x] |
| B68 | Back | Simulação mapa | `GET/PATCH /api/mapa/simulacao` — overlay concluídas; merge opcional no mapa | [ ] |
| F12 | Front | `CourseMapGrid` | Grid via API + layout 1–5/6–10 + ementas PPC (sem faixa optativas) | [x] |
| F39 | Front | Modo simulação mapa | Toggle what-if; marcar concluídas; visual distinto; limpar simulação | [ ] |
| — | Decisão | Mapa sem catálogo optativas | Optativas só em integralização + sync; mapa = obrigatórias 1–10 | [x] |

##### 3E — Grade semanal

> **Resumo:** Horários oficiais do semestre (`semestre_atual`) na grade; extras (monitoria) continuam no localStorage.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B19 | Back | `GET /api/schedule` | Slots Seg–Sex traduzidos do SIGAA (`codigo_horario` + fallback `horario_traduzido`) | [x] |
| F13 | Front | `WeeklyScheduleTable` | `useSchedule` + TanStack Query; merge extras localStorage | [x] |

##### 3F — Simulador de matrícula

> **Resumo:** `/simulador` (Montar Grade) — **F19** `[x]` via `GET /api/turmas-ofertadas` + sync **B67** `[x]` (`POST /api/sync/turmas`).

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B67 | Back | Turmas ofertadas | Ensino → Consultar Turmas; Atendida/Pendente; curso/optativas PPC; `scheduleBlocker` | [x] |
| F19 | Front | `/simulador` via API | Montar grade real; preview multi-horário; coreq par; cards uniformes; CH obr/opt/total; export JPEG | [x] |

**Ordem sugerida Etapa 3:** `B9–B12 → F6–F8` → `B13–B15 → F9–F10` → `B16–B17 → F11` → `B18 → F12` → `B19 → F13`

> Checklist linear: ver **[Checklist mestre](#checklist-mestre-ordem-de-execução)** · exec. **#1**.

---

### #2–#3 — Bloco 2 · Scraper SIGAA (detalhe)

**Objetivo:** dados reais do SIGAA substituem `seed-demo` no `runSync`. **#2** = dev local · **#3** = worker em produção.

#### 2a — Dev local (#2)

| Fase scraper | O que raspa |
|--------------|-------------|
| **2.1 Auth** | Login Playwright, sessão, senha AES opcional, erros |
| **2.2 Portal** | RG, semestre, tarefas; CH portal (% / total) **auxiliar** |
| **2.3 Turma** | Notas, faltas, grupo, tarefas |
| **2.4 Extra** | **B30** histórico · **B66** calendário · **B67** turmas · **B68-orq** orquestração *(policy §6.6 · 3/6)* |

| # | Tipo | Task | Resumo | Fase | Status |
|---|------|------|--------|------|--------|
| B24 | Back | `lib/scraper/auth.ts` | Login Playwright + cookies de sessão | 2.1 | [x] |
| B25 | Back | Criptografia AES-256 | “Lembrar senha” cifrada no SQLite *(endurecimento total = **B71**)* | 2.1 | [x] |
| B26 | Back | Erros de auth | Credencial inválida, timeout, SIGAA offline | 2.1 | [x] |
| B27 | Back | Scraper portal discente | RG, semestre, atividades; CH portal auxiliar (% / total) | 2.2 | [x] |
| B65 | Back | Sync automático + last_run | Auto a cada 30 min; manual sem rate limit (dev) | 2.2 | [x] |
| B28 | Back | Scraper turma virtual | Notas, faltas, tarefas, grupo e nome do grupo por matéria | 2.3 | [x] |
| B30 | Back | Histórico escolar | Ensino → Emitir Histórico (PDF) → `historico` + CH resumo | 2.4 | [x] |
| B31 | Back | Integrar no `runSync` | Pipeline full/incremental; policies; login rápido; DB/CPF | 2.x | [x] |
| F18 | Front | Erros reais no login | Credenciais inválidas, SIGAA offline, timeout API; mock removido; hint 1º sync bloqueante | 2.1 | [x] |
| F37 | Front | Menu perfil (avatar) | Modal perfil, tutorial, `/planos`, conta + assinatura dev; último sync (**B65**) | 2.2 | [x] |
| F38 | Front | Sino notificações in-app | Tarefas/notas novas pós-sync; lembretes 24h/1h; baseline pré-sync; nota obtida/máxima | 2.x | [x] |
| B66 | Back | Calendário acadêmico | Robô isolado `POST /api/sync/calendario` + painel dual-semestre | 2.4 | [x] |
| B67 | Back | Turmas ofertadas | Ensino → Consultar Turmas; Atendida/Pendente; curso/optativas PPC; `scheduleBlocker` | 2.4 | [x] |
| F19 | Front | `/simulador` via API | Montar grade real; preview multi-horário; coreq par; cards uniformes; CH obr/opt/total; export JPEG | 2.4 | [x] |
| B68-orq | Plan/Back | Orquestração sync + global | Policy **§6.6** · **B68a–c** ✅ · **B68d–f** pendente — **fora da ordem #2** | 2c | [/] |

**Ordem 2a (#2, linear):** `B24→B26` → `B27` → `B65` → `B28` → `B30` → `B31` → `F18` → `F37` → `F38` → `B66` → `B67` → `F19` · **8/8** até `F37` · **`B68-orq`** = [#6d](#6d--orquestração-sync--catálogo-global-pré-mobile)

> **Nota:** **B29/B57/F35** (materiais SIGAA → nuvem) **cancelados** jun/2026 — ver [Apêndice](#apêndice--escopo-futuro-fora-da-ordem-011).

#### 2b — Worker servidor (#3)

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B54 | Back | Worker Playwright | `app/worker/` · 1 slot browser · HTTP `/jobs` · Docker · graceful shutdown | [@] |
| B55 | Back | API fila sync | Filas prioritária + normal; enqueue; status/posição | [ ] |
| B56 | Back | Pipeline no worker | B24–B31 no servidor; credenciais cifradas | [ ] |
| O3 | Ops | Cooldowns sync | Auto ≥3h/usuário; manual 5 min; manual → fim da fila; **exceção** painel dev **B70** (sem cooldown) | [ ] |
| F19 | Front | UI fila + simulador | Status sync/fila (**F37**); `/simulador` real (**B67**) | [ ] |

**Ordem 2b (#3):** `B54 → B55 → B56` → `O3` → `F19`

#### B54 — Worker Playwright `[@]`

- [x] Processo separado `app/worker/` (`main.ts` · `server.ts`) — fora do Next.js
- [x] `BrowserJobSlot` — semáforo global (`SIGAA_WORKER_MAX_CONCURRENT`, padrão **1**)
- [x] HTTP: `GET /health` · `GET /status` · `POST /jobs` (Bearer `WORKER_SHARED_SECRET`) — job **R1** via `runSync`
- [x] Timeout por job · graceful shutdown (SIGTERM/SIGINT)
- [x] `worker/Dockerfile` (Playwright jammy) · `worker/README.md`
- [x] Testes `tests/worker-b54.test.ts`

> **Próximo:** **B55** — fila na API Next.js enfileira jobs e faz polling no worker.

> Checklist: **[#2](#2--bloco-2a--scraper-sigaa--dev-88)** e **[#3](#3--bloco-2b--scraper-sigaa--worker-05)** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### #4–#6 — Bloco 6 · Cloud / Supabase (detalhe)

**Objetivo:** migrar SQLite → Postgres no Supabase; deploy global; auth; RLS antes do PIX.

#### 6a — Deploy global (#4)

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| — | Plan | Projeto Supabase | Free tier + env dev/prod | [ ] |
| B39 | Back | Schema Postgres | Tabelas + `user_id` (nullable em teste) | [ ] |
| B41 | Back | Seed PPC global | Disciplinas/requisitos read-only | [ ] |
| B42 | Back | Client Supabase | Adapter queries SQLite→PG | [ ] |
| B43 | Back | Migrar APIs | dashboard, disciplinas, sync stub | [ ] |
| O1 | Ops | Deploy Frontend | Cloudflare Pages + Cron Job de ping Supabase | [ ] |
| O2 | Ops | Remover `.db` local | Prod sem `app/.data/planner.db` | [ ] |
| T1 | Test | Smoke deploy | URL abre, seed carrega | [ ] |

**Ordem:** `B39 → B41 → B42 → B43` → `O1 → O2` → `T1`

#### 6b — Auth (#5)

> **Escopo (regras):** `SCOPE.md` §2.0–§2.2, §2.5 · `SCOPE-CLOUD.md` §3–§4.  
> **Resumo:** cadastro = **e-mail + telefone + CPF + senha SIGAA + curso (PPC)**; **login só CPF + senha**; trial **7 dias / 1× por CPF**.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B44 | Back | Conta do aluno | Cadastro: e-mail, telefone, CPF, `curso_id`, senha cifrada; **login só CPF** | [ ] |
| B45 | Back | Credenciais cifradas | Persistência AES (CPF + senha) no servidor — **obrigatório** para sync sem usuário online (worker **B56**) | [ ] |
| B58 | Back | Trial por CPF | Registro `trial_por_cpf`: 7 dias **uma vez** por CPF (anti-abuso) | [ ] |
| B59 | Back | Gate de acesso | Middleware: `trial_active` \| `active` liberam; expirado → billing | [ ] |
| B63 | Back | `curso_id` na conta | Enum Comp/Meca/Moda; mapa/integralização filtram PPC por curso | [ ] |
| B61 | Back | Preferências contato | `notificacoes_email_ativas` + PATCH configurações | [ ] |
| F29 | Front | Cadastro + login | Cadastro: e-mail, tel, CPF, curso, senha · Login: **só CPF + senha** | [ ] |
| F36 | Front | Menu Config (avatar) | Configurações; toggle notificações e-mail | [ ] |
| B62 | Back | E-mails transacionais | Fila: atividades + nota de prova (respeita toggle) | [ ] |

**Ordem 6b:** `B44 → B45 → B58 → B63` → `B59` → `F29 → F36` → `B61 → B62`

> **Fora do 6b:** pagamento PIX e planos pagos = **Bloco 7** (B47–B53). Dev local Bloco 1–2 mantém login SIGAA simples até cloud.

**Removido / absorvido:** F30 (onboarding SIGAA separado) — credenciais entram no **cadastro** (F29).

#### 6c — Multi-tenant (#6)

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B40 | Back | RLS policies | `user_id = auth.uid()` | [ ] |
| T2 | Test | Isolamento | 2 contas não veem dados uma da outra | [ ] |

**Ordem:** `B40` → `T2`

> Checklist: **#4–#6** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### #7 — Bloco 7 · Assinatura PIX (detalhe)

**Objetivo:** plano por período; pagamento PIX no cadastro; gate de acesso.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B47 | Plan | Planos e preços | Semestre / ano; **trial 7d fechado** (1×/CPF) | [ ] |
| B48 | Plan | Gateway PIX | Mercado Pago, Asaas, etc. | [ ] |
| B49 | Back | Tabelas billing | `plans`, `subscriptions`, `payments` | [ ] |
| B50 | Back | Checkout PIX | `POST /api/billing/checkout` | [ ] |
| B51 | Back | Webhook | Confirmação → `subscription.active` | [ ] |
| B52 | Back | Gate middleware | Bloqueia `trial_expired` / `pending_payment` / `expired` → PIX | [ ] |
| B53 | Back | Renovação | Novo PIX + grace period (TBD) | [ ] |
| B69 | Back | Chaves gift | Tabela + gerar 8 chars + resgate único + `POST /api/billing/redeem-key` | [ ] |
| B70 | Back | Painel dev API | Login operador; `/api/dev/*`; **`GET/PATCH /api/dev/sync-policy`**; robôs sem cooldown | [ ] |
| B71 | Back | **Endurecimento credenciais** | **Última task pré-go-live:** ocultar senhas no `/dev`, cifragem plena, zero leak API/logs | [ ] |
| F31 | Front | Cadastro + plano | Após trial ou CPF já usado: escolha semestre/ano + PIX | [ ] |
| F32 | Front | Tela PIX | QR + copia-e-cola + aguardando | [ ] |
| F33 | Front | Renovação | Assinatura expirada | [ ] |
| F34 | Front | Minha assinatura | Plano, validade, histórico | [ ] |
| F40 | Front | Resgate chave plano | Campo 8 chars em login/cadastro/`/planos`; feedback uso único | [ ] |
| F41 | Front | Painel dev `/dev` | Login operador; chavinhas R1/R2/R3; **Orquestração sync** (TTLs, batch, policy §6.6) | [ ] |
| L1 | Legal | Termos + LGPD | Política de privacidade | [ ] |

**Ordem:** `B47 → B48` → `B49 → B50 → B51 → B52 → B53` → `B69` → `B70` → `F31 → F32 → F33 → F34` → `F40` → `F41` → `L1` → **`B71`** *(última — imediatamente antes do go-live público)*

> Escopo gift + painel: [`SCOPE.md` §2.1.1 / §10](./SCOPE.md) · [`SCOPE-CLOUD.md` §3.6 / §8](./SCOPE-CLOUD.md) · [Apêndice](#apêndice--chaves-gift-e-painel-dev-jun2026)

> Checklist: **#7** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### #8 — Bloco 8 · Mobile Expo Go (detalhe)

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

> Checklist: **#8** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### #9 — Bloco 3 · Inteligência acadêmica (detalhe)

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

### #10 — Bloco 4 · Polimento UX (detalhe)

**Objetivo:** skeletons, transições de página e favicon.

| # | Tipo | Task | Resumo | Fase | Status |
|---|------|------|--------|------|--------|
| F25 | Front | Loading skeletons | Placeholders em todas as telas | 6.4 | [ ] |
| F26 | Front | Transições de página | Animações entre rotas | 6.4 | [ ] |
| F27 | Front | Favicon + título | Identidade na aba do browser | 6.4 | [ ] |

**Ordem:** `F25 → F26 → F27`

> Checklist: **#10** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### #11 — Expansão multi-PPC (detalhe)

> **⛔ Só após #8 (Mobile)** com Eng. Computação 100% funcional. Ver `SCOPE.md` §6.2.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| — | Plan | PPC Eng. Mecatrônica | Obter PDF oficial (Divinópolis) | [ ] |
| — | Plan | PPC Design de Moda | Obter PDF oficial (Divinópolis) | [ ] |
| — | Back | Seeds multi-curso | Indexar disciplinas + requisitos + metas CH | [ ] |
| — | Back/Front | `curso_id` | Perfil + mapa/integralização por curso | [ ] |

**Ordem #11:** `PLAN PPCs` → `indexar seeds` → `curso_id` → smoke por curso

> Checklist: **[#11](#11--expansão-multi-ppc-mecatrônica--moda-04)** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### Visão geral (ordem de execução v3)

```
#0  Bloco 0   Planejamento                    ✅
      ↓
#1  Bloco 1   SQLite local (3E)               ✅
      ↓
#2  Bloco 2a  Scraper dev + sync REAL          ✅ 8/8 · B67 [x] · F19 [x]
      ordem: B24→B26→B27→B65→B28→B30→B31→F18→F37→F38→B66→B67→F19
#3  Bloco 2b  Worker + fila (§6.3 SCOPE-CLOUD)
      ↓
#4  Bloco 6a  Supabase + deploy global       (após sync validado)
#5  Bloco 6b  Auth: cadastro + login CPF (0/9)
#6  Bloco 6c  RLS multi-tenant               (antes do PIX)
#6d Bloco 2c  Orquestração sync (B68-orq)     policy §6.6 · 3/6
      ↓
#7  Bloco 7   Assinatura PIX
      ↓
#8  Bloco 8   Mobile Expo Go                 (requer #6d)
      ↓
#9  Bloco 3   Inteligência acadêmica
#10 Bloco 4   Polimento UX
      ↓
#11 Bloco 9   Multi-PPC (Mecatrônica, Moda)  🔒 após #8
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

> **Resumo:** Playwright automatiza login e extração de dados do SIGAA (portal + turmas). **Ordem 2a:** `B24→B26` → `B27` → `B65` → `B28` → `B30` → `B31` → `F18` → `F37` → `F38` → `B66` → `B67` → `F19` · **8/8** até `F37`.

### 2.1 Autenticação
- [x] Implementar login no SIGAA via Playwright (POST para `verTelaLogin.do`) — B24
- [x] Gerenciar sessão/cookies após login bem-sucedido — B24
- [x] Implementar criptografia AES-256 para “lembrar senha” (opcional) — **B25** *(endurecimento total = **B71**, última pré-go-live)*
- [x] Tratamento de erros: senha inválida, SIGAA fora do ar, timeout — B26

### 2.2 Scraper: Portal do Discente
- [x] Extrair dados institucionais (matrícula, curso, status, email, entrada)
- [x] Extrair índices acadêmicos (RG)
- [x] Extrair CH pendente, total currículo e % integralizado do portal (**auxiliar** — cálculo fiel = histórico **B30**)
- [x] Extrair componentes curriculares do semestre (nome, local, código de horário)
- [x] Extrair atividades pendentes (data, tipo, disciplina)

#### B65 — Sync automático + `last_run` `[x]`
- [x] `sync.last_at` em `configuracoes` (`recordSyncCompletedAt` após sync OK)
- [x] `GET /api/perfil` expõe `lastSyncAt` + `intervalMinutes` (30 min fixo)
- [x] `useAutoSync` no client — dispara sync se credenciais salvas e intervalo decorrido
- [x] Sync manual (navbar/login) **sem** rate limit nesta fase dev
- [ ] **Produção:** fila worker + cooldowns (**B54–B56**, **O3**) — ver [Apêndice B65](#apêndice--b65-sync-automático-dev-remover-antes-de-produção) e `SCOPE-CLOUD.md` §6.3

#### F38 — Sino notificações in-app `[x]`
- [x] Badge + painel 24h (`NotificationBell`, `useNotifications`)
- [x] Fingerprints estáveis para tarefas e notas; lembretes 24h/1h
- [x] **Polish `04887c9`:** baseline pré-sync (`notification-pre-sync-baseline`) — nota nova não some após sync; fingerprint de nota sem valor; subtítulo com nota obtida/máxima
- [x] **Jul/2026:** fingerprint de nota **com valor** (alerta em mudança pós-sync); seed inicial não marca notas como lidas; **tarefas concluídas** excluídas do sino/lembretes
- [x] **Polish dashboard `5923e9c`:** nome da disciplina no `SubjectCard` navega para `/disciplinas/[código]`

### 2.3 Scraper: Turma Virtual (por disciplina)
- [x] Navegar para cada disciplina da turma virtual (`scrape-turma-virtual.ts` + delay entre disciplinas)
- [x] Extrair frequência (Alunos → Frequência): lista de datas com status
- [x] Extrair notas (Alunos → Ver Notas): PRO1, SEM, PRO2, Nota, Resultado, Faltas, Sit
- [x] Extrair tooltip de cada nota (title → "Avaliação: X | Nota Máxima: Y")
- [x] Extrair grupo (Alunos → Ver Grupo): membros, matrícula, email, curso + **nome do grupo** (`grupo_nome`)
- [x] UI **Ver grupo** na disciplina (`SubjectGroupModal`) — só quando há integrantes
- [x] Arredondamento da **nota final** (decimal ≥ 0,5 → inteiro; &lt; 0,5 mantém casa decimal)
- [x] Extrair tarefas (Atividades → Tarefas): individuais e em grupo, descrição, instruções, entregáveis
- [x] ~~Download de materiais/PDFs~~ — **fora de escopo** (cancelado jun/2026; painel removido da disciplina)

### 2.4 Scraper: Funcionalidades Adicionais

> **B30** = caminho crítico do sync (última etapa do robô). **B66** e **B67** = robôs **separados** (`POST /api/sync/calendario` · `POST /api/sync/turmas`) — **não** entram em `execute-live-sync-pipeline` nem em `runSync`; o front dispara B66 em background após sync principal (`useSync`); **B67** sob demanda no `/simulador` (**F19**).

#### B30 — Histórico escolar `[x]`
- [x] Parser PDF → `HistoricoSnapshot` JSON (`pdf-parse` v2 / `PDFParse`)
- [x] Falha no histórico **não** apaga portal/turma; não persistir snapshot vazio
- [x] Mapeamento `disciplina_id` via nome → código PPC
- [x] Emitir/baixar histórico escolar live (Ensino → Emitir Histórico → PDF; captura direta no menu)
- [x] Validar sync real end-to-end com SIGAA (múltiplas contas, jun/2026)

#### B31 — Pipeline `runSync` resiliente `[x]`
- [x] Modos `full` / `incremental` + `sync-stage-plan`
- [x] Policies portal / turma / histórico (falha parcial não apaga snapshot)
- [x] Login rápido (`sync-readiness`) + verify SIGAA + sync background
- [x] 1º login → sync full bloqueante; PPC sempre no mapa (`seedPpcIfEmpty`)
- [x] SQLite isolado por CPF (`.data/users/{cpf}/`)
- [x] Testes `bloco-2a-b31.test.ts` · commit `a7a02ac`

**Ordem linear 2a (continuação pós-B31):** `F18` → `F37` → `F38` → `B66` → `B67` → `F19` · **`B68-orq`** = [#6d](#6d--orquestração-sync--catálogo-global-pré-mobile) (fora do #2)

#### B68-orq — Orquestração sync + catálogo global `[/]`

> **Pré-mobile (#8).** Policy **§6.6 `SCOPE-CLOUD`** (jul/2026). **B68a–c** ✅ · pendente **B68d–f**. *(Distinto do **B68** simulação mapa no Apêndice gift/dev.)*

- [x] **Policy documentada** — matriz robô × gatilho; R1 full/lite/deep; botão lite; global R2/R3; batch noturno; policy no `/dev`
- [ ] **Schema global (B68d)** — Postgres + `app_config` policy
- [ ] **Orquestrador (B68e)** — cron + fila worker
- [ ] **Pipeline lite/deep (B68f)** — scraper layers + runtime lê policy

#### B66 — Calendário acadêmico `[x]`
> **Escopo aprovado** (jun/2026). Robô isolado — calendário nem sempre existe no SIGAA; snapshot `unavailable` **não apaga** dados locais. Semestre alvo derivado da **data atual** (`resolveCalendarioSemesterTargets` — jul/2026: `2026.1` + `2026.2`). **Aprovado** stakeholder jun/2026 (`75694c0`).

- [x] Schema `calendario_academico` + `build-calendar` + `CalendarAcademicDates` em `/calendario`
- [x] Scraper Ensino → Calendário Acadêmico (`navigate-to-calendario`, `parse-calendario-html`, `scrape-calendario`)
- [x] `POST /api/sync/calendario` + `runCalendarioSync` + policy persist + TTL 7d (`calendario-sync-plan`)
- [x] Disparo em background pós-sync principal (`useSync` → `postCalendarioSync`)
- [x] Testes `bloco-2a-b66.test.ts`
- [x] UI painel acadêmico: **duas colunas** (semestre corrente + próximo); troca **1 dia antes** do início do Período Letivo (`buildAcademicDateDisplayGroups` · `resolveAcademicSemesterDisplayPair`)
- [x] Estado vazio por coluna — *Nenhuma informação*; divisor vertical entre semestres (desktop)
- [x] Grade semanal removida de `/calendario` (mantida no dashboard)
- [x] Validação live no SIGAA

#### B67 — Turmas ofertadas `[x]`
- [x] Scraper Ensino → **Consultar Turmas do Próx. Semestre** → página **Solicitação de Abertura de Turma** (lista CEFET)
- [x] Filtrar situações **Atendida** e **Pendente** (ignora Cancelada/outras)
- [x] **Pendente** ou horário vazio → `horarioIndefinido` + `scheduleBlocker` (⛔ no **F19**)
- [x] Separar **`curso`** vs **`optativas`** via PPC (`classifyTurmaCategoria`)
- [x] Persistir em `turmas_ofertadas` + `GET /api/turmas-ofertadas` (`curso` · `optativas` · `courses`)

---

## Fase 3: Interface do Usuário — Telas Principais

> **Resumo:** Integração SQLite completa no Bloco 1 — incl. **grade semanal via API** (B19 · F13 ✅). Extras na grade continuam no client.

### 3.1 Tela de Login / Cadastro

> **Produção (6b+):** cadastro = e-mail + telefone + CPF + curso + senha SIGAA · **login = só CPF + senha**.  
> **Dev local (Bloco 1–2):** login SIGAA direto (CPF + senha) sem trial/cloud.

- [x] Input de usuário e senha do SIGAA *(dev — vira CPF explícito no F29)*
- [x] Senha com mostrar/ocultar (`PasswordInput`)
- [x] Toggle "Lembrar senha neste computador" — persiste usuário no client; senha cifrada no SQLite (B25 ✅)
- [x] Botão "Entrar e Sincronizar"
- [x] Loading state com progresso da sincronização
- [x] Tratamento de erro visual (credenciais inválidas, SIGAA offline) — **F18** ✅
- [x] Login rápido + sync full bloqueante no 1º acesso (**B31**)
- [x] Hint “primeiro acesso demora” abaixo do botão sincronizando (**F18**)
- [x] Modulação de layout **somente no dashboard** (demais telas layout fixo)
- [x] Menu perfil no avatar — modal, tutorial, /planos (**F37** ✅ · back **B65** `[x]`)
- [x] Sino de notificações in-app — tarefas/notas novas + lembretes 24h/1h (**F38**); polish `04887c9` (baseline pré-sync, nota obtida/máxima no painel)
- [ ] Cadastro produção: e-mail, telefone, CPF, **curso (Comp/Meca/Moda)**, senha (F29 · B44 · B58 · B63)
- [ ] Login produção: **apenas CPF + senha** (sem e-mail no login)
- [ ] Menu Config no avatar + toggle e-mail (**F36** · **B61** — produção; perfil dev = **F37**)

### 3.2 Dashboard Central
- [x] Header com saudação, nome do aluno e semestre atual — **via API** (`useDashboard`, TanStack Query)
- [/] Card de RG com indicador visual (cor baseada na faixa) — RG numérico em `StatsRow`; **faixa de cores pendente**
- [x] Barra de integralização com breakdown por tipo de CH — **via API** + tooltips por categoria (F11b)
- [/] Lista "Próximas Entregas" (5 próximas tarefas/avaliações) — filtros via API (incl. Concluídas) + regra 3 dias após prazo; **limite de 5 pendente**
- [x] Modal com detalhes da tarefa ao clicar (descrição, entregáveis, link à disciplina)
- [x] Grid de cards de disciplinas (nota, faltas, próxima atividade por matéria) — **via API**
- [x] Nome da disciplina no card é link para a página da matéria (`SubjectCard` · `5923e9c`)
- [x] Indicador de risco de nota e badge Recuperação nos cards (`GradeRiskIndicator`; prioridade fora do `<Link>`)
- [x] Ordenação e prioridade em "Próximas Entregas" (`TaskSortSelect`, `PrioritySelect`)
- [x] Botão de re-sincronização na navbar (Sync SIGAA)
- [x] Botão Sair (`LogoutButton`) — extra F5b

### 3.3 Grade Semanal (Horário de Aulas)
- [x] Tabela visual: Segunda a Sexta × blocos de horário (M12, M34, M56, Almoço, T12, T34, Janta, N12, N34)
- [x] Tradução automática de códigos SIGAA — **B19 + F13** (`useSchedule` → `GET /api/schedule`)
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
- [x] Template `/calendario` — calendário mensal **via API** (F9–F10) · grade semanal **via API** (B19 · F13 ✅)
- [x] Template `/disciplinas` — listagem e detalhe **via API** (F6–F8); simulação de notas permanece local
- [x] Template `/mapa` — grade obrigatória por período (1–10) + resumo de status **via API** (`useMapa`, F12); sem catálogo optativas; skeleton + estados vazio/erro
- [x] Template `/integralizacao` — donut + barras + tabela **via API**; modal cadastrar horas; glossário (F11 · F11b)
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
- [x] Header com nome, apelido (`shortLabel`), sala, horário, **horas/sem** (grade SIGAA), professor — **via API** (F7 + F8g)
- [x] Modal **Editar disciplina**: nome, apelido, sala, horário, horas semanais, professor; linha *Portal* quando difere do sync (`SubjectDetailEditModal`, `PATCH .../appearance` · **B12d**/**F8g**)
- [x] Horas no header = **blocos do horário** (2h/aula), não CH total do PPC; ementa mantém CH do PPC
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

> **Download de materiais SIGAA:** **fora de escopo** (cancelado jun/2026). Histórico escolar PDF (**B30**) permanece.

---

## Fase 5: Motor do PPC e Planejamento Acadêmico

> **Resumo:** Dados do PPC (disciplinas, requisitos), mapa do curso, simulador de matrícula, integralização e calendário acadêmico. Inteligência avançada = **Bloco 3**.

### 5.1 Indexação do PPC
- [x] Popular banco de dados com disciplinas **obrigatórias** de Eng. Computação (DCDV):
  - Código, nome, tipo, CH, período, ementa
- [x] Popular tabela de requisitos (pré-requisitos e co-requisitos)
- [x] Dados extraídos do mapa mental existente + PPC oficial
- [x] **Decisão:** não indexar catálogo de optativas/eletivas no mapa — oferta mutável no SIGAA; CH optativa (240 h) via sync + `/integralizacao`
- [x] **Decisão:** curso escolhido no **cadastro** (B63 · F29); indexação PPC Meca/Moda = Bloco 9 (#11)
- [ ] *(Bloco 9 — #11)* Indexar PPC Eng. Mecatrônica
- [ ] *(Bloco 9 — #11)* Indexar PPC Design de Moda

### 5.2 Mapa Mental / Grafo do Curso
- [x] Colunas por período (1–10) com disciplinas obrigatórias e status — **via API** (F12 · B18)
- [x] Cores dos nós por status: Concluída, Cursando, Desbloqueada, Trancada
- [x] Clique no nó navega para página da disciplina
- [ ] Renderizar grafo interativo (usar biblioteca como `react-flow` ou `d3.js`)
- [ ] Setas sólidas para pré-requisitos, pontilhadas para co-requisitos
- [ ] Zoom e pan para navegação

### 5.3 Simulador de Matrícula (Pré-horário)
- [x] Página dedicada apenas ao simulador de horários/matrícula (`/simulador` — Montar Grade)
- [x] Buscar turmas ofertadas do SIGAA (scraper **B67** `[x]`)
- [x] Montar grade via API — **F19** `[x]` (`GET /api/turmas-ofertadas`, preview multi-horário, coreq par rollback+modal, cards uniformes, CH obr/opt/total, export JPEG)
- [x] Lista de matérias com ícones: Desbloqueada / Trancada (template mock)
- [x] Alocar matéria desbloqueada em horário vazio da grade (clique — template)
- [x] Clique em aula da grade abre modal com detalhes e opção de remover
- [ ] Drag-and-drop de matérias para a grade semanal
- [ ] Detecção automática de choque de horários (alerta visual)
- [ ] Botão "Salvar Simulação" para referência futura
- [ ] Botão "Exportar" para levar na hora da matrícula

### 5.4 Gestão de Integralização (Horas)
- [x] Tabela com tipos de CH, total, concluído, pendente — **via API** (F11)
- [x] Cadastrar horas manuais — **POST /api/integralizacao** (B17) + modal (F11)
- [x] Barra de progresso visual por categoria
- [x] Donut "Total Integralizado" + cards alinhados em altura (`IntegrationDonutChart`)
- [x] Barras de progresso douradas unificadas no app
- [x] Documentar glossário de tipos de CH no `SCOPE.md` §6.4 (implementação → **F11b**)
- [x] Glossário **“Entenda suas horas”** na UI (obrigatória, eletiva, complementar, extensão, flexibilizada) — F11b
- [ ] Alerta quando estiver perto de concluir uma categoria

### 5.5 Calendário Acadêmico
- [x] Tela com datas do semestre via `GET /api/calendar` + painel acadêmico (seed/mock em dev; **B66** popula `calendario_academico` via sync isolado)
- [x] Painel dual-semestre: corrente + próximo; rotação na véspera do Período Letivo; divisor visual; vazio por coluna
- [/] Alertas/notificações para datas próximas — lembretes de **tarefa** 24h/1h via sino (**F38** ✅); datas acadêmicas institucionais = **B37** *(pós-B66 ✅)*
- [x] Verificação periódica de novas datas — `shouldRunCalendarioSync` + TTL 7d + disparo background pós-sync (**B66**)

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
- [/] Adicionar loading skeletons em todas as telas — **feito:** dashboard, disciplinas (lista + detalhe inline), calendário, mapa, integralização, grade semanal; **pendente:** `/simulador`, login (**F25**)
- [x] Responsividade básica (breakpoints mobile/tablet/desktop)
- [/] Favicon e título personalizado na aba do navegador — `layout.tsx` com título **ACME HUB**; **favicon.ico** e branding visual pendentes (**F27**)

---

## Fase 7: App Mobile (Expo Go)

> **Resumo:** App mobile para testes via **Expo Go**, backend **Supabase** — **Bloco 8**. Escopo: [`docs/SCOPE-CLOUD.md`](./SCOPE-CLOUD.md) §7.

- [ ] Criar projeto Expo em `mobile/` (TypeScript)
- [ ] Integrar Supabase Auth + checagem de assinatura ativa
- [ ] Telas: dashboard, disciplinas, calendário, mapa
- [ ] Testar no Expo Go (Android/iOS)
- [ ] EAS Build para lojas (fase posterior — M10)

---

## Apêndice — Escopo futuro (fora da ordem #0–#11)

> **Download automático de materiais SIGAA (B57 · B29 · F35):** **cancelado** jun/2026 — não será implementado neste produto. O aluno continua baixando materiais manualmente no SIGAA. **Histórico escolar PDF (B30)** permanece no escopo (Ensino → Emitir Histórico).

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B57 | Back | OAuth nuvem pessoal | Google Drive / Dropbox / OneDrive | ❌ cancelado |
| B29 | Back | PDFs → nuvem | Materiais SIGAA → pasta na nuvem | ❌ cancelado |
| F35 | Front | UI nuvem pessoal | Toggle por disciplina + conectar nuvem | ❌ cancelado |

**Histórico:** **B29** ocupava a posição entre **B28** e **B30** na ordem 2a antiga; removido da fila ativa em jun/2026. Placeholder `SubjectDownloadsPanel` existiu até jun/2026 e foi removido.

---

## Apêndice — Chaves gift e painel dev (jun/2026)

> **Escopo fechado** em `SCOPE.md` §2.1.1, §6.1.1, §10 e `SCOPE-CLOUD.md` §3.6, §8.  
> **Implementação:** Bloco 1 pode ter **stub dev** (SQLite); produção com **B69 + B70 + F40 + F41** no Bloco 7 (após gate **B59**).

### Chaves de plano (gift card)

| Regra | Detalhe |
|---|---|
| Código | 8 caracteres `A–Z` + `0–9`, gerado aleatoriamente |
| Uso | **Uma vez** por chave; vincula CPF + período de acesso |
| Pacote | Definido na criação (dias, tipo semestre/ano, validade opcional da chave) |
| Emissão | **Somente operador** — painel `/dev` |
| Resgate | Aluno em login, cadastro ou `/planos` (**F40**) |

**Tasks:** **B69** (back) · **F40** (front resgate) · parte de **B70/F41** (criar/listar chaves)

### Simulação de mapa de curso

| Regra | Detalhe |
|---|---|
| Onde | `/mapa` — toggle “Modo simulação” |
| Efeito | Marcar disciplinas como concluídas **localmente**; recalcular desbloqueios |
| Não altera | Tabela `historico` nem sync SIGAA |
| Tasks | **B68** (API) · **F39** (UI) |

### Painel dev (operador)

Rota **`/dev`** — invisível ao aluno.

#### Autenticação operador (obrigatória)

| Regra | Detalhe |
|---|---|
| **Sempre pedir** | Tela **email + senha** antes de qualquer área do painel (sem sessão válida = bloqueado) |
| **Onde validar** | **Somente server-side** — comparar com pares cadastrados no **env** (`.env.local` dev · secrets prod) |
| **Cadastro de devs** | **Manual no env** — **nunca** UI, **nunca** banco; novo operador = adicionar par `EMAIL`/`PASSWORD` comentado ou ativo no env |
| **Dev local** | `EMAIL_DEV` + `PASSWORD_DEV` (1º operador) · `PLANNER_DEV_2_EMAIL` + `PLANNER_DEV_2_PASSWORD` (2º, comentado até precisar) · … |
| **Produção** | Mesmo modelo — pares só em **secrets** do deploy (VPS/Supabase/etc.); rotação = editar env + redeploy |
| **Sessão** | Cookie **httpOnly** após login OK; expira → pede email+senha de novo |
| **Segurança** | Zero credencial de operador no client bundle, logs ou resposta JSON |

> **Substitui** o desenho antigo `PLANNER_DEV_SECRET` / allowlist CPF — operador = quem conhece **email+senha** definidos **manualmente** no env.

| Área | Capacidades |
|---|---|
| Contas | Listar CPF, matrícula, curso, assinatura, trial, último sync |
| **Robôs (ops manual)** | Lista **nome + CPF** com busca; **chavinhas** (toggle dourado) por robô — **R1** sync principal · **R2** calendário (**B66**) · **R3** turmas (**B67**); disparo **individual** (1 conta) ou **global** (todas/filtradas); usa **CPF + senha já persistidos**; **sem cooldown** B65/O3 |
| Credenciais | **Fase testes:** senha SIGAA **visível** (copiar / abrir SIGAA manual). **Pós-B71:** só “salva / não salva” |
| Chaves | Criar (lote), listar, revogar, ver quem resgatou |
| Promoções | Toggle global + banners `/planos` |
| Simulação | Forçar expiração/renovação de plano; sync forçado; reset dados (confirmação dupla) |
| Auditoria | Log de ações sensíveis |

**Tasks:** **B70** (API + middleware + robôs ops) · **F41** (UI + chavinhas + lista) · **B71** (endurecimento — **última antes de produção**)

### Painel robôs — ops manual (escopo fechado p/ **B70** + **F41**)

> **Objetivo:** operador dispara scrapers **por fora** do fluxo do aluno — sem fila, sem cooldown dev (**B65**) / produção (**O3**). Credenciais vêm do que já está salvo no SQLite (dev) / Postgres (prod).

| Robô | Endpoint / pipeline | Persiste |
|---|---|---|
| **R1** | `POST /api/sync` · `runSync` / pipeline live | Portal, turma virtual, histórico (por CPF) |
| **R2** | `POST /api/sync/calendario` (**B66**) | `calendario_academico` global |
| **R3** | `POST /api/sync/turmas` (**B67**) | `turmas_ofertadas` global |

#### Back (**B70**)

- [ ] **`POST /api/dev/auth/login`** — body `{ email, password }`; valida contra **todos** os pares `EMAIL_DEV`/`PASSWORD_DEV`, `PLANNER_DEV_2_*`, … lidos do env
- [ ] Middleware **`/api/dev/*`** — exige sessão operador (cookie httpOnly); **401** sem login
- [ ] **Nunca** expor lista de emails autorizados ao client; mensagem genérica em falha de login
- [ ] `GET /api/dev/accounts` — lista contas com **nome**, CPF (mascarado), curso, último sync, flags de credencial salva
- [ ] Query **`?q=`** — busca por nome ou CPF (parcial)
- [ ] **`GET/PATCH /api/dev/sync-policy`** + **`POST …/reset`** — policy orquestração §6.6
- [ ] `POST /api/dev/robots/run` — body: `{ scope: "individual" | "global", cpf?: string, robots: { r1: boolean, r2: boolean, r3: boolean } }`
- [ ] Resolver senha SIGAA **server-side** (B25 decrypt dev / B45 prod) — **nunca** reenviar ao browser do operador após **B71**
- [ ] **Bypass cooldown** — não aplicar `sync-preferences` / TTL / fila ao disparo manual do `/dev`
- [ ] **Global:** iterar contas com credencial válida (ou subset da busca); log por CPF + robô + outcome
- [ ] **Auditoria** — toda execução manual registrada (operador, escopo, robôs, alvos, timestamp)

#### Front (**F41**)

- [ ] **`/dev/login`** (ou gate na rota `/dev`) — formulário **email + senha**; obrigatório **sempre** que não houver sessão operador
- [ ] Após login → painel; logout limpa cookie e volta ao formulário
- [ ] Rota **`/dev`** — seção **Robôs** (ou aba dedicada)
- [ ] **Menu chavinhas** — um toggle por linha (**R1**, **R2**, **R3**); estilo pill dourado ON / cinza OFF (igual selects do app)
- [ ] **Orquestração sync** — formulário policy §6.6: escopo botão (**lite**), TTLs por camada (intervalo **ou** data fixa), batch noturno, `max_concurrent`, **Restaurar padrões**
- [ ] **Lista contas** — colunas nome + CPF; campo busca; seleção de linha para disparo individual
- [ ] Botões **Rodar selecionado** (individual) e **Rodar todos** (global) — só robôs com chave ON
- [ ] Feedback inline — progresso / erro por robô (sem bloquear navbar do aluno)
- [ ] Reutilizar demais áreas do painel: chaves gift, promoções, simular tempo (escopo §10 `SCOPE.md`)

#### Fora de escopo (v1 painel dev)

- Cadastro de operadores pelo painel — **só env manual** (segurança de dados)
- Impersonate write no app do aluno — só **disparo de sync** + leitura de contas

> **Nota:** cron/fila worker (**B68e**, **B54–B56**) **consome** a policy gravada aqui; o painel **configura** cadências — disparo manual continua **sem cooldown**.

**Tasks:** **B70** (API) · **F41** (UI) · endurecimento senha = **B71**

### Endurecimento credenciais (B71)

| Entrega | Detalhe |
|---|---|
| Painel `/dev` | Remove coluna/campo de senha **SIGAA** em claro; **operadores** continuam só no env |
| Storage | Senha sempre cifrada; rotação de chave documentada |
| API | Nenhum endpoint aluno devolve credencial |
| Logs | Sem senha/CPF completo |
| Gate | Só marcar go-live / PIX amplo após **B71** `[x]` |

**Ordem:** roda **depois** de tudo (sync, billing, painel dev) — ver Bloco 7.

### Ordem sugerida (dentro do Bloco 7)

```
B49 (billing tables) → B69 (gift keys) → F40 (resgate)
B70 (dev API + senhas visíveis + robôs ops sem cooldown) → F41 (painel dev + chavinhas R1/R2/R3)
B68 + F39 (simulação mapa — pode paralelizar ao Bloco 1 pós-F12)
… PIX, mobile, etc. …
B71 (ÚLTIMA — endurecer credenciais antes do go-live)
```

### Dev local (antes da cloud)

- Stub em `build-subscription-dev.ts` / `/planos` placeholder → evoluir para resgate real quando **B69** existir.
- Painel dev SQLite: rota `/dev` com **login email+senha** (`EMAIL_DEV`/`PASSWORD_DEV` no `.env.local`; devs extras **`PLANNER_DEV_N_*` manual**) — layout com lista nome/CPF, chavinhas R1/R2/R3 (**F41** stub OK antes do Bloco 7).

---

## Apêndice — B65 sync automático dev (remover antes de produção)

> **Status da task:** **B65** está **`[x]` aprovada** para dev local (SQLite + Playwright no browser do aluno).  
> **Não levar este desenho para produção/cloud** sem refatorar — substituir por fila worker (**B54–B56**) + cooldowns (**O3**) conforme `SCOPE-CLOUD.md` §6.3.

### O que existe hoje (dev)

| Peça | Arquivo / chave | Comportamento dev |
|------|-----------------|-------------------|
| Timestamp do último sync | `configuracoes.sync.last_at` · `lib/sync/sync-preferences.ts` | Gravado após `runSync` bem-sucedido |
| Intervalo fixo 30 min | `SYNC_AUTO_INTERVAL_MINUTES` | Não configurável pelo aluno |
| Auto-sync no client | `hooks/useAutoSync.ts` | `setInterval` + checagem de credenciais salvas |
| API perfil | `GET /api/perfil` · `lib/perfil/build-perfil.ts` | Retorna `lastSyncAt`, `intervalMinutes` |
| UI informativa | `ProfileMenu.tsx` (**F37**) | Badge/texto “sync automático a cada 30 min” |
| Sync manual | Navbar / login | **Sem** rate limit (facilita debug do scraper) |

### O que remover ou substituir antes de produção

1. **`useAutoSync` no browser** — mover sync para fila worker (**B54–B56**); client só enfileira/polling.
2. **Intervalo fixo 30 min** — substituir por **auto-sync ≥3h/usuário** na fila (**O3** / **B55**).
3. **`sync.last_at` só local** — persistir `last_sync_at` por usuário no Postgres (Supabase) após **B39+**.
4. **Sync manual sem limite** — manual → **fim da fila** + cooldown **5 min** (**O3** / **B55**).
5. **Texto “dev” no menu perfil** — alinhar **F37** ao status real (último sync, **posição na fila**, erro) quando **B55** existir.
6. **Playwright no device** — pipeline só no worker; mobile nunca roda scraper local.

### Ordem sugerida de migração

```
B31 ✅ → B54–B56 (worker 1× + fila) → O3 (3h auto / 5 min manual) → remover useAutoSync client → F37 polish produção
```

### Arquivos tocados na entrega B65

- `app/src/lib/sync/sync-preferences.ts`
- `app/src/lib/perfil/build-perfil.ts`
- `app/src/hooks/useAutoSync.ts`
- `app/src/components/profile/ProfileMenu.tsx`
- `app/src/lib/sync/run-sync.ts` (`recordSyncCompletedAt`)

---

## Notas para Outros Agentes de IA

Se você é um agente de IA continuando este projeto, aqui estão informações cruciais:

1. **Leia `docs/SCOPE-CLOUD.md`** para arquitetura (cloud, PIX, mobile). **`docs/SCOPE.md`** mantém regras acadêmicas.
2. **`README.md`** — visão geral e como rodar em dev; arquitetura de produto em `SCOPE-CLOUD.md`.
3. **O mapa mental do curso** (grade curricular com pré/co-requisitos) foi fornecido como imagem e deve ser convertido em dados estruturados.
4. **O SIGAA é uma aplicação JSF (Java Server Faces).** Os formulários usam `javax.faces.ViewState` e IDs dinâmicos. O scraper deve usar Playwright (não requests simples) por causa do JavaScript.
5. **URLs do SIGAA mudam de sessão para sessão.** Sempre navegue pelo menu, não por URLs hardcoded.
6. **O design deve ser PREMIUM.** Cores do Cruzeiro (Azul #0060B1 + Dourado #D4A843), glassmorphism, micro-animações. Nada genérico.
7. **Atualize o `docs/TASKS.md` sempre que trabalhar em uma task** — leia o arquivo inteiro (ou `grep` por ID + etapa) e sincronize **todas** as seções listadas em `.cursor/rules/tasks-workflow.mdc` → **Sincronizar TASKS.md**:
   - Ao **iniciar**: marque como `[/]` — em andamento (+ checklist mestre / §1.4 se aplicável).
   - Após **commit local**: marque como `[%]` — feito, sem push (+ contador `X/49`, notas de etapa).
   - Após **push sem aprovação 100%** (usuário avisa): marque como **`[@]`** — no remoto, bugs/validação pendente.
   - Após **push com aprovação 100%** ou aprovação explícita depois: marque como `[x]` — finalizada (+ item 11 “Próximo passo”).
   - Faça **commit** ao concluir cada task (push só quando o usuário pedir).
   - **Obrigatório:** toda entrega deve refletir no TASKS.md **no mesmo ciclo** — tabela B/F, checklist mestre, progresso, bullets de UI e notas para agentes **sem texto stale**.
8. **Próximo passo do roadmap:** informe **depois do push** (tasks em `[@]` ou `[x]`). Com commits locais só `[%]`, **não** avance o roadmap na resposta.
9. **Ordem de execução:** seguir [Ordem oficial v3](#ordem-oficial-de-execução-v3) — **Bloco 2 (sync) antes do Bloco 6 (Supabase)**. Dentro de cada fatia: `B` antes de `F`.
10. **Modo testes global (6a):** deploy **após** sync validado; RLS **só na 6c** (antes do PIX).
11. **Próximo passo:** **B55** (fila sync API). **B54** `[@]` (validar Docker/VPS). **#6d:** policy **§6.6** · **B68a–c** ✅ · **B68d–f** pendente. **B71** = última pré-go-live.
12. **Integralização:** CH concluída = `historico` + PPC (`computeChDoneFromDisciplinas`); portal SIGAA só % / total currículo; matérias já passadas = **B30** ✅.
13. **Gift + painel dev + simulação mapa:** escopo em `SCOPE.md` §10.7, §6.1.1 · `SCOPE-CLOUD` §6.6 — tasks **B68–B71**, **F39–F41**. Painel: chavinhas R1/R2/R3 + **Orquestração sync** (TTLs/data fixa/batch). **B71** = ocultar senhas SIGAA.
14. **Sincronização TASKS (regra inviolável):** `docs/TASKS.md` **sempre 100% atualizado** — ver `.cursor/rules/tasks-workflow.mdc` → **Regra inviolável** + **Sincronizar (10 pontos)** + **Verificação final**. Nunca commitar ou encerrar turno com sync parcial. **Polish em task `[x]`** (ex.: F38, dashboard) também exige nota no TASKS no mesmo ciclo do push.
15. **Credenciais SIGAA:** sync **sem** o aluno no site exige senha **cifrada no servidor** (dev: B25 opcional + `useAutoSync` no client; produção: **B45** + worker **B56**). Ver `SCOPE.md` §2 · `SCOPE-CLOUD.md` §4–§6.
16. **Código frontend** está em `app/src/` (não na raiz `src/`). Mock data em `app/src/config/mock/`.
