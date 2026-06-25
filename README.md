# 🎓 CEFET Academic Planner

> Um planejador acadêmico inteligente e automatizado para alunos do CEFET-MG, que sincroniza dados diretamente do SIGAA e oferece uma experiência moderna, visual e muito superior ao portal padrão.

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-blue)
![Plataforma](https://img.shields.io/badge/Plataforma-Windows%20%7C%20Linux-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🎯 O que é?

O CEFET Academic Planner é uma **web app local (self-hosted)** que roda no PC do aluno. Ele se conecta ao SIGAA automaticamente, extrai todos os dados acadêmicos e apresenta em uma interface premium com cores inspiradas no Cruzeiro (💙 Azul + 💛 Dourado).

**Resumo:** O aluno roda `npm start`, abre `localhost:3000` no navegador e tem acesso a um painel completo com calendário, grade de horários, simulador de notas, mapa de pré-requisitos e muito mais.

---

## ✨ Funcionalidades Principais

### 🔐 Autenticação e Sincronização com o SIGAA
- Login usando as credenciais do SIGAA (scraping via Playwright).
- **Sync automático** a cada login: puxa dados institucionais, notas, faltas, tarefas e horários.
- O aluno escolhe se quer salvar a senha criptografada localmente ou digitar a cada sync.

### 📊 Dashboard Central
- Visão geral do semestre: **RG (Rendimento Global)**, progresso de integralização (barra visual), próximas entregas.
- Resumo rápido de cada disciplina com nota atual, faltas restantes e tarefas pendentes.

### 📅 Calendário Inteligente (Duas Visões)
- **Grade Semanal:** Traduz automaticamente os códigos do SIGAA (ex: `6M56`) para uma tabela visual (Segunda a Sexta, com horários reais como 7:00–8:40). Editável pelo aluno.
- **Agenda Mensal:** Calendário no estilo planner com todas as tarefas, provas e trabalhos. Suporta:
  - ✅ Checklist (marcar como feito)
  - 🔍 Filtros por matéria, tipo ou status
  - ➕ Adicionar tarefas manuais

### 📚 Gestão de Disciplinas (Híbrida: SIGAA + Manual)
Como nem todo professor usa o SIGAA corretamente, o aluno pode cadastrar e editar atividades manualmente.

- **Notas Inteligentes:**
  - Tabela mista (dados do SIGAA + manuais).
  - Mostra sempre: pontos distribuídos, pontos faltando, porcentagem atual.
  - Hover mostra o valor máximo de cada avaliação.
- **Simulador de Notas:** Insira notas fictícias em avaliações futuras para prever se passa e como fica o RG.
- **Controle de Faltas por Limite Máximo (não por %):**

  | Carga Horária | Máx. Faltas | Dias reais (~) |
  |:---:|:---:|:---:|
  | 30h | 7 | 3 |
  | 45h | 11 | 5 |
  | 60h | 15 | 7 |
  | 75h | 18 | 9 |
  | 90h | 22 | 11 |
  | 120h | 30 | 15 |

- **Tarefas Individuais e em Grupo:** Sincronizadas do SIGAA com opção de baixar arquivos de instrução.
- **Download Automático de PDFs:** Toggle por matéria para salvar materiais na pasta `docs/` local automaticamente.
- **Grupos de Estudo:** Visualização dos membros do grupo cadastrado pelo professor.

### 🗺️ Mapa Mental do Curso (Motor do PPC)
- Visualização em **grafo interativo** de toda a grade curricular, mostrando:
  - ✅ Disciplinas concluídas (selo verde)
  - 🔓 Disciplinas desbloqueadas (pré-requisitos atendidos)
  - 🔒 Disciplinas trancadas (falta pré-requisito)
  - 🔗 Co-requisitos (precisam ser cursadas juntas)
  - Ementa de cada disciplina no dashboard individual
- Organizado por período (1º ao 10º).
- Baseado no PPC oficial do curso.

### 🧮 Simulador de Matrícula (Pré-horário)
- No início do semestre, consulta as turmas ofertadas no SIGAA.
- Cruza com o histórico do aluno e o mapa de pré-requisitos.
- **Sugere automaticamente** quais matérias o aluno pode pegar.
- Permite **montar a grade visualmente** (drag-and-drop) antes da matrícula oficial.
- Alerta de **choque de horários**.

### ⏰ Gestão de Integralização (Horas)
- Tela dedicada para o aluno cadastrar e acompanhar suas horas:
  - CH Obrigatória, Optativa, Complementar, Extensão, Flexibilizada.
- Corrige a falta de clareza e os bugs do cálculo oficial do SIGAA.
- Barra de progresso visual por categoria.

### 📆 Calendário Acadêmico
- Busca automática das datas oficiais do CEFET (início/fim de aulas, matrícula, trancamento).
- Alertas e lembretes para o aluno não perder prazos.

---

## 🏗️ Arquitetura e Stack Tecnológica

```
┌─────────────────────────────────────────────┐
│              PC do Aluno (localhost)         │
│                                             │
│  ┌─────────────┐    ┌───────────────────┐   │
│  │  Next.js     │    │   Playwright      │   │
│  │  (Frontend   │◄──►│   (Scraper SIGAA) │   │
│  │   + API)     │    └───────────────────┘   │
│  └──────┬───────┘                            │
│         │                                    │
│  ┌──────▼───────┐    ┌───────────────────┐   │
│  │   SQLite     │───►│  Pasta do Google  │   │
│  │   (Banco     │    │  Drive/OneDrive   │   │
│  │    Local)    │    │  (Sync gratuito)  │   │
│  └──────────────┘    └───────────────────┘   │
│                                              │
│  Navegador: http://localhost:3000            │
└─────────────────────────────────────────────┘
```

| Componente | Tecnologia | Justificativa |
|---|---|---|
| **Framework Full-Stack** | Next.js (React + API Routes) | Frontend e backend em um único projeto |
| **Scraper SIGAA** | Playwright (Node.js) | Automação robusta de browser, roda local |
| **Banco de Dados** | SQLite (better-sqlite3) | Arquivo único, zero config, portátil |
| **Estilização** | CSS Moderno (variáveis CSS) | Flexibilidade total, sem dependências extras |
| **Tipografia** | Inter / Outfit (Google Fonts) | Moderna e limpa |

### 🎨 Paleta de Cores (Estilo Cruzeiro 💙💛)

| Uso | Cor | Hex |
|---|---|---|
| Primária (backgrounds, headers) | Azul Vivo | `#0060B1` |
| Primária Escura (hover, active) | Azul Escuro | `#004A8C` |
| Primária Clara (cards, destaques) | Azul Claro | `#1A8FE3` |
| Secundária (botões, ícones, badges) | Dourado | `#D4A843` |
| Secundária Clara (hover) | Dourado Claro | `#E8C66A` |
| Background | Cinza Escuro | `#0D1117` |
| Surface (cards) | Cinza Médio | `#161B22` |
| Texto Principal | Branco | `#F0F6FC` |
| Texto Secundário | Cinza Claro | `#8B949E` |
| Sucesso (concluído) | Verde | `#3FB950` |
| Alerta (atenção) | Laranja | `#D29922` |
| Erro (reprovado, limite) | Vermelho | `#F85149` |

---

## 🔄 Sincronização Gratuita (Sem Servidor)

O banco de dados é um **único arquivo SQLite** (`.db`). Para sincronizar entre PCs:

1. Nas configurações do app, aponte a pasta do banco para dentro da **pasta do Google Drive** (ou OneDrive/Dropbox) sincronizada no seu PC.
2. O serviço de nuvem sincroniza o arquivo automaticamente.
3. Ao abrir o app em outro PC com a mesma pasta, seus dados estarão lá.

**Custo: R$ 0,00** 🎉

---

## 📱 Plano Futuro: App Mobile (React Native)

A interface é construída em React, o que permite reaproveitar a lógica para um app mobile com **React Native (Expo)**. O plano para mobile:

1. **Leitura do banco:** O app mobile leria o mesmo arquivo `.db` sincronizado via Google Drive (usando a API do Google Drive para download do arquivo).
2. **Modo offline:** O app baixa o banco na inicialização, funciona offline, e sobe as alterações quando houver conexão.
3. **Scraper via PC:** Como o Playwright não roda em celular, a sincronização com o SIGAA continuaria sendo feita no Desktop. O mobile seria um "leitor inteligente" dos dados já sincronizados.

> ⚠️ O foco atual é 100% Desktop. O mobile será implementado em uma fase futura.

---

## 🚀 Como Rodar

### Pré-requisitos
- [Node.js](https://nodejs.org/) v18+ instalado
- Navegador moderno (Chrome, Firefox, Edge)

### Instalação
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/CEFET-Academic-Planner.git
cd CEFET-Academic-Planner

# Instale as dependências
npm install

# Inicie o app
npm run dev
```

### Acesso
Abra o navegador em: **http://localhost:3000**

---

## 📂 Estrutura do Projeto

```
CEFET-Academic-Planner/
├── docs/                    # Documentação detalhada
│   ├── SCOPE.md             # Escopo completo com regras de negócio
│   ├── TASKS.md             # Roadmap e tasks detalhadas
│   └── ppc/                 # PPC e grade curricular dos cursos
├── src/                     # Código-fonte (Next.js)
│   ├── app/                 # Páginas e rotas (App Router)
│   ├── components/          # Componentes React reutilizáveis
│   ├── lib/                 # Lógica de negócio, DB, scraper
│   │   ├── db/              # Schema SQLite e queries
│   │   ├── scraper/         # Módulos Playwright (SIGAA)
│   │   └── engine/          # Motor de pré-requisitos, simulador
│   └── styles/              # CSS global e design system
├── data/                    # Banco de dados SQLite (local)
├── docs-downloads/          # PDFs baixados automaticamente
├── package.json
└── README.md
```

---

## 📄 Documentação Adicional

- **[docs/SCOPE.md](docs/SCOPE.md)** — Escopo completo com todas as regras de negócio, detalhes de cada funcionalidade e premissas do projeto.
- **[docs/TASKS.md](docs/TASKS.md)** — Roadmap detalhado com todas as tasks, organizadas por fase, com status de progresso.

---

## 📜 Licença

MIT License — Use, modifique e distribua livremente.
