# ACME HUB — Mobile (Android)

App nativo **Android only** (Expo Go). **Clone nativo do F28** (navbar + drawer · mesmas telas do site ≤768 · **sem** WebView · **sem** bottom tabs).

Roadmap: [`docs/TASKS.md`](../docs/TASKS.md) · Bloco 8 · escopo [`docs/SCOPE-CLOUD.md`](../docs/SCOPE-CLOUD.md) §7.

## Pré-requisitos

- Node.js 20+
- [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) no Android (**Play Store** — SDK **54**)
- Mesma rede Wi‑Fi do PC (ou tunnel)

> O projeto usa **Expo SDK 54** de propósito: a Play Store ainda não entrega Expo Go para SDK 55+.

## Rodar

```bash
cd mobile
npm install
npm start
```

## Estrutura

```
mobile/
├── App.tsx                 # AuthGate + SubscriptionGate (M4)
├── app.json
├── metro.config.js
├── .env.example
├── src/
│   ├── auth/               # SecureStore · login · refresh · access · logout
│   ├── screens/            # Login · Paywall · Home placeholder
│   ├── config/env.ts
│   ├── contracts/
│   └── theme/brand.ts
└── assets/
```

## Sessão e auth (M3–M4)

1. `.env` com `EXPO_PUBLIC_API_BASE_URL`
2. `npx expo start -c` → Expo Go
3. **Login** (CPF + senha cloud)
4. Sem assinatura válida → **paywall** (abre planos no site)
5. Com trial/pago → home placeholder (dashboard em M7+)
6. **Sair** limpa SecureStore (+ hooks cache/push futuros)
