#!/usr/bin/env bash
# Test de non-régression : joue le corrigé formateur contre le défi 01 dans un HOME jetable.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; export BASHLAB_HOME="$ROOT" HOME="$(mktemp -d)"
D="$ROOT/engine/defi"
$D start 01 >/dev/null || exit 1
cd "$HOME/atelier/01-incident-ssh" || exit 1
echo "--- avant corrigé (doit échouer) :"; $D valider >/dev/null && { echo "ANOMALIE : validé sans rien faire"; exit 1; } || echo "échec attendu OK"
bash "$ROOT/formateur/solutions/01-incident-ssh.sh" || exit 1
echo "--- après corrigé :"; $D valider
