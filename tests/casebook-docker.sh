#!/usr/bin/env bash
# Test du Casebook côté Docker : preuves, suppression, conclusion, rapport (sans Docker, dans un HOME temporaire).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; export HOME; HOME=$(mktemp -d); export BASHLAB_HOME="$ROOT"; D="bash $ROOT/engine/defi"; bad=0
ok(){ if [ "$1" = 0 ]; then echo "OK $2"; else echo "KO $2"; bad=$((bad+1)); fi; }
$D start 01 >/dev/null; cd "$HOME"/atelier/01-* || exit 1
$D preuve 'echo alpha' >/dev/null; $D preuve 'echo beta' >/dev/null; $D preuve 'echo gamma' >/dev/null
[ "$($D preuves | grep -c 'echo ')" = 3 ]; ok $? "3 preuves enregistrées"
$D preuve-suppr 2 >/dev/null; $D preuves | grep -q 'echo beta'; [ $? -ne 0 ]; ok $? "la preuve 2 est supprimée"
[ "$($D preuves | grep -c 'echo ')" = 2 ] && $D preuves | grep -q '02 .*echo gamma'; ok $? "les preuves sont renumérotées"
$D conclusion "Analyse de test." >/dev/null; $D rapport >/dev/null; R="$HOME/rapport-01.md"
[ -s "$R" ]; ok $? "le rapport est écrit"
grep -q "Analyse de test." "$R"; ok $? "le rapport contient la conclusion"
H=$(printf '%s' alpha | sha256sum | cut -d' ' -f1); grep -q "$H" "$R"; ok $? "le rapport contient l'empreinte SHA-256 de la sortie"
for i in $(seq 1 25); do $D preuve "echo $i" >/dev/null 2>&1; done; [ "$($D preuves | grep -c 'echo ')" = 20 ]; ok $? "limite de 20 preuves respectée"
cd "$HOME"; $D start 01 >/dev/null; [ "$($D preuves | grep -c 'echo ')" = 0 ]; ok $? "defi start repart d'un dossier vide"
$D conclusion >/dev/null 2>&1; [ $? -ne 0 ]; ok $? "conclusion sans texte refusée"
[ "$bad" = 0 ] && echo "Casebook Docker : OK" || { echo "ECHEC ($bad)"; exit 1; }
