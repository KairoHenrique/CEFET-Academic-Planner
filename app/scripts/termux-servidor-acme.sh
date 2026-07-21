#!/data/data/com.termux/files/usr/bin/bash
# ServidorACME via Termux - Script de Inicialização
# Este script sobe o worker local (npm run worker:home),
# abre o túnel cloudflared, captura a URL e atualiza o secret SIGAA_WORKER_URL no Cloudflare.

echo "Iniciando ServidorACME no Termux..."

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

# Função de limpeza
cleanup() {
    echo ""
    echo "[*] Parando servidores..."
    kill $TUNNEL_PID 2>/dev/null
    kill $WORKER_PID 2>/dev/null
    echo "[+] Servidor parado."
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "Pressione Ctrl+C para parar o servidor."

# Espera os processos
wait $WORKER_PID $TUNNEL_PID
