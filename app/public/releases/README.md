# Releases — APK sideload (M16)

## Limite Cloudflare

Workers Assets aceitam no máximo **25 MiB** por arquivo. O APK ACME HUB 1.0 tem ~**77 MiB**, então **não** pode ficar em `public/releases/` no deploy.

## Onde está o APK

| Ambiente | Local |
|----------|--------|
| EAS (download público atual) | URL em `manifest.json` → `apkUrl` / `APP_RELEASE.apkPath` |
| Página do build | https://expo.dev/accounts/kairohfm/projects/acme-hub/builds/d6061094-4c3f-4102-b522-ec0ed461d1e9 |
| Cópia local (gitignored) | `app/.data/releases/acme-hub-1.0.0.apk` |

## Novo build

```bash
cd mobile
npx eas-cli build -p android --profile preview --non-interactive
# Atualize APP_RELEASE.apkPath + manifest.json apkUrl com o novo applicationArchiveUrl
```

## Futuro (hosting permanente no domínio)

Subir o APK para **Cloudflare R2** (ou similar) e apontar `APP_RELEASE.apkPath` para a URL pública do bucket.
