# @acme/api-contracts

Contratos TypeScript das APIs do **ACME HUB**, consumidos pelo app Expo (`mobile/`).

- **Task:** Bloco 8 · **M2**
- **Escopo:** respostas JSON estáveis (auth, dashboard, disciplinas, calendário, mapa, integralização, notificações, perfil, billing, sync)
- **Sem** dependências de Next.js / React Native

## Uso no mobile

```ts
import type { DashboardResponse, LoginAccountBody } from "@acme/api-contracts";
```

Dependência: `"@acme/api-contracts": "file:../packages/api-contracts"` em `mobile/package.json`.
