#!/bin/bash
# Les Roches — Aperçu local
# Double-cliquez sur ce fichier dans le Finder pour démarrer

cd "$(dirname "$0")"
PORT=4000

echo "╔══════════════════════════════════════════╗"
echo "║   Les Roches — Aperçu local démarré     ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Ouverture sur : http://localhost:4000   ║"
echo "║  Ctrl+C pour arrêter                     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Open browser automatically
sleep 1 && open "http://localhost:${PORT}/" &

python3 -m http.server $PORT
