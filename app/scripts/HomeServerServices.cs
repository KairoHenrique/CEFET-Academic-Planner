// ServidorACME - servicos de suporte do tray (log, .env.local, autostart,
// HTTP, secret Cloudflare e sync geral). Compilado junto com HomeServerTray.cs.
// C# 5 (csc do .NET Framework): sem interpolacao, sem ?. e sem nameof.
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace HomeServerTray
{
    static class TrayLog
    {
        const long MaxLogBytes = 2 * 1024 * 1024;
        static readonly object fileLock = new object();
        static string logFile;

        public static void Init(string appDir)
        {
            logFile = Path.Combine(appDir, ".data", "home-server-tray.log");
        }

        public static void Write(string msg)
        {
            if (logFile == null) return;
            lock (fileLock)
            {
                try
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(logFile));
                    RotateIfLarge(logFile, MaxLogBytes);
                    File.AppendAllText(logFile,
                        "[" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "] " + msg +
                        Environment.NewLine);
                }
                catch { }
            }
        }

        public static void RotateIfLarge(string path, long maxBytes)
        {
            try
            {
                var info = new FileInfo(path);
                if (!info.Exists || info.Length < maxBytes) return;
                string old = path + ".old";
                if (File.Exists(old)) File.Delete(old);
                File.Move(path, old);
            }
            catch { }
        }
    }

    static class EnvLocal
    {
        public static string AppDir;

        static string FilePath()
        {
            return Path.Combine(AppDir, ".env.local");
        }

        public static string Read(string key)
        {
            try
            {
                string path = FilePath();
                if (!File.Exists(path)) return null;
                foreach (string raw in File.ReadAllLines(path))
                {
                    string line = raw.Trim();
                    if (line.Length == 0 || line.StartsWith("#")) continue;
                    if (!line.StartsWith(key + "=")) continue;
                    return Unquote(line.Substring(key.Length + 1).Trim());
                }
            }
            catch (Exception ex) { TrayLog.Write("erro ReadEnvLocal(" + key + "): " + ex.Message); }
            return null;
        }

        static string Unquote(string value)
        {
            if (value.Length >= 2 &&
                ((value[0] == '"' && value[value.Length - 1] == '"') ||
                 (value[0] == '\'' && value[value.Length - 1] == '\'')))
            {
                return value.Substring(1, value.Length - 2);
            }
            return value;
        }

        public static void WriteWorkerUrl(string url)
        {
            try
            {
                string path = FilePath();
                if (!File.Exists(path)) return;
                string text = File.ReadAllText(path);
                if (Regex.IsMatch(text, @"^SIGAA_WORKER_URL=", RegexOptions.Multiline))
                {
                    text = Regex.Replace(text, @"^SIGAA_WORKER_URL=.*$",
                        "SIGAA_WORKER_URL=" + url, RegexOptions.Multiline);
                }
                else
                {
                    text = text.TrimEnd() + Environment.NewLine +
                        "SIGAA_WORKER_URL=" + url + Environment.NewLine;
                }
                File.WriteAllText(path, text);
            }
            catch (Exception ex) { TrayLog.Write("erro WriteEnvLocal: " + ex.Message); }
        }
    }

    /// <summary>Inicia o tray no logon do Windows (HKCU\...\Run, sem admin).</summary>
    static class AutostartRegistry
    {
        const string RunKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Run";
        const string ValueName = "ServidorACME";

        static string Command()
        {
            return "\"" + Application.ExecutablePath + "\"";
        }

        static string DisabledMarkerPath()
        {
            return Path.Combine(EnvLocal.AppDir, ".data", "autostart-disabled");
        }

        public static bool IsEnabled()
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(RunKeyPath, false))
                {
                    if (key == null) return false;
                    object value = key.GetValue(ValueName);
                    return value != null &&
                        string.Equals(value.ToString(), Command(), StringComparison.OrdinalIgnoreCase);
                }
            }
            catch { return false; }
        }

        public static void SetEnabled(bool enabled)
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(RunKeyPath))
                {
                    if (enabled) key.SetValue(ValueName, Command());
                    else key.DeleteValue(ValueName, false);
                }
                UpdateDisabledMarker(enabled);
                TrayLog.Write("Autostart Windows = " + enabled);
            }
            catch (Exception ex) { TrayLog.Write("erro autostart: " + ex.Message); }
        }

        static void UpdateDisabledMarker(bool enabled)
        {
            string marker = DisabledMarkerPath();
            Directory.CreateDirectory(Path.GetDirectoryName(marker));
            if (enabled) { if (File.Exists(marker)) File.Delete(marker); }
            else File.WriteAllText(marker, DateTime.Now.ToString("o"));
        }

        /// <summary>Liga o autostart por padrao, salvo se o usuario desligou no menu.</summary>
        public static void ApplyDefaultOnLaunch()
        {
            if (File.Exists(DisabledMarkerPath())) return;
            if (!IsEnabled()) SetEnabled(true);
        }
    }

    static class HttpProbe
    {
        public static bool IsHealthy(string url, int timeoutMs)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                req.Method = "GET";
                req.Timeout = timeoutMs;
                req.ReadWriteTimeout = timeoutMs;
                req.Proxy = null;
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                using (StreamReader sr = new StreamReader(res.GetResponseStream()))
                {
                    return res.StatusCode == HttpStatusCode.OK && sr.ReadToEnd().Contains("\"ok\"");
                }
            }
            catch { return false; }
        }

        public static bool WaitHealthy(string url, int totalMs, Func<bool> keepWaiting)
        {
            Stopwatch sw = Stopwatch.StartNew();
            while (sw.ElapsedMilliseconds < totalMs && keepWaiting())
            {
                if (IsHealthy(url, 10000)) return true;
                Thread.Sleep(3000);
            }
            return false;
        }

        /// <summary>No boot a rede/DNS pode demorar; espera o DNS do quick tunnel.</summary>
        public static bool WaitForNetwork(int totalMs, Func<bool> keepWaiting)
        {
            Stopwatch sw = Stopwatch.StartNew();
            while (sw.ElapsedMilliseconds < totalMs && keepWaiting())
            {
                try
                {
                    if (Dns.GetHostAddresses("api.trycloudflare.com").Length > 0) return true;
                }
                catch { }
                Thread.Sleep(5000);
            }
            return false;
        }

        /// <summary>POST sem corpo com Bearer. Retorna status HTTP ou -1 (rede/timeout).</summary>
        public static int PostWithBearer(string url, string bearer, int timeoutMs)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                req.Method = "POST";
                req.Timeout = timeoutMs;
                req.ReadWriteTimeout = timeoutMs;
                req.ContentLength = 0;
                req.Headers[HttpRequestHeader.Authorization] = "Bearer " + bearer;
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                {
                    return (int)res.StatusCode;
                }
            }
            catch (WebException ex)
            {
                HttpWebResponse res = ex.Response as HttpWebResponse;
                return res != null ? (int)res.StatusCode : -1;
            }
            catch { return -1; }
        }
    }

    static class CloudflareSecret
    {
        const int MaxAttempts = 4;
        const int WranglerTimeoutMs = 3 * 60 * 1000;
        static readonly Regex SafeTunnelUrl =
            new Regex(@"^https://[a-z0-9-]+\.trycloudflare\.com$", RegexOptions.IgnoreCase);

        public static bool PutWorkerUrl(string url, Func<bool> keepTrying)
        {
            if (!SafeTunnelUrl.IsMatch(url))
            {
                TrayLog.Write("URL de tunel rejeitada (formato inesperado).");
                return false;
            }
            for (int attempt = 1; attempt <= MaxAttempts && keepTrying(); attempt++)
            {
                if (RunWrangler("secret put SIGAA_WORKER_URL --name acme-hub", url) == 0) return true;
                if (RunWrangler("versions secret put SIGAA_WORKER_URL --name acme-hub", url) == 0) return true;
                TrayLog.Write("wrangler falhou (tentativa " + attempt + "/" + MaxAttempts + ")");
                Thread.Sleep(15000 * attempt);
            }
            return false;
        }

        static int RunWrangler(string args, string stdinValue)
        {
            try
            {
                var psi = new ProcessStartInfo("cmd.exe", "/c npx wrangler " + args);
                psi.WorkingDirectory = EnvLocal.AppDir;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                psi.RedirectStandardInput = true;
                string token = EnvLocal.Read("CLOUDFLARE_API_TOKEN");
                if (!string.IsNullOrEmpty(token)) psi.EnvironmentVariables["CLOUDFLARE_API_TOKEN"] = token;
                else TrayLog.Write("Aviso: CLOUDFLARE_API_TOKEN ausente no .env.local");

                using (Process p = Process.Start(psi))
                {
                    p.StandardInput.WriteLine(stdinValue);
                    p.StandardInput.Close();
                    if (!p.WaitForExit(WranglerTimeoutMs))
                    {
                        ProcessTools.KillTree(p);
                        TrayLog.Write("wrangler " + args + " -> timeout");
                        return -1;
                    }
                    TrayLog.Write("wrangler " + args + " -> exit=" + p.ExitCode);
                    return p.ExitCode;
                }
            }
            catch (Exception ex)
            {
                TrayLog.Write("erro wrangler: " + ex.Message);
                return -1;
            }
        }
    }

    /// <summary>Dispara o orquestrador da nuvem (calendario, turmas e deep sync dos usuarios ativos).</summary>
    static class GeneralSync
    {
        const int MaxAttempts = 3;
        const int RequestTimeoutMs = 90 * 1000;
        const string DefaultAppUrl = "https://acmehub.com.br";

        public static void TriggerAsync(int delayMs, Action<string, bool> report)
        {
            ThreadPool.QueueUserWorkItem(delegate
            {
                if (delayMs > 0) Thread.Sleep(delayMs);
                Run(report);
            });
        }

        static string ResolveAppUrl()
        {
            string url = EnvLocal.Read("PLANNER_APP_URL");
            if (string.IsNullOrEmpty(url)) url = EnvLocal.Read("PLANNER_HEALTH_URL");
            if (string.IsNullOrEmpty(url)) url = DefaultAppUrl;
            url = url.Trim().TrimEnd('/');
            return url.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ? url : DefaultAppUrl;
        }

        static void Run(Action<string, bool> report)
        {
            string secret = EnvLocal.Read("CRON_SECRET");
            if (string.IsNullOrEmpty(secret))
            {
                TrayLog.Write("Sync geral: CRON_SECRET ausente no .env.local");
                report("Sync geral nao disparado: CRON_SECRET ausente no .env.local.", false);
                return;
            }

            string endpoint = ResolveAppUrl() + "/api/cron/sync-orchestrator?force=1";
            for (int attempt = 1; attempt <= MaxAttempts; attempt++)
            {
                int status = HttpProbe.PostWithBearer(endpoint, secret, RequestTimeoutMs);
                TrayLog.Write("Sync geral tentativa " + attempt + " -> HTTP " + status);
                if (status >= 200 && status < 300)
                {
                    report("Sync geral disparado (calendario, turmas e alunos ativos).", true);
                    return;
                }
                if (status == 401 || status == 403)
                {
                    report("Sync geral recusado: CRON_SECRET local diferente do Cloudflare.", false);
                    return;
                }
                Thread.Sleep(30000 * attempt);
            }
            report("Sync geral falhou apos " + MaxAttempts + " tentativas (ver log).", false);
        }
    }

    static class ProcessTools
    {
        public static bool HasExited(Process p)
        {
            if (p == null) return true;
            try { return p.HasExited; } catch { return true; }
        }

        public static void KillTree(Process p)
        {
            if (p == null) return;
            try { KillPid(p.Id); } catch { }
        }

        static void KillPid(int pid)
        {
            var psi = new ProcessStartInfo("taskkill.exe", "/PID " + pid + " /T /F");
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            using (Process k = Process.Start(psi)) { k.WaitForExit(15000); }
        }

        public static void KillByName(string name)
        {
            try
            {
                foreach (Process p in Process.GetProcessesByName(name))
                {
                    try { p.Kill(); } catch { }
                    p.Dispose();
                }
            }
            catch { }
        }

        /// <summary>Libera a porta de um worker anterior que ficou orfao.</summary>
        public static void KillPortListeners(int port)
        {
            try
            {
                var psi = new ProcessStartInfo("netstat.exe", "-ano -p TCP");
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                psi.RedirectStandardOutput = true;
                string output;
                using (Process p = Process.Start(psi))
                {
                    output = p.StandardOutput.ReadToEnd();
                    p.WaitForExit(10000);
                }
                KillListenersInNetstat(output, port);
            }
            catch (Exception ex) { TrayLog.Write("erro KillPortListeners: " + ex.Message); }
        }

        static void KillListenersInNetstat(string output, int port)
        {
            string suffix = ":" + port;
            foreach (string raw in output.Split('\n'))
            {
                string[] parts = raw.Trim().Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length < 5 || parts[3] != "LISTENING" || !parts[1].EndsWith(suffix)) continue;
                int pid;
                if (!int.TryParse(parts[4], out pid) || pid <= 0) continue;
                TrayLog.Write("Encerrando PID " + pid + " na porta " + port);
                try { KillPid(pid); } catch { }
            }
        }
    }
}
