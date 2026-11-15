#!/usr/bin/env bash
set -e
M=""; for p in "1. P:perimetre" "2. E:exclusions" "3. F:dates" "4. T:techniques" "5. C:contacts" "6. C:confidentialite" "7. S:signature"; do n=${p%%.*}; k=${p##*:}; grep -q "^$n\." mandat.txt || M+="$k,"; done
M=${M%,}; [ -n "$M" ] || M=aucune
EX=$(grep '^2\.' mandat.txt | grep -oE '198\.51\.100\.[0-9]+' | tr '\n' ' ')
D1=$(grep '^3\.' mandat.txt | sed 's/.*du \([0-9]*\) au \([0-9]*\) novembre.*/\1/'); D2=$(grep '^3\.' mandat.txt | sed 's/.*du \([0-9]*\) au \([0-9]*\) novembre.*/\2/')
: > autorisees.txt
while IFS=';' read -r id d h cible tech; do [ "$id" = id ] && continue
  ok=1; case "$cible" in 198.51.100.*) ;; *) ok=0;; esac; for e in $EX; do [ "$cible" = "$e" ] && ok=0; done
  case "$tech" in scan-ports|scan-versions|test-authentification) ;; *) ok=0;; esac
  day=${d##*-}; day=$((10#$day)); hh=$((10#${h%%:*}))
  if [ $hh -ge 20 ]; then nuit=$day; else nuit=$((day-1)); fi
  { [ $hh -ge 20 ] || [ $hh -lt 6 ]; } || ok=0; [ $nuit -ge $D1 ] && [ $nuit -le $D2 ] || ok=0
  [ $ok = 1 ] && echo "$id" >> autorisees.txt
done < actions.csv
sed -i "s/^clauses_manquantes=.*/clauses_manquantes=$M/;s/^etape_k1=.*/etape_k1=reconnaissance/;s/^etape_k2=.*/etape_k2=livraison/;s/^etape_k3=.*/etape_k3=exploitation/;s/^etape_k4=.*/etape_k4=installation/;s/^etape_k5=.*/etape_k5=commande/" reponses.txt
