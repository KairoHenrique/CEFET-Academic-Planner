# ACME HUB

> Planejador acadêmico para alunos do **CEFET-MG**: sincroniza dados do SIGAA e oferece dashboard, calendário, mapa do curso e integralização em uma interface moderna (paleta Cruzeiro 💙 + 💛).

![Status](https://img.shields.io/badge/Site%20web-v1.0.0-brightgreen)
![Plataforma](https://img.shields.io/badge/Plataforma-Web%20%7C%20Android%20(Bloco%208)-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🎯 O que é?

O **ACME HUB** é uma plataforma web (**v1.0.0**) — e em seguida app Android (Bloco 8) — que centraliza a vida acadêmica do aluno fora do portal SIGAA.

**Hoje:** site em produção (Cloudflare Workers + Supabase) com sync SIGAA via worker no PC; Eng. Computação completa (dashboard, disciplinas, calendário, mapa, integralização, simulador, planos PIX, sino).

**Próximo:** app mobile Android (Expo) com **paridade total** do site, sessão persistente, cache local e push no telefone — ver [`docs/TASKS.md`](docs/TASKS.md) Bloco 8 e [`docs/SCOPE-CLOUD.md`](docs/SCOPE-CLOUD.md) §7.

---

## ✨ Funcionalidades

### 🔐 Autenticação e sync SIGAA
- Login com CPF + senha SIGAA; sync **full** no primeiro acesso e **incremental** depois.
- Credenciais SIGAA opcionais cifradas no SQLite (`CREDENTIALS_ENCRYPTION_KEY`).
- Sync automático em background (intervalo configurável — ver apêndice B65 no TASKS).
- Sino de notificações: tarefas/notas novas pós-sync; eventos/datas em cadastro · 1 dia antes · no dia.

### 📊 Dashboard
- RG, integralização (CH por categoria), próximas entregas, cards por disciplina.
- Link no nome da disciplina → página da matéria.

### 📅 Calendário (duas visões)
- **Grade semanal:** códigos SIGAA traduzidos (ex.: `6M56` → horário real); extras editáveis pelo aluno.
- **Agenda mensal:** tarefas, provas e eventos; filtros, checklist e tarefas manuais.
- **Datas acadêmicas oficiais:** painel com início/fim de aulas, recesso, provas — populado pelo robô **B66** (calendário acadêmico SIGAA).

### 📚 Disciplinas
- Notas e faltas do SIGAA + edição manual; simulador de notas; tarefas individuais e em grupo.
- Limite de faltas por carga horária (regra do PPC — ver [`docs/SCOPE.md`](docs/SCOPE.md)).

### 🗺️ Mapa do curso e integralização
- Grafo do PPC: concluídas, desbloqueadas, trancadas, co-requisitos.
- Integralização prioriza **histórico escolar** (PDF B30) + PPC; portal SIGAA como auxiliar.

### 🔜 Em roadmap (ainda não no app)
- Simulador de matrícula com turmas ofertadas (**B67**).
- App mobile (Expo), PIX e multi-tenant Supabase.

---

## 🏗️ Arquitetura

### Visão alvo (produção)

```
┌─────────────────────────────────────────────────────────────┐
│  Clientes: Next.js (web) · Expo Go (mobile)                 │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS / JWT
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase — Auth · PostgreSQL (RLS)                         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Worker Playwright — fila assíncrona de sync SIGAA          │
└────────────────────────────┬────────────────────────────────┘
                             ▼
                    https://sig.cefetmg.br
```

### Sync SIGAA hoje (dev — robôs separados)

O pipeline principal **não** inclui tudo. Cada fonte do SIGAA tem robô próprio — falha em uma etapa não apaga as outras.

| Robô | Endpoint / gatilho | Dados |
|------|-------------------|--------|
| Portal discente | `POST /api/sync` | RG, semestre, tarefas, integralização portal |
| Turma virtual | `POST /api/sync` | Notas, faltas, grupo |
| Histórico escolar | `POST /api/sync` | PDF → tabela `historico` |
| **Calendário acadêmico (B66)** | `POST /api/sync/calendario` | `calendario_academico` — disparo em background após sync principal |

**B66:** menu *Ensino → Calendário Acadêmico* nem sempre existe no SIGAA. Se indisponível, o snapshot é marcado como `unavailable` e **os dados locais são preservados**. O semestre alvo é derivado da **data atual** (ex.: jul/2026 → `2026.1` + `2026.2`).

| Componente | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TanStack Query |
| API / dev DB | Next.js API Routes + SQLite (`better-sqlite3`) |
| Scraper | Playwright (headless no servidor) |
| Estilo | CSS — design system Cruzeiro, dark mode padrão |
| Prod (futuro) | Supabase PostgreSQL, worker em fila, PIX, Expo |

---

## 🚀 Como rodar

### Pré-requisitos
- [Node.js](https://nodejs.org/) 18+
- Navegador Chromium (instalado pelo Playwright na primeira vez)

### Instalação

```bash
git clone <url-do-repositorio>
cd CEFET-Academic-Planner/app

npm install
npx playwright install chromium

cp .env.example .env.local
# Edite .env.local: CREDENTIALS_ENCRYPTION_KEY (mín. 16 caracteres)
# Para sync real: SIGAA_SCRAPER_MOCK=false

npm run dev
```

Abra **http://localhost:3000**, faça login com CPF + senha SIGAA e use o botão **Sync SIGAA** na navbar.

### Testes

```bash
cd app
npm test
# Suite B66 (calendário):
npx tsx --test tests/bloco-2a-b66.test.ts
# Sync real (credenciais no ambiente):
npm run test:scraper:live
```

### Variáveis úteis (`.env.local`)

| Variável | Descrição |
|----------|-----------|
| `CREDENTIALS_ENCRYPTION_KEY` | Cifra senha SIGAA salva no perfil |
| `SIGAA_SCRAPER_MOCK` | `true` = dados mock (padrão nos testes npm) |
| `SIGAA_HISTORICO_PDF_PATH` | Dev: pula download e parseia PDF local |
| `SIGAA_CALENDARIO_HTML_PATH` | Dev: parseia HTML local do calendário |
| `SIGAA_HEADLESS` | `false` para ver o browser durante debug |

---

## 📂 Estrutura do projeto

```
CEFET-Academic-Planner/          # nome da pasta do repositório (legado)
├── app/                          # Next.js — código em app/src/
│   ├── src/
│   │   ├── app/api/              # API Routes (sync, dashboard, calendar…)
│   │   ├── lib/scraper/          # Playwright: portal, turma, histórico, calendário
│   │   ├── lib/sync/             # Orquestração e policies de persistência
│   │   ├── config/brand.ts       # Marca: ACME HUB
│   │   └── components/           # UI
│   ├── tests/                    # Testes Node (tsx --test)
│   └── .env.example
├── docs/
│   ├── SCOPE.md                  # Regras acadêmicas
│   ├── SCOPE-CLOUD.md            # Cloud, PIX, mobile, fila worker
│   ├── TASKS.md                  # Roadmap e status das tasks
│   └── ppc/                      # Grade curricular PPC
├── mobile/                       # Expo (futuro)
└── README.md
```

---

## 📄 Documentação

- **[docs/SCOPE.md](docs/SCOPE.md)** — Notas, faltas, PPC, calendário, integralização.
- **[docs/SCOPE-CLOUD.md](docs/SCOPE-CLOUD.md)** — Arquitetura cloud, fila de sync, PIX, mobile.
- **[docs/TASKS.md](docs/TASKS.md)** — Ordem oficial de execução e status (fonte de verdade do roadmap).

**Status jun/2026:** Bloco 1 ✅ · Bloco 2a (B27–B31, F18, F37, F38) ✅ · **B66** calendário acadêmico em validação · próximo: **B67** turmas ofertadas.

---

## 📜 Licença

MIT License — use, modifique e distribua livremente.
