// ServidorACME - Servidor de casa (tray app nativo).
// Ao abrir (ou no logon do Windows) sobe sozinho o worker Playwright (:8787)
// + tunnel cloudflared, valida o tunel, atualiza o secret SIGAA_WORKER_URL
// no Cloudflare e dispara um sync geral. Watchdog reinicia worker/tunel
// se cairem; poll a cada 20s em 127.0.0.1:20241/quicktunnel reaplica a URL.
// Ao acordar de suspensao/hibernacao: tunel novo, secret novo e sync geral.
// Compilar: ver app/scripts/build-tray-exe.ps1
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace HomeServerTray
{
    static class Program
    {
        const int WorkerPort = 8787;
        const string MetricsUrl = "http://127.0.0.1:20241/quicktunnel";
        const int PollMs = 20000;
        const int WatchdogMs = 15000;
        const int AutoStartDelayMs = 3000;
        const int NetworkWaitMs = 3 * 60 * 1000;
        const int LocalHealthWaitMs = 4 * 60 * 1000;
        const int PublicHealthWaitMs = 3 * 60 * 1000;
        const int SyncAfterSecretDelayMs = 20000;
        const int MaxRestartBackoffSec = 300;
        const int ResumeSettleMs = 5000;

        static readonly Regex UrlRe =
            new Regex(@"https://[a-z0-9-]+\.trycloudflare\.com", RegexOptions.IgnoreCase);
        static readonly Regex HostnameRe =
            new Regex(@"""hostname""\s*:\s*""([^""]+)""", RegexOptions.IgnoreCase);

        static readonly object stateLock = new object();
        static NotifyIcon notify;
        static Control ui;
        static ToolStripMenuItem miStatus, miStart, miStop, miSync, miScreensOff, miAutostart, miKeepAwake;
        static System.Windows.Forms.Timer pollTimer, watchdogTimer;
        static Process workerProc, tunnelProc;
        static string tunnelUrl;
        static string cloudflared;
        static bool running;
        static bool generalSyncPending;
        static int publishing;
        static int watchdogBusy;
        static int resuming;
        static int workerRestarts, tunnelRestarts;
        static DateTime nextWorkerRestartUtc = DateTime.MinValue;
        static DateTime nextTunnelRestartUtc = DateTime.MinValue;

        [STAThread]
        static void Main()
        {
            bool createdNew;
            using (var mutex = new Mutex(true, "Local\\ServidorACME_Tray", out createdNew))
            {
                if (!createdNew) return;
                ServicePointManager.SecurityProtocol |= (SecurityProtocolType)3072;
                EnvLocal.AppDir = ResolveAppDir();
                TrayLog.Init(EnvLocal.AppDir);
                cloudflared = ResolveCloudflared();

                Application.EnableVisualStyles();
                ui = new Control();
                IntPtr forceHandle = ui.Handle;

                BuildTray();
                AutostartRegistry.ApplyDefaultOnLaunch();
                miAutostart.Checked = AutostartRegistry.IsEnabled();
                CreateTimers();
                SystemEvents.PowerModeChanged += OnPowerModeChanged;
                TrayLog.Write("Tray iniciado. AppDir=" + EnvLocal.AppDir);
                ScheduleAutoStart();
                Application.Run();
                SystemEvents.PowerModeChanged -= OnPowerModeChanged;
                GC.KeepAlive(mutex);
            }
        }

        // ---------------- UI ----------------

        static void BuildTray()
        {
            miStatus = new ToolStripMenuItem("Parado");
            miStatus.Enabled = false;
            miStart = new ToolStripMenuItem("Executar");
            miStart.Click += delegate { StartServers(); };
            miStop = new ToolStripMenuItem("Parar");
            miStop.Enabled = false;
            miStop.Click += delegate { StopServers(true); };
            miSync = new ToolStripMenuItem("Sync geral agora");
            miSync.Click += delegate { GeneralSync.TriggerAsync(0, ReportSync); };
            miScreensOff = new ToolStripMenuItem("Apagar telas agora");
            miScreensOff.Click += delegate { MonitorPower.TurnOffAfter(800); };
            miAutostart = new ToolStripMenuItem("Iniciar com o Windows");
            miAutostart.CheckOnClick = true;
            miAutostart.Click += delegate { AutostartRegistry.SetEnabled(miAutostart.Checked); };
            miKeepAwake = new ToolStripMenuItem("Impedir suspensao (telas podem apagar)");
            miKeepAwake.CheckOnClick = true;
            miKeepAwake.Checked = KeepAwake.IsPreferred();
            miKeepAwake.Click += delegate
            {
                KeepAwake.SetPreferred(miKeepAwake.Checked);
                ApplyKeepAwake();
            };
            var miExit = new ToolStripMenuItem("Sair");
            miExit.Click += delegate { ExitApp(); };

            var menu = new ContextMenuStrip();
            menu.Items.AddRange(new ToolStripItem[] {
                miStatus, miStart, miStop, miSync, miScreensOff, new ToolStripSeparator(),
                miAutostart, miKeepAwake, new ToolStripSeparator(), miExit });

            notify = new NotifyIcon();
            notify.Icon = LoadIcon();
            notify.Text = "ServidorACME - Servidor";
            notify.Visible = true;
            notify.ContextMenuStrip = menu;
            notify.MouseClick += delegate (object s, MouseEventArgs e)
            {
                if (e.Button == MouseButtons.Left) ShowMenu();
            };
        }

        static void CreateTimers()
        {
            pollTimer = new System.Windows.Forms.Timer();
            pollTimer.Interval = PollMs;
            pollTimer.Tick += delegate { ThreadPool.QueueUserWorkItem(delegate { PollLiveTunnel(); }); };

            watchdogTimer = new System.Windows.Forms.Timer();
            watchdogTimer.Interval = WatchdogMs;
            watchdogTimer.Tick += delegate { ThreadPool.QueueUserWorkItem(delegate { WatchdogTick(); }); };
        }

        static void ScheduleAutoStart()
        {
            var once = new System.Windows.Forms.Timer();
            once.Interval = AutoStartDelayMs;
            once.Tick += delegate
            {
                once.Stop();
                once.Dispose();
                StartServers();
            };
            once.Start();
        }

        static void RunOnUi(MethodInvoker action)
        {
            try
            {
                if (ui.InvokeRequired) ui.BeginInvoke(action);
                else action();
            }
            catch { }
        }

        static void SetStatus(string text)
        {
            RunOnUi(delegate
            {
                miStatus.Text = text;
                string full = "ServidorACME - " + text;
                notify.Text = full.Length > 63 ? full.Substring(0, 63) : full;
            });
        }

        static void Balloon(string text, ToolTipIcon icon)
        {
            RunOnUi(delegate { notify.ShowBalloonTip(4000, "ServidorACME", text, icon); });
        }

        static void ApplyKeepAwake()
        {
            RunOnUi(delegate { KeepAwake.Apply(IsRunning() && miKeepAwake.Checked); });
        }

        static void ReportSync(string message, bool ok)
        {
            Balloon(message, ok ? ToolTipIcon.Info : ToolTipIcon.Warning);
        }

        static Icon LoadIcon()
        {
            try
            {
                Icon self = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
                if (self != null) return self;
            }
            catch { }
            try
            {
                string ico = Path.Combine(EnvLocal.AppDir, "src", "app", "favicon.ico");
                if (File.Exists(ico)) return new Icon(ico);
            }
            catch { }
            return SystemIcons.Application;
        }

        static void ShowMenu()
        {
            MethodInfo m = typeof(NotifyIcon).GetMethod(
                "ShowContextMenu", BindingFlags.Instance | BindingFlags.NonPublic);
            if (m != null) m.Invoke(notify, null);
        }

        static string ResolveAppDir()
        {
            try
            {
                string exeDir = Path.GetDirectoryName(Application.ExecutablePath);
                string[] cands =
                {
                    Path.Combine(exeDir, "app"),
                    exeDir,
                    Path.GetFullPath(Path.Combine(exeDir, "..", "app"))
                };
                foreach (string c in cands)
                {
                    if (File.Exists(Path.Combine(c, "package.json"))) return c;
                }
            }
            catch { }
            return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                "CEFET-Academic-Planner", "app");
        }

        static string ResolveCloudflared()
        {
            string def = @"C:\Program Files (x86)\cloudflared\cloudflared.exe";
            return File.Exists(def) ? def : "cloudflared";
        }

        // ---------------- Ciclo de vida ----------------

        static bool IsRunning()
        {
            lock (stateLock) { return running; }
        }

        static void StartServers()
        {
            lock (stateLock)
            {
                if (running) return;
                running = true;
                generalSyncPending = true;
                workerRestarts = 0;
                tunnelRestarts = 0;
            }
            TrayLog.Write("--- Iniciando servidor ---");
            miStart.Enabled = false;
            miStop.Enabled = true;
            ApplyKeepAwake();
            SetStatus("Aguardando rede...");
            ThreadPool.QueueUserWorkItem(delegate { BootSequence(); });
        }

        static void BootSequence()
        {
            if (!HttpProbe.WaitForNetwork(NetworkWaitMs, IsRunning))
                TrayLog.Write("Rede nao confirmada em 3 min; tentando mesmo assim.");
            if (!IsRunning()) return;

            ProcessTools.KillByName("cloudflared");
            ProcessTools.KillPortListeners(WorkerPort);
            StartWorker();
            StartTunnel();

            SetStatus("No ar (conectando tunel...)");
            Balloon("Servidor iniciado. Conectando tunel...", ToolTipIcon.Info);
            RunOnUi(delegate { pollTimer.Start(); watchdogTimer.Start(); });
            Thread.Sleep(5000);
            PollLiveTunnel();
        }

        static void StartWorker()
        {
            try
            {
                string workerLog = Path.Combine(EnvLocal.AppDir, ".data", "home-worker.log");
                Directory.CreateDirectory(Path.GetDirectoryName(workerLog));
                TrayLog.RotateIfLarge(workerLog, 5 * 1024 * 1024);

                var psi = new ProcessStartInfo("cmd.exe",
                    "/c npm run worker:home >> \"" + workerLog + "\" 2>&1");
                psi.WorkingDirectory = EnvLocal.AppDir;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                psi.WindowStyle = ProcessWindowStyle.Hidden;
                Process p = Process.Start(psi);
                lock (stateLock) { workerProc = p; }
                TrayLog.Write("worker:home pid=" + (p != null ? p.Id.ToString() : "?"));
            }
            catch (Exception ex) { TrayLog.Write("erro worker: " + ex.Message); }
        }

        static void StartTunnel()
        {
            try
            {
                var psi = new ProcessStartInfo(cloudflared,
                    "tunnel --url http://127.0.0.1:" + WorkerPort + " --metrics 127.0.0.1:20241");
                psi.WorkingDirectory = EnvLocal.AppDir;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                psi.RedirectStandardOutput = true;
                psi.RedirectStandardError = true;
                var p = new Process();
                p.StartInfo = psi;
                p.OutputDataReceived += OnTunnelData;
                p.ErrorDataReceived += OnTunnelData;
                p.Start();
                p.BeginOutputReadLine();
                p.BeginErrorReadLine();
                lock (stateLock) { tunnelProc = p; }
                TrayLog.Write("cloudflared pid=" + p.Id);
            }
            catch (Exception ex) { TrayLog.Write("erro tunnel: " + ex.Message); }
        }

        static void StopServers(bool showBalloon)
        {
            Process w, t;
            lock (stateLock)
            {
                running = false;
                tunnelUrl = null;
                w = workerProc; workerProc = null;
                t = tunnelProc; tunnelProc = null;
            }
            TrayLog.Write("--- Parando servidor ---");
            try { pollTimer.Stop(); watchdogTimer.Stop(); } catch { }
            ProcessTools.KillTree(t);
            ProcessTools.KillTree(w);
            ProcessTools.KillByName("cloudflared");
            miStart.Enabled = true;
            miStop.Enabled = false;
            ApplyKeepAwake();
            SetStatus("Parado");
            if (showBalloon) Balloon("Servidor parado.", ToolTipIcon.Info);
        }

        static void ExitApp()
        {
            StopServers(false);
            try { notify.Visible = false; notify.Dispose(); } catch { }
            Application.Exit();
        }

        // ---------------- Watchdog ----------------

        static int BackoffSeconds(int restarts)
        {
            int exp = Math.Min(restarts, 6);
            return Math.Min(MaxRestartBackoffSec, 10 * (1 << (exp - 1)));
        }

        static void WatchdogTick()
        {
            if (Interlocked.CompareExchange(ref watchdogBusy, 1, 0) != 0) return;
            try
            {
                if (!IsRunning()) return;
                Process w, t;
                lock (stateLock) { w = workerProc; t = tunnelProc; }
                if (ProcessTools.HasExited(w)) RestartWorker();
                if (ProcessTools.HasExited(t)) RestartTunnel();
            }
            finally { Interlocked.Exchange(ref watchdogBusy, 0); }
        }

        static void RestartWorker()
        {
            if (DateTime.UtcNow < nextWorkerRestartUtc) return;
            workerRestarts++;
            nextWorkerRestartUtc = DateTime.UtcNow.AddSeconds(BackoffSeconds(workerRestarts));
            TrayLog.Write("Watchdog: worker caiu, reiniciando (#" + workerRestarts + ")");
            SetStatus("Reiniciando worker...");
            ProcessTools.KillPortListeners(WorkerPort);
            StartWorker();
        }

        static void RestartTunnel()
        {
            if (DateTime.UtcNow < nextTunnelRestartUtc) return;
            tunnelRestarts++;
            nextTunnelRestartUtc = DateTime.UtcNow.AddSeconds(BackoffSeconds(tunnelRestarts));
            TrayLog.Write("Watchdog: tunel caiu, reiniciando (#" + tunnelRestarts + ")");
            SetStatus("Reconectando tunel...");
            lock (stateLock) { tunnelUrl = null; }
            ProcessTools.KillByName("cloudflared");
            StartTunnel();
        }

        // ---------------- Suspensao / hibernacao ----------------

        static void OnPowerModeChanged(object sender, PowerModeChangedEventArgs e)
        {
            if (e.Mode == PowerModes.Suspend)
            {
                TrayLog.Write("PC entrando em suspensao.");
                return;
            }
            if (e.Mode != PowerModes.Resume || !IsRunning()) return;
            if (Interlocked.CompareExchange(ref resuming, 1, 0) != 0) return;
            TrayLog.Write("PC acordou: religando tunel e conferindo worker.");
            SetStatus("Religando apos suspensao...");
            ThreadPool.QueueUserWorkItem(delegate
            {
                try { RecoverAfterResume(); }
                finally { Interlocked.Exchange(ref resuming, 0); }
            });
        }

        /// <summary>
        /// Apos o sleep o quick tunnel costuma voltar "meio morto" ou com outro hostname;
        /// um tunel novo + secret novo e mais confiavel que esperar o watchdog perceber.
        /// </summary>
        static void RecoverAfterResume()
        {
            Thread.Sleep(ResumeSettleMs);
            if (!HttpProbe.WaitForNetwork(NetworkWaitMs, IsRunning))
                TrayLog.Write("Rede nao confirmada apos resume; tentando mesmo assim.");
            if (!IsRunning()) return;

            HoldWatchdog();
            try
            {
                Process t, w;
                lock (stateLock)
                {
                    tunnelUrl = null;
                    generalSyncPending = true;
                    t = tunnelProc;
                    w = workerProc;
                }
                ProcessTools.KillTree(t);
                ProcessTools.KillByName("cloudflared");
                RestartWorkerIfUnhealthy(w);
                StartTunnel();
            }
            finally { Interlocked.Exchange(ref watchdogBusy, 0); }

            Thread.Sleep(5000);
            PollLiveTunnel();
        }

        static void HoldWatchdog()
        {
            for (int i = 0; i < 60 && Interlocked.CompareExchange(ref watchdogBusy, 1, 0) != 0; i++)
            {
                Thread.Sleep(500);
            }
        }

        static void RestartWorkerIfUnhealthy(Process w)
        {
            string localHealth = "http://127.0.0.1:" + WorkerPort + "/health";
            if (!ProcessTools.HasExited(w) && HttpProbe.IsHealthy(localHealth, 10000)) return;
            TrayLog.Write("Worker sem resposta apos resume; reiniciando.");
            ProcessTools.KillTree(w);
            ProcessTools.KillPortListeners(WorkerPort);
            StartWorker();
        }

        // ---------------- Tunel -> secret -> sync ----------------

        static void OnTunnelData(object sender, DataReceivedEventArgs e)
        {
            if (string.IsNullOrEmpty(e.Data)) return;
            Match m = UrlRe.Match(e.Data);
            if (m.Success) ApplyTunnelUrl(m.Value, "log");
        }

        static void PollLiveTunnel()
        {
            if (!IsRunning()) return;
            string live = ReadLiveTunnelUrl();
            if (!string.IsNullOrEmpty(live)) ApplyTunnelUrl(live, "poll");
        }

        static string ReadLiveTunnelUrl()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(MetricsUrl);
                req.Timeout = 5000;
                req.ReadWriteTimeout = 5000;
                req.Proxy = null;
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                using (StreamReader sr = new StreamReader(res.GetResponseStream()))
                {
                    Match m = HostnameRe.Match(sr.ReadToEnd());
                    return m.Success ? NormalizeTunnelUrl(m.Groups[1].Value) : null;
                }
            }
            catch { return null; }
        }

        static string NormalizeTunnelUrl(string raw)
        {
            if (string.IsNullOrEmpty(raw)) return null;
            string u = raw.Trim().TrimEnd('/');
            if (!u.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
                !u.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                u = "https://" + u;
            }
            return u.ToLowerInvariant();
        }

        static void ApplyTunnelUrl(string raw, string reason)
        {
            string u = NormalizeTunnelUrl(raw);
            if (string.IsNullOrEmpty(u) || !IsRunning()) return;
            lock (stateLock)
            {
                if (string.Equals(u, tunnelUrl, StringComparison.OrdinalIgnoreCase)) return;
            }
            if (Interlocked.CompareExchange(ref publishing, 1, 0) != 0) return;
            TrayLog.Write("Tunnel URL (" + reason + "): " + u);
            ThreadPool.QueueUserWorkItem(delegate
            {
                try { PublishTunnel(u); }
                finally { Interlocked.Exchange(ref publishing, 0); }
            });
        }

        static void PublishTunnel(string url)
        {
            SetStatus("Validando worker local...");
            string localHealth = "http://127.0.0.1:" + WorkerPort + "/health";
            if (!HttpProbe.WaitHealthy(localHealth, LocalHealthWaitMs, IsRunning))
            {
                TrayLog.Write("Worker local sem /health; secret nao atualizado (retenta no poll).");
                SetStatus("Worker local sem resposta");
                return;
            }

            SetStatus("Validando tunel publico...");
            if (!HttpProbe.WaitHealthy(url + "/health", PublicHealthWaitMs, IsRunning))
            {
                TrayLog.Write("Tunel publico sem /health; secret nao atualizado (evita 530/1016).");
                SetStatus("Tunel sem resposta (retentando)");
                return;
            }

            SetStatus("Atualizando URL no Cloudflare...");
            if (!CloudflareSecret.PutWorkerUrl(url, IsRunning))
            {
                SetStatus("No ar (falha secret)");
                Balloon("Tunel no ar, mas falhou atualizar o secret. Retentando no proximo poll.",
                    ToolTipIcon.Warning);
                return;
            }
            OnTunnelPublished(url);
        }

        static void OnTunnelPublished(string url)
        {
            bool runSync;
            lock (stateLock)
            {
                if (!running) return;
                tunnelUrl = url;
                workerRestarts = 0;
                tunnelRestarts = 0;
                runSync = generalSyncPending;
                generalSyncPending = false;
            }
            EnvLocal.WriteWorkerUrl(url);
            SetStatus("No ar (OK)");
            Balloon("Servidor no ar! Tunel conectado e URL atualizada no Cloudflare.", ToolTipIcon.Info);
            if (runSync) GeneralSync.TriggerAsync(SyncAfterSecretDelayMs, ReportSync);
        }
    }
}
