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
- [ ] Obter e indexar o PPC de Engenharia da Computação (PDF → dados estruturados)

---

## Fase 1: Setup da Infraestrutura

### 1.1 Inicialização do Projeto
- [x] Criar projeto Next.js com TypeScript (`npx create-next-app`)
- [x] Configurar estrutura de pastas (`src/app`, `src/components`, `src/lib/db`, `src/lib/scraper`, `src/lib/engine`)
- [ ] Instalar dependências: `better-sqlite3`, `playwright`, `crypto` (para criptografia de senha)

### 1.2 Design System (CSS)
- [x] Criar variáveis CSS com a paleta de cores do Cruzeiro (Azul `#0060B1`, Dourado `#D4A843`, etc.)
- [x] Configurar tipografia (Google Fonts: Inter e Outfit)
- [x] Criar componentes base: Button, Card, Badge, ProgressBar, Modal, Input, Table
- [x] Implementar dark mode como padrão (background `#0D1117`)
- [x] Adicionar micro-animações (hover, transitions, loading states)

### 1.3 Banco de Dados (SQLite)
- [ ] Criar schema completo do banco de dados:
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
- [ ] Criar funções CRUD para todas as tabelas
- [ ] Criar migration/seed inicial
- [ ] Configurar caminho do banco como variável de ambiente / configuração do usuário

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
- [ ] Input de usuário e senha do SIGAA
- [ ] Checkbox "Salvar senha localmente (criptografada)"
- [ ] Botão "Entrar e Sincronizar"
- [ ] Loading state com progresso da sincronização
- [ ] Tratamento de erro visual (credenciais inválidas, SIGAA offline)

### 3.2 Dashboard Central
- [x] Header com saudação, nome do aluno e semestre atual
- [x] Card de RG com indicador visual (cor baseada na faixa)
- [x] Barra de integralização com breakdown por tipo de CH
- [x] Lista "Próximas Entregas" (5 próximas tarefas/avaliações)
- [x] Grid de cards de disciplinas (nota, faltas, próxima atividade por matéria)
- [ ] Botão de re-sincronização manual (Integrar com scraper real)

### 3.3 Grade Semanal (Horário de Aulas)
- [x] Tabela visual: Segunda a Sexta × blocos de horário (M12, M34, M56, Almoço, T12, T34, Janta, N12, N34)
- [x] Tradução automática de códigos SIGAA (ex: `6M56` → Sexta, 10:50–12:30) (Baseado em dados mocados para preview)
- [x] Cada célula: nome abreviado da matéria + sala
- [x] Cores distintas por matéria
- [ ] Modo de edição para adicionar eventos extras (monitoria, estágio, estudo)

### 3.4 Agenda Mensal
- [ ] Calendário mensal interativo (navegação entre meses)
- [ ] Blocos de aula, tarefas e provas nos dias correspondentes
- [ ] Filtros: por matéria, por tipo (prova/tarefa/aula), por status (pendente/feito)
- [ ] Checkbox para marcar tarefa como concluída
- [ ] Modal para adicionar tarefa manual ao clicar em um dia
- [ ] Indicadores visuais de dias com muitas atividades

---

## Fase 4: Interface do Usuário — Gestão de Disciplinas

### 4.1 Página Individual da Disciplina
- [ ] Header com nome completo, código, professor, CH, sala, horário traduzido
- [ ] Seção de Ementa (texto do PPC)
- [ ] Card de Nota Atual (barra de progresso, pontos distribuídos, pontos faltando)
- [ ] Card de Faltas (barra de progresso até o limite, cores por zona de risco)
- [ ] Lista de Tarefas (pendentes primeiro, com data e tipo)

### 4.2 Tabela de Notas Detalhada
- [ ] Tabela com todas as avaliações (SIGAA + manuais)
- [ ] Coluna de "valor máximo" visível (não apenas no hover)
- [ ] Botão "+ Adicionar Avaliação" para cadastro manual
- [ ] Indicador de "faltam X pontos para distribuir"
- [ ] Destaque da nota necessária para aprovação

### 4.3 Simulador de Notas
- [ ] Campos editáveis para inserir notas hipotéticas
- [ ] Cálculo em tempo real da nota final
- [ ] Indicador "Aprovado ✅" ou "Reprovado ❌" simulado
- [ ] Impacto simulado no RG do semestre
- [ ] Botão "Limpar Simulação" para voltar aos dados reais

