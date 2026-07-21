#!/data/data/com.termux/files/usr/bin/bash
# ServidorACME via Termux - Script de Inicialização
# Este script sobe o worker local (npm run worker:home),
# abre o túnel cloudflared, captura a URL e atualiza o secret SIGAA_WORKER_URL no Cloudflare.

echo "Iniciando ServidorACME no Termux..."

# Resolve o diretório do app baseado na localização do script
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
cd "$DIR" || exit 1

# Auto-update: Busca o código mais recente no repositório
echo "[*] Buscando atualizações no GitHub..."
if command -v git &> /dev/null; then
    git pull origin main || echo "[-] Falha ao puxar código. Continuando com a versão local."
else
    echo "[-] Git não instalado. Pulando atualização automática."
fi

# Instala as dependências, se houver pacotes novos
echo "[*] Verificando/instalando dependências..."
if command -v npm &> /dev/null; then
    # Ignora scripts para não dar crash no workerd (que não roda no Android)
    npm install --no-fund --no-audit --ignore-scripts
    # Reconstrói apenas o better-sqlite3 manualmente
    export GYP_DEFINES="android_ndk_path=''"
    npm rebuild better-sqlite3
fi


# Verifica dependências
if ! command -v node &> /dev/null; then
    echo "Erro: nodejs não está instalado. Rode: pkg install nodejs"
    exit 1
fi

if ! command -v cloudflared &> /dev/null; then
    echo "Erro: cloudflared não está instalado. Rode: pkg install cloudflared"
    exit 1
fi

if ! command -v chromium-browser &> /dev/null; then
    echo "Erro: Chromium não está instalado."
    echo "Para rodar o Playwright no Termux, rode:"
    echo "pkg install x11-repo && pkg install chromium"
    exit 1
fi

# 1. Inicia o worker em background
echo "[*] Iniciando worker:home..."
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
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
