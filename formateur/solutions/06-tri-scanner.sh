#!/usr/bin/env bash
set -e
: > vrais-positifs.txt; : > faux-positifs.txt; best=""; bs=0
while IFS=';' read -r cve pk fx; do [ "$cve" = cve ] && continue
  inst=$(awk -v p="$pk" '$1=="ii" && $2==p {print $3}' paquets-installes.txt)
  if [ -n "$inst" ] && dpkg --compare-versions "$inst" lt "$fx"; then echo "$cve" >> vrais-positifs.txt
    sc=$(grep "$cve" scanner.txt | sed 's/.*cvss=\([0-9.]*\).*/\1/'); if awk "BEGIN{exit !($sc>$bs)}"; then bs=$sc; best=$cve; fi
  else echo "$cve" >> faux-positifs.txt; fi
done < avis-securite.csv
sed -i "s/^le_plus_grave=.*/le_plus_grave=$best/" reponses.txt
