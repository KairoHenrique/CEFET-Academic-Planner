# =====================================================================
#  CEFET Planner - Servidor de casa (tray app)
#  Sobe o worker Playwright (:8787) + tunnel cloudflared e atualiza
#  automaticamente o secret SIGAA_WORKER_URL no Cloudflare.
#
#  Menu na bandeja (icone oculto): Executar | Parar | Sair
#  NAO e o site (Cloudflare Worker) - e o "trem dos robos" (worker local).
# =====================================================================

$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# --- Resolve pasta do app (funciona como .ps1 e como .exe compilado) ---
function Resolve-AppDir {
  $candidates = @()
  if ($PSScriptRoot) { $candidates += (Split-Path $PSScriptRoot -Parent) }
  try {
    $exeDir = Split-Path ([System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName) -Parent
    $candidates += (Split-Path $exeDir -Parent)
  } catch {}
  foreach ($c in $candidates) {
    if ($c -and (Test-Path (Join-Path $c 'package.json'))) { return $c }
  }
  return 'C:\Users\kairo\OneDrive\Documentos\CEFET-Academic-Planner\app'
}

$global:AppDir = Resolve-AppDir
$global:LogFile = Join-Path $global:AppDir '.data\home-server-tray.log'
$global:Cloudflared = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $global:Cloudflared) { $global:Cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe' }

$global:WorkerPid = $null
$global:TunnelProc = $null
$global:TunnelUrl = $null
$global:Running = $false
$global:UpdatingSecret = $false

function Normalize-TunnelUrl([string]$raw) {
  if (-not $raw) { return $null }
  $u = $raw.Trim().TrimEnd('/')
  if ($u -match '^https?://') { return $u.ToLowerInvariant() }
  return ('https://' + $u).ToLowerInvariant()
}

function Read-LiveTunnelUrl {
  try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:20241/quicktunnel' -UseBasicParsing -TimeoutSec 3
    if ($r.Content -match '"hostname"\s*:\s*"([^"]+)"') {
      return (Normalize-TunnelUrl $Matches[1])
    }
  } catch {}
  return $null
}

function Apply-TunnelUrl([string]$raw, [string]$reason) {
  $u = Normalize-TunnelUrl $raw
  if (-not $u) { return }
  if ($u -eq $global:TunnelUrl) { return }
  $global:TunnelUrl = $u
  Write-Log "Tunnel URL ($reason): $u"
  Update-WorkerUrlSecret $u
}

function Poll-LiveTunnel {
  if (-not $global:Running) { return }
  $live = Read-LiveTunnelUrl
  if ($live) { Apply-TunnelUrl $live 'poll' }
}

function Write-Log([string]$msg) {
  try {
    $dir = Split-Path $global:LogFile -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Add-Content -Path $global:LogFile -Value ("[{0}] {1}" -f (Get-Date).ToString('HH:mm:ss'), $msg)
  } catch {}
}

# --- Icone da bandeja ---
$notify = New-Object System.Windows.Forms.NotifyIcon
$iconPath = Join-Path $global:AppDir 'src\app\favicon.ico'
try {
  if (Test-Path $iconPath) { $notify.Icon = New-Object System.Drawing.Icon($iconPath) }
  else { $notify.Icon = [System.Drawing.SystemIcons]::Application }
} catch { $notify.Icon = [System.Drawing.SystemIcons]::Application }
$notify.Text = 'CEFET Planner - Servidor'
$notify.Visible = $true

# --- Menu ---
$menu = New-Object System.Windows.Forms.ContextMenuStrip
$miStatus = New-Object System.Windows.Forms.ToolStripMenuItem('Parado')
$miStatus.Enabled = $false
$miStart = New-Object System.Windows.Forms.ToolStripMenuItem('Executar')
$miStop = New-Object System.Windows.Forms.ToolStripMenuItem('Parar')
$miStop.Enabled = $false
$miSep = New-Object System.Windows.Forms.ToolStripSeparator
$miExit = New-Object System.Windows.Forms.ToolStripMenuItem('Sair')
$menu.Items.AddRange(@($miStatus, $miStart, $miStop, $miSep, $miExit))
$notify.ContextMenuStrip = $menu

function Set-Status([string]$text) {
  try { $miStatus.Text = $text } catch {}
  try { $notify.Text = ("CEFET Planner - {0}" -f $text).Substring(0, [Math]::Min(63, ("CEFET Planner - {0}" -f $text).Length)) } catch {}
}

