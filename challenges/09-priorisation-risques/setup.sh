. "$LAB_LIB"
CVSSAWK=$(mktemp); cat > "$CVSSAWK" <<'AWK'
function ru(x,  i){ i=int(x*100000+0.5); if (i%10000==0) return i/100000; return (int(i/10000)+1)/10 }
function w(m,v,s){
  if(m=="AV") return (v=="N")?0.85:(v=="A")?0.62:(v=="L")?0.55:0.2
  if(m=="AC") return (v=="L")?0.77:0.44
  if(m=="PR") { if(v=="N") return 0.85; if(v=="L") return (s=="C")?0.68:0.62; return (s=="C")?0.5:0.27 }
  if(m=="UI") return (v=="N")?0.85:0.62
  return (v=="H")?0.56:(v=="L")?0.22:0 }
{ delete M; n=split($1,p,"/"); for(i=1;i<=n;i++){ split(p[i],kv,":"); M[kv[1]]=kv[2] }
  s=M["S"]; iss=1-(1-w("C",M["C"]))*(1-w("C",M["I"]))*(1-w("C",M["A"]))
  imp=(s=="U")?6.42*iss:7.52*(iss-0.029)-3.25*((iss-0.02)^15)
  ex=8.22*w("AV",M["AV"])*w("AC",M["AC"])*w("PR",M["PR"],s)*w("UI",M["UI"])
  if(imp<=0) sc=0; else if(s=="U") sc=ru((imp+ex>10)?10:imp+ex); else sc=ru((1.08*(imp+ex)>10)?10:1.08*(imp+ex))
  printf "%.1f\n", sc }
AWK
VEC=("AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" "AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N" "AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N" "AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H" "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N" "AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H" "AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H" "AV:A/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N" "AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H" "AV:P/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N" "AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H")
TIT=("Exécution de code à distance dans le service web" "Lecture de données d'un autre utilisateur" "Script injecté dans une page de recherche" "Élévation de privilèges locale" "Divulgation de version et de configuration" "Compromission via une pièce jointe piégée" "Déni de service d'un démon réseau" "Interception sur le réseau local" "Contournement d'authentification complexe" "Accès physique à un port de maintenance" "Prise de contrôle du portail d'administration")
ACT=(portail-clients erp-compta messagerie intranet-rh serveur-fichiers wifi-invites sauvegarde-nas)
EXPO=(internet interne interne interne interne internet interne); CRIT=(haute haute moyenne moyenne basse basse haute)
echo "actif;exposition;criticite" > "$WORK/actifs.csv"
for i in 0 1 2 3 4 5 6; do echo "${ACT[$i]};${EXPO[$i]};${CRIT[$i]}" >> "$WORK/actifs.csv"; done
echo "id;titre;vecteur_cvss;actif" > "$WORK/constats.csv"
VI=($(shuf -i 1-10 -n 6)); ORDER=($(shuf -i 0-6))
for k in 0 1 2 3 4 5 6; do id=$(printf 'F%02d' $((k+1))); if [ $k = 0 ]; then v=0; a=0; else v=${VI[$((k-1))]}; a=${ORDER[$((k-1))]}; [ $a = 0 ] && a=${ORDER[6]}; fi
  echo "$id;${TIT[$v]};${VEC[$v]};${ACT[$a]}" >> "$WORK/constats.csv"; done
# --- vérité : score, priorité ---
SET=""; BEST=""; BS=0; P1=""; NP1=0
while IFS=';' read -r id titre vec act; do [ "$id" = id ] && continue
  sc=$(echo "$vec" | gawk -f "$CVSSAWK"); ex=$(awk -F';' -v a="$act" '$1==a{print $2}' "$WORK/actifs.csv"); cr=$(awk -F';' -v a="$act" '$1==a{print $3}' "$WORK/actifs.csv")
  p=P3
  if awk "BEGIN{exit !($sc>=7.0)}" || { awk "BEGIN{exit !($sc>=4.0)}" && [ $ex = internet ]; }; then p=P2; fi
  if awk "BEGIN{exit !($sc>=9.0)}" || { awk "BEGIN{exit !($sc>=7.0)}" && [ $ex = internet ] && [ $cr = haute ]; }; then p=P1; NP1=$((NP1+1)); P1+="$id"$'\n'
    if awk "BEGIN{exit !($sc>$BS)}"; then BS=$sc; BEST=$id; fi; fi
  SET+="$id;$sc;$p"$'\n'
done < "$WORK/constats.csv"
rm -f "$CVSSAWK"
save_set priorites "$SET"; save_kv premiere_action "$BEST"; save_num nombre_p1 "$NP1"
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
premiere_action=
nombre_p1=
R
cp "$CH/cvss31-reference.txt" "$WORK/"
cat > "$WORK/synthese.md" <<'R'
# Synthèse pour la direction

A COMPLETER
R
