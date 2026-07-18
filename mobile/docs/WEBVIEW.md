# App Android = site mobile (F28) em WebView

Reinício jul/2026: **não** reinventar UI/API nativa.

O `App.tsx` abre `EXPO_PUBLIC_API_BASE_URL` (ex. `https://acme-hub.khfm.workers.dev`)
num `WebView`. Login, dados, módulos e visual = **exatamente o site mobile**.

Código legado em `src/` (telas nativas) fica arquivado e **não** é montado.
