# ACME HUB — Mobile (Android)

App nativo **Android only** (Expo Go). Paridade de **funções** com o site web v1.0; UX própria (bottom tabs, **sem sidebar**).

Roadmap: [`docs/TASKS.md`](../docs/TASKS.md) · Bloco 8 · escopo [`docs/SCOPE-CLOUD.md`](../docs/SCOPE-CLOUD.md) §7.

## Pré-requisitos

- Node.js 20+
- [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) no Android (**Play Store** — SDK **54**)
- Mesma rede Wi‑Fi do PC (ou tunnel)

> O projeto usa **Expo SDK 54** de propósito: a Play Store ainda não entrega Expo Go para SDK 55+. Com SDK 57 o app mostra “Project is incompatible…”.

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
- **SDK 54** (compatível com Expo Go da loja)
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