### 4.4 Tela de Frequência
- [ ] Tabela cronológica de datas e status (Presente/Falta/Não Registrada)
- [ ] Card resumo: "X faltas de Y permitidas (Z dias restantes)"
- [ ] Indicador visual de zona de risco (verde → amarelo → vermelho)

### 4.5 Download Automático de PDFs
- [ ] Toggle on/off por disciplina nas configurações
- [ ] Indicador de "X arquivos baixados" por matéria
- [ ] Link para abrir a pasta local `docs-downloads/{disciplina}/`

---

## Fase 5: Motor do PPC e Planejamento Acadêmico

### 5.1 Indexação do PPC
- [ ] Popular banco de dados com todas as disciplinas de Eng. Computação (DCDV):
  - Código, nome, tipo (Obrigatória/Optativa/Extensão), CH, período, ementa
- [ ] Popular tabela de requisitos (pré-requisitos e co-requisitos)
- [ ] Dados extraídos do mapa mental existente + PPC oficial

### 5.2 Mapa Mental / Grafo do Curso
- [ ] Renderizar grafo interativo (usar biblioteca como `react-flow` ou `d3.js`)
- [ ] Nós organizados por período (1º ao 10º em colunas)
- [ ] Cores dos nós por status: Concluída (verde), Cursando (azul), Desbloqueada (amarelo), Trancada (vermelho)
- [ ] Setas sólidas para pré-requisitos, pontilhadas para co-requisitos
- [ ] Clique no nó abre o dashboard da disciplina (com ementa)
- [ ] Zoom e pan para navegação

### 5.3 Simulador de Matrícula (Pré-horário)
- [ ] Buscar turmas ofertadas do SIGAA (scraper)
- [ ] Filtrar matérias elegíveis (cruza com histórico + pré-requisitos atendidos)
- [ ] Lista de matérias com selo: ✅ Concluída, 🔓 Desbloqueada, 🔒 Trancada
- [ ] Drag-and-drop de matérias para a grade semanal em branco
- [ ] Detecção automática de choque de horários (alerta visual)
- [ ] Botão "Salvar Simulação" para referência futura
- [ ] Botão "Exportar" para levar na hora da matrícula

### 5.4 Gestão de Integralização (Horas)
- [ ] Tabela com tipos de CH, total necessário, concluído, pendente
- [ ] Botão "+ Cadastrar Horas" (tipo, descrição, horas, comprovante)
- [ ] Barra de progresso visual por categoria
- [ ] Alerta quando estiver perto de concluir uma categoria

### 5.5 Calendário Acadêmico
- [ ] Tela com as datas oficiais do semestre (matrícula, trancamento, aulas, recessos)
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
- [ ] Revisar todas as telas para consistência visual
- [ ] Adicionar animações de transição entre páginas
- [ ] Adicionar loading skeletons em todas as telas
- [ ] Responsividade (funcionar em telas menores, tipo laptop 13")
- [ ] Favicon e título personalizado na aba do navegador

---

## Fase 7 (Futuro): App Mobile
- [ ] Criar projeto React Native (Expo) reaproveitando componentes
- [ ] Integrar Google Drive API para leitura do `.db`
- [ ] Implementar modo offline
- [ ] Adaptar UI para telas de celular
- [ ] Publicar na Play Store / App Store

---

## Notas para Outros Agentes de IA

Se você é um agente de IA continuando este projeto, aqui estão informações cruciais:

1. **Leia o `docs/SCOPE.md`** antes de qualquer implementação. Ele contém todas as regras de negócio.
2. **O `README.md`** na raiz contém a arquitetura e a paleta de cores.
3. **O mapa mental do curso** (grade curricular com pré/co-requisitos) foi fornecido como imagem e deve ser convertido em dados estruturados.
4. **O SIGAA é uma aplicação JSF (Java Server Faces).** Os formulários usam `javax.faces.ViewState` e IDs dinâmicos. O scraper deve usar Playwright (não requests simples) por causa do JavaScript.
5. **URLs do SIGAA mudam de sessão para sessão.** Sempre navegue pelo menu, não por URLs hardcoded.
6. **O design deve ser PREMIUM.** Cores do Cruzeiro (Azul #0060B1 + Dourado #D4A843), glassmorphism, micro-animações. Nada genérico.
