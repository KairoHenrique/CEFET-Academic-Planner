# ACME HUB — Mobile (Android)

App nativo **Android only** (Expo Go). Paridade de **funções** com o site web v1.0; UX própria (bottom tabs, **sem sidebar**).

Roadmap: [`docs/TASKS.md`](../docs/TASKS.md) · Bloco 8 · escopo [`docs/SCOPE-CLOUD.md`](../docs/SCOPE-CLOUD.md) §7.

## Pré-requisitos

- Node.js 20+
- [Expo Go](https://expo.dev/go) no celular Android
- Mesma rede Wi‑Fi do PC (ou tunnel)

## Rodar

```bash
cd mobile
npm install
npm start
```

No terminal do Expo, escaneie o QR com o **Expo Go** (Android). Ou:

```bash
npm run android
```

## Escopo M1

- Projeto Expo TypeScript em `mobile/`
- Target **Android only** (`platforms: ["android"]`)
- Identidade Cruzeiro (`#0060B1` / `#D4A843`)

Próximas tasks: **M2** tipos · **M3** sessão · **M4** auth · …

## Estrutura

```
mobile/
├── App.tsx              # entry UI (placeholder M1)
├── app.json             # Expo config (Android)
├── src/theme/brand.ts   # cores do produto
└── assets/              # ícones / splash
```
