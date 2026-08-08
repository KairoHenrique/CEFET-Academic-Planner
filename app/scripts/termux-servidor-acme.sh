#!/data/data/com.termux/files/usr/bin/bash
# ServidorACME via Termux - Script de Inicialização
# Este script sobe o worker local (npm run worker:home),
# abre o túnel cloudflared, captura a URL e atualiza o secret SIGAA_WORKER_URL no Cloudflare.

echo "Iniciando ServidorACME no Termux..."

# Limpa instâncias antigas para garantir que o código novo rode limpo
echo "[*] Encerrando processos antigos do worker e cloudflared..."
pkill -f "npm run worker:home" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true
pkill -f "cloudflared" 2>/dev/null || true

# Resolve o diretório do app baseado na localização do script
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
cd "$DIR" || exit 1

# Auto-instalação de dependências do Termux
if command -v pkg &> /dev/null; then
    echo "[*] Verificando dependências do sistema..."
    
    MISSING_PKGS=""
    if ! command -v git &> /dev/null; then MISSING_PKGS="$MISSING_PKGS git"; fi
    if ! command -v node &> /dev/null; then MISSING_PKGS="$MISSING_PKGS nodejs"; fi
    if ! command -v python &> /dev/null; then MISSING_PKGS="$MISSING_PKGS python"; fi
    if ! command -v make &> /dev/null; then MISSING_PKGS="$MISSING_PKGS make"; fi
    if ! command -v clang &> /dev/null; then MISSING_PKGS="$MISSING_PKGS clang"; fi
    if ! command -v cloudflared &> /dev/null; then MISSING_PKGS="$MISSING_PKGS cloudflared"; fi
    
    if [ ! -z "$MISSING_PKGS" ]; then
        echo "[!] Instalando pacotes básicos faltantes:$MISSING_PKGS"
        pkg install -y $MISSING_PKGS
    fi
    
    if ! command -v chromium-browser &> /dev/null; then
        echo "[!] Instalando Chromium (isso pode demorar alguns minutos)..."
        pkg install -y x11-repo
        pkg install -y chromium
    fi
else
    echo "[-] Aviso: gerenciador 'pkg' não encontrado. Instale as dependências manualmente."
fi

# Auto-update: Busca o código mais recente no repositório
echo "[*] Buscando atualizações no GitHub..."
if command -v git &> /dev/null; then
    git pull origin main || echo "[-] Falha ao puxar código. Continuando com a versão local."
fi

# Instala as dependências, se houver pacotes novos
echo "[*] Verificando/instalando dependências do projeto (npm)..."
if command -v npm &> /dev/null; then
    # Ignora scripts para não dar crash no workerd (que não roda no Android)
    npm install --no-fund --no-audit --ignore-scripts
    # Reconstrói apenas o better-sqlite3 manualmente
    if [ -d "node_modules/better-sqlite3" ]; then
        if [ ! -f "node_modules/.better-sqlite3-termux-compiled" ]; then
            echo "[*] Recompilando better-sqlite3 nativo do Termux (from source)..."
            export GYP_DEFINES="android_ndk_path=''"
            export npm_config_build_from_source=true
            npm rebuild better-sqlite3 --build-from-source && touch "node_modules/.better-sqlite3-termux-compiled"
        else
            echo "[*] better-sqlite3 já foi compilado, pulando etapa."
        fi
    fi
fi

# 1. Inicia o worker em background
echo "[*] Iniciando worker:home..."
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export SIGAA_BROWSER_CHANNEL=""
export SIGAA_BROWSER_EXECUTABLE_PATH="/data/data/com.termux/files/usr/bin/chromium-browser"
npm run worker:home > termux-worker.log 2>&1 &
WORKER_PID=$!
echo "Worker PID: $WORKER_PID"

# 2. Inicia o tunnel
echo "[*] Iniciando cloudflared tunnel..."
> termux-cloudflared.log
cloudflared tunnel --url http://127.0.0.1:8787 > termux-cloudflared.log 2>&1 &
TUNNEL_PID=$!
echo "Tunnel PID: $TUNNEL_PID"

