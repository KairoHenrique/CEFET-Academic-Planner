# Compila o tray app (HomeServerTray.cs) para um .exe nativo (sem console),
# usando o csc.exe do .NET Framework (offline, sempre presente no Windows).
# Uso:  powershell -ExecutionPolicy Bypass -File app\scripts\build-tray-exe.ps1
$ErrorActionPreference = 'Stop'

$scriptDir = $PSScriptRoot
$appDir = Split-Path $scriptDir -Parent
$repoRoot = Split-Path $appDir -Parent
$src = Join-Path $scriptDir 'HomeServerTray.cs'
$outFile = Join-Path $repoRoot 'ServidorCEFET.exe'
$icon = Join-Path $appDir 'src\app\favicon.ico'

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
if (Test-Path $icon) { $cscArgs += "/win32icon:$icon" }
$cscArgs += $src

Write-Host "csc: $csc"
& $csc @cscArgs
if ($LASTEXITCODE -ne 0) { throw "Falha na compilacao (exit $LASTEXITCODE)." }
Write-Host "OK -> $outFile"
