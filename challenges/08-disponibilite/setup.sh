. "$LAB_LIB"
# ---------- 1. Instantané ss -ant pendant une saturation ----------
SRV="192.168.20.$((RANDOM%50+10)):443"; NFLOOD=$((RANDOM%60+80)); MODE=$(shuf -e unique distribuee -n1)
DOM="203.0.113.$((RANDOM%200+20))"
{ echo "State      Recv-Q Send-Q  Local Address:Port    Peer Address:Port"
  for i in $(seq 1 $((RANDOM%10+12))); do printf 'ESTAB      0      0      %s   198.51.100.%d:%d\n' "$SRV" $((RANDOM%200+10)) $((RANDOM%28000+32768)); done
  for i in $(seq 1 3); do printf 'LISTEN     0      511    0.0.0.0:80      0.0.0.0:*\n'; break; done
  for i in $(seq 1 $NFLOOD); do
    if [ $MODE = unique ] && [ $((RANDOM%10)) -lt 8 ]; then src=$DOM; else src="203.0.113.$((RANDOM%230+10))"; fi
    printf 'SYN-RECV   0      0      %s   %s:%d\n' "$SRV" "$src" $((RANDOM%28000+32768)); done; } | shuf > "$WORK/ss.txt"
# garder l'en-tête en première ligne
{ grep '^State' "$WORK/ss.txt"; grep -v '^State' "$WORK/ss.txt"; } > "$WORK/ss.tmp" && mv "$WORK/ss.tmp" "$WORK/ss.txt"
NSYN=$(grep -c 'SYN-RECV' "$WORK/ss.txt")
if [ $MODE = unique ]; then TOP=$(grep SYN-RECV "$WORK/ss.txt" | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -1)
  TOPN=$(echo $TOP | awk '{print $1}'); TOPIP=$(echo $TOP | awk '{print $2}')
  if [ $((TOPN*100/NSYN)) -ge 50 ]; then ANS=$TOPIP; else ANS=distribuee; fi
else ANS=distribuee; fi
SC=$(shuf -e 0 1 -n1); printf 'net.ipv4.tcp_syncookies = %s\nnet.ipv4.tcp_max_syn_backlog = 128\nnet.ipv4.tcp_synack_retries = 5\n' "$SC" > "$WORK/sysctl.txt"
# ---------- 2. Amplification ----------
PRO=("DNS|60" "NTP|48" "SSDP|90" "CLDAP|52" "memcached|15"); : > "$WORK/amplification.csv"; echo "protocole;requete_octets;reponse_octets" > "$WORK/amplification.csv"
FS=($(shuf -e 28 54 31 46 120 -n5)); BEST=""; BF=0; EM=$((RANDOM%9+5))
for i in 0 1 2 3 4; do IFS='|' read -r n r <<< "${PRO[$i]}"; f=${FS[$i]}; echo "$n;$r;$((r*f))" >> "$WORK/amplification.csv"; [ $f -gt $BF ] && BF=$f && BEST=$n; done
echo "Débit émis par l'attaquant (requêtes à adresse source usurpée) : $EM Mbit/s" > "$WORK/emission.txt"
# ---------- 3. Sauvegardes ----------
CIBLE=$(shuf -e 6 8 -n1); echo "Objectif RPO : $CIBLE heures" > "$WORK/objectif.txt"
t=$(date -u -d '2026-11-12 00:00' +%s); : > "$WORK/sauvegardes.log"; prev=""; MAXGAP=0; LASTRES="jamais"
for i in $(seq 0 12); do now=$((t+i*6*3600)); d=$(date -u -d "@$now" '+%Y-%m-%d %H:%M')
  if [ $i = $((RANDOM%9+2)) ] || [ $i = $((RANDOM%9+2)) ]; then echo "$d sauvegarde ECHEC espace disque insuffisant" >> "$WORK/sauvegardes.log"; continue; fi
  echo "$d sauvegarde OK taille=$((RANDOM%400+800))Mo" >> "$WORK/sauvegardes.log"
  [ -n "$prev" ] && { g=$(( (now-prev)/3600 )); [ $g -gt $MAXGAP ] && MAXGAP=$g; }; prev=$now; done
if [ $((RANDOM%2)) = 0 ]; then rd="2026-11-$((RANDOM%3+10))"; echo "$rd 14:30 restauration-test OK durée=47min" >> "$WORK/sauvegardes.log"; LASTRES=$rd; fi
sort -o "$WORK/sauvegardes.log" "$WORK/sauvegardes.log"
CONF=non; [ $MAXGAP -le $CIBLE ] && CONF=oui
save_num syn_recv "$NSYN"; save_kv origine_flood "$ANS"; save_kv syncookies_actifs "$([ $SC = 1 ] && echo oui || echo non)"
save_kv plus_amplifiant "$BEST"; save_num bande_recue_mbps "$((EM*BF))"
save_num rpo_reel_heures "$MAXGAP"; save_kv rpo_conforme "$CONF"; save_kv derniere_restauration "$LASTRES"
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
syn_recv=
origine_flood=
syncookies_actifs=
plus_amplifiant=
bande_recue_mbps=
rpo_reel_heures=
rpo_conforme=
derniere_restauration=
R
