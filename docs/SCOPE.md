# 📋 CEFET Academic Planner — Escopo (Regras de Negócio)

> **Infraestrutura, cloud, PIX e mobile:** [`docs/SCOPE-CLOUD.md`](./SCOPE-CLOUD.md)  
> Este documento cobre **funcionalidades acadêmicas**, regras de negócio e comportamento do produto.

Este documento detalha as funcionalidades e premissas de domínio do projeto. Serve como referência para qualquer desenvolvedor (humano ou IA) que implemente features acadêmicas.

---

## 1. Visão Geral do Projeto

**Objetivo:** Criar uma plataforma de gestão acadêmica que substitua a experiência do SIGAA do CEFET-MG, oferecendo uma interface premium, automatizada e inteligente.

**Público-alvo:** Alunos do CEFET-MG (Campus Divinópolis). **Foco de entrega:** **Engenharia da Computação** de ponta a ponta (web → cloud → sync real → PIX → mobile). **Engenharia Mecatrônica** e **Design de Moda** entram **somente depois** desse ciclo completo — ver §6.2.

**Premissas de produto:**
- O sync do SIGAA **complementa** os dados; o que o aluno cadastrou ou editou tem **prioridade absoluta** (ver §2.4).
- O scraper do SIGAA roda no **servidor** (worker Playwright) — detalhes em `SCOPE-CLOUD.md`.
- Cada aluno tem **conta isolada** na nuvem (Supabase + RLS).
- O design segue a paleta de cores do **Cruzeiro** (Azul Vivo + Dourado).

---

## 2. Autenticação e Motor de Sincronização (Scraper SIGAA)

> **Dev local (Blocos 1–2):** login direto SIGAA (CPF + senha) no SQLite, sem conta cloud nem trial.  
> **Produção (Blocos 6b+):** cadastro completo conforme §2.0 e `SCOPE-CLOUD.md` §3–§4.

### 2.0 Conta do aluno, trial e acesso *(decisão de produto)*

**Login do app = CPF + senha SIGAA** — e-mail **não** entra no login.

| Campo | Onde | Regra de negócio |
|---|---|---|
| **CPF** | Cadastro + **login** | Login SIGAA (só números). **Chave anti-abuso** do trial (§2.1). |
| **Senha SIGAA** | Cadastro + login | Mesma senha do portal. **Fase testes (jun/2026):** visível no painel dev para debug do sync — testadores **informados e consentientes**. **Produção:** cifrada em repouso (**B71** — última task pré-go-live). Validada pelo **SIGAA no sync**. |
| **E-mail** | **Só cadastro** | Contato e **notificações** (atividades, nota de prova). **Não** é usuário de login. Opt-out em Configurações (§2.5). |
| **Telefone** | **Só cadastro** | Contato (WhatsApp/SMS futuro, suporte). **Não** é login na v1. |
| **Curso** | **Cadastro** (obrigatório) | **Eng. Computação**, **Eng. Mecatrônica** ou **Design de Moda** — define qual **PPC** alimenta mapa, integralização e simulador (§6.2). |

**Quem valida a senha:** o **SIGAA**, no sync (Playwright). O app valida **formato de CPF**, **curso escolhido** e **status de acesso** (trial/assinatura).

**Fluxo de acesso após cadastro:**

1. CPF válido + conta com trial ou assinatura **ativa** → permite login e sync.
2. Trial **esgotado** ou assinatura **expirada** → bloqueia app e redireciona para **renovar/pagar** (não para “login SIGAA” genérico).
3. Sync falha por credencial SIGAA → mensagem de erro do scraper (senha errada, portal offline, etc.).

### 2.1 Trial gratuito (7 dias por CPF)

