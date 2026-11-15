#!/usr/bin/env bash
# Joue chaque corrigé formateur contre son défi dans un HOME jetable. Usage : tests/run-solution.sh [NN ...]
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; export BASHLAB_HOME="$ROOT"
D="$ROOT/engine/defi"; ids=("$@"); rc=0
[ ${#ids[@]} -eq 0 ] && for f in "$ROOT"/formateur/solutions/*.sh; do ids+=("$(basename "$f" | cut -d- -f1)"); done
for id in "${ids[@]}"; do
  export HOME; HOME="$(mktemp -d)"
  sol=$(ls "$ROOT"/formateur/solutions/"$id"-*.sh) || { echo "pas de corrigé pour $id"; rc=1; continue; }
  name=$(basename "$sol" .sh)
  $D start "$id" >/dev/null || { echo "KO $id : start"; rc=1; continue; }
  cd "$HOME/atelier/$name" || { echo "KO $id : atelier"; rc=1; continue; }
  if $D valider >/dev/null 2>&1; then echo "KO $id : validé sans rien faire"; rc=1; continue; fi
  bash "$sol" >/dev/null 2>&1 || { echo "KO $id : le corrigé échoue"; rc=1; continue; }
  if $D valider >/tmp/out.$$ 2>&1; then echo "OK $id : $name"; else echo "KO $id : corrigé refusé"; sed 's/\x1b\[[0-9;]*m//g' /tmp/out.$$ | grep -E '✘'; rc=1; fi
done
exit $rc
