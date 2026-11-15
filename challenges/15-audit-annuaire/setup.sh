. "$LAB_LIB"
NOMS=($(shuf -e amartin bdupont cleroy dgarcia efournier fmoreau gbernard hroux ilambert jmercier kpetit lsimon mrobert nrichard))
N=${#NOMS[@]}
declare -A GRP SPN FLG DAY ACT
for n in "${NOMS[@]}"; do GRP[$n]="Utilisateurs"; SPN[$n]=""; FLG[$n]="NORMAL_ACCOUNT"; DAY[$n]=$((RANDOM%60+1)); ACT[$n]=1; done
# comptes de service : 2 actifs avec SPN, 1 désactivé avec SPN
SPN[${NOMS[0]}]="MSSQLSvc/srv-bdd.lab.local:1433"; SPN[${NOMS[1]}]="HTTP/srv-web.lab.local"; SPN[${NOMS[2]}]="CIFS/srv-fichiers.lab.local"; ACT[${NOMS[2]}]=0
# sans pré-authentification : 1 à 2
FLG[${NOMS[3]}]="NORMAL_ACCOUNT|DONT_REQ_PREAUTH"; [ $((RANDOM%2)) = 0 ] && FLG[${NOMS[4]}]="NORMAL_ACCOUNT|DONT_REQ_PREAUTH"
# administrateurs : un inactif actif, un inactif désactivé, un actif sans expiration, un sain
GRP[${NOMS[5]}]="Domain Admins"; DAY[${NOMS[5]}]=$((RANDOM%200+100))
GRP[${NOMS[6]}]="Domain Admins"; DAY[${NOMS[6]}]=$((RANDOM%200+100)); ACT[${NOMS[6]}]=0
GRP[${NOMS[7]}]="Domain Admins"; FLG[${NOMS[7]}]="NORMAL_ACCOUNT|DONT_EXPIRE_PASSWORD"; DAY[${NOMS[7]}]=$((RANDOM%20+1))
GRP[${NOMS[8]}]="Domain Admins"; DAY[${NOMS[8]}]=$((RANDOM%20+1))
echo "sam;actif;groupes;spn;uac;derniere_connexion_jours" > "$WORK/annuaire.csv"
KERB=""; PRE=""; ADM=""; NEV=""; NA=0
for n in "${NOMS[@]}"; do
  echo "$n;${ACT[$n]};${GRP[$n]};${SPN[$n]};${FLG[$n]};${DAY[$n]}" >> "$WORK/annuaire.csv"
  [ ${ACT[$n]} = 1 ] && NA=$((NA+1))
  [ ${ACT[$n]} = 1 ] && [ -n "${SPN[$n]}" ] && KERB+="$n"$'\n'
  [ ${ACT[$n]} = 1 ] && [[ "${FLG[$n]}" == *DONT_REQ_PREAUTH* ]] && PRE+="$n"$'\n'
  [ ${ACT[$n]} = 1 ] && [ "${GRP[$n]}" = "Domain Admins" ] && [ ${DAY[$n]} -gt 90 ] && ADM+="$n"$'\n'
  [ ${ACT[$n]} = 1 ] && [ "${GRP[$n]}" = "Domain Admins" ] && [[ "${FLG[$n]}" == *DONT_EXPIRE_PASSWORD* ]] && NEV+="$n"$'\n'
done
save_set comptes_kerberoastables "$KERB"; save_set comptes_sans_preauth "$PRE"; save_set admins_inactifs "$ADM"; save_set admins_sans_expiration "$NEV"
save_num nb_comptes_actifs "$NA"; save_kv correction_services gmsa
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
nb_comptes_actifs=
correction_services=
R
