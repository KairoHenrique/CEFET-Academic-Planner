# Releases — APK sideload (M16)

1. Gere o APK: `cd mobile && eas build -p android --profile preview` (ou `production`).
2. Baixe o artefato e copie para este diretório como **`acme-hub-1.0.0.apk`**.
3. Atualize `manifest.json` → `"published": true`.
4. Deploy do site (`npm run deploy:cf` em `app/`).

URL pública: `/releases/acme-hub-1.0.0.apk`  
Página + QR: `/download`