function Update-WorkerUrlSecret([string]$url) {
  try {
    Write-Log "Atualizando SIGAA_WORKER_URL = $url"
    $cmd = "echo $url| npx wrangler secret put SIGAA_WORKER_URL"
    $p = Start-Process -FilePath 'cmd.exe' -ArgumentList "/c $cmd" -WorkingDirectory $global:AppDir -WindowStyle Hidden -PassThru -Wait
    Write-Log ("wrangler secret put exit={0}" -f $p.ExitCode)
    if ($p.ExitCode -eq 0) {
      Set-Status 'No ar (OK)'
      $notify.ShowBalloonTip(4000, 'CEFET Planner', "Servidor no ar!`nTunel conectado e URL atualizada no Cloudflare.", [System.Windows.Forms.ToolTipIcon]::Info)
    } else {
      Set-Status 'No ar (falha secret)'
      $notify.ShowBalloonTip(5000, 'CEFET Planner', "Tunel no ar, mas falhou atualizar o secret.`nURL: $url", [System.Windows.Forms.ToolTipIcon]::Warning)
    }
  } catch { Write-Log "erro Update-WorkerUrlSecret: $_" }
}

function Start-Servers {
  if ($global:Running) { return }
  Write-Log '--- Iniciando servidor ---'
  Set-Status 'Iniciando...'

  # 1) Worker Playwright (:8787), oculto
  try {
    $wp = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c npm run worker:home' -WorkingDirectory $global:AppDir -WindowStyle Hidden -PassThru
    $global:WorkerPid = $wp.Id
    Write-Log "worker:home pid=$($wp.Id)"
  } catch { Write-Log "erro worker: $_" }

  # 2) Tunnel cloudflared -> captura URL trycloudflare e atualiza secret
  try {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $global:Cloudflared
    $psi.Arguments = 'tunnel --url http://127.0.0.1:8787 --metrics 127.0.0.1:20241'
    $psi.WorkingDirectory = $global:AppDir
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true

    $tp = New-Object System.Diagnostics.Process
    $tp.StartInfo = $psi

    $handler = {
      param($sender, $e)
      if ($e.Data -and ($e.Data -match 'https://[a-z0-9-]+\.trycloudflare\.com')) {
        $u = $matches[0]
        if ($u -ne $global:TunnelUrl) {
          Apply-TunnelUrl $u 'log'
        }
      }
    }
    $tp.add_OutputDataReceived($handler)
    $tp.add_ErrorDataReceived($handler)
    $tp.Start() | Out-Null
    $tp.BeginOutputReadLine()
    $tp.BeginErrorReadLine()
    $global:TunnelProc = $tp
    Write-Log "cloudflared pid=$($tp.Id)"
  } catch { Write-Log "erro tunnel: $_" }

  $global:Running = $true
  $miStart.Enabled = $false
  $miStop.Enabled = $true
  Set-Status 'No ar (conectando tunel...)'
  $notify.ShowBalloonTip(3000, 'CEFET Planner', 'Servidor iniciado. Conectando tunel...', [System.Windows.Forms.ToolTipIcon]::Info)
  $global:PollTimer.Start()
}

function Stop-Servers {
  Write-Log '--- Parando servidor ---'
  if ($global:TunnelProc) {
    try { Start-Process -FilePath 'taskkill.exe' -ArgumentList "/PID $($global:TunnelProc.Id) /T /F" -WindowStyle Hidden -Wait } catch {}
    $global:TunnelProc = $null
  }
  if ($global:WorkerPid) {
    try { Start-Process -FilePath 'taskkill.exe' -ArgumentList "/PID $($global:WorkerPid) /T /F" -WindowStyle Hidden -Wait } catch {}
    $global:WorkerPid = $null
  }
  # limpeza de sobras
  Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  try { $global:PollTimer.Stop() } catch {}
  $global:Running = $false
  $global:TunnelUrl = $null
  $miStart.Enabled = $true
  $miStop.Enabled = $false
  Set-Status 'Parado'
  $notify.ShowBalloonTip(2000, 'CEFET Planner', 'Servidor parado.', [System.Windows.Forms.ToolTipIcon]::Info)
}

# Clique esquerdo tambem abre o menu
$notify.add_MouseClick({
    param($s, $e)
    if ($e.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
      $m = $notify.GetType().GetMethod('ShowContextMenu', [System.Reflection.BindingFlags]'Instance,NonPublic')
      if ($m) { $m.Invoke($notify, $null) }
    }
  })

$miStart.add_Click({ Start-Servers })
$miStop.add_Click({ Stop-Servers })
$miExit.add_Click({
    Stop-Servers
    $notify.Visible = $false
    $notify.Dispose()
    [System.Windows.Forms.Application]::Exit()
  })

$global:PollTimer = New-Object System.Windows.Forms.Timer
$global:PollTimer.Interval = 20000
$global:PollTimer.add_Tick({ Poll-LiveTunnel })

Write-Log "Tray iniciado. AppDir=$global:AppDir"
$notify.ShowBalloonTip(2500, 'CEFET Planner', 'Pronto. Clique no icone e em "Executar".', [System.Windows.Forms.ToolTipIcon]::Info)

$appctx = New-Object System.Windows.Forms.ApplicationContext
[System.Windows.Forms.Application]::Run($appctx)
