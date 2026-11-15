#!/usr/bin/env bash
set -e
A="awk -F; NR>1&&\$2==1"
awk -F';' 'NR>1 && $2==1 && $4!=""{print $1}' annuaire.csv > comptes-kerberoastables.txt
awk -F';' 'NR>1 && $2==1 && $5 ~ /DONT_REQ_PREAUTH/{print $1}' annuaire.csv > comptes-sans-preauth.txt
awk -F';' 'NR>1 && $2==1 && $3=="Domain Admins" && $6>90{print $1}' annuaire.csv > admins-inactifs.txt
awk -F';' 'NR>1 && $2==1 && $3=="Domain Admins" && $5 ~ /DONT_EXPIRE_PASSWORD/{print $1}' annuaire.csv > admins-sans-expiration.txt
for f in comptes-kerberoastables comptes-sans-preauth admins-inactifs admins-sans-expiration; do [ -s $f.txt ] || echo aucun > $f.txt; done
sed -i "s/^nb_comptes_actifs=.*/nb_comptes_actifs=$(awk -F';' 'NR>1&&$2==1' annuaire.csv | wc -l)/;s/^correction_services=.*/correction_services=gmsa/" reponses.txt
