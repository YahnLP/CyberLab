#!/usr/bin/env bash
set -e
NSYN=$(grep -c 'SYN-RECV' ss.txt)
T=$(grep SYN-RECV ss.txt | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -1)
N=$(echo $T | awk '{print $1}'); IP=$(echo $T | awk '{print $2}')
if [ $((N*100/NSYN)) -ge 50 ]; then O=$IP; else O=distribuee; fi
S=non; grep -q 'tcp_syncookies = 1' sysctl.txt && S=oui
B=$(awk -F';' 'NR>1{print $3/$2, $1}' amplification.csv | sort -rn | head -1); F=${B%% *}; P=${B##* }
EM=$(grep -o '[0-9]* Mbit' emission.txt | awk '{print $1}')
prev=""; max=0
while read -r d h rest; do case "$rest" in "sauvegarde OK"*) e=$(date -u -d "$d $h" +%s); [ -n "$prev" ] && { g=$(( (e-prev)/3600 )); [ $g -gt $max ] && max=$g; }; prev=$e;; esac; done < sauvegardes.log
CIB=$(grep -o '[0-9]* heures' objectif.txt | awk '{print $1}'); C=non; [ $max -le $CIB ] && C=oui
R=$(grep 'restauration-test OK' sauvegardes.log | tail -1 | awk '{print $1}'); [ -n "$R" ] || R=jamais
sed -i "s/^syn_recv=.*/syn_recv=$NSYN/;s/^origine_flood=.*/origine_flood=$O/;s/^syncookies_actifs=.*/syncookies_actifs=$S/;s/^plus_amplifiant=.*/plus_amplifiant=$P/;s/^bande_recue_mbps=.*/bande_recue_mbps=$((EM*F))/;s/^rpo_reel_heures=.*/rpo_reel_heures=$max/;s/^rpo_conforme=.*/rpo_conforme=$C/;s/^derniere_restauration=.*/derniere_restauration=$R/" reponses.txt