- Todo **CPF novo** recebe **7 dias** de uso gratuito a partir do **primeiro cadastro** com aquele CPF.
- **Um trial por CPF, para sempre** — criar nova conta com outro e-mail mas **mesmo CPF** **não** reinicia o trial.
- Após os 7 dias: acesso bloqueado até **pagamento PIX** (semestre/ano — ver `SCOPE-CLOUD.md` §3).
- **Atenção (Retenção de Dados):** Se o aluno não realizar o pagamento em até 7 dias após a expiração (do trial ou da assinatura), todos os seus dados acadêmicos **serão apagados** do banco de dados para poupar espaço. O CPF, no entanto, continuará salvo na lista de controle para impedir que ele ganhe um novo trial no futuro.

### 2.1.1 Chaves de plano (gift card) *(decisão de produto — jun/2026)*

Alternativa ao PIX para liberar acesso: **chave de resgate** gerada **somente pelo operador** (painel dev — §10). Comportamento de **gift card**:

| Regra | Detalhe |
|---|---|
| **Formato** | **8 caracteres** alfanuméricos (`A–Z`, `0–9`), gerados aleatoriamente (ex.: `K7M2P9QX`). Entrada **case-insensitive**. |
| **Uso único** | Cada chave **funciona uma vez**. Após resgate → status `resgatada`; não pode ser reutilizada nem transferida. |
| **Benefício** | Cada chave carrega um **pacote configurável** na criação: tipo de plano (ex.: semestre, ano), **duração em dias** ou data fim fixa, rótulo interno (ex.: “promo lançamento”). |
| **Quem cria** | **Somente o operador** via painel dev (§10). Alunos **não** geram chaves. |
| **Onde resgatar** | Cadastro, login (trial expirado), `/planos` ou modal “Tenho uma chave de plano”. |
| **Efeito** | Estende ou ativa assinatura (`active`) pelo período da chave — **sem PIX** naquele resgate. |
| **Anti-abuso** | Chave inválida, expirada (se tiver validade) ou já usada → mensagem genérica; log interno no painel dev. |

**Fluxo resumo:**

1. Operador cria chave no painel dev → sistema gera código + grava pacote (dias/plano).
2. Aluno informa a chave na autenticação ou em `/planos`.
3. Sistema valida → vincula `subscription` ao CPF → marca chave como `resgatada` + `resgatada_por_cpf` + timestamp.
4. Gate de acesso (§2.0) passa a tratar como assinatura ativa até o fim do período da chave.

> Detalhes de schema, promoções globais e segurança do painel: `SCOPE-CLOUD.md` §3.6 e §8.

### 2.2 Login e persistência de credenciais

- **Login** = **CPF + senha SIGAA** (e-mail e telefone **não** autenticam).
- Opção **“Lembrar senha neste computador”** → senha salva no SQLite local (dev) / perfil cifrado (produção — **B71**).
- **Fase beta / testes com voluntários:** o painel dev (§10) **exibe a senha SIGAA** para o operador abrir o portal manualmente e validar scraper, mapa, histórico, etc. Só participantes que **sabem e aceitam** esse uso.
- **Antes do go-live:** task **B71** remove exibição de senhas, endurece cifragem (AES + segredos em env), bloqueia retorno de credencial ao client do aluno e audita acessos no painel dev.

### 2.3 Dados Sincronizados (o que o scraper busca)

