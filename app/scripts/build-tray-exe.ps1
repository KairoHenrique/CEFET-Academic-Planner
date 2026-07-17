# Compila o tray app (HomeServerTray.cs) para um .exe nativo (sem console),
# usando o csc.exe do .NET Framework (offline, sempre presente no Windows).
# Gera o icone (.ico) a partir da logo do site (icon.png) automaticamente.
# Uso:  powershell -ExecutionPolicy Bypass -File app\scripts\build-tray-exe.ps1
$ErrorActionPreference = 'Stop'

$scriptDir = $PSScriptRoot
$appDir = Split-Path $scriptDir -Parent
$repoRoot = Split-Path $appDir -Parent
$src = Join-Path $scriptDir 'HomeServerTray.cs'
$outFile = Join-Path $repoRoot 'ServidorACME.exe'
$icoOut = Join-Path $scriptDir 'servidor-acme.ico'

# Fonte da logo (quadrada, melhor para icone). Fallbacks se nao existir.
$logoCandidates = @(
  (Join-Path $appDir 'src\app\icon.png'),
  (Join-Path $appDir 'public\logo_v2.png'),
  (Join-Path $appDir 'public\logo.png')
) | Where-Object { Test-Path $_ }

if ($logoCandidates.Count -gt 0) {
  $logo = $logoCandidates[0]
  Write-Host "Logo: $logo"
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $scriptDir 'png-to-ico.ps1') -In $logo -Out $icoOut
} else {
  Write-Warning 'Nenhuma logo encontrada; usando icone padrao.'
  $icoOut = $null
}

$csc = @(
  'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe',
  'C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe'
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $csc) { throw 'csc.exe (.NET Framework) nao encontrado.' }

$cscArgs = @(
  '/nologo',
  '/target:winexe',
  "/out:$outFile",
  '/reference:System.Windows.Forms.dll',
  '/reference:System.Drawing.dll'
)
if ($icoOut -and (Test-Path $icoOut)) { $cscArgs += "/win32icon:$icoOut" }
$cscArgs += $src

Write-Host "csc: $csc"
& $csc @cscArgs
if ($LASTEXITCODE -ne 0) { throw "Falha na compilacao (exit $LASTEXITCODE)." }
Write-Host "OK -> $outFile"
