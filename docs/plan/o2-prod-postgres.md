# Plano O2 — Prod sem `.db` local

> **Task:** **O2** do Bloco **6a** · [`docs/TASKS.md`](../TASKS.md)

---

## Objetivo

Em **produção/cloud**, o app **não abre** `app/.data/planner.db` nem `sync-queue.db` via `better-sqlite3`. Só **Postgres** (Supabase).

Dev local continua com SQLite quando `PLANNER_DATABASE` não é `postgres` e `PLANNER_CLOUD` não está ativo.

---

## Mecanismo

| Peça | Comportamento |
|------|----------------|
| `PLANNER_CLOUD=true` | Flag explícita no Cloudflare (auto-detect também via `CF_PAGES` / runtime Workers) |
| `resolvePlannerDatabaseBackend()` | Cloud → sempre `postgres` |
| `assertSqliteAllowed()` | Bloqueia `getActiveDatabase()`, `ensureDbReady()`, `sync-queue.db` |
| Rotas SQLite-only | Resposta `503` `SQLITE_DISABLED` ou stub (`sync`, fila sync) |

---

## Variáveis Cloudflare (além de O1)

```
PLANNER_CLOUD=true
PLANNER_DATABASE=postgres
DATABASE_URL=postgresql://...
```

---

## Testes

```powershell
cd app
npm run test:o2
```

---

## Próximo

**T1** — smoke deploy (URL abre, health, PPC).