> **Orquestração (rascunho):** sugestão de como agrupar robôs e gatilhos — **não é decisão fechada**. Matriz em [`SCOPE-CLOUD.md` §6.5](./SCOPE-CLOUD.md#65-orquestração-de-robôs--timing-e-gatilhos-pré-mobile); tabelas globais em §5.4. **Você decide na task #6d (B68-orq)** antes do mobile.

O Playwright navega pelo SIGAA e extrai, agrupado por robô:

| Robô | Dado | Fonte no SIGAA | Escopo |
|---|---|---|---|
| **R1 — Pipeline principal** | Matrícula, curso, status, e-mail, entrada | Portal do Discente | Por aluno |
| **R1** | RG (rendimento global) | Portal → Detalhar | Por aluno |
| **R1** | CH pendente / % integralizado (auxiliar) | Portal do Discente | Por aluno |
| **R1** | Matérias do semestre (nome, local, horário) | Portal do Discente | Por aluno |
| **R1** | Tarefas/atividades pendentes | Portal + Turma Virtual → Tarefas | Por aluno |
| **R1** | Frequência, notas, grupo | Turma Virtual → Alunos | Por aluno |
| **R1 — Histórico** | Histórico escolar (PDF) | Ensino → Emitir Histórico | Por aluno · muda raramente |
| **R2 — Calendário** | Calendário acadêmico (datas do semestre) | Ensino → Calendário Acadêmico | **Global** (campus/semestre) |
| **R3 — Turmas** | Turmas ofertadas (próximo semestre) | Ensino → Consultar Turmas | **Global** por `curso_id` + semestre |

**Gatilhos — sugestão de referência (decisão na #6d / B68-orq):**

| Momento | O que dispara |
|---|---|
| **1º login** (sem snapshot) | **R1 full** bloqueante (portal + histórico + turma) · fila prioritária |
| **Login rápido** (já sincronizado) | Entrada imediata · **R1 incremental** em background (fila normal) |
| **Botão Sincronizar** | **R1 incremental** (fim da fila normal · cooldown 5 min) — **não** re-raspa histórico se TTL ok |
| **Auto-sync** | **R1 incremental** se `last_sync + 3h` (produção; dev local = 30 min) |
| **Calendário R2** | Job **global** (cron operador ou 1×/semana) — **não** por clique do aluno |
| **Turmas R3** | Sob demanda no `/simulador` ou botão explícito · TTL ~24h |

### 2.4 URLs Importantes do SIGAA
```
Base:                 https://sig.cefetmg.br/sigaa/
Login:                https://sig.cefetmg.br/sigaa/verTelaLogin.do
Portal do Discente:   https://sig.cefetmg.br/sigaa/portais/discente/discente.jsf
Turma Virtual:        https://sig.cefetmg.br/sigaa/ava/index.jsf
```

### 2.5 Configurações, contato e notificações

- Menu **Configurações** ao clicar na **foto/avatar** (navbar).
- Toggle: **“Receber notificações por e-mail”** (padrão: ligado).
- E-mails vão para o **e-mail cadastrado** (campo de contato, não de login).
- Telefone cadastrado fica disponível para **contato futuro** (suporte, lembretes — canal a definir nas tasks).
- Quando e-mail desligado: sem alertas acadêmicos por e-mail (billing/recuperação podem usar e-mail ou SMS conforme implementação).

### 2.6 Prioridade de Dados (Regra #1)

**O que o usuário colocou no app nunca pode ser apagado nem sobrescrito pelo sync do SIGAA.**

Ordem de precedência:

1. **Dados do usuário** — cadastros manuais, edições e preferências (notas, avaliações, tarefas, eventos, apelido, nome da matéria, cor, frequência corrigida, integralização manual, etc.).
2. **Dados do SIGAA** — preenchem lacunas e atualizam apenas registros ainda “puros” (nunca tocados pelo usuário).

Comportamento esperado em cada sync:

| Entidade | Protegido quando | O sync pode |
|---|---|---|
| **Notas / avaliações** | `manual = true` ou nota editada pelo aluno | Inserir novas do SIGAA; atualizar linhas ainda puras |
| **Tarefas** | `manual = true` | Atualizar tarefas do SIGAA; respeitar “concluída” marcada pelo aluno |
| **Faltas** | status alterado pelo aluno | Atualizar datas ainda puras do SIGAA |
| **Semestre atual** | apelido, nome de exibição, cor | Atualizar sala, horário, professor, limites |
| **Eventos de calendário** | `manual = true` | Inserir/atualizar só eventos automáticos |
| **Integralização** | `manual = true` | Atualizar só linhas vindas do SIGAA |

Implementação de referência: `app/src/lib/sync/user-data-priority.ts` e funções `upsertSynced*` em `queries.ts`.

---

## 3. Dashboard Central

### 3.1 Visão Geral
O dashboard é a tela principal após o login. Exibe:

- **Saudação** com nome do aluno e semestre atual.
- **Card de RG (Rendimento Global):** Número grande com indicador visual (bom/médio/ruim).
- **Barra de Integralização:** Barra de progresso mostrando o % do curso concluído, com breakdown por tipo de CH.
- **Próximas Entregas:** Lista das 5 próximas tarefas/avaliações com data e matéria.
- **Resumo de Disciplinas:** Cards compactos para cada matéria do semestre, mostrando:
  - Nome e código da disciplina
  - Nota atual / Nota máxima possível
  - Faltas usadas / Limite de faltas
  - Próxima atividade

---

## 4. Sistema de Calendário

### 4.1 Grade Semanal (Horário de Aulas)
- Tabela visual: **linhas = dias** (Segunda a Sexta), **colunas = blocos de horário**.
- Os blocos de horário seguem o padrão do CEFET:

| Código | Horário Real |
|:---:|:---:|
| M12 | 07:00 – 08:40 |
| M34 | 08:55 – 10:35 |
| M56 | 10:50 – 12:30 |
| T12 | 13:50 – 15:30 |
| T34 | 15:50 – 17:30 |
| N12 | 19:00 – 20:40 |
| N34 | 20:55 – 22:35 |

- Os **dias** são codificados como: `2` = Segunda, `3` = Terça, `4` = Quarta, `5` = Quinta, `6` = Sexta.
- Exemplo: `6M56` = Sexta-feira, Manhã, aulas 5 e 6 (10:50–12:30).
- O aluno pode **editar** a grade manualmente (ex: adicionar monitoria, estágio, estudos).
- Cada célula mostra: **nome abreviado da matéria** + **sala**.

### 4.2 Agenda Mensal
- Calendário clássico do mês inteiro.
- Exibe:
  - Horários de aula (como blocos coloridos).
  - Tarefas/provas/trabalhos com data de entrega.
  - Tarefas manuais criadas pelo aluno.
- **Filtros:** Por matéria, por tipo (prova/tarefa/aula), por status (pendente/concluído).
- **Checklist:** Cada tarefa pode ser marcada como ✅ feita.
- **Adicionar tarefa:** Clicar em um dia para criar uma tarefa manual.

---

## 5. Gestão de Disciplinas (Turma Virtual)

### 5.1 Dashboard Individual da Disciplina
Cada disciplina tem uma página própria com:
- **Resumo:** Nome, código, professor, carga horária, sala, horário traduzido.
- **Ementa:** Ementa oficial da disciplina (extraída do PPC).
- **Nota atual** com barra de progresso visual.
- **Faltas** com barra de progresso até o limite.
- **Tarefas** pendentes dessa disciplina.

### 5.2 Gestão de Notas
- Tabela de notas com colunas: **PRO1, SEM, PRO2, Nota, Reposição, Resultado, Faltas, Situação**.
- O aluno pode **cadastrar avaliações** que o professor não colocou no SIGAA (com nome e pontuação máxima, ou deixar como 0 se não souber o valor).
- Sempre visível: **pontos já distribuídos**, **pontos que faltam distribuir**, **nota necessária para aprovação**.
- Hover em cima de uma avaliação mostra: `Avaliação: Prova 1 | Nota Máxima: 25.0`.

### 5.3 Simulador de Notas
- O aluno insere notas hipotéticas em avaliações futuras.
- O sistema calcula em tempo real:
  - A nota final da disciplina.
  - Se seria aprovado ou reprovado.
  - O impacto no RG geral do semestre.
- **Não altera os dados reais.** É apenas uma simulação visual.

### 5.4 Controle de Frequência (Faltas)
- Lista de todas as datas com status (Presente / Falta / Não Registrada).
- Mostra **faltas atuais** vs **limite máximo** (NÃO porcentagem).
- Regra de cálculo (cada "falta" no SIGAA = 1 horário-aula, cada dia = 2 horários):

| CH da Matéria | Máx. Faltas (horários) | Máx. Dias Reais |
|:---:|:---:|:---:|
| 30h | 7 | ~3 |
| 60h | 15 | ~7 |
| 90h | 22 | ~11 |
| 120h | 30 | ~15 |

- Indicador visual: verde (seguro) → amarelo (atenção) → vermelho (crítico).

### 5.5 Tarefas (Individuais e em Grupo)
- Sincronizadas do SIGAA (seção Atividades → Tarefas da Turma Virtual).
- Cada tarefa mostra: Título, Descrição, Período de Entrega, Possui Nota (sim/não), Envios.
- Opção de **baixar o arquivo de instrução** do professor.
- Também aparecem no **Dashboard Central** e na **Agenda Mensal**.
- O aluno pode **criar tarefas manualmente** para matérias cujo professor não usa o SIGAA.

### 5.6 Download automático de materiais (cancelado)

> **Decisão (jun/2026):** download automático de materiais da Turma Virtual **não faz parte do escopo**. O aluno acessa PDFs diretamente no SIGAA.  
> **Permanece no escopo:** histórico escolar oficial (Ensino → Emitir Histórico) — ver **B30** e §7.

### 5.7 Grupos de Estudo
- Exibe os membros do grupo cadastrado pelo professor (nome, matrícula, email, curso).
- Muitos professores não usam esta funcionalidade, então pode estar vazia.

---

## 6. Motor do PPC e Planejamento Acadêmico

### 6.1 Grade Curricular como Grafo (Mapa Mental)
- Visualização interativa em **grafo/mapa mental** de todas as disciplinas do curso.
- Organizado por **período** (1º ao 10º).
- Tipos de relações:
  - **Pré-requisito (seta sólida →):** Disciplina A deve ser concluída antes de cursar B.
  - **Co-requisito (seta pontilhada ···>):** Disciplinas que devem ser cursadas no mesmo semestre.
- Status visual de cada nó:
  - 🟢 **Concluída** — Já aprovado.
  - 🔵 **Cursando** — No semestre atual.
  - 🟡 **Desbloqueada** — Pré-requisitos atendidos, pode pegar.
  - 🔴 **Trancada** — Falta pré-requisito.
- Ao clicar em uma disciplina, abre o dashboard individual com a ementa.

#### 6.1.1 Simulação de mapa de curso *(decisão de produto — jun/2026)*

Modo **“what-if”** na página `/mapa`, **separado** do mapa real (sync/histórico) e **separado** do simulador de matrícula (§6.3):

| Aspecto | Regra |
|---|---|
| **Objetivo** | O aluno marca disciplinas como **“simular concluída”** e vê em tempo real o que **desbloqueia** (pré-requisitos, travas de CH de capstone). |
| **Fonte de verdade** | Mapa real = `historico` + semestre atual (sync). Simulação = **overlay local** (preferência do usuário) — **não altera** `historico` nem o SIGAA. |
| **Persistência** | Conjunto simulado salvo por usuário (localStorage no dev SQLite; Postgres na cloud). Botão **“Limpar simulação”** volta ao mapa real. |
| **UI** | Toggle **“Modo simulação”** no topo do mapa; nós simulados com indicador visual distinto (ex.: borda tracejada / ícone “sim”). |
| **Integração** | Opcional: exportar lista de disciplinas simuladas para o **simulador de matrícula** (§6.3) como ponto de partida. |

**Regra #1 (§2.4):** dados simulados são **preferência do usuário** — sync nunca apaga a simulação; reset só manual.

### 6.2 Carregamento do PPC**

Cada curso tem seu **PPC**. O aluno escolhe o **curso no cadastro**; mapa, integralização e simulador usam o PPC associado.

#### Cursos disponíveis no cadastro

| Curso | `curso_id` (ex.) | PPC no app |
|---|---|---|
| **Engenharia da Computação** (DCDV) | `eng-computacao` | ✅ Indexado (Bloco 1) |
| **Engenharia Mecatrônica** | `eng-mecatronica` | 🔒 Indexação Bloco 9 (#11) — cadastro já associa PPC quando indexado |
| **Design de Moda** | `design-moda` | 🔒 Indexação Bloco 9 (#11) |

**Regra:** o formulário de **criar conta** sempre pergunta o curso (radio/select). Eng. Computação funciona ponta a ponta primeiro; Mecatrônica/Moda podem exibir “PPC em preparação” até a indexação, mas a **conta já guarda** `curso_id` para quando o PPC existir.

#### Fase 1 — Eng. Computação (entrega atual)

Todo o fluxo (sync → cloud → PIX → mobile) deve estar **100% para Eng. Computação** antes de exigir paridade para os outros PPCs.

#### Fase 2 — Indexação Mecatrônica e Moda (Bloco 9, pós-mobile)

- PPCs completos no banco; mapa/integralização passam a funcionar para quem escolheu esses cursos no cadastro.
- Totais de CH por categoria vêm do PPC do curso — **não são fixos** entre cursos.
- Disciplinas e requisitos = dados **globais** read-only por `curso_id`; ver `SCOPE-CLOUD.md` §5.2.

### 6.3 Simulador de Matrícula (Pré-horário)
- Consulta as **turmas ofertadas** para o próximo semestre no SIGAA.
- Cruza com:
  - O histórico do aluno (o que já foi aprovado).
  - O mapa de pré-requisitos do PPC (o que está desbloqueado).
- Apresenta uma lista de matérias elegíveis com:
  - ✅ Selo de "já concluída" para as que o aluno já fez.
  - 🔓 Destaque para as desbloqueadas.
- O aluno pode **montar a grade visualmente** (drag-and-drop para a grade semanal).
- **Alerta de choque de horários** automático.
- Exportar a simulação para referência na hora da matrícula real.

### 6.4 Gestão de Integralização (Horas)

Tela dedicada (`/integralizacao`) para o aluno ver e gerenciar o progresso de **carga horária (CH)** exigida pelo PPC do curso.

**Painel principal:** donut “Total integralizado”, tabela por categoria e barras de progresso.

| Tipo de CH | Total Necessário | Concluído | Pendente |
|---|:---:|:---:|:---:|
| Obrigatória | (conforme PPC) | X | Y |
| Optativa | (conforme PPC) | X | Y |
| Complementar | (conforme PPC) | X | Y |
| Extensão | (conforme PPC) | X | Y |
| Flexibilizada | (conforme PPC) | X | Y |

> Os totais vêm do **PPC do curso** + sync do SIGAA. Exemplo: Eng. Computação usa metas como 240 h optativas; Moda e Mecatrônica terão valores próprios após indexação.

**Cadastro manual:** o aluno pode registrar horas que o SIGAA não reflete (certificados, projetos, eventos), respeitando a regra §2.4 (dados do usuário têm prioridade).

**Glossário na tela — “O que é cada tipo?”**

Seção fixa ou painel expansível (ícone ℹ️ em cada linha da tabela) explicando **o que conta** em cada categoria, com linguagem simples e exemplos do dia a dia do CEFET:

| Tipo | O que é | Exemplos (contam aqui) |
|---|---|---|
| **Obrigatória** | Disciplinas **obrigatórias da grade** do seu curso (PPC). | Cálculo I, Algoritmos, Física I, matérias núcleo de Moda/Mecatrônica conforme PPC. |
| **Optativa (eletivas)** | Disciplinas **escolhidas pelo aluno** dentro do catálogo de optativas/eletivas **do próprio curso**. | Eletiva de IA, Empreendedorismo, matéria optativa listada no PPC; **não** confundir com “qualquer curso da faculdade”. |
| **Complementar** | CH **fora do núcleo estrito** da grade — enriquecimento, outras áreas, atividades formais reconhecidas. | Disciplina de **outro curso** (ex.: cursou algo de Administração ou outro campus), curso de idiomas reconhecido, workshop/certificação homologada, atividade curricular complementar. |
| **Extensão** | Ações de **extensão universitária** ligadas à instituição (interação comunidade ↔ universidade). | Projeto de extensão no CEFET, evento/campanha extensionista dentro da faculdade, atividade extensionista validada pela coordenação. |
| **Flexibilizada** | CH reconhecida por **experiências práticas ou atividades especiais** previstas no regulamento/PPC. | Estágio curricular supervisionado, monitoria, iniciação científica, intercâmbio ou equivalências validadas — conforme regras do curso. |

**UX sugerida:**
- Bloco **“Entenda suas horas”** abaixo do donut ou aba lateral.
- Cada card: título, 1–2 frases, bullet “Exemplos” e link “Ver regulamento / PPC” (futuro).
- Tooltip no dashboard (barra resumida de integralização) com resumo de 1 linha por tipo.

**Próximo passo de implementação:** API `GET /api/integralizacao` (B16) + painéis via API (F11) **incluindo** este glossário estático ou vindo de config por curso — ver `TASKS.md` §3C.

### 6.5 Calendário Acadêmico
- O sistema busca as datas oficiais do semestre no SIGAA (seção Ensino → Calendário Acadêmico):
  - Início e fim das aulas.
  - Período de matrícula.
  - Período de trancamento.
  - Recessos e feriados.
- **Alertas automáticos** próximo às datas importantes.
- Verificação periódica (fim de semestre / férias) para detectar novas datas publicadas.

---

## 7. Histórico Escolar (SIGAA)

- O sistema pode emitir/baixar o PDF do Histórico Escolar oficial via SIGAA (scraper — Bloco 2).

---

## 8. Mobile

Ver **`docs/SCOPE-CLOUD.md` §7** — app **Expo Go**, backend Supabase, sem scraper no device.

---

## 9. Regras de Negócio Importantes

1. **Isolamento por conta:** cada aluno acessa apenas seus dados (RLS no Supabase).
2. **Prioridade do usuário sobre o SIGAA** — o que o aluno cadastrou ou editou nunca é apagado nem sobrescrito pelo sync (detalhes em §2.4).
3. **A falta conta como horário-aula, não como dia.** Cada dia de falta = 2 faltas no sistema.
4. **O RG (Rendimento Global)** é a média ponderada pela carga horária das notas finais dos componentes concluídos.
5. **Nem todo professor usa o SIGAA.** O sistema deve funcionar mesmo sem dados do SIGAA (modo manual).
6. **Co-requisitos** são matérias que devem ser cursadas no mesmo semestre (ex: uma teoria e seu laboratório). Não é pré-requisito.
7. **O sistema não altera dados no SIGAA.** É somente leitura (scraping).
8. **Um curso por vez até o mobile:** Eng. Computação deve estar completa (web → cloud → sync → PIX → mobile) antes de indexar Mecatrônica ou Moda (§6.2).
9. **Simulação de mapa ≠ histórico real:** overlay local; não substitui sync do PDF (§7).
10. **Chaves de plano:** uso único; emissão exclusiva do operador (§2.1.1, §10).
11. **Senhas no painel dev (fase testes):** visíveis ao operador para debug SIGAA; **B71** encerra isso antes do go-live.

---

## 10. Painel Dev (operador)

> **Acesso:** rota protegida **`/dev`** (ou subdomínio admin). **Somente operadores autorizados** — não é visível na navbar do aluno.  
> **Autenticação:** o painel **sempre pede email + senha** (formulário de login). Validação **somente server-side** contra pares cadastrados no **env** (`.env.local` em dev · secrets em produção). **Nunca** exposta no client.  
> **Cadastro de operadores:** **manual no env** — cada dev = par `EMAIL` + `PASSWORD`; novos operadores no futuro = adicionar par comentado/ativo no env (**sem UI**, **sem banco** — segurança de dados).  
> Detalhes técnicos e LGPD: `SCOPE-CLOUD.md` §8 · tasks **B70**, **F41**, **B71** em `TASKS.md` (Apêndice gift/dev).

### 10.0 Login operador

| Regra | Detalhe |
|---|---|
| **Gate** | Sem sessão válida → só tela **email + senha**; nenhuma área do painel acessível |
| **1º operador (local)** | `EMAIL_DEV` + `PASSWORD_DEV` no `.env.local` |
| **Operadores extras** | `PLANNER_DEV_2_EMAIL` + `PLANNER_DEV_2_PASSWORD`, … — cadastro **manual** no env |
| **Sessão** | Cookie **httpOnly** após login OK; expirou → pede credenciais de novo |
| **Substitui** | Modelo antigo `PLANNER_DEV_SECRET` / allowlist CPF |

### 10.1 Visão geral de contas

Listagem e busca de **todas as contas** registradas:

| Coluna / dado | Uso |
|---|---|
| CPF (parcialmente mascarado) | Identificação |
| Matrícula, nome, curso | Dados SIGAA sync |
| E-mail, telefone | Contato cadastro |
| Status assinatura | `trial_active`, `active`, `expired`, etc. |
| Plano + validade | Semestre/ano/chave resgatada + `expires_at` |
| Trial | Início/fim; CPF já consumiu trial? |
| Último sync | Timestamp + outcome parcial |
| **Senha SIGAA** | **Fase testes:** exibida em claro no painel dev (só operador) — copiar/abrir SIGAA para debug. **Pós-B71:** oculta; só “salva / não salva” + botão “forçar re-sync” |
| Ações rápidas | Abrir sync forçado, copiar CPF, link “testar login SIGAA” (dev) |

### 10.2 Chaves de plano (gift cards)

- **Criar** chave: gera código 8 chars + define pacote (dias, plano, validade opcional da chave, nota interna).
- **Listar** chaves: código, status (`disponível` / `resgatada` / `expirada`), quem resgatou (CPF), quando.
- **Revogar** chave ainda não resgatada (opcional v1).
- **Exportar** CSV de chaves geradas (operador only).

### 10.3 Promoções e billing

- Toggle global: **“Promoções ativas”** (ex.: exibir banner na `/planos`).
- Configurar textos/preços promocionais (sem alterar planos base até Bloco 7 PIX).
- Visão de pagamentos PIX pendentes/confirmados (quando Bloco 7 existir).

### 10.4 Ferramentas de simulação (operador)

Para **suporte e testes** — ações que **não** existem para o aluno comum:

| Ação | Efeito |
|---|---|
| Simular expiração de trial/assinatura | Força gate de billing na conta escolhida |
| Simular renovação / estender validade | +N dias sem PIX |
| Disparar sync forçado | Enfileira job (worker) ou stub dev |
| **Robôs ops manual** | Chavinhas ON/OFF por robô (**R1** sync principal · **R2** calendário · **R3** turmas); lista **nome/CPF** com busca; rodar **individual** (1 conta) ou **global**; usa CPF+senha SIGAA já persistidos; **sem cooldown** (exceção a **O3** / fila aluno) |
| Ver mapa/integralização da conta | Abrir como “impersonate read-only” (sem editar dados do aluno) |
| Reset dados acadêmicos | Apaga SQLite/Postgres do usuário (confirmação dupla) |

### 10.5 Auditoria

Toda ação sensível no painel dev gera **log interno** (quem, o quê, quando, alvo CPF) — sem PII desnecessário nos logs **após B71**.

### 10.6 Endurecimento de credenciais — **última task pré-produção (B71)**

> Enquanto **B71** não estiver `[x]`, o produto permanece em **modo testes** quanto a senhas.

| Entrega B71 | Detalhe |
|---|---|
| Painel dev | Deixa de exibir senha **SIGAA** em claro; operadores continuam só no env; re-sync / logs de erro |
| Armazenamento | Senha SIGAA **sempre** cifrada em repouso (AES-256 + `CREDENTIALS_ENCRYPTION_KEY` rotacionável) |
| API aluno | Nenhum endpoint devolve senha ou ciphertext ao browser |
| Logs | Zero senha/CPF completo em texto claro |
| LGPD | Termos atualizados para produção; beta com testadores documentado como exceção encerrada |

**Ordem:** **B71** roda **depois** de sync, billing e painel dev funcionarem — **immediately before** deploy público / PIX amplo.
