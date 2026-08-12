// ServidorACME - Servidor de casa (tray app nativo).
// Sobe o worker Playwright (:8787) + tunnel cloudflared e atualiza
// automaticamente o secret SIGAA_WORKER_URL no Cloudflare.
// Compilar: ver app/scripts/build-tray-exe.ps1
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Windows.Forms;

namespace HomeServerTray
{
    static class Program
    {
        static NotifyIcon notify;
        static ToolStripMenuItem miStatus, miStart, miStop, miExit;
        static Process workerProc;
        static Process tunnelProc;
        static string tunnelUrl;
        static bool running;
        static string appDir;
        static string cloudflared;
        static string logFile;
        static readonly Regex UrlRe =
            new Regex(@"https://[a-z0-9-]+\.trycloudflare\.com", RegexOptions.IgnoreCase);

        [STAThread]
        static void Main()
        {
            appDir = ResolveAppDir();
            logFile = Path.Combine(appDir, ".data", "home-server-tray.log");
            cloudflared = ResolveCloudflared();

            Application.EnableVisualStyles();

            miStatus = new ToolStripMenuItem("Parado");
            miStatus.Enabled = false;
            miStart = new ToolStripMenuItem("Executar");
            miStart.Click += delegate { StartServers(); };
            miStop = new ToolStripMenuItem("Parar");
            miStop.Enabled = false;
            miStop.Click += delegate { StopServers(); };
            miExit = new ToolStripMenuItem("Sair");
            miExit.Click += delegate { ExitApp(); };

            var menu = new ContextMenuStrip();
            menu.Items.Add(miStatus);
            menu.Items.Add(miStart);
            menu.Items.Add(miStop);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add(miExit);

            notify = new NotifyIcon();
            notify.Icon = LoadIcon();
            notify.Text = "ServidorACME - Servidor";
            notify.Visible = true;
            notify.ContextMenuStrip = menu;
            notify.MouseClick += delegate (object s, MouseEventArgs e)
            {
                if (e.Button == MouseButtons.Left) ShowMenu();
            };
            notify.ShowBalloonTip(2500, "ServidorACME",
                "Pronto. Clique no icone e em \"Executar\".", ToolTipIcon.Info);

            Log("Tray iniciado. AppDir=" + appDir);
            Application.Run();
        }

