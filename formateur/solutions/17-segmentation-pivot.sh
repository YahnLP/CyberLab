#!/usr/bin/env bash
set -e
grep '^R' regles.txt | awk '{print $3, $5}' > /tmp/paires.$$
declare -A D; D[dmz]=0; LV=0; CH=1
while [ $CH = 1 ]; do CH=0
  for z in "${!D[@]}"; do [ ${D[$z]} = $LV ] || continue
    while read -r s d; do [ "$s" = "$z" ] && [ -z "${D[$d]+x}" ] && { D[$d]=$((LV+1)); CH=1; }; done < /tmp/paires.$$
  done; LV=$((LV+1)); done
for z in "${!D[@]}"; do [ $z != dmz ] && echo $z; done > zones-atteignables.txt
grep '^R' regles.txt | grep -E ' any( |$)' | awk '{print $1}' > regles-larges.txt; [ -s regles-larges.txt ] || echo aucun > regles-larges.txt
sed -i "s/^sauts_vers_db=.*/sauts_vers_db=${D[db]}/" reponses.txt; rm -f /tmp/paires.$$
