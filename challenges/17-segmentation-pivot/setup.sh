. "$LAB_LIB"
R=("internet dmz tcp/443" "dmz app tcp/8443" "app db tcp/5432" "admin dmz tcp/22" "admin app tcp/22" "admin db tcp/22")
EX=("dmz db tcp/5432" "dmz interne any" "interne db tcp/5432" "app admin any" "interne admin tcp/3389")
for e in "${EX[@]}"; do [ $((RANDOM%2)) = 0 ] && R+=("$e"); done
LINES=$(printf '%s\n' "${R[@]}" | shuf)
: > "$WORK/regles.txt"; i=1; BIG=""
while read -r s d p; do id=$(printf 'R%02d' $i); echo "$id allow $s -> $d $p" >> "$WORK/regles.txt"
  { [ "$p" = any ] || [ "$s" = any ] || [ "$d" = any ]; } && BIG+="$id"$'\n'; i=$((i+1)); done <<< "$LINES"
echo "# Politique par défaut : tout refuser. Les flux listés ci-dessus sont les seuls autorisés." >> "$WORK/regles.txt"
# fermeture depuis dmz + sauts vers db
declare -A DIST; DIST[dmz]=0; CH=1; LV=0
while [ $CH = 1 ]; do CH=0
  for z in "${!DIST[@]}"; do [ ${DIST[$z]} = $LV ] || continue
    while read -r s d p; do [ "$s" = "$z" ] && [ -z "${DIST[$d]+x}" ] && { DIST[$d]=$((LV+1)); CH=1; }; done <<< "$LINES"
  done; LV=$((LV+1)); done
REACH=""; for z in "${!DIST[@]}"; do [ $z != dmz ] && REACH+="$z"$'\n'; done
save_set zones_atteignables "$REACH"; save_set regles_larges "${BIG:-aucun}"; save_num sauts_vers_db "${DIST[db]}"
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
sauts_vers_db=
R
