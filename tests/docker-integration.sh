#!/usr/bin/env bash
# Test d'intégration : construit l'image, lance le conteneur en mode tty et rejoue chaque corrigé
# à l'intérieur (utilisateur « stagiaire », image réelle). Nécessite Docker et l'accès au registre.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; IMG="${IMG:-cyberlab-test}"; rc=0
docker build -t "$IMG" "$ROOT" >/dev/null || { echo "KO build de l'image"; exit 1; }
echo "OK build"
# 1. le serveur web ttyd répond
cid=$(docker run -d -p 127.0.0.1:7681:7681 "$IMG") || { echo "KO démarrage"; exit 1; }
ok=0; for i in $(seq 1 20); do curl -fsS -o /dev/null http://127.0.0.1:7681/ && { ok=1; break; }; sleep 1; done
docker rm -f "$cid" >/dev/null
[ $ok = 1 ] && echo "OK ttyd répond sur 7681" || { echo "KO ttyd ne répond pas"; rc=1; }
# 2. chaque corrigé est rejoué dans l'image
for sol in "$ROOT"/formateur/solutions/*.sh; do
  name=$(basename "$sol" .sh); id=${name%%-*}
  out=$(docker run --rm -e MODE=tty -v "$sol":/tmp/sol.sh:ro --entrypoint bash "$IMG" -c '
    export BASHLAB_HOME=/opt/bashlab; defi start '"$id"' >/dev/null || exit 2
    cd "$HOME/atelier/'"$name"'" || exit 3
    defi valider >/dev/null 2>&1 && exit 4
    bash /tmp/sol.sh >/dev/null 2>&1 || exit 5
    defi valider >/dev/null 2>&1 || exit 6' 2>&1); c=$?
  if [ $c = 0 ]; then echo "OK $id : $name"; else echo "KO $id : $name (code $c : 2 start, 3 atelier, 4 validé sans travail, 5 corrigé en échec, 6 corrigé refusé)"; rc=1; fi
done
exit $rc
