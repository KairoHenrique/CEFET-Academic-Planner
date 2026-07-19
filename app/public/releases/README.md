# Releases — APK sideload (M16)

## Por que R2?

Workers Assets aceitam no máximo **25 MiB**. O APK (~77 MiB) fica no bucket R2
`acme-hub-releases`, com URL pública **r2.dev** (não expira).

## URL atual

`https://pub-b2b330087a284ca886367469abf1924b.r2.dev/acme-hub-1.0.0.apk`

## Novo APK

```bash
cd app
npx wrangler r2 object put acme-hub-releases/acme-hub-1.0.0.apk \
  --file=.data/releases/acme-hub-1.0.0.apk \
  --content-type=application/vnd.android.package-archive \
  --remote
# Atualize APP_RELEASE.apkPath + public/releases/manifest.json se o nome mudar
```

Cópia local (gitignored): `app/.data/releases/acme-hub-1.0.0.apk`
