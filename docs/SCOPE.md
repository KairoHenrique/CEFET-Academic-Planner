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

### 2.1 Login
- O aluno fornece seu **login e senha do SIGAA** (sig.cefetmg.br) após criar a conta do app.
- O sistema oferece **duas opções de persistência** (credenciais cifradas no perfil, servidor):
  1. **Salvar credenciais cifradas** → sync automático ao abrir o app (worker no servidor).
  2. **Digitar a cada sync** → mais seguro; credenciais não ficam armazenadas.

### 2.2 Dados Sincronizados (o que o scraper busca)
A cada sincronização, o Playwright navega pelo SIGAA e extrai:

| Dado | Fonte no SIGAA | Frequência |
|---|---|---|
| Dados Institucionais (Matrícula, Curso, Status, Email, Entrada) | Portal do Discente | A cada login |
| Índices Acadêmicos (RG — Rendimento Global) | Portal do Discente → Detalhar | A cada login |
| Integralização (CH Obrigatória, Optativa, Complementar, Extensão, Flexibilizada, % Integralizado) | Portal do Discente | A cada login |
| Componentes Curriculares do semestre (matérias, locais, códigos de horário) | Portal do Discente | A cada login |
| Atividades/Tarefas pendentes (data, tipo, matéria) | Portal do Discente + Turma Virtual → Atividades → Tarefas | A cada login |
| Frequência por disciplina (datas, presenças, faltas) | Turma Virtual → Alunos → Frequência | A cada login |
| Notas por disciplina (PRO1, SEM, PRO2, Nota, Resultado) | Turma Virtual → Alunos → Ver Notas | A cada login |
| Grupo de estudos por disciplina | Turma Virtual → Alunos → Ver Grupo | A cada login |
| Materiais/PDFs das disciplinas | Turma Virtual → Materiais | A cada login |
| Turmas ofertadas (próximo semestre) | Ensino → Consultar Turmas | Sob demanda (pré-matrícula) |
| Calendário Acadêmico | Ensino → Calendário Acadêmico | Periódico (início/fim de semestre) |
| Histórico Escolar (PDF) | Ensino → Emitir Histórico | Sob demanda |

### 2.3 URLs Importantes do SIGAA
```
Base:                 https://sig.cefetmg.br/sigaa/
Login:                https://sig.cefetmg.br/sigaa/verTelaLogin.do
Portal do Discente:   https://sig.cefetmg.br/sigaa/portais/discente/discente.jsf
Turma Virtual:        https://sig.cefetmg.br/sigaa/ava/index.jsf
```

### 2.4 Prioridade de Dados (Regra #1)

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
| **Semestre atual** | apelido, nome de exibição, cor, toggle de PDF | Atualizar sala, horário, professor, limites |
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
| 45h | 11 | ~5 |
| 60h | 15 | ~7 |
| 75h | 18 | ~9 |
| 90h | 22 | ~11 |
| 120h | 30 | ~15 |

- Indicador visual: verde (seguro) → amarelo (atenção) → vermelho (crítico).

### 5.5 Tarefas (Individuais e em Grupo)
- Sincronizadas do SIGAA (seção Atividades → Tarefas da Turma Virtual).
- Cada tarefa mostra: Título, Descrição, Período de Entrega, Possui Nota (sim/não), Envios.
- Opção de **baixar o arquivo de instrução** do professor.
- Também aparecem no **Dashboard Central** e na **Agenda Mensal**.
- O aluno pode **criar tarefas manualmente** para matérias cujo professor não usa o SIGAA.

### 5.6 Download Automático de PDFs
- Toggle (ativar/desativar) **por disciplina**.
- Quando ativo, materiais da disciplina são baixados pelo worker e armazenados no **Supabase Storage** (`user_id/{disciplina}/`).
- No web, o aluno acessa/baixa pelo app; no mobile v1, download automático fica fora do escopo.

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

### 6.2 Carregamento do PPC

Cada curso possui seu **Projeto Pedagógico de Curso (PPC)** próprio. O app usa o PPC do curso do aluno para mapa, pré-requisitos, simulador de matrícula e metas de integralização.

#### Fase 1 — Engenharia da Computação (entrega atual)

| Curso | Status |
|---|---|
| **Engenharia da Computação** (Bacharelado — DCDV) | ✅ Indexado (mapa + requisitos) — **único curso até o mobile** |

Todo o produto (SQLite → API → cloud → scraper SIGAA → assinatura → **app mobile Expo Go**) deve funcionar **100% para Eng. Computação** antes de indexar outros PPCs.

#### Fase 2 — Expansão multi-curso (somente após mobile)

| Curso | Status | Pré-requisito |
|---|---|---|
| **Engenharia Mecatrônica** | 🔒 Backlog | Eng. Computação completa + mobile em produção |
| **Design de Moda** | 🔒 Backlog | Eng. Computação completa + mobile em produção |

**Regra de sequência:** Mecatrônica e Moda **não** são desenvolvidas em paralelo ao Bloco 1 nem ao mobile. Só entram quando:
1. Blocos **1 → 6c → 7 → 8** concluídos para Eng. Computação;
2. Aluno de Computação consegue usar o fluxo inteiro (sync, notas, mapa, integralização, calendário, PIX, app mobile).

**Regras gerais (quando a Fase 2 iniciar):**
- O aluno associa seu **curso** no onboarding/perfil; mapa e integralização usam o PPC correspondente.
- Totais de CH por categoria vêm do PPC do curso — **não são fixos** entre cursos.
- Importação manual de PPC (PDF) continua disponível para cursos ainda não indexados oficialmente.
- Disciplinas e requisitos = dados **globais** read-only; ver `SCOPE-CLOUD.md` §5.2.

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
