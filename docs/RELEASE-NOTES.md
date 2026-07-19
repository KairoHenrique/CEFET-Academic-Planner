# Release notes — ACME HUB

## v1.0.1 (jul/2026) — correção de bugs (site + app)

Patch sobre a base **v1.0.0**.

### Correções
- **Preferências de notificação (cloud):** ligar/desligar persiste no Postgres (`configuracoes`) — fim do toggle que “voltava sozinho” e do erro SQLite no app.
- **Navbar desktop:** sino alinhado/centralizado.
- **Página /download:** texto enxuto.
- **Simulador / corequisito:** card **ALOCANDO** no 2º passo com várias turmas (site + app).
- **Simulador:** banner “Turmas ofertadas atualizadas.” some sozinho.
- **Calendário (app):** formulário **Novo evento** com paridade do navegador.
- **Semestre automático:** header Dashboard/Disciplinas (site + app) usa data oficial do calendário acadêmico (“Período Letivo”); fallback por mês.
- **Excluir eventos manuais:** botão Excluir no detalhe (site + app) — só eventos criados pelo aluno.

### Artefatos
- **Site:** `https://acme-hub.khfm.workers.dev`
- **APK R2:** `ACME-HUB-1.0.1.apk`

## v1.0.0 (jul/2026)

Release inicial — Eng. Computação web madura + Multi-PPC + mobile M1–M15 · M16 sideload.
