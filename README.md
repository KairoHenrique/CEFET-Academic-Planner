# ACME HUB

Planejador acadêmico gratuito para alunos do **CEFET-MG**. Sincroniza dados do SIGAA e centraliza dashboard, calendário, disciplinas, mapa do curso, integralização e simulador — no **site** e no **app Android**.

**Site:** https://acme-hub.khfm.workers.dev  
**Produto:** 100% gratuito (sem assinatura / PIX)

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Web | Next.js (App Router) · Cloudflare Workers |
| Mobile | Expo (Android) · `mobile/` |
| Dados | Supabase (Auth + PostgreSQL) |
| Sync SIGAA | Playwright (Servidor ACME no PC ou aparelho) |

---

## Desenvolvimento

### Web (`app/`)

```bash
cd app
npm install
npx playwright install chromium
cp .env.example .env.local
npm run dev
```

### Mobile (`mobile/`)

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

Copie `mobile/google-services.json.example` → `mobile/google-services.json` (Firebase) para builds com push.

### Deploy cloud

```bash
cd app
npm run deploy:cf
npm run deploy:crons   # se aplicável
npm run db:migrate
```

---

## Licença

MIT
