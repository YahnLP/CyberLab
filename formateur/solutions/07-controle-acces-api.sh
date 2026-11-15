#!/usr/bin/env bash
set -e
awk -F';' 'NR>1{print $1" "$2}' proprietes.csv > /tmp/own.$$
awk 'NR==FNR{o[$1]=$2; next} $5 ~ /^\/api\/v1\/commandes\// && $6==200 && $3!="-" {n=split($5,a,"/"); id=a[n]; if(id in o && o[id]!=$3) print $1}' /tmp/own.$$ requetes.log > acces-non-autorises.txt
awk '$6==500 && ($0 ~ /Exception/ || $0 ~ /SQL/){print $1}' requetes.log > reponses-bavardes.txt
[ -s reponses-bavardes.txt ] || echo aucun > reponses-bavardes.txt
LIM=non; grep -q ' 429 ' requetes.log && LIM=oui
P=$(cut -d. -f2 jeton.txt | tr '_-' '/+'); while [ $(( ${#P} % 4 )) -ne 0 ]; do P="$P="; done
J=$(printf '%s' "$P" | base64 -d)
SUB=$(echo "$J" | grep -o '"sub":"[^"]*"' | cut -d'"' -f4); ROLE=$(echo "$J" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
sed -i "s/^limitation_en_place=.*/limitation_en_place=$LIM/;s/^utilisateur_du_jeton=.*/utilisateur_du_jeton=$SUB/;s/^role_du_jeton=.*/role_du_jeton=$ROLE/" reponses.txt
