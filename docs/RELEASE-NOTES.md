# Release notes — ACME HUB

## v1.0.1 (jul/2026) — correção de bugs (site + app Expo Go)

Patch sobre a base **v1.0.0**. Sem rebuild de APK nesta tag (testar no Expo Go primeiro).

### Correções
- **Preferências de notificação (cloud):** ligar/desligar passa a persistir no Postgres (`configuracoes`) em vez de SQLite — fim do toggle que “voltava sozinho” e do erro `SQLite local indisponível…` no app.
- **Navbar desktop:** sino de notificações alinhado/centralizado com o restante das actions.
- **Página /download:** texto enxuto (sem “sideload · Play Store” e sem linha Cloudflare R2).
- **Simulador / corequisito:** card **ALOCANDO** reaparece no 2º passo quando o parceiro tem várias turmas (site + app).
- **Simulador:** banner “Turmas ofertadas atualizadas.” some sozinho após alguns segundos.
- **Calendário (app):** formulário **Novo evento** com paridade do navegador (disciplina, tipos completos, cor, datas/horas, recorrência semanal, descrição).

### Artefatos
- **Site:** `https://acme-hub.khfm.workers.dev` (deploy Cloudflare).
- **APK no R2:** ainda `ACME-HUB-1.0.0.apk` até novo EAS preview.

## v1.0.0 (jul/2026)

Release inicial — Eng. Computação web madura + Multi-PPC + mobile M1–M15 · M16 sideload.