        static Icon LoadIcon()
        {
            // 1) icone embutido no proprio .exe (logo do site via /win32icon)
            try
            {
                Icon self = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
                if (self != null) return self;
            }
            catch { }
            // 2) fallback: favicon do app
            try
            {
                string ico = Path.Combine(appDir, "src", "app", "favicon.ico");
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
            return @"C:\Users\kairo\OneDrive\Documentos\CEFET-Academic-Planner\app";
        }

        static string ResolveCloudflared()
        {
            string def = @"C:\Program Files (x86)\cloudflared\cloudflared.exe";
            return File.Exists(def) ? def : "cloudflared";
        }

        static void Log(string msg)
        {
            try
            {
                string dir = Path.GetDirectoryName(logFile);
                if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                File.AppendAllText(logFile,
                    "[" + DateTime.Now.ToString("HH:mm:ss") + "] " + msg + Environment.NewLine);
            }
            catch { }
        }

        static void SetStatus(string t)
        {
            try
            {
                miStatus.Text = t;
                string full = "ServidorACME - " + t;
                notify.Text = full.Length > 63 ? full.Substring(0, 63) : full;
            }
            catch { }
        }

        static void StartServers()
        {
            if (running) return;
            Log("--- Iniciando servidor ---");
            SetStatus("Iniciando...");

            try
            {
                string workerLog = Path.Combine(appDir, ".data", "home-worker.log");
                string workerDir = Path.GetDirectoryName(workerLog);
                if (!Directory.Exists(workerDir)) Directory.CreateDirectory(workerDir);

                var wpsi = new ProcessStartInfo("cmd.exe",
                    "/c npm run worker:home > \"" + workerLog + "\" 2>&1");
                wpsi.WorkingDirectory = appDir;
                wpsi.UseShellExecute = false;
                wpsi.CreateNoWindow = true;
                wpsi.WindowStyle = ProcessWindowStyle.Hidden;
                workerProc = Process.Start(wpsi);
                Log("worker:home pid=" + (workerProc != null ? workerProc.Id.ToString() : "?") +
                    " log=" + workerLog);
            }
            catch (Exception ex) { Log("erro worker: " + ex.Message); }

            try
            {
                var tpsi = new ProcessStartInfo(cloudflared, "tunnel --url http://127.0.0.1:8787");
                tpsi.WorkingDirectory = appDir;
                tpsi.UseShellExecute = false;
                tpsi.CreateNoWindow = true;
                tpsi.RedirectStandardOutput = true;
                tpsi.RedirectStandardError = true;
                tunnelProc = new Process();
                tunnelProc.StartInfo = tpsi;
                tunnelProc.OutputDataReceived += OnTunnelData;
                tunnelProc.ErrorDataReceived += OnTunnelData;
                tunnelProc.Start();
                tunnelProc.BeginOutputReadLine();
                tunnelProc.BeginErrorReadLine();
                Log("cloudflared pid=" + tunnelProc.Id);
            }
            catch (Exception ex) { Log("erro tunnel: " + ex.Message); }

            running = true;
            miStart.Enabled = false;
            miStop.Enabled = true;
            SetStatus("No ar (conectando tunel...)");
            notify.ShowBalloonTip(3000, "ServidorACME",
                "Servidor iniciado. Conectando tunel...", ToolTipIcon.Info);
        }

        static void OnTunnelData(object sender, DataReceivedEventArgs e)
        {
            if (string.IsNullOrEmpty(e.Data)) return;
            Match m = UrlRe.Match(e.Data);
            if (!m.Success) return;
            string u = m.Value;
            if (u == tunnelUrl) return;
            tunnelUrl = u;
            Log("Tunnel URL detectada: " + u);
            UpdateSecret(u);
        }

        static void UpdateSecret(string url)
        {
            try
            {
                Log("Atualizando SIGAA_WORKER_URL=" + url);
                string token = ReadEnvLocalValue("CLOUDFLARE_API_TOKEN");
                var psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments =
                    "/c echo " + url +
                    "| npx wrangler secret put SIGAA_WORKER_URL --name acme-hub";
                psi.WorkingDirectory = appDir;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                if (!string.IsNullOrEmpty(token))
                {
                    psi.EnvironmentVariables["CLOUDFLARE_API_TOKEN"] = token;
                    Log("CLOUDFLARE_API_TOKEN carregado do .env.local");
                }
                else
                {
                    Log("Aviso: CLOUDFLARE_API_TOKEN ausente no .env.local");
                }
                Process p = Process.Start(psi);
                p.WaitForExit();
                Log("wrangler secret put exit=" + p.ExitCode);
                if (p.ExitCode == 0)
                {
                    SetStatus("No ar (OK)");
                    notify.ShowBalloonTip(4000, "ServidorACME",
                        "Servidor no ar! Tunel conectado e URL atualizada no Cloudflare.",
                        ToolTipIcon.Info);
                }
                else
                {
                    SetStatus("No ar (falha secret)");
                    notify.ShowBalloonTip(5000, "ServidorACME",
                        "Tunel no ar, mas falhou atualizar o secret. URL: " + url,
                        ToolTipIcon.Warning);
                }
            }
            catch (Exception ex) { Log("erro UpdateSecret: " + ex.Message); }
        }

        static string ReadEnvLocalValue(string key)
        {
            try
            {
                string path = Path.Combine(appDir, ".env.local");
                if (!File.Exists(path)) return null;
                foreach (string raw in File.ReadAllLines(path))
                {
                    string line = raw.Trim();
                    if (line.Length == 0 || line.StartsWith("#")) continue;
                    if (!line.StartsWith(key + "=")) continue;
                    string value = line.Substring(key.Length + 1).Trim();
                    if (value.Length >= 2 &&
                        ((value[0] == '"' && value[value.Length - 1] == '"') ||
                         (value[0] == '\'' && value[value.Length - 1] == '\'')))
                    {
                        value = value.Substring(1, value.Length - 2);
                    }
                    return value;
                }
            }
            catch (Exception ex) { Log("erro ReadEnvLocal: " + ex.Message); }
            return null;
        }

        static void StopServers()
        {
            Log("--- Parando servidor ---");
            KillTree(tunnelProc); tunnelProc = null;
            KillTree(workerProc); workerProc = null;
            try
            {
                foreach (Process p in Process.GetProcessesByName("cloudflared"))
                {
                    try { p.Kill(); } catch { }
                }
            }
            catch { }
            running = false;
            tunnelUrl = null;
            miStart.Enabled = true;
            miStop.Enabled = false;
            SetStatus("Parado");
            notify.ShowBalloonTip(2000, "ServidorACME", "Servidor parado.", ToolTipIcon.Info);
        }

        static void KillTree(Process p)
        {
            if (p == null) return;
            try
            {
                var psi = new ProcessStartInfo("taskkill.exe", "/PID " + p.Id + " /T /F");
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                Process k = Process.Start(psi);
                k.WaitForExit();
            }
            catch { }
        }

        static void ExitApp()
        {
            StopServers();
            try { notify.Visible = false; notify.Dispose(); } catch { }
            Application.Exit();
        }
    }
}
