#!/data/data/com.termux/files/usr/bin/bash

# Resolve o diretório do app baseado na localização do script
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
cd "$DIR" || exit 1

echo "================================================="
echo "   Watchdog Automático de Atualização (ACME)     "
echo "================================================="
echo "A cada 5 minutos ele buscará novas atualizações no Git."
echo "Pressione Ctrl+C para encerrar."
echo ""

start_server() {
    echo "[*] Iniciando o servidor ACME..."
    # Garante que não há processos antigos zumbis rodando
    pkill -f "node scripts/start-home-worker.mjs" || true
    pkill -f "cloudflared tunnel" || true
    pkill -f "tsx" || true
    
    # Inicia o script principal em background
    ./scripts/termux-servidor-acme.sh &
    SERVER_PID=$!
}

# Inicia a primeira vez
start_server

# Loop de checagem
while true; do
    # Aguarda 5 minutos (300 segundos)
    sleep 300

    echo "[*] Buscando por atualizações no GitHub..."
    git fetch origin main >/dev/null 2>&1

    # Compara a hash do commit local com o remote
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)

    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "[!] Nova versão encontrada! (Local: ${LOCAL:0:7} | Remote: ${REMOTE:0:7})"
        echo "[*] Parando o servidor atual..."
        
        # Envia sinal de SIGTERM para o script servidor parar graciosamente
        kill $SERVER_PID 2>/dev/null
        sleep 2
        
        # Garantia dupla de matar processos pendentes
        pkill -f "node scripts/start-home-worker.mjs" || true
        pkill -f "cloudflared tunnel" || true
        pkill -f "tsx" || true

        echo "[*] Baixando a nova versão..."
        git pull origin main

        echo "[*] Servidor será reiniciado com a nova versão."
        echo ""
        start_server
    else
        echo "[*] Sistema já está atualizado. Próxima checagem em 5 minutos."
    fi
done
