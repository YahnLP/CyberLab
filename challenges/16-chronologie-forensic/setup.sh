. "$LAB_LIB"
BASE=$((1767225600 + (RANDOM%20)*86400))
EP=($(shuf -i 0-86399 -n 60)); i=0
W=$(printf '%06x' $((RANDOM*RANDOM%16777216)))
ATT=("/var/www/html/uploads/img_$W.php" "/tmp/.cache_$W" "/etc/cron.d/maj-$W")
BEN=(/var/log/syslog /var/log/auth.log /var/www/html/index.php /var/www/html/css/site.css /etc/hosts /home/support/.bash_history /var/lib/dpkg/status /srv/data/export.csv /var/log/apache2/access.log /etc/resolv.conf)
# horaires de l'attaque : trois instants croissants
S=($(printf '%s\n' "${EP[@]:0:3}" | sort -n)); T0=${S[0]}
: > "$WORK/timeline.csv"
for k in 0 1 2; do echo "$((BASE+${S[$k]}));${ATT[$k]};B;www-data" >> "$WORK/timeline.csv"; done
USR=(root www-data support backup)
for k in $(seq 3 59); do echo "$((BASE+${EP[$k]}));${BEN[$((RANDOM%${#BEN[@]}))]};$(shuf -e M A C -n1);${USR[$((RANDOM%4))]}" >> "$WORK/timeline.csv"; done
shuf "$WORK/timeline.csv" -o "$WORK/timeline.csv"
# empreintes collectées
mkdir -p "$WORK/collecte"; : > "$WORK/hashes.txt"; : > "$WORK/ioc.txt"; SUSP=""
for k in 0 1 2; do h=$(printf 'mal%s%s' "$W" "$k" | sha256sum | cut -d' ' -f1); echo "$h  ${ATT[$k]}" >> "$WORK/hashes.txt"; [ $k != 2 ] && { echo "$h" >> "$WORK/ioc.txt"; SUSP+="${ATT[$k]}"$'\n'; }; done
for p in /var/www/html/index.php /etc/hosts /srv/data/export.csv; do echo "$(printf 'ok%s' "$p" | sha256sum | cut -d' ' -f1)  $p" >> "$WORK/hashes.txt"; done
for k in 1 2; do printf 'autre%s%s' "$W" "$k" | sha256sum | cut -d' ' -f1 >> "$WORK/ioc.txt"; done
shuf "$WORK/ioc.txt" -o "$WORK/ioc.txt"; shuf "$WORK/hashes.txt" -o "$WORK/hashes.txt"
AFTER=$(awk -F';' -v t=$((BASE+T0)) '$1>t' "$WORK/timeline.csv" | wc -l)
save_kv heure_debut_utc "$(date -u -d @$((BASE+T0)) +%H:%M:%S)"; save_kv fichier_persistance "${ATT[2]}"
save_num nb_evenements_apres "$AFTER"; save_set fichiers_ioc "$SUSP"
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
heure_debut_utc=
fichier_persistance=
nb_evenements_apres=
R