echo "[*] Aguardando URL do trycloudflare.com..."

URL=""
while true; do
    # Verifica se o processo worker caiu
    if ! kill -0 $WORKER_PID 2>/dev/null; then
        echo "[-] Erro: Worker parou inesperadamente. Verifique termux-worker.log"
        kill $TUNNEL_PID 2>/dev/null
        exit 1
    fi
    
    # Verifica se o tunnel caiu
    if ! kill -0 $TUNNEL_PID 2>/dev/null; then
        echo "[-] Erro: Cloudflared parou inesperadamente. Verifique termux-cloudflared.log"
        kill $WORKER_PID 2>/dev/null
        exit 1
    fi

    # Procura a URL
    if [ -f termux-cloudflared.log ]; then
        URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' termux-cloudflared.log | head -n 1)
        if [ ! -z "$URL" ]; then
            break
        fi
    fi
    sleep 1
done

echo "[+] Tunnel URL detectada: $URL"

# 3. Atualiza o secret
echo "[*] Atualizando SIGAA_WORKER_URL no Cloudflare via wrangler..."

# Hack Termux: O Wrangler no Node importa o workerd, que trava ao ler process.platform === 'android'.
# Como 'secret put' não usa o binário do workerd, nós podemos silenciar o erro injetando variáveis dummy usando Node.
if [ -f "node_modules/workerd/lib/main.js" ]; then
node << 'EOF'
const fs = require('fs');
const file = 'node_modules/workerd/lib/main.js';
let code = fs.readFileSync(file, 'utf8');
code = code.replace('let pkg;', 'let pkg = "dummy";');
code = code.replace('let subpath;', 'let subpath = "dummy";');
code = code.replace(/throw new Error/g, 'console.warn');
code = code.replace(/throw e;/g, 'return { binPath: __filename };');
fs.writeFileSync(file, code);
EOF
fi

echo "$URL" | npx wrangler secret put SIGAA_WORKER_URL

if [ $? -eq 0 ]; then
    echo "[+] Servidor no ar! Tunel conectado e URL atualizada."
else
    echo "[-] Aviso: Tunel no ar, mas falhou ao atualizar o secret no Cloudflare."
fi

# 4. Inicia cron loop local (background)
echo "[*] Iniciando loop de cron local em background..."
# O CRON_SECRET é lido do app/.env.local (ou você pode setá-lo no Termux)
# Vamos extraí-lo do .env.local para fazer as chamadas locais autenticadas
CRON_SECRET=$(grep -oE '^CRON_SECRET=.*' .env.local 2>/dev/null | cut -d '=' -f 2- | tr -d '"' | tr -d "'" || echo "")

if [ -z "$CRON_SECRET" ]; then
    echo "[-] Aviso: CRON_SECRET não encontrado em .env.local. Crons locais vão falhar por falta de autorização."
fi

# Função loop do cron
run_crons() {
    echo "[cron] Loop de crons iniciado (PID $$)"
    while true; do
        # Aguarda 5 minutos
        sleep 300
        
        echo "[cron] Disparando /api/cron/notification-reminders..."
        curl -s -X POST "https://acme-hub.khfm.workers.dev/api/cron/notification-reminders" \
             -H "Authorization: Bearer $CRON_SECRET" \
             -H "Content-Type: application/json" -o /dev/null
             
        # Para evitar enfileirar tudo junto, aguarda mais 10 minutos (total 15 min do ciclo anterior) para o orchestrator
        # Obs: como é um loop simples, vamos disparar o orchestrator a cada 3x que o de notificação rodar
        # ou apenas criar dois loops
    done
}

# Criamos um subshell pra cada cron pra ficar mais fácil
(
    while true; do
        sleep 300 # 5 min
        echo "[cron] $(date '+%H:%M:%S') Disparando notification-reminders..."
        curl -s -X POST "https://acme-hub.khfm.workers.dev/api/cron/notification-reminders" \
             -H "Authorization: Bearer $CRON_SECRET" \
             -H "Content-Type: application/json" -o /dev/null &
    done
) &
CRON_NOTIF_PID=$!

