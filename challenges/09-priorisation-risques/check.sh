. "$LAB_LIB"
phase "Calcul des scores et décision"
check_set priorites priorites.csv; check_kv premiere_action; check_num nombre_p1
phase "Synthèse pour la direction"
M="$WORK/synthese.md"
if [ ! -f "$M" ] || grep -q 'A COMPLETER' "$M"; then echo "    ✘ synthese.md à compléter"; FAIL=1
else
  w=$(sed '/^#/d' "$M" | wc -w); [ "$w" -ge 40 ] && echo "    ✔ $w mots" || { echo "    ✘ synthèse trop courte ($w mots, 40 minimum)"; FAIL=1; }
  for id in $(awk -F";" '$3=="P1"{print $1}' "$WORK/priorites.csv" 2>/dev/null); do grep -qw "$id" "$M" && echo "    ✔ cite $id" || { echo "    ✘ ne cite pas le constat P1 $id"; FAIL=1; }; done
  grep -qi 'retest' "$M" && echo "    ✔ prévoit un retest" || { echo "    ✘ ne prévoit pas de retest"; FAIL=1; }
fi
finish "Risques priorisés : calcul CVSS juste, contexte pris en compte, décision restituée."
