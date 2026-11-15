#!/usr/bin/env bash
# Vérifie la structure des leçons : sections obligatoires, exercices corrigés, liens, adresses fictives, pas d'emoji.
cd "$(dirname "$0")/../cours" || exit 1
fail=0
for f in [0-9]*.md P*.md SO*.md SIM*.md; do
  [ -f "$f" ] || continue
  grep -q '^## Objectifs' "$f" || { echo "KO $f : section Objectifs manquante"; fail=1; }
  grep -qE '^## [0-9]+\. Exercices' "$f" || { echo "KO $f : section Exercices manquante"; fail=1; }
  grep -q '<details>' "$f" || { echo "KO $f : exercices sans réponse repliable"; fail=1; }
  grep -q '^Durée' "$f" || { echo "KO $f : ligne Durée manquante"; fail=1; }
  # adresses IPv4 : seulement plages fictives ou privées
  grep -oE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' "$f" | grep -vE '^(192\.168\.|10\.|127\.|203\.0\.113\.|198\.51\.100\.|255\.|0\.)' | grep -v '^$' | while read -r ip; do echo "KO $f : adresse non fictive $ip"; done | grep . && fail=1
  grep -qP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' "$f" 2>/dev/null && { echo "KO $f : emoji"; fail=1; }
done
# liens du README
grep -oE '\]\(([^)]+\.md)\)' README.md | sed 's/](\(.*\))/\1/' | while read -r l; do [ -f "$l" ] || { echo "KO lien mort : $l"; exit 1; }; done || fail=1
n=$(ls [0-9]*.md P*.md SO*.md SIM*.md 2>/dev/null | wc -l)
[ "$n" -eq 30 ] || { echo "KO : $n leçons au lieu de 30"; fail=1; }
[ $fail = 0 ] && echo "OK : $n leçons conformes"
exit $fail
