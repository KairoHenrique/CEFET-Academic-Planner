param (
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$FeatureDescription
)

$ErrorActionPreference = "Stop"
Write-Host "Iniciando build no EAS para a versão $Version..."
cd mobile
npx eas-cli build -p android --profile production --non-interactive --wait --json > build.json
$buildInfo = Get-Content build.json | ConvertFrom-Json
$buildUrl = $buildInfo[0].artifacts.buildUrl
Write-Host "Build concluido! Baixando APK de $buildUrl"
cd ..
$outPath = "app\.data\releases\ACME-HUB-$Version.apk"
Invoke-WebRequest -Uri $buildUrl -OutFile $outPath
Write-Host "Upload para R2..."
npx wrangler r2 object put "acme-hub-releases/ACME-HUB-$Version.apk" --file $outPath --remote

Write-Host "Testando URL no R2..."
$r2Url = "https://pub-b2b330087a284ca886367469abf1924b.r2.dev/ACME-HUB-$Version.apk"
$response = Invoke-WebRequest -Uri $r2Url -Method Head -ErrorAction SilentlyContinue
if ($response.StatusCode -ne 200) {
    Write-Error "R2 nao retornou 200 OK. Abortando atualizacao do manifesto."
    exit 1
}

Write-Host "Upload e teste para R2 concluidos. Atualizando manifest.json..."
$manifest = @{
    version = $Version
    published = $true
    apkUrl = $r2Url
}
$manifest | ConvertTo-Json -Depth 10 -Compress | Out-File -FilePath "app/public/releases/manifest.json" -Encoding utf8

Write-Host "Commitando no Git..."
git add $outPath "app/public/releases/manifest.json" build_and_deploy.ps1
git commit -m "chore: release ACME-HUB-$Version.apk"
git push
git tag v$Version
git push origin v$Version
Write-Host "Tudo pronto!"

Write-Host "Enviando Push Notification para todos os usuários..."
cd app
if ([string]::IsNullOrWhiteSpace($FeatureDescription)) {
    npx tsx scripts/push-app-update.ts $Version
} else {
    npx tsx scripts/push-app-update.ts $Version $FeatureDescription
}
cd ..
