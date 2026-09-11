#!/data/data/com.termux/files/usr/bin/bash
# Legado: não faz mais poll de git.
# Use o ServidorACME Termux (fica aberto infinito; [r] atualiza git só quando você pedir).

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
cd "$DIR" || exit 1

echo "[*] Auto-update a cada 5 min foi desligado."
echo "    Rode: bash scripts/termux-servidor-acme.sh"
echo "    Dentro dele: [r] = git update · [q] = sair"
exec bash scripts/termux-servidor-acme.sh
