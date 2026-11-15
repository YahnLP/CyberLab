. "$LAB_LIB"
NET="192.168.$((RANDOM%3*10+20))"
NAMES=(srv-web srv-bdd srv-fichiers srv-mail pc-compta pc-rh pc-direction imprimante-1 imprimante-2 nas-sauvegarde switch-core ap-wifi)
TYPES=(serveur serveur serveur serveur poste poste poste imprimante imprimante stockage reseau reseau)
OCT=($(shuf -i 10-90 -n 14)); 
mac(){ printf '08:00:27:%02x:%02x:%02x' $((RANDOM%256)) $((RANDOM%256)) $((RANDOM%256)); }
: > "$WORK/inventaire.csv"; echo "ip;nom;type" > "$WORK/inventaire.csv"
for i in $(seq 0 11); do echo "$NET.${OCT[$i]};${NAMES[$i]};${TYPES[$i]}" >> "$WORK/inventaire.csv"; done
ORDER=($(shuf -i 0-11)); FILT=${ORDER[0]}; DOWN=${ORDER[1]}
U1="$NET.${OCT[12]}"; U2="$NET.${OCT[13]}"
{ echo "# Nmap 7.93 scan initiated Sun Nov 15 09:30:02 2026 as: nmap -sn -oG - $NET.0/24"
  for i in $(shuf -i 0-11); do [ $i = $FILT ] || [ $i = $DOWN ] || printf 'Host: %s.%s ()\tStatus: Up\n' "$NET" "${OCT[$i]}"; done
  printf 'Host: %s ()\tStatus: Up\n' "$U1"
  echo "# Nmap done at Sun Nov 15 09:30:05 2026 -- 256 IP addresses (11 hosts up) scanned in 2.91 seconds"; } > "$WORK/scan-ping.gnmap"
{ for i in $(shuf -i 0-11); do
    if [ $i = $DOWN ]; then printf '%s.%s dev eth0  FAILED\n' "$NET" "${OCT[$i]}"
    else printf '%s.%s dev eth0 lladdr %s %s\n' "$NET" "${OCT[$i]}" "$(mac)" "$(shuf -e REACHABLE STALE -n1)"; fi
  done
  printf '%s dev eth0 lladdr %s STALE\n' "$U1" "$(mac)"; printf '%s dev eth0 lladdr %s REACHABLE\n' "$U2" "$(mac)"; } > "$WORK/arp.txt"
P=$(shuf -e 22 23 24 25 26 -n1); echo "Plage à dimensionner : 10.$((RANDOM%200)).$((RANDOM%250)).0/$P" > "$WORK/cidr.txt"
save_set inconnus "$U1
$U2"
save_set absents "$NET.${OCT[$DOWN]}"
save_num hote_icmp_filtre "$NET.${OCT[$FILT]}"
save_num adresses_utilisables "$(( (1 << (32-P)) - 2 ))"
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
hote_icmp_filtre=
adresses_utilisables=
R
