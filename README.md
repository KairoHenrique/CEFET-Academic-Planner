# 🎓 CEFET Academic Planner

> Um planejador acadêmico inteligente e automatizado para alunos do CEFET-MG, que sincroniza dados diretamente do SIGAA e oferece uma experiência moderna, visual e muito superior ao portal padrão.

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-blue)
![Plataforma](https://img.shields.io/badge/Plataforma-Windows%20%7C%20Linux-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🎯 O que é?

O CEFET Academic Planner é uma **plataforma web** para alunos do CEFET-MG. Sincroniza dados do SIGAA automaticamente e apresenta uma interface premium com cores inspiradas no Cruzeiro (💙 Azul + 💛 Dourado).

**Resumo:** SaaS com backend **Supabase**, sync SIGAA via **worker Playwright** no servidor, **assinatura PIX** e app **mobile Expo Go**. Em desenvolvimento local, o app roda em `localhost:3000` com SQLite.

---

## ✨ Funcionalidades Principais

### 🔐 Autenticação e Sincronização com o SIGAA
- Login com credenciais do SIGAA; sync via **worker Playwright** no servidor.
- **Sync automático** a cada login: puxa dados institucionais, notas, faltas, tarefas e horários.
- O aluno escolhe se quer salvar as credenciais SIGAA cifradas no perfil ou digitar a cada sync.

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
- **Download Automático de PDFs:** Toggle por matéria; materiais vão para a **nuvem pessoal** do aluno (`CEFET Academic Planner/{semestre}/{matéria}/`), não para o Supabase.
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
┌─────────────────────────────────────────────────────────────┐
│  Clientes: Next.js (web) · Expo Go (mobile)                 │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS / JWT
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase — Auth · PostgreSQL (RLS) · (PDFs na nuvem do aluno) │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Worker Playwright — sync SIGAA (fila assíncrona)           │
└────────────────────────────┬────────────────────────────────┘
                             ▼
                    https://sig.cefetmg.br
```

| Componente | Tecnologia | Observação |
|---|---|---|
| **Frontend Web** | Next.js (App Router) | Deploy Vercel ou similar |
| **Backend / API** | Next.js API Routes + Supabase | Dev local: SQLite (Bloco 1) |
| **Banco (prod)** | Supabase PostgreSQL | Multi-tenant com RLS |
| **Scraper SIGAA** | Playwright (worker servidor) | Não roda no browser/celular |
| **Pagamentos** | PIX (gateway TBD) | Assinatura por período |
| **Mobile** | Expo (React Native) | Testes via Expo Go |
| **Estilização** | CSS (design system Cruzeiro) | Dark mode padrão |

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

## 📱 Mobile

App **Expo Go** para testes no celular — mesmo backend Supabase. Detalhes em [`docs/SCOPE-CLOUD.md`](docs/SCOPE-CLOUD.md) §7.

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
├── app/                     # Next.js (código em app/src/)
├── docs/
│   ├── SCOPE.md             # Regras acadêmicas
│   ├── SCOPE-CLOUD.md       # Arquitetura cloud, PIX, mobile
│   ├── TASKS.md             # Roadmap e tasks
│   └── ppc/                 # PPC e grade curricular
├── mobile/                  # Expo (futuro — Bloco 8)
├── package.json
└── README.md
```

---

## 📄 Documentação Adicional

- **[docs/SCOPE.md](docs/SCOPE.md)** — Regras de negócio acadêmicas (notas, faltas, PPC, calendário).
- **[docs/SCOPE-CLOUD.md](docs/SCOPE-CLOUD.md)** — Arquitetura cloud, assinatura PIX e mobile.
- **[docs/TASKS.md](docs/TASKS.md)** — Roadmap com ordem de execução e status das tasks.

---

## 📜 Licença

MIT License — Use, modifique e distribua livremente.
