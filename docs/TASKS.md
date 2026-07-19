# 📝 CEFET Academic Planner — Roadmap e Tasks

Este documento contém todas as tasks do projeto, organizadas por fase. Cada task tem um status e detalhes suficientes para qualquer desenvolvedor (humano ou IA) entender e implementar.

> ## Direção atual — Sync SIGAA → Cloud → PIX → Site maduro (#9+#10) → Mobile
>
> **Prioridade:** terminar Bloco 1 (SQLite) → **Scraper/sync real (Bloco 2) enquanto o semestre está ativo** → depois Supabase/deploy. ~~Download automático de materiais SIGAA~~ **fora de escopo** (cancelado jun/2026). Ver também [`docs/SCOPE-CLOUD.md`](./SCOPE-CLOUD.md).
>
> - **Regras acadêmicas:** [`docs/SCOPE.md`](./SCOPE.md)
> - **Ordem de execução:** [§ Ordem oficial](#ordem-oficial-de-execução-v3)
> - **Modo testes:** deploy global após sync validado; RLS na fase 6c (antes do PIX)
> **Pré-mobile (#8):** **#6d** ✅ + **#6e** ✅ + **#7** + **#9 + #10** (site maduro + **F28**) · policy **§6.6** · **B68a–f** ✅
>
> **📌 Prioridade (jul/2026):** **worker sync = este PC** (Chrome + Playwright + mirror → Supabase) exposto via **cloudflared**; Cloudflare só despacha. Código B72a–e `[x]`. Ops: `npm run worker:home` + `npm run worker:tunnel` + secrets CF — ver [`app/worker/README.md`](../app/worker/README.md) · [Bloco 2f · B72](#12--bloco-2f--sync-real-postgres-b72). Site local (#9/#10) continua em paralelo.

**Navegação rápida:** [Roadmap detalhado (#0→#11)](#roadmap-detalhado--ordem-de-execução-0--11) · [Sequência #0→#11](#sequência-completa--o-que-fazer-e-em-qual-ordem) · [Ordem oficial v3](#ordem-oficial-de-execução-v3) · [Checklist BACK→FRONT](#checklist-mestre-ordem-de-execução) · [Detalhe por bloco](#detalhe-dos-blocos) · [#6d orquestração sync](#6d--orquestração-sync--catálogo-global-pré-mobile) · [#6e painel dev](#6e--painel-dev--policy-pré-pix) · [Escopo cloud](./SCOPE-CLOUD.md) · [Marco testes gerais](#marco--site-no-ar-para-testes-gerais) · [Apêndice escopo futuro](#apêndice--escopo-futuro-fora-da-ordem-011) · [Apêndice B65 dev](#apêndice--b65-sync-automático-dev-remover-antes-de-produção) · [Apêndice gift + painel dev](#apêndice--chaves-gift-e-painel-dev-jun2026)

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

**Polish pós-push (jun/2026, sem nova task):** `04887c9` — fix alerta nota nova pós-sync (baseline pré-sync) + nota obtida/máxima no sino · `5923e9c` — nome da disciplina no `SubjectCard` abre `/disciplinas/[código]`.

**Marco site desktop v1.0.0 (jul/2026):** web Eng. Computação considerada **finalizada** para paridade mobile — release GitHub `v1.0.0`. **Polish sino:** eventos/datas só cadastro · D-1 · no dia; painel 24h após vista (`00576a7`).

**Polish tutoriais (jul/2026):** passos desktop + mobile (≤768) atualizados ao produto v1.0 — PIX, sino, mapa grade/grafo, âncoras no calendário; botão ? em Disciplinas / Calendário / Mapa / Integralização / Planos.

**Polish mobile motion (jul/2026, sem nova task):** press feedback (navbar/drawer/chips) · drawer slide · stack fade/slide detalhe · fade pós-load · ProgressBar animado · Disciplinas FlatList+memo — aprovado 100%.

---

## Roadmap detalhado — ordem de execução (#0 → #11)

> **🌐 Site desktop = v1.0.1** (jul/2026 · bugfix) — Eng. Computação web madura (**#1–#7 · #9 · #10 · #12**); release GitHub `v1.0.0`. **#8 Mobile** **M1–M15** `[x]` · **M16** `[@]`. **#11 Multi-PPC** `[x]` (Meca + Moda). **F28** `[x]`. **B74/F43** `[x]` · **B73/F42** `[x]`. **#9** `[x]`. Bloco **2f (B72a–e)** `[x]`. **Polish sino (jul/2026):** eventos/datas só em cadastro · D-1 · no dia; painel some 24h após vista.
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

### #3 — Bloco 2b · Worker sync (servidor) `✅ 5/5`

> Fila §6.3 `SCOPE-CLOUD` — 1 job global, auto **3h/usuário**, manual **fim da fila** + cooldown **5 min**.

- [x] **BACK:** B54 *(worker Playwright — `app/worker/` · HTTP `/health` `/status` `/jobs` · `BrowserJobSlot` max 1 · Docker · graceful shutdown)*
- [x] **BACK:** B55 *(API fila sync — filas prioritária + normal; enqueue; status/posição/ETA)*
- [x] **BACK:** B56 *(pipeline B24–B31 no worker — credenciais cifradas no servidor)*
- [x] **OPS:** O3 *(cooldowns produção — auto ≥3h/usuário; manual 5 min; manual → fim da fila; **exceção:** painel `/dev` **B70/F41** dispara robôs **sem cooldown**)*
- [x] **FRONT:** F19 *(UI fila — `POST /api/sync/queue` + polling; **F37** status fila; auto-sync enfileira via fila)*

**Ordem 2b:** `B54 → B55 → B56` → `O3` → `F19` ✅

---

### #4 — Bloco 6a · Supabase + deploy global `✅ 8/8`

> **Só após B31 validado.** RLS flexível nesta fase (testes globais).

- [x] **PLAN:** Projeto Supabase free + env dev/prod — [`docs/plan/6a-supabase-plan.md`](./plan/6a-supabase-plan.md) · **Acme-Hub-dev** · `.env.local` ok
- [x] **BACK:** B39 *(schema Postgres — tabelas + `user_id` nullable em teste)*
- [x] **BACK:** B41 *(seed PPC global — disciplinas/requisitos read-only)*
- [x] **BACK:** B42 *(client Supabase — adapter queries SQLite→PG)*
- [x] **BACK:** B43 *(migrar APIs — dashboard, disciplinas, sync stub)*
- [x] **OPS:** O1 *(deploy Cloudflare Workers + cron ping Supabase — OpenNext)*
- [x] **OPS:** O2 *(remover `.db` local em prod — PLANNER_CLOUD + guard SQLite)*
- [x] **TEST:** T1 *(deploy Cloudflare + cron + smoke URL pública — [`t1-smoke-deploy.md`](./plan/t1-smoke-deploy.md))*

**Ordem 6a:** `PLAN` → `B39 → B41 → B42 → B43` → `O1 → O2` → `T1`

---

### #5 — Bloco 6b · Auth (CPF login + cadastro) `✅ 8/8`

> Cadastro = e-mail + telefone + CPF + curso + senha SIGAA · **login só CPF + senha** · trial 7d 1×/CPF.

- [x] **BACK:** B44 *(conta do aluno — cadastro e-mail/tel/CPF/`curso_id`; login só CPF)*
- [x] **BACK:** B45 *(credenciais cifradas AES no servidor — obrigatório para worker **B56**)*
- [x] **BACK:** B58 *(trial por CPF — `trial_por_cpf` 7 dias uma vez; anti-abuso)*
- [x] **BACK:** B63 *(`curso_id` — Comp/Meca/Moda; mapa/integralização filtram PPC)*
- [x] **BACK:** B59 *(gate de acesso — middleware trial_active/active vs expirado → billing)*
- [x] **FRONT:** F29 *(cadastro + login produção — CPF explícito no login · `PlannerNotice` toast de erro)*
- [x] **BACK:** B61 *(PATCH `/api/perfil` → `app_profiles` no Postgres — UI **F37** ✅)*
- [x] **BACK:** B62 *(fila e-mail — promoções sempre + ciclo conta: cadastro, fim trial, plano perto de acabar, plano encerrado)*
- [x] **BACK:** B62b *(provedor transacional — **Brevo** grátis/sem domínio, fallback **Resend**; envio real via REST `fetch`, HTML anti-XSS + retry backoff; stub de log quando sem secret · deploy jul/2026, teste real ok · aprovado jul/2026)*
- [x] **BACK:** B62c *(conteúdo + ativação — saudação com 2 primeiros nomes, link `/planos` absoluto, agenda plano expirando 7/3/1 + encerrado, disparo de promoção no `/dev` · push+aprovado jul/2026)*
- [x] **BACK+FRONT:** B73/F42 *(promoção dirigida por preço — aba **Promoções** no `/dev` define preço promocional + duração; sistema calcula %, gera textos, sobrescreve preço no checkout/`/planos` e reverte no fim do prazo; banner + preço riscado · aprovado jul/2026)*
- [x] **BACK+FRONT:** B74/F43 *(indicação por matrícula do amigo no cadastro — +3d cada no 1º pagamento do indicado · cap 30d · trial 7d intacto · chave gift só em `/planos` · aprovado jul/2026)*

**Ordem 6b:** `B44 → B45 → B58 → B63` → `B59` → `F29` → `B61 → B62 → B62b → B62c → B73/F42` → `B74/F43`

---

### #6 — Bloco 6c · RLS multi-tenant `✅ 2/2`

> **Obrigatório antes do Bloco 7 (PIX).**

- [x] **BACK:** B40 *(RLS policies Postgres — `user_id = auth.uid()` + tenant context na API)*
- [x] **TEST:** T2 *(smoke isolamento — 2 contas não veem dados uma da outra)*

**Ordem 6c:** `B40` → `T2` ✅

---

### #6d — Orquestração sync + catálogo global (pré-mobile) `✅ 6/6`

> **Policy fechada (jul/2026):** `SCOPE-CLOUD` **[§6.6](./SCOPE-CLOUD.md#66-política-de-sync--decisão-de-produto-jul2026)** · botão **lite** · global R2/R3 · batch noturno · policy editável no `/dev`.

- [x] **PLAN:** B68a *(matriz gatilho × robô — R1 full/lite/deep · R2 · R3 — §6.6)*
- [x] **PLAN:** B68b *(TTLs por camada + intervalo **ou** data fixa no painel dev — defaults §6.6)*
- [x] **PLAN:** B68c *(botão **Sincronizar** = **R1-lite** notas+tarefas; **R1-deep** batch noturno / “sync completo” perfil)*
- [x] **BACK:** B68d *(schema global vs `user_id` — policy `app_config`; **B39** ✅ · `test:b68d`)*
- [x] **BACK:** B68e *(orquestrador — cron batch 03–06h · R2/R3 global · R1-deep fila · `max_concurrent` CPFs distintos · `POST /api/cron/sync-orchestrator` · `test:b68e`)*
- [x] **BACK:** B68f *(pipeline `lite`/`deep` · login rápido R1-lite · ler policy em runtime · `test:b68f`)*

**Ordem #6d:** `B68a → B68b → B68c → B68d → B68e → B68f` ✅

---

### #6e — Painel dev + policy (pré-PIX) `✅ 2/2`

> **Só após #6d.** Fecha o ciclo **B68-orq**: policy editável no `/dev`, robôs R1/R2/R3 modulares e ops **sem cooldown** (O3). **Antes do billing PIX (#7).**

- [x] **BACK:** B70 *(painel dev API — `/api/dev/*`; login operador; contas+assinatura; **`GET/PATCH /api/dev/sync-policy`** §6.6; **`GET /api/dev/sync-status`**; robôs modulares sem cooldown · `test:b70` · chaves gift = **B69**/F41)*
- [x] **FRONT:** F41 *(painel `/dev` — login operador; **navbar** 4 abas; robôs **R1/R2/R3** modulares; contas+assinaturas; fila sync; **Orquestração sync** §6.6 · chaves gift = **B69**)*

**Ordem #6e:** `B70` → `F41`

---

### #7 — Bloco 7 · Assinatura PIX `✅ 15/15`

> **Só após #6e.** Preços v1: R$ 50 (3m) · R$ 85 (6m) · R$ 150 (12m) · R$ 700 (5a). Gift keys + endurecimento credenciais incluídos neste bloco.

- [x] **PLAN:** B47 *(planos e preços — trial + 3m/6m/12m/5a; R$ 50/85/150/700; trial 7d 1×/CPF)*
- [x] **PLAN:** B48 *(gateway PIX — Mercado Pago v1 + mock; adapter `billing/gateway`)*
- [x] **BACK:** B49 *(tabelas billing — `plans`, `subscriptions`, `payments`)*
- [x] **BACK:** B50 *(`POST /api/billing/checkout` — checkout PIX)*
- [x] **BACK:** B51 *(webhook — confirmação → `subscription.active`)*
- [x] **BACK:** B52 *(gate middleware — bloqueia trial_expired/pending/expired → PIX)*
- [x] **BACK:** B53 *(renovação — novo PIX + grace period · `BILLING_GRACE_PERIOD_DAYS` default 3)*
- [x] **BACK:** B69 *(chaves gift — gerar 8 chars + resgate único + `POST /api/billing/redeem-key`)*
- [x] **FRONT:** F31 *(cadastro + plano — pós-auth redirect · guard assinatura · checkout PIX em `/planos` · handoff `/planos/pix`)*
- [x] **FRONT:** F32 *(tela PIX — QR + copia-e-cola + polling `GET /api/billing/payments/[id]`)*
- [x] **FRONT:** F33 *(renovação — grace period · alerta em `/planos`)*
- [x] **FRONT:** F34 *(minha assinatura — perfil + histórico via `GET /api/billing/account`)*
- [x] **FRONT:** F40 *(resgate chave — `/planos` · `POST /api/billing/redeem-key` · cadastro = matrícula amigo **F43**)*
- [x] **LEGAL:** L1 *(termos + LGPD — `/termos` · `/privacidade` · consent cadastro · `GET /api/legal/meta` · migration consent)*
- [x] **BACK:** B71 *(endurecimento credenciais — accountRef opaco · credentialSaved · logs/audit sanitizados · gate produção)*

**Ordem #7:** `B47 → B48` → `B49 → B50 → B51 → B52 → B53` → `B69` → `F31 → F32 → F33 → F34` → `F40` → `L1` → **`B71`**

> **#7 Mapa:** **F31–F40** ✅ · **L1** ✅ · **B71** ✅ — bloco **#7** fechado (pré-go-live PIX).

> **Correção pós-go-live (jul/2026) — bugfix B51 `[x]`:** ativação de assinatura paga estava quebrada — a `UPDATE subscriptions` usava `$3` com só 2 parâmetros (erro Postgres `42P18`), então o pagamento era **aprovado** mas o plano ficava preso em `pending_payment`. **Fix:** parâmetro corrigido (`$2`) + `confirmBillingPayment` idempotente/auto-corretivo (reconcilia a ativação mesmo com pagamento já aprovado; só ativa `pending_payment`) + webhook responde `200` p/ pagamento inexistente (evita retries do MP). Preço de teste (R$1) revertido → **R$30/mês**. PIX aprovado → redirect `/` (Dashboard) já garantido por **F32** (poll 4s).

> **Ajuste UI (jul/2026, sobre F34) `[x]`:** removido o bloco **"Histórico de pagamentos"** do modal de perfil (`ProfileSubscriptionSection`); `ProfileSubscriptionBlock` apagado e `ProfileModalBody` passa a renderizar a section direto — elimina a chamada `GET /api/billing/account` no perfil (o endpoint segue existindo p/ `/planos`).

> **Painel dev:** **B70/F41** = [#6e](#6e--painel-dev--policy-pré-pix) *(fora desta ordem — vem antes)*.

---

### #9 — Bloco 3 · Inteligência acadêmica `🟡 8/11`

> Depende de dados reais do Bloco 2. **Executar antes do mobile (#8).**

- [x] **BACK:** B32 *(motor elegibilidade — `GET /api/simulador/elegibilidade`)*
- [x] **BACK:** B33 *(choque de horários — `POST /api/simulador/choques`)*
- [x] **BACK:** B34 *(persistir simulação — `GET/POST /api/simulador/simulacoes` + export)*
- [x] **FRONT:** F21 *(simulador elegível — filtro + drag-and-drop na grade)*
- [x] **FRONT:** F22 *(alerta choque — destaque visual de conflito)*
- [x] **FRONT:** F23 *(salvar simulação — botões salvar/exportar matrícula)*
- [x] **BACK:** B35 *(`GET /api/mapa/grafo` — nós e arestas para react-flow)*
- [x] **FRONT:** F20 *(grafo react-flow — zoom, pan, setas sólidas/pontilhadas)* · **polish jul/2026:** grafo também em **Montar Grade** (abaixo do simulador) + botão **Expandir** (popup em top-layer `<dialog>`, sem blur) via `ExpandableStage` reutilizável — aplicado ao grafo e à grade.
- [x] **BACK:** B36 *(alertas integralização — limiar por categoria de CH)* — marcos `50/80/100%` por categoria no sino (kind `integralizacao-alert`)
- [x] **BACK:** B37 *(alertas calendário — datas acadêmicas)* — sino: nova data / 1 dia antes / no dia (kind `calendar-date-alert`; sem spam diário da janela 14d)
- [-] **FRONT:** F24 *(alertas na UI)* — **descartado** por decisão do produto: alertas de integralização/calendário ficam **só no sino** (B36/B37); banners de página removidos

**Ordem Bloco 3:** `B32–B34` → `F21–F23` → `B35` → `F20` → `B36–B37` → `F24`

---

### #12 — Bloco 2f · Sync real Postgres (B72) `✅ 5/5 [x]`

> **Código fechado; ops = PC home server (jul/2026).** Gap de escrita resolvido com **mirror SQLite→Postgres**. **Worker oficial:** este PC (`SIGAA_BROWSER_CHANNEL=chrome`, `npm run worker:home`) + **cloudflared** (`npm run worker:tunnel`) → secrets no Cloudflare. Fly/Docker = fallback só se o PC não estiver online. Ver `app/worker/README.md`.
>
> **Padrão:** SQLite = staging do scraper · Postgres = serving DB · Mirror = replicação idempotente com proteção `manual`/`override` na fronteira (CQRS: worker no PC escreve, cloud lê). Decisão de arquitetura: duplicar 20+ funções de escrita com regras de merge num adapter PG criaria drift de regra de negócio; o mirror reutiliza as regras (`user-data-priority.ts`) verbatim.

- [x] **BACK:** B72a *(`PlannerWritePort` + adapter SQLite; resolvido via `isSqliteAllowed()` — staging sempre SQLite, cloud puro lança erro)*
- [x] **BACK:** B72b *(mirror Postgres — `lib/sync-mirror/`: snapshot readonly do SQLite do usuário → UPSERT/replace idempotente em `aluno`, `historico`, `semestre_atual`, `notas`, `faltas`, `tarefas`, `grupo_membros`, `integralizacao`, `configuracoes` (whitelist, sem credenciais) + catálogo global `disciplinas`, `requisitos`, `turmas_ofertadas`, `calendario_academico`; linhas `manual=1`/`*_override=1` no PG preservadas)*
- [x] **BACK:** B72c *(tenant CPF→`app_profiles` (`user_id` + `curso_id`) + hook `runMirrorAfterSync` nos 3 runners (`runSync`, turmas, calendário) — qualquer caminho (rota, fila, worker, script) espelha automaticamente; falha de mirror não derruba sync)*
- [x] **BACK:** B72d *(desstub `/api/sync*` em modo postgres local — `runWithScraperSqlite` (override ALS do guard, nunca vale em `isCloudDeployment()`); fila SQLite + readiness + turmas + calendário funcionam em dev postgres; no deploy Cloudflare o stub só permanece **sem** `SIGAA_WORKER_URL` configurado (dispatch B72e) · script `npm run sync:mirror` (SIGAA_CPF/SIGAA_PASSWORD) roda sync completo + verificação de linhas no PG)*
- [x] **OPS:** B72e *(dispatch cloud→worker pronto: fila Postgres `sync_jobs` · worker async 202 + robôs turmas/calendario · cloud despacha via `SIGAA_WORKER_URL`+Bearer · **path oficial = PC + cloudflared** (`worker:home` / `worker:tunnel`, `SIGAA_BROWSER_CHANNEL=chrome`) · secrets CF · `smoke:cloud-sync` · Fly/Docker = fallback)*

**Validação live (06/jul):** `npm run sync:mirror` com conta real → Supabase populado: aluno 1 · histórico 31 · semestre_atual 7 · notas 37 · faltas 149 · tarefas 2 · grupo 10 · integralização 5 · config 8 · turmas_ofertadas 99 · calendário 6. Fix extra no scraper: interstitial "Notificações Acadêmicas" do SIGAA (confirmar senha + leitura) e shim `__name` do esbuild/tsx no `page.evaluate`.

> **Ferramenta ops — home-server tray (jul/2026) `[x]`:** app de bandeja nativo (`app/scripts/HomeServerTray.cs` → `ServidorACME.exe`, build em `build-tray-exe.ps1` via `csc`; fallback PowerShell `home-server-tray.ps1`). Ícone = logo do site (`png-to-ico.ps1` gera `.ico` multi-res de `src/app/icon.png`, embutido via `/win32icon`). Menu **Executar/Parar** sobe/derruba `worker:home` (:8787) + `cloudflared` túnel e **atualiza sozinho** o secret `SIGAA_WORKER_URL` (captura a URL `*.trycloudflare.com` do stdout do cloudflared e roda `wrangler secret put`). Elimina o passo manual do secret a cada boot. `.exe`/`.ico` fora do git (`.gitignore`).

**Fix jul/2026 (turmas cloud + polish simulador):** `POST /api/sync/turmas` ganhou branch cloud — enfileira o robô `turmas` no worker (`enqueueCloudSyncJob`) em vez de tentar Playwright no Cloudflare; `useTurmasOfertadasSync` resolve credencial via sessão cloud (`resolveSyncStartCredentials`, sem prompt de senha) e faz poll do `jobId` antes de refazer o fetch. UI de Montar Grade: apelidos de disciplina curados (`subject-nickname-overrides.ts`, prioridade sobre código SIGAA), paleta de cores mais divergente (10 matizes) e remoção do botão "Exportar" (JSON). Removido o auto-sync de turmas ao abrir `/simulador` (`MatriculaView` sem `autoRun`) — sincroniza só no clique de "Atualizar SIGAA"/"Buscar turmas" ou no sync geral (refetch via evento `planner:sync-complete`); abrir a página apenas lê o que já está no banco.

**Validação E2E B72e (06/jul):** cloud simulado (`PLANNER_CLOUD=true` porta 3001) + worker local → `smoke:cloud-sync`: enqueue 202 → job `queued→running→completed` (121s, 5 etapas) → mirror ok → `sync_jobs` completed no Supabase. **Ops restante:** subir worker no PC + túnel + `wrangler secret put SIGAA_WORKER_URL` / `WORKER_SHARED_SECRET` + smoke na URL pública.

**Ordem Bloco 2f:** `B72a → B72b → B72c → B72d → B72e` ✅ código · ops = **PC home server** · push jul/2026 (aprovado `[x]`)

---

### #10 — Bloco 4 · Polimento UX + site mobile `✅ 4/4`

> **Executar antes do mobile (#8).** Quem não instalar o app Android usa o site no celular (**F28**).

- [x] **FRONT:** F25 *(loading skeletons — todas as telas)* — `SubjectDetailSkeleton` estruturado; demais telas já cobertas (dashboard, disciplinas, calendário, mapa, integralização, simulador/grade)
- [x] **FRONT:** F26 *(transições de página entre rotas)* — fade-in keyed por `pathname` nas telas do aluno (`.route-transition`, respeita `prefers-reduced-motion`)
- [x] **FRONT:** F27 *(favicon + título na aba)* — favicon já existente + `title` template `%s · ACME HUB` + `metadata` por página
- [x] **FRONT:** F28 *(site mobile pre-APK — grade compacta · notas/drawer/sync · ACME HUB · grafo sem link perfil · aprovado jul/2026)*

**Ordem Bloco 4:** `F25 → F26 → F27 → F28`

---

### #8 — Bloco 8 · Mobile Android (Expo Go) `🟢 15/16`

> **Requer #6d + #6e + #7 + #9 + #10** (site **v1.0** maduro, incl. **F28**). Mesmo backend Supabase / API Next.  
> **Ordem de execução:** **#9 → #10 → #8** — ver [ordem oficial](#ordem-oficial-de-execução-v3).  
> **Decisão (jul/2026):** app nativo **só Android** · **sem** Play/App Store · alternativa = **site mobile** (**F28**).  
> **Princípio (v1.0 → app):** **paridade de funções** com o site (tudo que o desktop faz), **não** clonar o layout do site mobile (**F28**). No nativo: só herdar **cores / marca / tipografia de produto**; IA e telas podem ser **mais modulares, visíveis e intuitivas** (bottom nav, home por “o que fazer agora”, módulos grandes). Sessão persistente · cache local · push (silencioso se deslogado). Ver detalhe § UX nativa.  
> **Progresso:** **M1–M15** `[x]`. **M16** `[@]` — download pelo site + v1.0.0. App **nativo** (não WebView) — mesmas APIs/funções do site; visual F28. Aprovado jul/2026.

- [x] **SETUP:** M1 *(projeto Expo TypeScript — `mobile/` · **Android only** · **SDK 54** p/ Expo Go da Play Store)*
- [x] **SHARED:** M2 *(tipos/contratos compartilhados — `packages/api-contracts` · `@acme/api-contracts`)*
- [x] **SETUP:** M3 *(sessão persistente — SecureStore + refresh; login até logout explícito)*
- [x] **FRONT:** M4 *(auth + gate assinatura — login CPF, trial/pago, logout limpa tokens/cache/push)*
- [x] **SHARED:** M5 *(cache local — snapshot acadêmico no device; invalida/atualiza pós-sync/API)*
- [x] **SHARED:** M6 *(push E2E — Expo Notifications + tokens no backend; dispara pós-sync/novidades; sem push se deslogado)*
- [x] **FRONT:** M7 *(dashboard — stats, entregas, cards, atalhos)*
- [x] **FRONT:** M8 *(disciplinas — lista + detalhe: notas, tarefas, faltas)*
- [x] **FRONT:** M9 *(calendário — agenda + eventos; alertas alinhados ao sino web)*
- [x] **FRONT:** M10 *(mapa PPC — grafo/grade usável no touch)*
- [x] **FRONT:** M11 *(integralização — CH por categoria)*
- [x] **FRONT:** M12 *(simulador de matrícula — paridade com `/simulador`)*
- [x] **FRONT:** M13 *(planos / PIX — assinatura no app)*
- [x] **FRONT:** M14 *(perfil + preferências de notificação — espelha web)*
- [x] **TEST:** M15 *(Expo Go Android — QA de paridade + push + sessão)*
- [@] **OPTIONAL:** M16 *(APK sideload pelo site · /releases + QR desktop + drawer F28 · **sem** Play Store · v1.0.0)*

**Ordem Bloco 8:** `M1 → M2 → M3 → M4` → `M5 → M6` → `M7–M14` → `M15` → `(M16 opcional)`

---

### #11 — Multi-PPC (Mecatrônica + Moda) `✅ 4/4`

> **Aprovado (jul/2026)** — PDFs em `docs/referencias/` — seeds Meca/Moda — CH por curso — turmas com `curso_id` da conta — sync worker ALS — glossário por curso — smoke `tests/multi-ppc-bloco-11.test.ts`.

- [%] **PLAN:** PPC Eng. Mecatrônica (Divinópolis) — PDF em `docs/referencias/PPC-mecatrônica-revisado.pdf`
- [%] **PLAN:** PPC Design de Moda (Divinópolis) — PDF em `docs/referencias/PPC-Design-de-Moda-Alteração-2024-v09-Versão-CGRAD.pdf`
- [x] **BACK:** indexar disciplinas + requisitos + metas CH (Meca + Moda) — JSON + `loadPpcSeedData(cursoId)` + `ch-catalog` + seed PG `--curso=all` + sync worker com ALS `cursoId` + glossário por curso
- [x] **BACK/FRONT:** smoke mapa/integralização Meca + Moda (filtro **B63** ✅; seed + CH + turmas `curso_id`; `tests/multi-ppc-bloco-11.test.ts`)

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

> **Progresso:** Bloco 1 ✅ · **Bloco 2a/2b** ✅ · **Bloco 6a** ✅ **8/8** · **6b** ✅ **8/8** (+ **B73/F42** `[x]` · **B74/F43** `[x]`) · **6c** ✅ **2/2** · **#6d** ✅ **6/6** · **#6e** ✅ **2/2** · **#7** ✅ **15/15** · **#12** B72a–e `[x]` **5/5** · **#9** `[x]` · **#10** F25–F28 `[x]` · URL **`https://acme-hub.khfm.workers.dev`**.

Roadmap detalhado: ver **[Roadmap #0→#11 no topo](#roadmap-detalhado--ordem-de-execução-0--11)** · [Ordem oficial v3](#ordem-oficial-de-execução-v3). **F19** simulador (2a) `[x]` · **B67** `[x]`.

---

## Ordem oficial de execução (v3)

> **Princípio (jul/2026):** terminar Bloco 1 no SQLite → **sync SIGAA real (Bloco 2) antes do Supabase** → cloud (6a/6b/6c) → PIX (#7) → **site web maduro** (#9 inteligência + #10 polimento/gráficos) → **só então mobile** (#8) → multi-PPC (#11). Mobile consome a mesma API — não duplicar UX incompleta no Expo.  
> **Modo testes global (6a):** URL pública + Supabase free; **RLS/multi-tenant** ✅ **6c** (antes do PIX).

```
FASE A   Bloco 1 (3E)          SQLite local — grade semanal ✅
    ↓
FASE B   Bloco 2a            Scraper dev (B24–B31) — sync REAL ⚠️ prioridade semestre
         Bloco 2b            Worker servidor (B54–B56)
    ↓
FASE C   Bloco 6a            Supabase + deploy global (seed, sem RLS rígido)
         Bloco 6b            Auth app + credenciais SIGAA cifradas
         Bloco 6c ✅          RLS multi-tenant — obrigatório antes de cobrar
    ↓
         Bloco 2c ✅          Orquestração sync + global (B68-orq) — policy §6.6
         Bloco 2e ✅          Painel dev + policy (B70/F41)
    ↓
FASE D   Bloco 7 ✅           Assinatura PIX
    ↓
         Bloco 2f ✅          Sync real Postgres (**B72**) — a–e `[x]` · ops = **PC + cloudflared**
    ↓
FASE F   Bloco 3             Inteligência acadêmica (web) ← **agora (local)**
         Bloco 4             Polimento UX + site mobile (**F28**)
    ↓
FASE E   Bloco 8             Mobile Android (Expo Go)  ← **após #9 + #10** · **sem lojas**
    ↓
FASE G   Bloco 9             Multi-PPC (Mecatrônica, Moda) [x] seeds+CH+turmas ✅
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
| **6d** | B | **2c** | Orquestração sync + catálogo global (**B68-orq**) | ✅ **6/6** — policy §6.6 |
| **6e** | B/F | **2e** | Painel dev + policy §6.6 (**B70** → **F41**) | ✅ **2/2** |
| **7** | D | **7** | PIX + gate de acesso | ✅ **15/15** · monetização |
| **12** | B | **2f** | **Sync real Postgres (B72)** — mirror SQLite→PG | ✅ **5/5** `[x]` — código + E2E ok; **ops = PC + cloudflared** |
| **9** | F | **3** | Grafo, matrícula, alertas | **Depois de #7** · **antes do mobile (#8)** |
| **10** | F | **4** | Skeletons, transições, favicon, **site mobile (F28)** | **Antes do mobile (#8)** |
| **#8** | E | **8** | Mobile Android (Expo Go) | **Depois de #9 + #10** + **#6d + #6e + #7** · **sem lojas** |
| **11** | — | **9** | Multi-PPC (Mecatrônica, Moda) | `[x]` seeds+CH+turmas ✅ |

### Sync antes da cloud (decisão de produto)

- Bloco **2a** roda em **dev local + SQLite** — não precisa Supabase para testar login SIGAA, portal e turmas.
- Objetivo: substituir `seed-demo` por pipeline Playwright **ainda com semestre ativo**.
- Supabase (**6a**) só depois que **B31** validado ✅ e **2b** fila desenhada.

### Modo global de testes (6a)

- Deploy Cloudflare Pages com URL compartilhável.
- Supabase free; seed PPC global (**B41**).
- RLS **permissivo ou desligado** na 6a/6b — ok para beta aberto.
- **6c obrigatório** antes do **Bloco 7** (PIX) e cobrança.
- **Plano operacional:** [`docs/plan/6a-supabase-plan.md`](./plan/6a-supabase-plan.md).
- **Marco “site no ar para testes gerais”:** ver [final do documento](#marco--site-no-ar-para-testes-gerais).

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
| **2e** | #6e | Painel dev + policy (B70/F41 ✅) |
| **2f** | #12 | **Sync real Postgres (B72)** — ✅ 5/5 `[x]` · ops = **PC + cloudflared** |
| **7** | #7 | Assinatura PIX |
| **3** | #9 | Inteligência acadêmica *(antes do mobile)* |
| **4** | #10 | Polimento UX + **site mobile (F28)** *(antes do mobile)* |
| **8** | #8 | Mobile Android (Expo Go · **sem lojas**) |
| **—** | #11 | Multi-PPC (Mecatrônica, Moda) `[x]` 4/4 ✅ |

**O que permanece no client (localStorage) durante o Bloco 1:**
- ~~Layout modular de módulos (`useModuleLayout`)~~ — **removido jul/2026** (dashboard fixo)
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
| **#3** | 2b | Worker sync (servidor) | ✅ **5/5** · F19 UI fila `[x]` | 5/5 |
| **#4** | 6a | Supabase + deploy global | ✅ **Concluído** · URL pública | 8/8 |
| **#5** | 6b | Auth: CPF login, cadastro completo | ✅ **Concluído** | 8/8 |
| **#6** | 6c | RLS multi-tenant | ✅ **Concluído** | 2/2 |
| **#6d** | 2c | Orquestração sync + catálogo global | ✅ **6/6** · policy **§6.6** | 6/6 |
| **#6e** | 2e | Painel dev + policy (B70 → F41) | ✅ **2/2** | 2/2 |
| **#7** | 7 | Assinatura PIX | ✅ **Concluído** | 15/15 |
| **#12** | 2f | **Sync real Postgres (B72)** | ✅ B72a–e `[x]` · **ops = PC + cloudflared** | 5/5 |
| **#9** | 3 | Inteligência acadêmica | **B36/B37** `[x]` (sino) · **F24 descartado** · demais `[x]` · próximo **#10** | 10/10 |
| **#10** | 4 | Polimento UX + site mobile (**F28**) | **F25–F28** `[x]` (aprovado jul/2026) | 4/4 |
| **#8** | 8 | Mobile Android (Expo Go) | **M1–M15** `[x]` · **M16** `[@]` · download site + v1.0.0 · **sem Play/App Store** | 15/16 |
| **#11** | 9 | Multi-PPC (Mecatrônica, Moda) | **[x]** seeds + CH + turmas | 4/4 ✅ |

> **Atalho:** [Roadmap detalhado topo](#roadmap-detalhado--ordem-de-execução-0--11) · [Checklist #1](#1--bloco-1--api--ui--sqlite-4949) · [#2–#3](#2-3--bloco-2--scraper-sigaa-detalhe) · [#6d](#6d--orquestração-sync--catálogo-global-pré-mobile) · [#4–#6](#4-6--bloco-6--cloud--supabase-detalhe) · [#7](#7--bloco-7--assinatura-pix-detalhe) · [#9](#9--bloco-3--inteligência-acadêmica-detalhe) · [#10](#10--bloco-4--polimento-ux--site-mobile-detalhe) · [#8](#8--bloco-8--mobile-android-detalhe) · [#11](#11--expansão-multi-ppc-detalhe)

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

> **Calendário — rótulos e datas (jul/2026, sobre B66) `[x]`:** renomeação **só na exibição** (nome bruto do SIGAA segue no banco): `Matrícula OnLine → Matrícula Fase 1`, `Rematrícula → Matrícula Fase 2`, `Processamento de Matrícula/Rematrícula → Resultado Matrícula Fase 1/2` (`event-label-overrides.ts`). Scraper passa a captar os eventos de "processamento" (`calendario-event-filter.ts`) e há fallback de datas institucionais conhecidas sem duplicar quando o SIGAA publica (`known-institutional-dates.ts`).

**Próximo:** **M16** `[@]` (download/APK). **#11 Multi-PPC** `[x]`. **M1–M15** `[x]`. Site **v1.0.1**. **F25–F28** `[x]`.

---

### #3 — Bloco 2b · Scraper SIGAA — worker `✅ 5/5`

> **Escopo fila:** [`SCOPE-CLOUD.md` §6.3](./SCOPE-CLOUD.md#63-fila-de-sync--decisão-fechada-mvp-worker) — 1 job global, auto **3h/usuário**, manual **fim da fila** + cooldown **5 min**, **prioridade** no 1º login.

- [x] **BACK:**  B54 — worker Playwright (`app/worker/` · slot 1 browser · Docker · POST `/jobs` R1)
- [x] **BACK:**  B55 — API fila sync (prioritária + normal; posição/ETA; polling ou Realtime)
- [x] **BACK:**  B56 — pipeline B24–B31 no worker (credenciais cifradas)
- [x] **OPS:**   O3 — cooldowns produção (auto 3h · manual 5 min · reinicia timer pós-sync); **exceção** painel `/dev` **B70/F41**
- [x] **FRONT:** F19 — UI fila + polling (`SyncQueueProvider`; **F37** footer)

**Ordem 2b:** `B54 → B55 → B56` → `O3` → `F19` ✅

---

### #6d — Orquestração sync + catálogo global (pré-mobile) `✅ 6/6`

> **Policy fechada (jul/2026):** `SCOPE-CLOUD` **[§6.6](./SCOPE-CLOUD.md#66-política-de-sync--decisão-de-produto-jul2026)**.

- [x] **PLAN:**  B68a — matriz gatilho × robô (R1 full/lite/deep · R2 · R3)
- [x] **PLAN:**  B68b — TTLs por camada; intervalo **ou** data fixa via painel `/dev`
- [x] **PLAN:**  B68c — botão **Sincronizar** = **R1-lite** (notas+tarefas); deep = batch noturno
- [x] **BACK:**  B68d — schema global vs `user_id` + `app_config` policy *(**B39** ✅ · `test:b68d`)*
- [x] **BACK:**  B68e — orquestrador cron + fila R1-deep + R2/R3 global + `max_concurrent` *(worker CF · `test:b68e`)*
- [x] **BACK:**  B68f — pipeline lite/deep + runtime lê policy *(SyncButton/useAutoSync lite · `test:b68f`)*

**Ordem #6d:** `B68a → B68b → B68c → B68d → B68e → B68f` ✅

**Antes do mobile (#8):** **#6d** ✅ · **#6e** ✅ · **#7** PIX · **#9 + #10**.

---

### #4 — Bloco 6a · Cloud — deploy global (testes) `✅ 8/8`

> Supabase + Postgres + URL pública. **Só após B31 validado.** RLS flexível nesta fase.

- [x] **PLAN:** Projeto Supabase free + env dev/prod — [`docs/plan/6a-supabase-plan.md`](./plan/6a-supabase-plan.md) · **Acme-Hub-dev** · `.env.local` ok
- [x] **BACK:**  B39 → B41 → B42 → B43
- [x] **OPS:**   O1 → O2
- [x] **TEST:**  T1 — deploy Cloudflare + smoke URL (runbook [`t1-smoke-deploy.md`](./plan/t1-smoke-deploy.md))

**Ordem 6a:** `PLAN` → `B39 → B41 → B42 → B43` → `O1 → O2` → `T1`

---

### #5 — Bloco 6b · Cloud — Auth `✅ 8/8` + extras

- [x] **BACK:** B44 → B45 → B58 → B63 → B59
- [x] **BACK:** B61 → B62 → B62b → B62c
- [x] **BACK+FRONT:** B73/F42
- [x] **BACK+FRONT:** B74/F43
- [x] **FRONT:** F29

**Ordem 6b:** `B44 → B45 → B58 → B63` → `B59` → `F29` → `B61 → B62 → B62b → B62c → B73/F42` → `B74/F43`

---

### #6 — Bloco 6c · Cloud — multi-tenant `✅ 2/2`

> **Obrigatório antes do Bloco 7 (PIX).**

- [x] **BACK:**  B40
- [x] **TEST:**  T2 — smoke 2 contas isoladas

**Ordem 6c:** `B40` → `T2` ✅

---

### #6e — Painel dev + policy (pré-PIX) `✅ 2/2`

> **Só após #6d.** Policy §6.6 editável · ops sem cooldown.

- [x] **BACK:**  B70 — painel dev API · `GET/PATCH /api/dev/sync-policy` · `GET /api/dev/sync-status` · robôs modulares sem cooldown · `test:b70`
- [x] **FRONT:** F41 — UI `/dev` · navbar 4 abas · robôs R1/R2/R3 modulares · contas+assinaturas · fila sync · **Orquestração sync**

**Ordem #6e:** `B70` → `F41`

---

### #7 — Bloco 7 · Assinatura PIX `✅ 15/15`

> Preços v1 definidos. **Só após #6e.**

- [x] **PLAN:** B47 → [x] **PLAN:** B48
- [x] **BACK:**  B49 → [x] B50 → [x] B51 → [x] B52 → [x] B53 → [x] B69
- [x] **FRONT:** F31 → F32 → F33 → F34 → F40
- [x] **LEGAL:** L1
- [x] **BACK:**  B71 *(endurecimento credenciais)*

**Ordem #7:** `B47 → B48` → `B49 → B50 → B51 → B52 → B53` → `B69` → `F31 → F32 → F33 → F34` → `F40` → `L1` → **`B71`**

---

### #12 — Bloco 2f · Sync real Postgres (B72) `✅ 5/5 [x]`

> ✅ **Mirror + dispatch cloud→worker validados E2E** (push jul/2026). **Ops = PC home server + cloudflared** (`worker:home` / `worker:tunnel` / secrets CF). Ver [detalhe](#12--bloco-2f--sync-real-postgres-b72) · `app/worker/README.md`.

- [x] **BACK:** B72a — Write Port + adapter SQLite (staging)
- [x] **BACK:** B72b — mirror Postgres (`lib/sync-mirror/` — UPSERT idempotente + proteção manual/override)
- [x] **BACK:** B72c — tenant CPF→`app_profiles` + hook `runMirrorAfterSync` nos runners
- [x] **BACK:** B72d — desstub `/api/sync*` local postgres (`runWithScraperSqlite`) + `npm run sync:mirror`
- [x] **OPS:**  B72e — fila `sync_jobs` + worker async + dispatch cloud → **PC** (`SIGAA_WORKER_URL` via cloudflared) + `SIGAA_BROWSER_CHANNEL=chrome` + `smoke:cloud-sync`

**Ordem #12:** `B72a → B72b → B72c → B72d → B72e` ✅ código · ops = **PC + tunnel** · push jul/2026 (aprovado `[x]`)

---

### #9 — Bloco 3 · Inteligência acadêmica `🟡 8/11`

> Depende de dados reais do Bloco 2. **Executar antes do mobile (#8).** Desenvolvimento **local (SQLite)** agora; deploy cloud não bloqueia B35+.

- [x] **BACK:**  B32 → B33 → B34
- [x] **FRONT:** F21 → F22 → F23
- [x] **BACK:**  B35
- [x] **FRONT:** F20
- [x] **BACK:**  B36 → B37
- [-] **FRONT:** F24 *(descartado — alertas só no sino)*

**Ordem Bloco 3:** `B32–B34` → `F21–F23` → `B35` → `F20` → `B36–B37` → `F24`

---

### #10 — Bloco 4 · Polimento UX + site mobile `✅ 4/4`

> **Executar antes do mobile (#8).** Alternativa ao app instalado = site no celular (**F28**).

- [x] **FRONT:** F25 → F26 → F27 → F28 *(aprovado jul/2026)*

**Ordem Bloco 4:** `F25 → F26 → F27 → F28`

---

### #8 — Bloco 8 · Mobile Android (Expo Go) `🟢 15/16`

> **Pré-mobile (#8):** site **v1.0** (**#6d + #7 + #9 + #10** + **F28**).  
> **Meta:** mesma função do desktop, UX nativa melhor · sessão que fica · dados no aparelho · push de sync/novidades (só logado).  
> **Progresso:** **M1–M15** `[x]`. **M16** `[@]` — download site + v1.0.0. App nativo (APIs do site). Aprovado jul/2026.

- [x] **SETUP:** M1 *(Expo `mobile/` · Android only · SDK 54)*
- [x] **SETUP/SHARED:** M2 *(tipos `@acme/api-contracts`)*
- [x] **SETUP:** M3 *(sessão SecureStore + refresh)*
- [x] **FRONT:** M4 *(auth + gate)*
- [x] **SHARED:** M5 → M6 *(cache local · push E2E)*
- [x] **FRONT:** M7 → M8 → M9 → M10 → M11 → M12 → M13 → M14 *(paridade de telas)*
- [x] **TEST:** M15 *(Expo Go · Android)*
- [@] **OPTIONAL:** M16 *(APK sideload · /releases + QR/drawer · sem loja · v1.0.0)*

**Ordem Bloco 8:** `M1–M4` → `M5–M6` → `M7–M14` → `M15` → `(M16 opcional)`

---

### #11 — Expansão multi-PPC (Mecatrônica + Moda) `✅ 4/4`

> **Aprovado (jul/2026)** — indexação Meca/Moda + smoke filtrado por `curso_id`.

- [%] **PLAN:** PPC oficial Eng. Mecatrônica — `docs/referencias/PPC-mecatrônica-revisado.pdf`
- [%] **PLAN:** PPC oficial Design de Moda — `docs/referencias/PPC-Design-de-Moda-Alteração-2024-v09-Versão-CGRAD.pdf`
- [x] **BACK:** Indexar disciplinas + requisitos + metas de CH (Mecatrônica e Moda) + sync ALS + auto-seed PG
- [x] **BACK/FRONT:** smoke mapa/integralização Meca/Moda (filtro **B63** ✅)

**Ordem #11:** `PLAN PPCs` → `indexar seeds` → `curso_id` → smoke por curso

---

### Resumo de progresso (por ordem de execução)

| Exec. # | Bloco | Status | Progresso |
|---------|-------|--------|-----------|
| #0 | 0 — Planejamento | ✅ | Concluído |
| **#1** | **1 — SQLite** | ✅ **Concluído** | 49 / 49 |
| **#2** | **2a — Scraper dev** | ✅ **8/8** · B67 `[x]` · **F19** `[x]` | 8 / 8 |
| **#3** | **2b — Worker sync** | ✅ **5/5** | 5 / 5 |
| #4 | 6a — Cloud deploy | ✅ **Concluído** | 8 / 8 |
| #5 | 6b — Cloud auth | ✅ | 8 / 8 |
| #6 | 6c — RLS | ✅ **Concluído** | 2 / 2 |
| **#6d** | **2c — Orquestração sync** | ✅ | 6 / 6 |
| **#6e** | **2e — Painel dev** | ✅ | 2 / 2 |
| #7 | 7 — Assinatura PIX | ✅ | 15 / 15 |
| **#12** | **2f — Sync real Postgres (B72)** | ✅ B72a–e `[x]` · **ops = PC + cloudflared** | 5 / 5 |
| #9 | 3 — Inteligência | ✅ **B36/B37** `[x]` (sino) · **F24 descartado** · próximo **#10** | 10 / 10 |
| #10 | 4 — Polimento + site mobile | **F25–F28** `[x]` | 4 / 4 |
| #8 | 8 — Mobile Android | 🟢 **M1–M15** `[x]` · **M16** `[@]` · download site + v1.0.0 · sem lojas | 15 / 16 |
| #11 | 9 — Multi-PPC | **[x]** seeds Meca/Moda + CH + turmas `curso_id` | 4 / 4 ✅ |

---

## Detalhe dos blocos

> **Ordem de leitura = ordem de execução:** #1 → #2–#3 → #4–#6 → **#6d** → **#6e** → **#7** → **#9 → #10** → **#8** → (#11).  
> Checklist resumido: [Checklist mestre](#checklist-mestre-ordem-de-execução) · Diagrama: [Ordem oficial v3](#ordem-oficial-de-execução-v3).

| Exec. | Seção abaixo |
|-------|----------------|
| **#1** | [Bloco 1 — SQLite](#1--bloco-1--api--ui--sqlite-detalhe) |
| **#2–#3** | [Bloco 2 — Scraper SIGAA](#2-3--bloco-2--scraper-sigaa-detalhe) |
| **#4–#6** | [Bloco 6 — Cloud Supabase](#4-6--bloco-6--cloud--supabase-detalhe) |
| **#6d** | [Orquestração sync + catálogo global](#6d--orquestração-sync--catálogo-global-pré-mobile) |
| **#6e** | [Painel dev + policy (pré-PIX)](#6e--painel-dev--policy-pré-pix) |
| **#7** | [Bloco 7 — PIX](#7--bloco-7--assinatura-pix-detalhe) |
| **#9** | [Bloco 3 — Inteligência](#9--bloco-3--inteligência-acadêmica-detalhe) |
| **#10** | [Bloco 4 — Polimento + site mobile](#10--bloco-4--polimento-ux--site-mobile-detalhe) |
| **#8** | [Bloco 8 — Mobile Android](#8--bloco-8--mobile-android-detalhe) |
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
| **2.4 Extra** | **B30** histórico · **B66** calendário · **B67** turmas · **B68-orq** orquestração *(policy §6.6 · ✅ 6/6)* |

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
| B68-orq | Plan/Back | Orquestração sync + global | Policy **§6.6** · **B68a–f** ✅ — **fora da ordem #2** | 2c | [x] |

**Ordem 2a (#2, linear):** `B24→B26` → `B27` → `B65` → `B28` → `B30` → `B31` → `F18` → `F37` → `F38` → `B66` → `B67` → `F19` · **8/8** até `F37` · **`B68-orq`** = [#6d](#6d--orquestração-sync--catálogo-global-pré-mobile)

> **Nota:** **B29/B57/F35** (materiais SIGAA → nuvem) **cancelados** jun/2026 — ver [Apêndice](#apêndice--escopo-futuro-fora-da-ordem-011).

#### 2b — Worker servidor (#3)

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B54 | Back | Worker Playwright | `app/worker/` · 1 slot browser · HTTP `/jobs` · Docker · graceful shutdown | [x] |
| B55 | Back | API fila sync | Filas prioritária + normal; enqueue; status/posição | [x] |
| B56 | Back | Pipeline no worker | B24–B31 no servidor; credenciais cifradas | [x] |
| O3 | Ops | Cooldowns sync | Auto ≥3h/usuário; manual 5 min; manual → fim da fila; **exceção** painel dev **B70** (sem cooldown) | [x] |
| F19 | Front | UI fila + polling | Status sync/fila (**F37**); enqueue + poll B55 | [x] |

**Ordem 2b (#3):** `B54 → B55 → B56` → `O3` → `F19`

#### B54 — Worker Playwright `[x]`

- [x] Processo separado `app/worker/` (`main.ts` · `server.ts`) — fora do Next.js
- [x] `BrowserJobSlot` — semáforo global (`SIGAA_WORKER_MAX_CONCURRENT`, padrão **1**)
- [x] HTTP: `GET /health` · `GET /status` · `POST /jobs` (Bearer `WORKER_SHARED_SECRET`) — job **R1** via `runSync`
- [x] Timeout por job · graceful shutdown (SIGTERM/SIGINT)
- [x] `worker/Dockerfile` (Playwright jammy) · `worker/README.md`
- [x] Testes `tests/worker-b54.test.ts`

> **Próximo (produto):** **M16** `[@]` (download/APK). **#11 Multi-PPC** `[x]`. **M1–M15** `[x]`. Site desktop **v1.0.1**. **F25–F28** `[x]`.

#### B55 — API fila sync `[x]`

- [x] SQLite global `.data/sync-queue.db` (`SYNC_QUEUE_DB_PATH`) — lanes **priority** + **normal** (FIFO por lane)
- [x] `POST /api/sync/queue` — enqueue (202) · idempotency key · cooldown manual **5 min** · senha cifrada (`CREDENTIALS_ENCRYPTION_KEY`)
- [x] `GET /api/sync/queue/[jobId]` — status · posição · ETA
- [x] Dispatcher assíncrono → worker B54 (`SIGAA_WORKER_URL`) ou **inline** (`SYNC_QUEUE_DISPATCH=inline`)
- [x] Testes `tests/sync-queue-b55.test.ts` · `npm run test:sync-queue`

> **Próximo (produto):** **M16** `[@]` (download/APK). **#11 Multi-PPC** `[x]`. **M1–M15** `[x]`. Site desktop **v1.0.1**. **F25–F28** `[x]`.

#### B56 — Pipeline no worker `[x]`

- [x] Worker aceita `passwordEnc` (AES) — tráfego API→worker sem senha plaintext
- [x] `POST /api/sync` enfileira via fila B55 + aguarda job (`runQueuedSync`)
- [x] Credenciais resolvidas no servidor (`sigaa-credential-store` · senha opcional no body)
- [x] Pipeline B24–B31 via `runSync` no worker/inline (Playwright isolado)
- [x] Gatilho `trigger` no body (`first_login` · `manual` · `auto`)

#### O3 — Cooldowns produção `[x]`

- [x] `sync-cooldown-policy.ts` — auto **3h** prod · **30 min** dev (`SYNC_COOLDOWN_PROFILE`)
- [x] Cooldown manual **5 min** na fila · manual/auto → lane **normal** (fim da fila)
- [x] Auto-sync elegível só após `sync.last_at + intervalo` (timer reinicia pós-sync OK)
- [x] `skipCooldown` + trigger `dev` para painel `/dev` (**B70/F41**)
- [x] Cliente envia `trigger: auto|manual|first_login` · **B68f:** `SyncButton`/`useAutoSync` enfileiram **R1-lite** (`mode: lite`)
- [x] Testes `tests/sync-b56-o3.test.ts`

#### F19 — UI fila + polling `[x]`

- [x] `SyncQueueProvider` — contexto global (`AppShell`); `useSync` enfileira + poll
- [x] `POST /api/sync/queue` + `GET /api/sync/queue/[jobId]` no client (`postSyncQueue`, `pollSyncJobUntilDone`)
- [x] Progresso foreground: posição na fila · ETA · steps do job concluído
- [x] **fix jul/2026:** progresso agora aparece também no sync de entrada/auto (background) — antes travava em `0%`. `background` passou a significar só "silencia erros"; `onUiStep` roda sempre (`run-queued-sync-client`), provider inicializa progresso, e `queueJobToUiStep` guarda contra job nulo.
- [x] Auto-sync (`useAutoSync`) enfileira com `trigger: auto` (cooldown O3 no servidor)
- [x] **F37** — `ProfileSyncFooter` mostra fila ao vivo ou intervalo (`3 h` / `30 min`)
- [x] Removido `postCalendarioSync` pós-sync no client (R2 global = **B68e**)

> Checklist: **[#2](#2--bloco-2a--scraper-sigaa--dev-88)** e **[#3](#3--bloco-2b--scraper-sigaa--worker-05)** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### #4–#6 — Bloco 6 · Cloud / Supabase (detalhe)

**Objetivo:** migrar SQLite → Postgres no Supabase; deploy global; auth; RLS antes do PIX.

#### 6a — Deploy global (#4)

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| — | Plan | Projeto Supabase | **Acme-Hub-dev** · env dev/prod · [`6a-supabase-plan.md`](./plan/6a-supabase-plan.md) | [x] |
| B39 | Back | Schema Postgres | Tabelas + `user_id` (nullable) · migration aplicada **Acme-Hub-dev** | [x] |
| B41 | Back | Seed PPC global | 61 disciplinas + requisitos · `npm run db:seed-ppc` | [x] |
| B42 | Back | Client Supabase | `@supabase/supabase-js` + adapter PG (`PLANNER_DATABASE=postgres`) | [x] |
| B43 | Back | Migrar APIs | dashboard · disciplinas · sync stub cloud | [x] |
| O1 | Ops | Deploy Frontend | Cloudflare Workers (OpenNext) + cron ping Postgres | [x] |
| O2 | Ops | Remover `.db` local | `PLANNER_CLOUD` + guard SQLite · stubs fila sync | [x] |
| T1 | Test | Deploy + smoke | **`npm run deploy:cf`** + cron + health/PPC/UI na URL pública | [x] |

**Ordem:** `PLAN` → `B39 → B41 → B42 → B43` → `O1 → O2` → `T1`

#### PLAN — Supabase + env dev/prod `[x]`

- [x] Plano operacional [`docs/plan/6a-supabase-plan.md`](./plan/6a-supabase-plan.md) — ambientes, free tier, worker TBD
- [x] Variáveis Supabase documentadas em `app/.env.example`
- [x] Projeto **Acme-Hub-dev** (São Paulo) criado no Supabase
- [x] `app/.env.local` preenchido (URL, publishable, secret, `DATABASE_URL`)
- [x] MVP **1 projeto** dev confirmado

#### B39 — Schema Postgres `[x]`

- [x] Migration `supabase/migrations/20260704120000_b39_initial_schema.sql` — catálogo global (`disciplinas`, `requisitos`, `calendario_academico`, `turmas_ofertadas`, `app_config`) + dados por aluno com `user_id UUID` nullable
- [x] Chave composta `(curso_id, codigo)` em `disciplinas`; `curso_id` nas FKs tenant
- [x] Script `npm run db:migrate` (`app/scripts/pg-migrate.ts` + `planner_schema_migrations`)
- [x] Teste estático `npm run test:b39`
- [x] Migration aplicada no **Acme-Hub-dev** (`npm run db:migrate` · Session pooler `aws-1-sa-east-1`)

> **6a concluído (jul/2026):** URL **`https://acme-hub.khfm.workers.dev`** · cron **`acme-hub-cron-ping`** · smoke T1 ✅. **6b** ✅ **8/8**. **6c** ✅ **2/2** · `npm run test:t2` · `npm run smoke:t2`.

#### B41 — Seed PPC global `[x]`

- [x] `lib/db/postgres/seed-ppc-global.ts` + `npm run db:seed-ppc`
- [x] Catálogo global `disciplinas` + `requisitos` (`curso_id=eng-computacao`)
- [x] Seed aplicado no **Acme-Hub-dev** (61 disciplinas · 99 requisitos)
- [x] Loader compartilhado `lib/db/ppc-seed-loader.ts`

#### B42 — Client Supabase + adapter PG `[x]`

- [x] `@supabase/supabase-js` · `lib/supabase/client.ts` (server + browser)
- [x] Pool PG + `lib/db/postgres/queries-read.ts` · `PLANNER_DATABASE=postgres`
- [x] `ensurePostgresReady()` · default SQLite inalterado
- [x] `.env.example` — `PLANNER_DATABASE` · `PLANNER_CURSO_ID`

#### B43 — Migrar APIs (dashboard · disciplinas · sync stub) `[x]`

- [x] `GET /api/dashboard` · `GET /api/disciplinas` · `GET /api/disciplinas/[code]` leem Postgres quando `PLANNER_DATABASE=postgres`
- [x] `POST /api/sync` stub cloud (sem Playwright inline no Postgres)
- [x] Builders async + query ports (`postgresQueryDeps`)
- [x] Testes `npm run test:b41-b43`

#### O1 — Deploy Cloudflare + cron ping `[x]`

- [x] `GET /api/health` — liveness + `?deep=1` com `SELECT 1` no Postgres
- [x] `CRON_SECRET` — protege ping deep (Bearer / `x-cron-secret`)
- [x] OpenNext `@opennextjs/cloudflare` · `wrangler.jsonc` · scripts `deploy:cf`
- [x] Worker `acme-hub-cron-ping` — cron diário **15:00 UTC** (= 12:00 BRT)
- [x] Runbook [`docs/plan/o1-cloudflare-deploy.md`](./plan/o1-cloudflare-deploy.md)
- [x] Testes `npm run test:o1`
- [x] **Stakeholder aprovou** — deploy prod jul/2026

#### O2 — Prod sem `.db` local `[x]`

- [x] `PLANNER_CLOUD` + auto-detect Workers — cloud força backend `postgres`
- [x] `assertSqliteAllowed()` — bloqueia `planner.db`, bootstrap SQLite e `sync-queue.db`
- [x] Erro `503 SQLITE_DISABLED` em rotas SQLite-only (mapa, calendário, etc.)
- [x] Stubs fila sync cloud (`/api/sync/queue`)
- [x] Runbook [`docs/plan/o2-prod-postgres.md`](./plan/o2-prod-postgres.md)
- [x] Testes `npm run test:o2`
- [x] **Stakeholder aprovou** — guard validado em prod

#### T1 — Deploy Cloudflare + smoke URL pública `[x]`

> **Aprovado jul/2026** — URL **`https://acme-hub.khfm.workers.dev`**.

- [x] Env vars Cloudflare (`PLANNER_CLOUD`, Postgres, Supabase, `CRON_SECRET`)
- [x] `npm run deploy:cf` + `npm run deploy:cron-ping`
- [x] Smoke: `/api/health`, `/api/health?deep=1` → `"database":"ok"`, `/api/disciplinas/01%2F1`, UI `/`
- [x] Runbook [`docs/plan/t1-smoke-deploy.md`](./plan/t1-smoke-deploy.md)
- [x] Login SIGAA na URL pública ainda bloqueado (SQLite bootstrap) — **fora do escopo T1**; normal até **6b**

#### 6b — Auth (#5)

> **Escopo (regras):** `SCOPE.md` §2.0–§2.2, §2.5 · `SCOPE-CLOUD.md` §3–§4.  
> **Resumo:** cadastro = **e-mail + telefone + CPF + senha SIGAA + curso (PPC)** (+ opcional **matrícula do amigo** **B74/F43**); **login só CPF + senha**; trial **7 dias / 1× por CPF**; **e-mail** = promo + ciclo conta (§2.5) — acadêmico só in-app (**F38**).

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B44 | Back | Conta do aluno | Cadastro: e-mail, telefone, CPF, `curso_id`, senha cifrada; **login só CPF** | [x] |
| B45 | Back | Credenciais cifradas | Persistência AES (CPF + senha) no servidor — **obrigatório** para sync sem usuário online (worker **B56**) | [x] |
| B58 | Back | Trial por CPF | Registro `trial_por_cpf`: 7 dias **uma vez** por CPF (anti-abuso) | [x] |
| B59 | Back | Gate de acesso | Middleware: `trial_active` \| `active` liberam; expirado → billing | [x] |
| B63 | Back | `curso_id` na conta | Enum Comp/Meca/Moda; mapa/integralização filtram PPC por curso | [x] |
| B61 | Back | Preferências contato | PATCH `/api/perfil` → `app_profiles` Postgres (UI **F37** ✅) | [x] |
| F29 | Front | Cadastro + login | Cadastro: e-mail, tel, CPF, curso, senha · Login: **só CPF + senha** · tabs cloud + Bearer | [x] |
| B62 | Back | E-mails conta/promo | Fila: promoções (**sempre**) + cadastro, fim trial, plano perto de acabar, plano encerrado | [x] |
| B62b | Back | Provedor e-mail | **Brevo** (grátis/sem domínio) → Resend fallback · REST `fetch` · HTML anti-XSS · retry backoff · stub sem secret · **deploy+teste ok** | [x] |
| B62c | Back | Conteúdo + ativação e-mail | Saudação 2 primeiros nomes · link `/planos` absoluto · agenda plano expirando (7/3/1) + encerrado · disparo de promoção no `/dev` | [x] |
| B73 | Back | Promo do site (por preço) | Promo global dirigida por preço no `app_config`: operador define preço promocional + duração; sistema calcula %, gera textos, sobrescreve preço no checkout e na `GET /api/billing/plans`, e reverte no fim do prazo | [x] |
| F42 | Front | Promoções (/dev) + banner | Aba **Promoções** no `/dev` (tabela de preços atuais, form preço+duração com preview de %, promo ativa + encerrar) · banner e card com preço riscado em `/planos` | [x] |
| B74 | Back | Indicação por matrícula | `account_referrals` · `friendMatricula` no register · +3d cada no 1º PIX do indicado · cap 30d · trial 7d intacto | [x] |
| F43 | Front | Matrícula do amigo | Criar conta: troca “Chave de plano” por campo opcional matrícula + copy de indicação | [x] |

**Ordem 6b:** `B44 → B45 → B58 → B63` → `B59` → `F29` → `B61 → B62 → B62b → B62c → B73/F42` → `B74/F43`

> **Fora do 6b:** pagamento PIX e planos pagos = **Bloco 7** (B47–B53). Dev local Bloco 1–2 mantém login SIGAA simples até cloud.

**Removido / absorvido:** F30 (onboarding SIGAA separado) — credenciais no **cadastro** (F29) · **F36** (menu Config contato) — **F37** já edita e-mail/tel no modal perfil (`ProfileAccountSection` + `PATCH /api/perfil`)

#### 6c — Multi-tenant (#6)

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B40 | Back | RLS policies | `user_id = auth.uid()` · migration + tenant context API | [x] |
| T2 | Test | Isolamento | 2 contas não veem dados uma da outra · `test:t2` + `smoke:t2` | [x] |

**Ordem:** `B40` → `T2` ✅

> Checklist: **#4–#6** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

> Checklist: **#6d** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### #6e — Painel dev + policy (pré-PIX) (detalhe)

**Objetivo:** operador configura policy §6.6 e dispara robôs manualmente **sem cooldown** (O3).

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B70 | Back | Painel dev API | Login operador; `/api/dev/*`; **`GET/PATCH /api/dev/sync-policy`**; **`GET /api/dev/sync-status`**; robôs modulares sem cooldown; auditoria | [x] |
| F41 | Front | Painel dev `/dev` | Login operador; navbar 4 abas; robôs R1/R2/R3 modulares; contas+assinaturas; fila sync; **Orquestração sync** (TTLs, batch, policy §6.6) | [x] |

**Ordem #6e:** `B70` → `F41`

> Escopo gift + painel: [`SCOPE.md` §2.1.1 / §10](./SCOPE.md) · [`SCOPE-CLOUD.md` §3.6 / §8](./SCOPE-CLOUD.md) · [Apêndice](#apêndice--chaves-gift-e-painel-dev-jun2026)

> Checklist: **#6e** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### #7 — Bloco 7 · Assinatura PIX (detalhe)

**Objetivo:** plano por período; pagamento PIX no cadastro; gate de acesso.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| B47 | Plan | Planos e preços | Trial + 3m/6m/12m/5a — **R$ 50 / 85 / 150 / 700**; trial 7d 1×/CPF | [x] |
| B48 | Plan | Gateway PIX | **Mercado Pago v1** + mock · `GET /api/billing/gateway/status` | [x] |
| B49 | Back | Tabelas billing | `plans`, `subscriptions`, `payments` · migrations + RLS + catálogo schema | [x] |
| B50 | Back | Checkout PIX | `POST /api/billing/checkout` · idempotência · gate billing exempt | [x] |
| B51 | Back | Webhook | MP + mock · confirmação → `subscription.active` | [x] |
| B52 | Back | Gate middleware | `subscriptions` + trial · bloqueia pending/expired → `/planos` | [x] |
| B53 | Back | Renovação | Grace 3d (`BILLING_GRACE_PERIOD_DAYS`) · checkout `renewal` · stack período | [x] |
| B69 | Back | Chaves gift | `plan_gift_keys` · dev CRUD · `POST /api/billing/redeem-key` | [x] |
| B71 | Back | **Endurecimento credenciais** | accountRef opaco · credentialSaved · audit/log sanitizados · gate `CREDENTIALS_ENCRYPTION_KEY` prod | [x] |
| F31 | Front | Cadastro + plano | Pós-auth redirect · `ACCOUNT_EXISTS` → login · guard cloud · checkout `POST /api/billing/checkout` · handoff `/planos/pix` | [x] |
| F32 | Front | Tela PIX | `/planos/pix` — QR base64 · copia-e-cola · polling status · redirect pós-aprovado | [x] |
| F33 | Front | Renovação | `PlanosStatusAlert` — grace 3d · copy acumula período | [x] |
| F34 | Front | Minha assinatura | Modal perfil — plano · validade · histórico PIX | [x] |
| F40 | Front | Resgate chave plano | 8 chars — `/planos` (cadastro usa **matrícula do amigo** **F43**) · feedback uso único | [x] |
| L1 | Legal | Termos + LGPD | `/termos` · `/privacidade` · consent cadastro · `GET /api/legal/meta` | [x] |

**Ordem #7:** `B47 → B48` → `B49 → B50 → B51 → B52 → B53` → `B69` → `F31 → F32 → F33 → F34` → `F40` → `L1` → **`B71`** *(última — imediatamente antes do go-live público)*

> **Painel dev:** **B70/F41** = [#6e](#6e--painel-dev--policy-pré-pix) *(executar antes deste bloco)*.

> Escopo gift + painel: [`SCOPE.md` §2.1.1 / §10](./SCOPE.md) · [`SCOPE-CLOUD.md` §3.6 / §8](./SCOPE-CLOUD.md) · [Apêndice](#apêndice--chaves-gift-e-painel-dev-jun2026)

> Checklist: **#7** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### #9 — Bloco 3 · Inteligência acadêmica (detalhe)

**Objetivo:** regras de negócio com dados reais (pré-requisitos, matrícula, grafo, alertas). **Executar antes do mobile (#8).**

| Área | O que resolve |
|------|----------------|
| **Matrícula** | Quais matérias o aluno pode cursar; choque de horário; salvar simulação |
| **Mapa PPC** | Grafo interativo com setas pré/co-requisito |
| **Alertas** | CH perto de completar; datas acadêmicas chegando |

| # | Tipo | Task | Resumo | Fase | Status |
|---|------|------|--------|------|--------|
| B32 | Back | Motor elegibilidade | `GET /api/simulador/elegibilidade` · histórico + pré-requisitos | 5.3 | [x] |
| B33 | Back | Choque de horários | `POST /api/simulador/choques` · sobreposição na grade | 5.3 | [x] |
| B34 | Back | Persistir simulação | `GET/POST/DELETE /api/simulador/simulacoes` · export JSON | 5.3 | [x] |
| B35 | Back | `GET /api/mapa/grafo` | Nós e arestas para react-flow | 5.2 | [x] |
| B36 | Back | Alertas integralização | Limiar por categoria de CH (sino) | 5.4 | [x] |
| B37 | Back | Alertas calendário | Datas acadêmicas no sino (nova / D-1 / no dia) | 5.5 | [x] |
| F20 | Front | Grafo react-flow | Zoom, pan, Bézier · co-req sempre dourado (polish jul/2026) | 5.2 | [x] |
| F21 | Front | Simulador elegível | Filtro + drag-and-drop na grade | 5.3 | [x] |
| F22 | Front | Alerta choque | Destaque visual de conflito | 5.3 | [x] |
| F23 | Front | Salvar simulação | Botões salvar/exportar matrícula | 5.3 | [x] |
| F24 | Front | Alertas na UI | ~~Banners~~ descartado — alertas só no sino | 5.4–5.5 | [-] |

**Ordem:** `B32 → B33 → B34` → `F21 → F22 → F23` → `B35 → F20` → `B36 → B37 → F24`

> Checklist: **#9** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### #10 — Bloco 4 · Polimento UX + site mobile (detalhe)

**Objetivo:** skeletons, transições, favicon e **site usável no celular** (alternativa ao app instalado).

| # | Tipo | Task | Resumo | Fase | Status |
|---|------|------|--------|------|--------|
| F25 | Front | Loading skeletons | Placeholders em todas as telas | 6.4 | [x] |
| F26 | Front | Transições de página | Animações entre rotas | 6.4 | [x] |
| F27 | Front | Favicon + título | Identidade na aba do browser | 6.4 | [x] |
| F28 | Front | Site mobile | Pre-APK · grade compacta · notas/drawer/sync · ACME HUB · grafo sem link | 6.4 | [x] |

**Ordem:** `F25 → F26 → F27 → F28`

> Checklist: **#10** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### #8 — Bloco 8 · Mobile Android (detalhe)

**Objetivo:** app **Android only** (Expo Go); **paridade funcional com o site desktop v1.0**, com UX nativa mais intuitiva. **Sem** Play/App Store. Quem não instalar usa **F28**.

**Contratos de produto (jul/2026 · pós-v1.0 web):**

| Requisito | Como entra no Bloco 8 |
|-----------|------------------------|
| Toda **função** do site no app | Telas **M7–M14** (conteúdo), não necessariamente a mesma hierarquia visual do web |
| UX nativa ≠ clone do F28 | **Só** cores/marca/visual de produto; layout/IA livres (modular, touch-first, mais visível) |
| **Sem barra lateral** | Navegação **só inferior** (bottom tabs) — **proibido** drawer/sidebar no app |
| Intuição > ordem do menu web | Home por jobs (“hoje / prazos / notas”); bottom nav; módulos grandes — ver § UX nativa |
| Login que permanece | **M3** SecureStore + refresh · senha só no login/logout |
| Dados no aparelho | **M5** cache local; atualiza quando API/sync traz novidade |
| Aviso no telefone pós-sync | **M6** push; **não** envia se deslogado |
| Política de alertas | Mesma do sino web: cadastro · D-1 · no dia (+ notas/tarefas novas) |

#### UX nativa — princípios (não espelhar o browser)

> **F28** = site usável no celular. **Bloco 8** = app **pensado para o bolso**, não um WebView do dashboard.

| Fazer | Evitar |
|-------|--------|
| **Bottom tab bar** (Início · Agenda · Matérias · Mais) — **única** navegação principal | **Barra lateral / drawer** (proibido no app) · copiar sidebar do Next.js |
| Home = “o que importa agora” (próxima aula, prazos, alertas, CH) | Home = lista longa de cards iguais ao desktop |
| Disciplina como hub (notas / faltas / tarefas em abas ou segments) | Empilhar a mesma densidade de painéis do `/disciplinas/[code]` |
| Tipografia e alvos de toque grandes; hierarquia clara | Densidade desktop / tabelas largas |
| Cores Cruzeiro + glass/premium do produto | Outra paleta ou “Material genérico” |

**Referências (pesquisa jul/2026) — o que elogiam / o que evitar:**

| Referência | Lição útil p/ ACME HUB |
|------------|-------------------------|
| **Canvas Student** | App ≠ site: fluxos “no caminho” (notas, to-do, calendário, push). Home com atalhos de alta frequência. |
| **MobileU (Utah)** | Redesign com feedback de alunos: home com **poucos** atalhos do dia a dia; seções com “top 3”; menu pinável — descoberta > menu completo. |
| **Case Canvas redesign (UX)** | Pergunta-guia: *onde preciso estar, o que entregar, como estou?* — poucas telas, pouco scroll cognitivo. |
| **SIGAA Mobile (UFRN)** | Offline + horários + push de rotina são esperados; estudos BR apontam **falhas de usabilidade** e gap vs web — **não** espelhar o SIGAA; superar em clareza. |
| **Campus apps (myBYUI / Navigate)** | Separar “hoje na rotina” de “ferramentas profundas” (mapa PPC, simulador, planos em “Mais”). |

**Jobs do aluno no app (ordem sugerida de prioridade na UI):**

1. Abrir e ver **hoje** (aula / prazo / alerta) em menos de 3 toques  
2. Ver **nota ou falta** de uma matéria sem caçar menu  
3. Confiar que **sync/novidade** chega de push  
4. Explorar mapa / integralização / simulador / planos quando precisar (não poluir a home)

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| M1 | Setup | Projeto Expo | `mobile/` TypeScript · **Android only** · **SDK 54** (Expo Go Play Store) | [x] |
| M2 | Shared | Tipos | Contratos API — `packages/api-contracts` (`@acme/api-contracts`) | [x] |
| M3 | Setup | Sessão persistente | SecureStore + `POST /api/auth/refresh` · sessão até logout | [x] |
| M4 | Front | Auth + gate | Login CPF · trial/pago · logout limpa tudo | [x] |
| M5 | Shared | Cache local | Snapshot acadêmico AsyncStorage · fallback offline | [x] |
| M6 | Shared | Push E2E | Tokens + Expo Notifications · push pós-sync | [x] |
| M7 | Front | Dashboard | Stats, entregas, cards, atalhos | [x] |
| M8 | Front | Disciplinas | Lista + detalhe (notas, tarefas, faltas) | [x] |
| M9 | Front | Calendário | Agenda + eventos · alertas alinhados ao web | [x] |
| M10 | Front | Mapa PPC | Grafo/grade usável no touch · sem % no subtítulo | [x] |
| M11 | Front | Integralização | CH por categoria | [x] |
| M12 | Front | Simulador | Paridade `/simulador` · preview fantasma · co-req multi-opção | [x] |
| M13 | Front | Planos / PIX | Assinatura no app | [x] |
| M14 | Front | Perfil + prefs | Prefs notificação · **Tutorial** no menu | [x] |
| M15 | Test | Expo Go QA | Paridade + push + sessão (**Android**) | [x] |
| M16 | Optional | APK sideload | Download pelo site (`/releases` + QR desktop + drawer F28) · **sem** Play Store · v1.0.0 | [@] |

**Ordem:** `M1 → M2 → M3 → M4` → `M5 → M6` → `M7 → … → M14` → `M15` → `(M16 opcional)`

> Checklist: **#8** no [Checklist mestre](#checklist-mestre-ordem-de-execução).

---

### #11 — Expansão multi-PPC (detalhe)

> **⛔ Só após #8 (Mobile)** com Eng. Computação 100% funcional. Ver `SCOPE.md` §6.2.

| # | Tipo | Task | Resumo | Status |
|---|------|------|--------|--------|
| — | Plan | PPC Eng. Mecatrônica | PDF em `docs/referencias/PPC-mecatrônica-revisado.pdf` | [x] |
| — | Plan | PPC Design de Moda | PDF em `docs/referencias/PPC-Design-de-Moda-…-CGRAD.pdf` | [x] |
| — | Back | Seeds multi-curso | JSON + loader + CH + seed PG + worker ALS + glossário | [x] |
| — | Back/Front | Smoke multi-curso | `tests/multi-ppc-bloco-11.test.ts` + turmas `curso_id` | [x] |

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
#3  Bloco 2b  Worker + fila (§6.3 SCOPE-CLOUD)     ✅ 5/5
      ↓
#4  Bloco 6a  Supabase + deploy global       (após sync validado)
#5  Bloco 6b  Auth: cadastro + login CPF ✅ (8/8)
#6  Bloco 6c  RLS multi-tenant ✅             (antes do PIX)
#6d Bloco 2c  Orquestração sync (B68-orq)     policy §6.6 · ✅ 6/6
#6e Bloco 2e  Painel dev + policy (B70/F41)        ✅ 2/2
      ↓
#7  Bloco 7   Assinatura PIX                   ✅ 15/15
      ↓
#9  Bloco 3   Inteligência acadêmica        ← site antes mobile
#10 Bloco 4   Polimento UX + site mobile (F28) ← gráficos / ajustes web
      ↓
#8  Bloco 8   Mobile Android (paridade site v1.0 + push + sessão · M1–M16 · sem lojas)
      ↓
#11 Bloco 9   Multi-PPC (Mecatrônica, Moda)  [x] 4/4 ✅
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
| **Fase 7** | Bloco 8 | App Android — paridade site v1.0 + push + sessão (sem lojas) |
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
- [x] **Produção:** fila worker (**B54–B56** `[x]`) + cooldowns (**O3** `[x]`) + UI fila (**F19** `[x]`) — ver [Apêndice B65](#apêndice--b65-sync-automático-dev-remover-antes-de-produção) e `SCOPE-CLOUD.md` §6.3

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

> **B30** = caminho crítico do sync (última etapa do robô). **B66** e **B67** = robôs **separados** (`POST /api/sync/calendario` · `POST /api/sync/turmas`) — **não** entram em `execute-live-sync-pipeline` nem em `runSync`; **B66** passa a orquestração global (**B68e**); **B67** sob demanda no `/simulador` (**F19** 2a).

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

#### B68-orq — Orquestração sync + catálogo global `[x]`

> **Pré-mobile (#8):** **#6d** ✅ · **#6e** ✅ · **#7 + #9 + #10**. Policy **§6.6 `SCOPE-CLOUD`**. *(Distinto do **B68** simulação mapa no Apêndice gift/dev.)*

- [x] **Policy documentada** — matriz robô × gatilho; R1 full/lite/deep; botão lite; global R2/R3; batch noturno; policy no `/dev`
- [x] **Schema global (B68d)** — catálogo GLOBAL/TENANT · `app_config` · migration seed · `test:b68d`
- [x] **Orquestrador (B68e)** — janela 03–06h · plan/tick R2/R3 · fila R1-deep · `max_concurrent` · cron CF · `test:b68e`
- [x] **Pipeline lite/deep (B68f)** — `resolveSyncMode` · subpáginas turma · histórico por mode · runtime policy · `test:b68f`

#### B66 — Calendário acadêmico `[x]`
> **Escopo aprovado** (jun/2026). Robô isolado — calendário nem sempre existe no SIGAA; snapshot `unavailable` **não apaga** dados locais. Semestre alvo derivado da **data atual** (`resolveCalendarioSemesterTargets` — jul/2026: `2026.1` + `2026.2`). **Aprovado** stakeholder jun/2026 (`75694c0`).

- [x] Schema `calendario_academico` + `build-calendar` + `CalendarAcademicDates` em `/calendario`
- [x] Scraper Ensino → Calendário Acadêmico (`navigate-to-calendario`, `parse-calendario-html`, `scrape-calendario`)
- [x] `POST /api/sync/calendario` + `runCalendarioSync` + policy persist + TTL 7d (`calendario-sync-plan`)
- [x] Disparo em background pós-sync principal — removido do client (**F19**); orquestração global **B68e** *(R2/R3 marca state Postgres; scrape B66/B67 no tick futuro)*
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

- [x] Input de usuário e senha do SIGAA *(dev SQLite — cloud usa CPF via **F29** ✅)*
- [x] Senha com mostrar/ocultar (`PasswordInput`)
- [x] Toggle "Lembrar senha neste computador" — persiste usuário no client; senha cifrada no SQLite (B25 ✅)
- [x] Botão "Entrar e Sincronizar"
- [x] Loading state com progresso da sincronização
- [x] Tratamento de erro visual (credenciais inválidas, SIGAA offline) — **F18** ✅
- [x] Login rápido + sync full bloqueante no 1º acesso (**B31**)
- [x] Hint “primeiro acesso demora” abaixo do botão sincronizando (**F18**)
- [x] Modulação de layout **somente no dashboard** (demais telas layout fixo)
- [x] Menu perfil no avatar — modal, tutorial, /planos, **editar e-mail/celular** (**F37** ✅ · `PATCH /api/perfil`)
- [x] Sino de notificações in-app — tarefas/notas novas + lembretes 24h/1h (**F38**); polish `04887c9` (baseline pré-sync, nota obtida/máxima no painel)
- [x] Cadastro produção: e-mail, telefone, CPF, **curso (Comp/Meca/Moda)**, senha — **F29** ✅ · opcional **matrícula do amigo** (**F43** `[x]`)
- [x] Login produção: **apenas CPF + senha** — **F29** ✅ (`POST /api/auth/login` · Bearer + `X-Planner-Sigaa-User`)
- [x] `/planos` checkout PIX + gift key + renovação (**F31–F33**, **F40**) · `/planos/pix` QR + polling (**F32**) · perfil histórico (**F34**)
- [x] Termos + Privacidade LGPD — **L1** (`/termos` · `/privacidade` · consent no cadastro · links login/planos)
- [x] Endurecimento credenciais — **B71** (`accountRef` · `safe-log` · audit sanitizado)
- [x] PATCH contato na **cloud** (`app_profiles`) — **B61** ✅ (`PATCH /api/perfil` · UI **F37**)

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

### 3.6 Layout Modular de Módulos — **REMOVIDO (jul/2026)**
> **Recurso descontinuado.** A modularização (reordenar/ocultar/arrastar módulos) não faz mais sentido no produto. Removido do dashboard — único lugar que ainda usava. Apagados `useModuleLayout`, `ModuleGrid`, `ModuleLayout` + CSS `.module-*`; `DashboardView` passou a render fixo. Chave `localStorage` `module-layout:dashboard` fica órfã (inofensiva).
- [x] ~~Hook `useModuleLayout` com persistência em `localStorage`~~ — removido
- [x] ~~Reordenar módulos (↑ ↓)~~ — removido
- [x] ~~Ocultar / mostrar módulos e restaurar layout padrão~~ — removido
- [x] ~~Aplicar layout modular no dashboard~~ — removido (dashboard agora é fixo)
- [x] ~~Arrastar e soltar módulos para reordenar (drag-and-drop)~~ — removido
- [x] Corrigir modal centralizado na tela (calendário e demais páginas)
- [x] Corrigir espaços vazios no calendário e integralização
- [x] Filtros globais visíveis na página do calendário

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
- [x] **polish jul/2026:** "Simular" 100% efêmero — snapshot das notas reais ao entrar; criar avaliação (`+ Avaliação`) e editar notas vivem só na simulação e somem ao sair (`Notas reais`), **sem** persistir no servidor. Nota total, barra e badge atualizam **ao vivo** via `computeGradeRisk` sobre o conjunto simulado; avaliações efêmeras têm botão remover. (`useGradeSimulation` reescrito, `SubjectGradesPanel` e `useSubjectGrades` desacoplado da simulação.)

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
- [x] *(Bloco 9 — #11)* Indexar PPC Eng. Mecatrônica — `disciplinas_db_eng-mecatronica.json` (78 obr.)
- [x] *(Bloco 9 — #11)* Indexar PPC Design de Moda — `disciplinas_db_design-moda.json` (47 obr.)

### 5.2 Mapa Mental / Grafo do Curso
- [x] Colunas por período (1–10) com disciplinas obrigatórias e status — **via API** (F12 · B18)
- [x] Cores dos nós por status: Concluída, Cursando, Desbloqueada, Trancada
- [x] Clique no nó navega para página da disciplina
- [x] API grafo — **B35** `GET /api/mapa/grafo` (nós + arestas pre/co p/ react-flow)
- [x] Renderizar grafo interativo (`@xyflow/react`) — **F20**
- [x] Setas sólidas para pré-requisitos, pontilhadas para co-requisitos — **F20**
- [x] Zoom e pan para navegação — **F20**

### 5.3 Simulador de Matrícula (Pré-horário)
- [x] Página dedicada apenas ao simulador de horários/matrícula (`/simulador` — Montar Grade)
- [x] Buscar turmas ofertadas do SIGAA (scraper **B67** `[x]`)
- [x] Montar grade via API — **F19** `[x]` (`GET /api/turmas-ofertadas`, preview multi-horário, coreq par rollback+modal, cards uniformes, CH obr/opt/total, export JPEG)
- [x] Lista de matérias com ícones: Desbloqueada / Trancada (template mock)
- [x] Alocar matéria desbloqueada em horário vazio da grade (clique — template)
- [x] Clique em aula da grade abre modal com detalhes e opção de remover
- [x] API elegibilidade — **B32** (`GET /api/simulador/elegibilidade`)
- [x] API choque de horários — **B33** (`POST /api/simulador/choques`)
- [x] API salvar/exportar simulação — **B34** (`/api/simulador/simulacoes`)
- [x] Drag-and-drop de matérias para a grade semanal — **F21** `[x]`
- [x] Detecção automática de choque de horários (alerta visual) — **F22** `[x]`
- [x] Botão "Salvar Simulação" para referência futura — **F23** `[x]`
- [x] Botão "Exportar" para levar na hora da matrícula — **F23** `[x]`

### 5.4 Gestão de Integralização (Horas)
- [x] Tabela com tipos de CH, total, concluído, pendente — **via API** (F11)
- [x] Cadastrar horas manuais — **POST /api/integralizacao** (B17) + modal (F11)
- [x] Barra de progresso visual por categoria
- [x] Donut "Total Integralizado" + cards alinhados em altura (`IntegrationDonutChart`)
- [x] Barras de progresso douradas unificadas no app
- [x] Documentar glossário de tipos de CH no `SCOPE.md` §6.4 (implementação → **F11b**)
- [x] Glossário **“Entenda suas horas”** na UI (obrigatória, eletiva, complementar, extensão, flexibilizada) — F11b
- [x] Alerta quando estiver perto de concluir uma categoria — **B36** no sino (marcos `50/80/100%` por categoria de CH, `build-integralizacao-alert-items.ts`); **F24 descartado** (sem banner na UI — alerta só no sino)

### 5.5 Calendário Acadêmico
- [x] Tela com datas do semestre via `GET /api/calendar` + painel acadêmico (seed/mock em dev; **B66** popula `calendario_academico` via sync isolado)
- [x] Painel dual-semestre: corrente + próximo; rotação na véspera do Período Letivo; divisor visual; vazio por coluna
- [x] Alertas/notificações para datas próximas — lembretes de **tarefa** 24h/1h via sino (**F38** ✅); datas acadêmicas via **B37** (sino: nova / D-1 / no dia); eventos manuais no mesmo ritmo (cadastro / D-1 / no dia); painel recente some 24h após vista; **F24 descartado** (sem banner na UI — alerta só no sino)
- [x] Verificação periódica de novas datas — `shouldRunCalendarioSync` + TTL 7d + disparo background pós-sync (**B66**)

---

## Fase 6: Polimento Visual

> **Resumo:** Skeletons, animações, favicon e **site mobile** — **Bloco 4** (F25–F28).

### 6.1 Polimento Visual
- [x] Redesign visual paleta Cruzeiro (fundo jersey, dourado, ícones SVG, sem emojis)
- [x] Corrigir espaçamento vazio no dashboard (grid unificado)
- [x] Melhorar contraste e legibilidade (cards, badges, bordas)
- [x] Revisar telas calendário, integralização e modal para consistência visual
- [x] UI login refinada (card institucional, senha com olho, toggle lembrar senha)
- [x] Barras de progresso douradas (global `.progress-bar-fill`)
- [x] Caixas de seleção unificadas (pill escuro Cruzeiro, menu em overlay) — `PlannerSelect`, `PrioritySelect`
- [x] Adicionar animações de transição entre páginas — fade-in keyed por `pathname` nas telas do aluno (`.route-transition`, `prefers-reduced-motion`) (**F26**)
- [x] Adicionar loading skeletons em todas as telas — dashboard, disciplinas (lista + `SubjectDetailSkeleton` estruturado), calendário, mapa, integralização, grade/simulador (**F25**)
- [x] Responsividade básica (breakpoints mobile/tablet/desktop)
- [x] Favicon e título na aba — favicon `favicon.ico`/`icon.png` · `title` template `%s · ACME HUB` + `metadata` por página (**F27**)
- [x] Site mobile — pre-APK (grade compacta, notas/drawer, ACME HUB; grafo sem abrir perfil) (**F28** · aprovado jul/2026)

---

## Fase 7: App Mobile Android (Expo Go)

> **Resumo:** App **Android only** · paridade com site **v1.0** · sessão persistente · cache local · **push** pós-sync — **Bloco 8** (`M1–M16`). Escopo: [`docs/SCOPE-CLOUD.md`](./SCOPE-CLOUD.md) §7. **Sem** lojas. Alternativa web: **F28** ✅.

- [x] **M1** — Expo TypeScript **SDK 54** em `mobile/` (Android only · compatível Play Store)
- [x] **M2** — tipos compartilhados `@acme/api-contracts` (`packages/api-contracts`)
- [x] **M3** — sessão SecureStore + refresh API
- [x] **M4** — auth/gate UI (login · paywall · logout)
- [x] **M5** — cache local AsyncStorage
- [x] **M6** — push Expo + `POST /api/push/register`
- [x] **M7–M14** — telas (dashboard → perfil) · tutorial no menu · polish mapa/simulador · **motion/lista** (press, slides, fade, FlatList)
- [x] **M15** — QA checklist Expo Go (`mobile/docs/M15-QA.md`)
- [@] **M16** *(opcional)* — APK sideload · download site (/releases, QR, drawer) · v1.0.0
- [x] **Alternativa sem instalar:** site adaptado ao celular (**F28** · aprovado jul/2026)
- [x] **Site desktop v1.0.1** — patch de bugs (jul/2026); base v1.0.0

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
> **Implementação:** produção **B69** ✅ (back) · **F40** ✅ UI resgate aluno · listagem gift = **F41** `[x]` painel dev.

### Chaves de plano (gift card)

| Regra | Detalhe |
|---|---|
| Código | 8 caracteres `A–Z` + `0–9`, gerado aleatoriamente |
| Uso | **Uma vez** por chave; vincula CPF + período de acesso |
| Pacote | Definido na criação (dias, tipo semestre/ano, validade opcional da chave) |
| Emissão | **Somente operador** — painel `/dev` |
| Resgate | Aluno em `/planos` (**F40**). Cadastro usa **matrícula do amigo** (**F43** / **B74**). |

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
| Credenciais | **B71** ✅ — painel dev só `credentialSaved` + `accountRef` opaco; senha nunca na API/logs |
| Chaves | Criar (lote), listar, revogar, ver quem resgatou |
| Promoções | Aba **Promoções** (**B73/F42** `[x]`) — preço promocional + duração · banner `/planos` · e-mail global automático |
| Simulação | Forçar expiração/renovação de plano; sync forçado; reset dados (confirmação dupla) |
| Auditoria | Log de ações sensíveis |

**Tasks:** **B70** (API + middleware + robôs ops) · **F41** (UI + chavinhas + lista) · **B71** ✅

#### Melhorias operacionais painel dev (jul/2026) `[x]`

> Fecha lacunas de ops identificadas na auditoria do `/dev` (sobre **B70/F41**). Sem novo ID de bloco — polimento operacional.

| # | Melhoria | Back | Front |
|---|---|---|---|
| 1 | **Aba “Chaves”** — gerar em lote (1–50) + rótulo interno · listar · revogar (usa `GET`/`PATCH /api/dev/gift-keys` já existentes) | ✅ | ✅ |
| 2 | **Fila: falhas + retry** — `sync-status` backend-aware (Postgres no cloud) lista `failed`; `POST /api/dev/sync-jobs/retry` re-enfileira no worker | ✅ | ✅ |
| 3 | **Fila: “Rodar tick agora”** — `POST /api/dev/orchestrator/tick` (force) | ✅ | ✅ |
| 4 | **Fila: “Rodar cron de e-mails”** — `POST /api/dev/cron/account-emails` (B62) | ✅ | ✅ |
| 5 | **Assinaturas da conta** — histórico + **revogar plano ativo** (`GET /api/dev/subscriptions`, `POST /api/dev/subscriptions/revoke`) | ✅ | ✅ |

**Correção de bug:** a aba **Fila sync** usava o store SQLite (`getSyncQueueDatabase`) e quebrava no cloud (Postgres) — agora `get-dev-sync-status` é backend-aware.

**Fora do escopo desta rodada:** robôs por camada (histórico/notificações/calendário como robôs separados) — R1-deep já cobre; exige refatorar o pipeline para expor runners por camada.

**Status:** `[x]` aprovado 100% (push jul/2026).

#### B62c — conteúdo + ativação dos e-mails (jul/2026) `[x]`

> Fecha o conteúdo/ativação da fila de e-mail (sobre **B62/B62b**). Sem novo bloco.

| # | Entrega | Arquivos-chave |
|---|---|---|
| 1 | **Saudação personalizada** — só os 2 primeiros nomes (LGPD); fallback "Olá!" sem nome | `email/greeting-name.ts`, `email/account-email-templates.ts` |
| 2 | **Link absoluto** — `/planos` e `/dashboard` viram URL completa (base `PLANNER_APP_URL` → fallback prod) | `email/email-links.ts`, `email/enqueue-account-email.ts` |
| 3 | **Copy sem travessão** — textos revisados (welcome, fim trial, expirando, encerrado) | `email/account-email-templates.ts` |
| 4 | **Plano expirando** — agenda faixas 7/3/1 dias (dedupe por janela) | `email/schedule-account-lifecycle-emails.ts` |
| 5 | **Plano encerrado** — dispara na virada (janela 3d, ignora quem já renovou) | `email/schedule-account-lifecycle-emails.ts` |
| 6 | **Disparo de promoção** — evoluído em **B73/F42** (aba Promoções, dirigida por preço; sempre global) | ver seção B73/F42 abaixo |
| 7 | **HTML da marca** — cabeçalho azul-marinho com logo (`/logo_v2.png`) + wordmark + tagline · botão de ação dourado (URL sozinha vira botão) · rodapé com contato | `email/account-email-html.ts` |

**Ativação:** sem novo secret (Brevo já configurado). Ciclo de plano pago passa a rodar automaticamente pelo cron (`run-account-email-cron` já chama os dois schedulers) após o deploy. **Welcome** segue genérico no cadastro (nome só existe após 1º sync); demais e-mails já saem personalizados.

**E-mail de contato/suporte:** `acme.hubsuporte@gmail.com` — fonte única em `legal/constants.ts`; explícito na seção 1 da privacidade e na seção 9 (Contato) dos termos, além do rodapé de `/termos` e `/privacidade`.

**Status:** `[x]` push + aprovado jul/2026.

#### B73/F42 — promoção dirigida por preço (jul/2026) `[x]`

> Evolui o disparo de promoção do B62c: sem texto livre, sem escopo individual. Operador só escolhe **plano + preço promocional + duração**.

| # | Entrega | Arquivos-chave |
|---|---|---|
| 1 | **Store** — `app_config` `billing.site_promo` (Postgres/arquivo); preço reverte sozinho ao expirar | `billing/site-promo/*`, `sync-policy/app-config-store.ts` |
| 2 | **Checkout + catálogo** — preço promocional em `create-billing-checkout` e `GET /api/billing/plans` | `checkout/create-billing-checkout.ts`, `apply-site-promo-to-plans.ts` |
| 3 | **Copy automática** — % + "de X por Y" + prazo (banner e e-mail) | `billing/site-promo/build-promo-copy.ts` |
| 4 | **Aba Promoções** no `/dev` — tabela de preços, form, promo ativa + encerrar | `DevPromotionsSection.tsx`, `dev-panel-navigation.ts` |
| 5 | **Banner `/planos`** — selo `-X%`, preço riscado no card, plano já selecionado | `PlanosPromoBanner.tsx`, `PlanosPlanShowcase.tsx` |
| 6 | **Filtro smoke/teste** — não dispara para `@smoke.test`, `@example.*`, local-part `smoke-*`/`t2-*` (economiza crédito Brevo) | `is-deliverable-promotion-email.ts`, `promotion-targets.ts` |
| 7 | **Entrega Gmail via PC** — `ACCOUNT_EMAIL_VIA_HOME_WORKER` + SMTP Gmail no worker (`POST /email/send`); Brevo free não entrega no Gmail (`*.brevosend.com`) | `home-worker-email-sender.ts`, `gmail-smtp-send.ts`, `worker/server.ts` |

**Status:** `[x]` push + aprovado jul/2026.

#### B74/F43 — indicação por matrícula do amigo (jul/2026) `[x]`

> No criar conta: **Matrícula do amigo** (no lugar da chave gift). Chave gift permanece só em `/planos` / painel.

| # | Entrega | Arquivos-chave |
|---|---|---|
| 1 | **Schema** — `account_referrals` + `source=referral` em subscriptions | `20260717120000_b74_*.sql` |
| 2 | **Register** — `friendMatricula` opcional → pending | `create-pending-referral.ts`, `parse-account-request.ts` |
| 3 | **Reward** — +3d cada no 1º PIX aprovado · cap 30d · trial intacto | `apply-referral-rewards.ts`, `confirm-billing-payment.ts` |
| 4 | **UI** — campo no `RegisterForm` · remove gift no cadastro | `FriendMatriculaField.tsx`, `CloudAuthScreen.tsx` |
| 5 | **Docs** — `SCOPE.md` §2.1.2 · `SCOPE-CLOUD` §3.7 · `test:b74` | |

**Status:** `[x]` push + aprovado jul/2026.

### Painel robôs — ops manual (escopo fechado p/ **B70** + **F41**)

> **Objetivo:** operador dispara scrapers **por fora** do fluxo do aluno — sem fila, sem cooldown dev (**B65**) / produção (**O3**). Credenciais vêm do que já está salvo no SQLite (dev) / Postgres (prod).

| Robô | Endpoint / pipeline | Persiste |
|---|---|---|
| **R1** | `POST /api/sync` · `runSync` / pipeline live | Portal, turma virtual, histórico (por CPF) |
| **R2** | `POST /api/sync/calendario` (**B66**) | `calendario_academico` global |
| **R3** | `POST /api/sync/turmas` (**B67**) | `turmas_ofertadas` global |

#### Back (**B70**) `[x]`

- [x] **`POST /api/dev/auth/login`** — body `{ email, password }`; valida contra **todos** os pares `EMAIL_DEV`/`PASSWORD_DEV`, `PLANNER_DEV_2_*`, … lidos do env
- [x] Guard **`/api/dev/*`** — exige sessão operador (cookie httpOnly); **401** sem login
- [x] **Nunca** expor lista de emails autorizados ao client; mensagem genérica em falha de login
- [x] **`GET /api/dev/sync-status`** — fila sync + preview orquestrador B68e
- [x] **`GET /api/dev/accounts`** — trial/assinatura por CPF (`trial_por_cpf` join Postgres)
- [x] Query **`?q=`** — busca por nome ou CPF (parcial)
- [x] **`GET/PATCH /api/dev/sync-policy`** + **`POST …/reset`** — policy orquestração §6.6
- [x] Robôs **modulares** — `lib/dev-panel/robots/` (run-r1/r2/r3 + dispatch)
- [x] **`POST /api/dev/robots/run`** — `{ scope, cpf?, robots: { r1|r2|r3 } }` — um ou mais robôs por chamada
- [x] Resolver senha SIGAA **server-side** (B25 decrypt dev / B45 prod) — **nunca** reenviar ao browser do operador após **B71**
- [x] **Bypass cooldown** — `skipCooldown` + trigger `dev` no disparo manual do `/dev`
- [x] **Global:** iterar contas com credencial válida; R2/R3 global via orquestrador (`force: true`); R1 por CPF
- [x] **Auditoria** — `GET /api/dev/audit-log` + append em login/logout/policy/robôs
- [x] **`test:b70`** — registry, sessão HMAC, parse, policy admin, guard 401

#### Front (**F41**) `[x]`

- [x] **`/dev`** — gate com login **email + senha** quando não há sessão operador (`GET /api/dev/auth/session`)
- [x] Após login → painel; logout limpa cookie e volta ao formulário
- [x] **Navbar operador** — 4 abas: Robôs · Fila sync · Policy · Auditoria (`?view=`)
- [x] **Robôs modulares** — card independente **R1/R2/R3** com ações próprias (conta + global)
- [x] **Contas & assinaturas** — trial, expiração, dias restantes, credencial SIGAA
- [x] **Fila sync** — jobs enfileirados + ordem prevista do orquestrador
- [x] **Orquestração sync** — formulário policy §6.6 (botão lite, TTLs, global R2/R3, batch noturno, `max_concurrent`, **Restaurar padrões**)
- [x] Feedback inline por robô (resultados + erros)
- [x] **Sem navbar aluno** — rota `/dev` isolada (`AuthGate` + `AppShell` + `DevNavbar`)
- [x] Chaves gift / promoções — **F41** painel dev *(API **B69** ✅)* · **F40** ✅ resgate aluno

#### Fora de escopo (v1 painel dev)

- Cadastro de operadores pelo painel — **só env manual** (segurança de dados)
- Impersonate write no app do aluno — só **disparo de sync** + leitura de contas

> **Nota:** cron/fila worker (**B68e**, **B54–B56**) **consome** a policy gravada aqui; o painel **configura** cadências — disparo manual continua **sem cooldown**.

**Tasks:** **B70** (API) · **F41** (UI) · **B71** ✅ (endurecimento credenciais)

### Endurecimento credenciais (B71) ✅

| Entrega | Detalhe |
|---|---|
| Painel `/dev` | `accountRef` opaco · `credentialSaved` (sem senha/CPF completo na API) |
| Storage | `CREDENTIALS_ENCRYPTION_KEY` obrigatória em produção |
| API | Nenhum endpoint aluno devolve credencial |
| Logs | `safe-log` + audit sanitizado |
| Gate | Bloco **#7** ✅ — go-live com L1+B71 aprovados |

**Ordem:** roda **depois** de tudo (sync, billing, painel dev) — ver Bloco 7.

### Ordem sugerida (pré-PIX → PIX → go-live)

```
#6e  B70 (dev API + sync-policy + robôs sem cooldown) → F41 (painel /dev + chavinhas R1/R2/R3)
#7   B47 → B48 → B49 → B50 → B51 → B52 → B53 → B69 → F31–F34 → F40 → L1 → B71 (ÚLTIMA pré-go-live)
B68 + F39 (simulação mapa — pode paralelizar ao Bloco 1 pós-F12)
… #9, #10, #8 mobile …
```

### Dev local (antes da cloud)

- Billing **B47–B69** ✅ · **F31–F40** ✅ · **L1** ✅ · **B71** ✅.
- Painel dev SQLite/cloud: rota **`/dev`** com login operador, navbar, robôs modulares R1/R2/R3 e policy §6.6 — **F41** `[x]`.

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

1. **`useAutoSync` no browser** — ✅ enfileira via fila B55 (`startSync` → `POST /api/sync/queue`); client só agenda + polling.
2. **Intervalo fixo 30 min** — dev local mantém 30 min; produção **3h** via **O3** ✅ (`SYNC_COOLDOWN_PROFILE=production`).
3. **`sync.last_at` só local** — persistir `last_sync_at` por usuário no Postgres (Supabase) após **B39+**.
4. **Sync manual sem limite** — manual → **fim da fila** + cooldown **5 min** (**O3** ✅ / **B55**).
5. **Texto “dev” no menu perfil** — ✅ **F37**/`ProfileSyncFooter` mostra posição na fila + ETA (**F19** `[x]`).
6. **Playwright no device** — pipeline só no worker; mobile nunca roda scraper local.

### Ordem sugerida de migração

```
B31 ✅ → B54–B56 (worker 1× + fila) ✅ → O3 (3h auto / 5 min manual) ✅ → F19 UI fila ✅ → #6d B68d–f ✅
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
8. **Próximo passo do roadmap:** informe **depois do push** (tasks em `[@]` ou `[x]`). Com commits locais só `[x]`, **não** avance o roadmap na resposta.
9. **Ordem de execução:** seguir [Ordem oficial v3](#ordem-oficial-de-execução-v3) — **Bloco 2 (sync) antes do Bloco 6 (Supabase)**. Dentro de cada fatia: `B` antes de `F`.
10. **Modo testes global (6a):** deploy **após** sync validado; RLS ✅ **6c** (antes do PIX). Marco “site no ar p/ testes gerais” → [final do TASKS.md](#marco--site-no-ar-para-testes-gerais).
11. **Próximo passo:** **M16** `[@]` (download/APK R2). **#11 Multi-PPC** `[x]` (Meca + Moda). Site **v1.0.1**. Bloco 8 **15/16**. **F28** `[x]`.
12. **Integralização:** CH concluída = `historico` + PPC (`computeChDoneFromDisciplinas`); portal SIGAA só % / total currículo; matérias já passadas = **B30** ✅.
13. **Gift + painel dev:** **B68–B71** ✅ · **F39–F41** ✅ — painel sem senha SIGAA (`credentialSaved` + `accountRef`).
14. **Sincronização TASKS (regra inviolável):** `docs/TASKS.md` **sempre 100% atualizado** — ver `.cursor/rules/tasks-workflow.mdc` → **Regra inviolável** + **Sincronizar (10 pontos)** + **Verificação final**. Nunca commitar ou encerrar turno com sync parcial. **Polish em task `[x]`** (ex.: F38, dashboard) também exige nota no TASKS no mesmo ciclo do push.
15. **Credenciais SIGAA:** sync **sem** o aluno no site exige senha **cifrada no servidor** (dev: B25 opcional + `useAutoSync` no client; produção: **B45** + worker **B56**). Ver `SCOPE.md` §2 · `SCOPE-CLOUD.md` §4–§6.
16. **Código frontend** está em `app/src/` (não na raiz `src/`). Mock data em `app/src/config/mock/`.

---

## Marco — site no ar para testes gerais

> **🌐 Mínimo funcional beta (jul/2026):** **6b** ✅ · **6c** ✅ — cadastro, login CPF, trial, gate, RLS/isolamento por conta. Sync SIGAA → Postgres = **[B72a–e](#12--bloco-2f--sync-real-postgres-b72)** `[x]` — **worker = este PC** + cloudflared (ver `app/worker/README.md`). Enquanto o túnel/worker estiver offline, sync na URL pública fica stub.

> **🌐 Beta aberto:** URL pública com **cadastro + login CPF + trial + gate** (**F29** ✅). Com worker+túnel no ar, sync cloud → Chrome neste PC → mirror Supabase. Sem PC online: usar `npm run sync:mirror` (dev) ou stub na URL.

> **🌐 O que isso NÃO significa:** o botão Sincronizar **na URL** exige PC com `worker:home` + `worker:tunnel` + secrets CF. Localmente o sync Playwright também roda in-process. **Dados isolados por conta** ✅ **6c**. **PIX / planos pagos** ✅ **#7**.

### Fases até o go-live comercial

| Fase | O que está no ar | Quem testa | Limitações |
|------|------------------|------------|------------|
| **6a** ✅ | URL + Postgres + health/PPC; **sem** login cloud completo | Time / smoke técnico | Sync cloud = stub |
| **6b** ✅ | **Conta aberta:** cadastro, login CPF, trial, gate, telas carregam | **Qualquer pessoa** (beta aberto; **≠** lançamento comercial) | Sync na nuvem = worker **B54–B56** |
| **6c** ✅ | RLS + isolamento por `user_id` | Continua beta | Dashboard cloud ainda parcial (SQLite em `getConfig`) |
| **Bloco 7** | PIX + planos + endurecimento | Público com assinatura | **#7** ✅ |

### O que **não** está incluído neste marco (6b)

| Fora do marco | Onde entra |
|---------------|------------|
| Sync SIGAA **real** na nuvem (dados por aluno na URL) | Worker **B54–B56** (hoje **stub**) |
| Dados **isolados** por conta | ✅ **6c** (RLS) |
| Cobrança / assinatura | **Bloco 7** (PIX) |
| Inteligência acadêmica avançada | **Bloco 3** |
| Mobile nativo (paridade + push) | **Bloco 8** (`M1–M16`) |
| PPC Mecatrônica / Moda completos | **Bloco 11** |

**Experiência acadêmica completa hoje (Eng. Comp):** dev local **SQLite** (Blocos 1–2).

### Go-live comercial oficial

**Bloco 7** ✅ — PIX + planos + **L1** + **B71** aprovados.

### Marco site desktop v1.0.1 (jul/2026)

**Site web Eng. Computação = v1.0.1** — patch de bugs sobre v1.0.0; funcionalidades de produto no ar (auth, sync worker, dashboard, disciplinas, calendário, mapa, integralização, simulador, planos, sino, F28). Release GitHub `v1.0.0`. **#8 Mobile** **M1–M15** `[x]` · **M16** `[@]`. **#11 Multi-PPC** `[x]` (Meca + Moda).
