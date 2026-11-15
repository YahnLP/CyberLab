#!/usr/bin/env bash
set -e
GW=$(awk '{print $4}' passerelle.txt); LEG=$(awk '{print $NF}' passerelle.txt)
SRV=$(grep 'FTP: USER' capture.txt | awk '{print $5}' | sed 's/\.[0-9]*:$//'); SRV=$(grep 'FTP: USER' capture.txt | awk '{print $5}' | sed 's/\.[0-9]*:$//')
FU=$(grep 'FTP: USER' capture.txt | awk '{print $NF}'); FP=$(grep 'FTP: PASS' capture.txt | awk '{print $NF}')
B=$(grep -o 'Basic [A-Za-z0-9+/=]*' capture.txt | awk '{print $2}' | base64 -d); HU=${B%%:*}; HP=${B#*:}
EVIL=$(grep "Reply $GW is-at" capture.txt | awk '{print $6}' | tr -d ',' | grep -vi "$LEG" | sort -u | head -1)
N=$(grep "Reply $GW is-at $EVIL" capture.txt | wc -l)
sed -i "s/^serveur_ftp=.*/serveur_ftp=$SRV/;s/^ftp_utilisateur=.*/ftp_utilisateur=$FU/;s/^ftp_mot_de_passe=.*/ftp_mot_de_passe=$FP/;s/^http_utilisateur=.*/http_utilisateur=$HU/;s/^http_mot_de_passe=.*/http_mot_de_passe=$HP/;s/^mac_usurpateur=.*/mac_usurpateur=$EVIL/;s/^nb_reponses_usurpees=.*/nb_reponses_usurpees=$N/" reponses.txt