(
    while true; do
        sleep 900 # 15 min
        echo "[cron] $(date '+%H:%M:%S') Disparando sync-orchestrator..."
        curl -s -X POST "https://acme-hub.khfm.workers.dev/api/cron/sync-orchestrator" \
             -H "Authorization: Bearer $CRON_SECRET" \
             -H "Content-Type: application/json" -o /dev/null &
    done
) &
CRON_SYNC_PID=$!

echo "[+] Crons locais ativos: Reminders(5m) e SyncOrchestrator(15m)."

# Função de limpeza
cleanup() {
    echo ""
    echo "[*] Parando servidores..."
    kill $TUNNEL_PID 2>/dev/null
    kill $WORKER_PID 2>/dev/null
    kill $CRON_NOTIF_PID 2>/dev/null
    kill $CRON_SYNC_PID 2>/dev/null
    echo "[+] Tudo pronto! O servidor está rodando e conectado à nuvem."
}

trap cleanup SIGINT SIGTERM

echo "--------------------------------------------------------"
echo " Pressione uma tecla para executar um comando:"
echo " [r] - Verificar GitHub (Atualizar e Reiniciar)"
echo " [c] - Ver consumo de CPU/RAM (Para testar limites dos robôs)"
echo " [q] - Sair e desligar o servidor"
echo "--------------------------------------------------------"

while true; do
    if read -t 300 -n 1 -s key; then
        case $key in
            r|R)
                echo -e "\n[*] Buscando atualizações no GitHub..."
                git fetch
                LOCAL=$(git rev-parse HEAD)
                REMOTE=$(git rev-parse @{u})
                
                if [ "$LOCAL" = "$REMOTE" ]; then
                    echo "[+] Você já está na versão mais recente!"
                else
                    echo "[!] Atualização encontrada! Reiniciando o servidor para aplicar..."
                    git pull origin main
                    pkill -P $$ 2>/dev/null
                    kill $WORKER_PID 2>/dev/null
                    kill $TUNNEL_PID 2>/dev/null
                    exec "$0" # Roda o script do zero
                fi
                echo "Pressione [r], [c] ou [q]"
                ;;
            c|C)
                echo -e "\n--- MONITOR DE RECURSOS ---"
                echo "Memória do Sistema:"
                free -h 2>/dev/null || echo "(Comando free indisponível)"
                echo "Processos mais pesados:"
                top -n 1 -b 2>/dev/null | head -n 15 || echo "(Comando top indisponível)"
                echo "---------------------------"
                echo "Pressione [r], [c] ou [q]"
                ;;
            q|Q)
                echo -e "\n[*] Desligando servidor e túnel..."
                kill $WORKER_PID 2>/dev/null
                kill $TUNNEL_PID 2>/dev/null
                pkill -P $$ 2>/dev/null
                exit 0
                ;;
        esac
    else
        # Tempo esgotado (5 minutos) - Checagem automática silenciosa
        git fetch >/dev/null 2>&1
        LOCAL=$(git rev-parse HEAD)
        REMOTE=$(git rev-parse @{u})
        
        if [ "$LOCAL" != "$REMOTE" ]; then
            echo -e "\n[!] Atualização automática encontrada no GitHub!"
            
            # Verifica se há algum robô do SIGAA (chromium) rodando
            while pgrep -f "chromium" > /dev/null; do
                echo "[!] Alguém está sincronizando agora (robô ativo). Aguardando 15 segundos..."
                sleep 15
            done
            
            echo "[*] Caminho livre! Nenhum robô rodando. Aplicando atualização e reiniciando..."
            git pull origin main
            pkill -P $$ 2>/dev/null
            kill $WORKER_PID 2>/dev/null
            kill $TUNNEL_PID 2>/dev/null
            exec "$0" # Roda o script do zero
        fi
    fi
done
