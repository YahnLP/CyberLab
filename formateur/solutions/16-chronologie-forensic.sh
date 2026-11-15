#!/usr/bin/env bash
set -e
E=$(grep 'uploads/.*\.php' timeline.csv | cut -d';' -f1)
H=$(date -u -d @$E +%H:%M:%S)
P=$(grep '/etc/cron.d/' timeline.csv | cut -d';' -f2)
N=$(awk -F';' -v t=$E '$1>t' timeline.csv | wc -l)
grep -F -f <(cut -c1-64 ioc.txt) hashes.txt | sed 's/^[^ ]*  //' > fichiers-ioc.txt
[ -s fichiers-ioc.txt ] || echo aucun > fichiers-ioc.txt
sed -i "s/^heure_debut_utc=.*/heure_debut_utc=$H/;s#^fichier_persistance=.*#fichier_persistance=$P#;s/^nb_evenements_apres=.*/nb_evenements_apres=$N/" reponses.txt
