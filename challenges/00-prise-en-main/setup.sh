. "$LAB_LIB"
HOSTS=(srv-web srv-bdd srv-mail srv-fichiers); CNT=($(shuf -e 3 5 8 12 -n4)); T=$((8*3600+RANDOM%600)); : > "$WORK/journal.log"
MSG_I=("connexion établie" "sauvegarde terminée" "tâche planifiée exécutée" "mise à jour appliquée"); MSG_A=("espace disque faible" "latence élevée" "certificat proche de l'expiration"); MSG_E=("échec d'authentification" "service arrêté" "délai de réponse dépassé")
ALL=(); for i in 0 1 2 3; do for k in $(seq 1 ${CNT[$i]}); do ALL+=("${HOSTS[$i]}"); done; done
NERR=0
for h in $(printf '%s\n' "${ALL[@]}" | shuf); do
  T=$((T+RANDOM%90+10)); case $((RANDOM%5)) in 0) L=ERREUR; M="${MSG_E[RANDOM%3]}"; NERR=$((NERR+1));; 1) L=AVERT; M="${MSG_A[RANDOM%3]}";; *) L=INFO; M="${MSG_I[RANDOM%4]}";; esac
  printf '2026-11-02 %02d:%02d:%02d %s %s %s\n' $((T/3600)) $((T%3600/60)) $((T%60)) "$h" "$L" "$M" >> "$WORK/journal.log"
done
TOP=$(awk '{print $3}' "$WORK/journal.log" | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')
{ echo "_log:$(sha256sum "$WORK/journal.log" | cut -d' ' -f1)"; } > "$ANSWER_FILE"
save_num nb_lignes "$(wc -l < "$WORK/journal.log")"; save_num nb_erreurs "$NERR"; save_kv hote_le_plus_actif "$TOP"
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
nb_lignes=
nb_erreurs=
hote_le_plus_actif=
R
