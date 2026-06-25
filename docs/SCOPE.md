# 📋 CEFET Academic Planner — Escopo Completo

Este documento detalha **todas** as funcionalidades, regras de negócio e premissas do projeto. Serve como referência definitiva para qualquer desenvolvedor (humano ou IA) que precise dar continuidade ao desenvolvimento.

---

## 1. Visão Geral do Projeto

**Objetivo:** Criar uma plataforma de gestão acadêmica que substitua a experiência do SIGAA do CEFET-MG, oferecendo uma interface premium, automatizada e inteligente.

**Público-alvo:** Alunos do CEFET-MG (inicialmente focado em Engenharia da Computação — Campus Divinópolis).

**Premissas fundamentais:**
- O app roda **localmente** no PC do aluno (localhost). Sem custos de servidor/domínio.
- Funciona em **Windows e Linux**.
- Os dados são armazenados em um **arquivo SQLite local**.
- A sincronização entre dispositivos é feita colocando o arquivo `.db` em uma pasta sincronizada com **Google Drive, OneDrive ou Dropbox**.
- O scraper do SIGAA roda via **Playwright** no PC do aluno.
- O design segue a paleta de cores do **Cruzeiro** (Azul Vivo + Dourado).

---

## 2. Autenticação e Motor de Sincronização (Scraper SIGAA)

### 2.1 Login
- O aluno fornece seu **login e senha do SIGAA** (sig.cefetmg.br).
- O sistema oferece **duas opções de persistência:**
  1. **Salvar senha criptografada localmente** → Sync automático e silencioso a cada abertura do app.
  2. **Digitar a cada sync** → Mais seguro, o aluno controla quando sincronizar.

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

### 5.6 Download Automático de PDFs (Desktop)
- Toggle (ativar/desativar) **por disciplina**.
- Quando ativo, todos os PDFs/materiais da disciplina são baixados automaticamente para a pasta `docs-downloads/{nome-da-disciplina}/`.
- Funcionalidade exclusiva do Desktop (não disponível no mobile futuro).

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
- Inicialmente, o PPC de **Engenharia da Computação (DCDV - Bacharelado)** será pré-carregado.
- Para outros cursos, o aluno poderá **importar o PPC** (PDF ou dados manuais) para que o sistema indexe as disciplinas, pré-requisitos e co-requisitos.
- O sistema terá um parser para extrair esses dados ou um formulário de entrada manual.

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
- Tela dedicada para o aluno ver e gerenciar suas horas pendentes:

| Tipo de CH | Total Necessário | Concluído | Pendente |
|---|:---:|:---:|:---:|
| Obrigatória | (varia) | X | Y |
| Optativa | 240 | X | Y |
| Complementar | 375 | X | Y |
| Extensão | 450 | X | Y |
| Flexibilizada | 30 | X | Y |

- O aluno pode **cadastrar horas manualmente** (ex: certificados de eventos, projetos de extensão).
- Isso corrige os problemas conhecidos do cálculo do SIGAA, que frequentemente apresenta valores errados ou desatualizados.
- Barra de progresso visual por categoria.

### 6.5 Calendário Acadêmico
- O sistema busca as datas oficiais do semestre no SIGAA (seção Ensino → Calendário Acadêmico):
  - Início e fim das aulas.
  - Período de matrícula.
  - Período de trancamento.
  - Recessos e feriados.
- **Alertas automáticos** próximo às datas importantes.
- Verificação periódica (fim de semestre / férias) para detectar novas datas publicadas.

---

## 7. Exportação e Portabilidade

### 7.1 Exportar/Importar JSON
- O aluno pode exportar **todos os seus dados** em um arquivo JSON para:
  - Backup manual.
  - Migração entre computadores.
  - Compartilhar com outro agente de IA para análise.

### 7.2 Sincronização via Google Drive
- O banco SQLite fica em uma pasta configurável.
- Se essa pasta estiver dentro do Google Drive / OneDrive / Dropbox → sincronização automática e gratuita.

### 7.3 Histórico Escolar
- O sistema pode emitir/baixar o PDF do Histórico Escolar oficial via SIGAA.

---

## 8. Plano Futuro: App Mobile

| Aspecto | Estratégia |
|---|---|
| **Framework** | React Native (Expo) — reaproveita componentes React |
| **Banco de dados** | Lê o mesmo `.db` sincronizado via Google Drive API |
| **Scraper** | Não roda no mobile. A sincronização com SIGAA é feita no Desktop |
| **Modo** | Leitor inteligente offline dos dados já sincronizados |
| **Funcionalidades** | Dashboard, Calendário, Notas, Faltas, Mapa do PPC |
| **Exclusões** | Download automático de PDFs (somente Desktop) |

---

## 9. Regras de Negócio Importantes

1. **Cada aluno é isolado:** O sistema é single-user por instância. Cada aluno roda no seu PC com seus dados.
2. **Dados do SIGAA são a fonte primária**, mas o aluno pode adicionar/editar por cima.
3. **A falta conta como horário-aula, não como dia.** Cada dia de falta = 2 faltas no sistema.
4. **O RG (Rendimento Global)** é a média ponderada pela carga horária das notas finais dos componentes concluídos.
5. **Nem todo professor usa o SIGAA.** O sistema deve funcionar mesmo sem dados do SIGAA (modo manual).
6. **Co-requisitos** são matérias que devem ser cursadas no mesmo semestre (ex: uma teoria e seu laboratório). Não é pré-requisito.
7. **O sistema não altera dados no SIGAA.** É somente leitura (scraping).
