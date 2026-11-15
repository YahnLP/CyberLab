. "$LAB_LIB"
NET="198.51.100"; EX1="$NET.$((RANDOM%30+20))"; EX2="$NET.$((RANDOM%20+100))"
D1=$((RANDOM%5+16)); D2=$((D1+5))
CLAUSES=("perimetre|1. PÉRIMÈTRE : $NET.0/24 (réseau de la société Aster, fictive)" "exclusions|2. EXCLUSIONS : $EX1 (imprimante louée) et $EX2 (passerelle de l'opérateur)" "dates|3. FENÊTRE : du $D1 au $D2 novembre 2026, de 20h00 à 06h00" "techniques|4. TECHNIQUES AUTORISÉES : scans de ports et de versions, tests d'authentification limités à 5 essais par compte. INTERDITS : déni de service, ingénierie sociale" "contacts|5. CONTACT D'URGENCE : responsable sécurité de la société Aster, joignable 24h/24" "confidentialite|6. CONFIDENTIALITÉ : les données collectées sont détruites 30 jours après la remise du rapport" "signature|7. SIGNATURES : le commanditaire et l'auditeur, avec date")
MISS=$(shuf -e contacts confidentialite | head -$((RANDOM%3)))
{ echo "MANDAT D'AUDIT DE SÉCURITÉ — référence AUD-2026-031 (document fictif)"; echo
  for c in "${CLAUSES[@]}"; do k=${c%%|*}; t=${c#*|}; echo "$MISS" | grep -qx "$k" || { echo "$t"; echo; }; done; } > "$WORK/mandat.txt"
# --- actions prévues ---
echo "id;date;heure;cible;technique" > "$WORK/actions.csv"; AUTH=""; n=0
act(){ n=$((n+1)); local id; id=$(printf 'A%02d' $n); echo "$id;$1;$2;$3;$4" >> "$WORK/actions.csv"; [ "$5" = ok ] && AUTH+="$id"$'\n'; }
T=(scan-ports scan-versions test-authentification deni-de-service ingenierie-sociale)
okip(){ echo "$NET.$((RANDOM%80+130))"; }
act "2026-11-$D1" 21:30 "$(okip)" scan-ports ok
act "2026-11-$D1" 23:10 "$(okip)" scan-versions ok
act "2026-11-$((D1+1))" 02:15 "$(okip)" test-authentification ok
act "2026-11-$((D1+2))" 22:00 "$EX1" scan-ports no
act "2026-11-$((D1+1))" 14:00 "$(okip)" scan-versions no
act "2026-11-$((D1+3))" 01:00 "$(okip)" deni-de-service no
act "2026-11-$D2" 20:30 "$(okip)" ingenierie-sociale no
act "2026-11-$((D2+3))" 22:00 "$(okip)" scan-ports no
act "2026-11-$((D1+2))" 03:45 "203.0.113.$((RANDOM%200+10))" scan-versions no
act "2026-11-$((D1+3))" 05:50 "$EX2" test-authentification no
# --- activités à classer dans la Cyber Kill Chain ---
cat > "$WORK/activites.csv" <<'ACT'
id;description
K1;Lecture des enregistrements DNS publics et du certificat du site
K2;Envoi d'un courriel contenant une pièce jointe piégée à un employé
K3;Ouverture de la pièce jointe : le code s'exécute sur le poste
K4;Création d'une tâche planifiée pour garder l'accès après redémarrage
K5;Connexion sortante du poste vers un serveur de l'attaquant pour recevoir des ordres
ACT
save_set autorisees "$AUTH"; save_kv clauses_manquantes "$( [ -n "$MISS" ] && echo "$MISS" | paste -sd, || echo aucune )"
save_kv etape_k1 reconnaissance; save_kv etape_k2 livraison; save_kv etape_k3 exploitation; save_kv etape_k4 installation; save_kv etape_k5 commande
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
clauses_manquantes=
etape_k1=
etape_k2=
etape_k3=
etape_k4=
etape_k5=
R
