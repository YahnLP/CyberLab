. "$LAB_LIB"
b64u(){ base64 -w0 | tr '+/' '-_' | tr -d '='; }
# --- objets et propriétaires ---
IDS=($(shuf -i 100-299 -n 10)); declare -A OWN; : > "$WORK/proprietes.csv"; echo "commande;proprietaire" > "$WORK/proprietes.csv"
for i in 0 1 2 3 4 5 6 7 8 9; do if [ $i -lt 5 ]; then OWN[${IDS[$i]}]=alice; else OWN[${IDS[$i]}]=bob; fi; echo "${IDS[$i]};${OWN[${IDS[$i]}]}" >> "$WORK/proprietes.csv"; done
# --- journal des requêtes (ordre chronologique) ---
LIM=$(shuf -e oui non -n1); IDOR=""; VERB=""; n=0; t=$((9*3600+RANDOM%600))
: > "$WORK/requetes.log"
rid(){ n=$((n+1)); printf 'r%03d' $n; }
ts(){ t=$((t+1+RANDOM%4)); printf '2026-11-15T%02d:%02d:%02dZ' $((t/3600)) $((t%3600/60)) $((t%60)); }
line(){ echo "$(rid) $(ts) $1 $2 $3 $4 $5" >> "$WORK/requetes.log"; }
GEN=("Erreur interne" "Erreur interne" "Service indisponible")
for k in $(seq 1 34); do
  u=$(shuf -e alice bob -n1); o=${IDS[$((RANDOM%10))]}
  case $((RANDOM%9)) in
   0) line "-" GET /api/v1/commandes/$o 401 'msg="authentification requise"';;
   1) line $u GET /api/v1/commandes/$((300+RANDOM%50)) 404 'msg="introuvable"';;
   2) m=$(shuf -n1 -e 'msg="java.lang.NullPointerException at com.exemple.CommandeService.charger(CommandeService.java:88)"' 'msg="SQLSyntaxError near FROM commandes WHERE id=" ' 'msg="Erreur interne"' 'msg="Erreur interne"')
      id=$(rid); n=$((n-1)); echo "$m" | grep -qE 'Exception|SQL' && VERB+="r$(printf '%03d' $((n+1)))"$'\n'
      line $u GET /api/v1/commandes/$o 500 "$m";;
   *) if [ "${OWN[$o]}" = "$u" ]; then line $u GET /api/v1/commandes/$o 200 "taille=$((300+RANDOM%900))"
      elif [ $((RANDOM%10)) -lt 4 ]; then IDOR+="r$(printf '%03d' $((n+1)))"$'\n'; line $u GET /api/v1/commandes/$o 200 "taille=$((300+RANDOM%900))"
      else line $u GET /api/v1/commandes/$o 403 'msg="accès refusé"'; fi;;
  esac
done
# garantir au moins 2 accès non autorisés
if [ "$(printf '%s' "$IDOR" | grep -c .)" -lt 2 ]; then
  for z in 1 2; do u=alice; o=$(for k in "${IDS[@]}"; do [ "${OWN[$k]}" = bob ] && echo $k; done | shuf -n1); IDOR+="r$(printf '%03d' $((n+1)))"$'\n'; line $u GET /api/v1/commandes/$o 200 "taille=$((300+RANDOM%900))"; done
fi
# rafale de requêtes de connexion
if [ $LIM = oui ]; then for k in $(seq 1 12); do st=401; [ $k -gt 8 ] && st=429; line "-" POST /api/v1/login $st 'msg="rafale"'; done
else for k in $(seq 1 12); do line "-" POST /api/v1/login 401 'msg="rafale"'; done; fi
# --- jeton JWT ---
SUB=$(shuf -e alice bob -n1); ROLE=$(shuf -e user support auditeur -n1)
H=$(printf '{"alg":"HS256","typ":"JWT"}' | b64u); PL=$(printf '{"sub":"%s","role":"%s","exp":1795000000,"iss":"api.exemple.test"}' "$SUB" "$ROLE" | b64u)
echo "$H.$PL.$(head -c 32 /dev/urandom | b64u)" > "$WORK/jeton.txt"
save_set acces_non_autorises "$IDOR"; save_set reponses_bavardes "${VERB:-aucun}"
save_kv limitation_en_place "$LIM"; save_kv utilisateur_du_jeton "$SUB"; save_kv role_du_jeton "$ROLE"
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
limitation_en_place=
utilisateur_du_jeton=
role_du_jeton=
R
