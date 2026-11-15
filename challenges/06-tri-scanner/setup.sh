. "$LAB_LIB"
# paquet|version amont signalée|corrigé dans (Debian)|version installée si vulnérable|version installée si corrigée
P=("apache2|2.4.57|2.4.57-2+deb12u1|2.4.57-2|2.4.57-2+deb12u2" "openssh-server|9.2p1|1:9.2p1-2+deb12u3|1:9.2p1-2+deb12u1|1:9.2p1-2+deb12u3" "openssl|3.0.11|3.0.11-1~deb12u2|3.0.9-1|3.0.11-1~deb12u2" "curl|7.88.1|7.88.1-10+deb12u5|7.88.1-10+deb12u1|7.88.1-10+deb12u5" "nginx|1.22.1|1.22.1-9|1.22.1-1|1.22.1-9" "postfix|3.7.9|3.7.9-0+deb12u1|3.7.5-1|3.7.9-0+deb12u1" "samba|4.17.12|2:4.17.12+dfsg-0+deb12u1|2:4.17.5+dfsg-1|2:4.17.12+dfsg-0+deb12u1" "vsftpd|3.0.3|3.0.3-13+b2|3.0.3-12|3.0.3-13+b2")
ORDER=($(shuf -i 0-7)); STAT=(V V V C C C A A); STAT=($(shuf -e "${STAT[@]}"))
CVSS_V=($(shuf -e 8.1 7.5 6.5)); CVSS_O=($(shuf -e 5.3 4.3 6.1 3.7 5.9))
: > "$WORK/scanner.txt"; echo "cve;paquet;corrige_dans" > "$WORK/avis-securite.csv"
{ echo "Debian GNU/Linux 12 (bookworm)"; echo "Desired=Unknown/Install/Remove/Purge/Hold"; } > "$WORK/paquets-installes.txt"
echo "# Rapport du scanner de vulnérabilités (détection par version amont) — hôte srv-app-01" > "$WORK/scanner.txt"
VRAIS=""; FAUX=""; BEST=""; BESTSCORE=0; vi=0; oi=0
for n in 0 1 2 3 4 5 6 7; do
  IFS='|' read -r pk up fx iv ic <<< "${P[${ORDER[$n]}]}"; st=${STAT[$n]}
  cve="CVE-2099-$((1000+RANDOM%8000))"; id=$(printf 'F%02d' $((n+1)))
  if [ $st = V ]; then sc=${CVSS_V[$vi]}; vi=$((vi+1)); else sc=${CVSS_O[$oi]}; oi=$((oi+1)); fi
  # le score le plus élevé du rapport est toujours un faux positif (piège)
  if [ $n = 0 ] && [ $st != V ]; then sc=9.8; elif [ $n = 0 ]; then :; fi
  case $st in V) inst=$iv; VRAIS+="$cve"$'\n'; if awk "BEGIN{exit !($sc>$BESTSCORE)}"; then BESTSCORE=$sc; BEST=$cve; fi;;
              C) inst=$ic; FAUX+="$cve"$'\n';; A) inst=""; FAUX+="$cve"$'\n';; esac
  printf '[%s] %s  %-15s cvss=%s  version détectée : %s (inférieure à la version corrigée amont)\n' "$id" "$cve" "$pk" "$sc" "$up" >> "$WORK/scanner.txt"
  echo "$cve;$pk;$fx" >> "$WORK/avis-securite.csv"
  [ -n "$inst" ] && printf 'ii  %-16s %-26s amd64        %s\n' "$pk" "$inst" "paquet $pk" >> "$WORK/paquets-installes.txt"
done
# Piège : si aucun faux positif n'a le plus haut score, on force le premier faux positif à 9.8
if ! grep -q 'cvss=9.8' "$WORK/scanner.txt"; then
  L=$(grep -n 'cvss=' "$WORK/scanner.txt" | while IFS=: read -r ln rest; do c=$(echo "$rest" | awk '{print $2}'); echo "$VRAIS" | grep -qx "$c" || { echo "$ln"; break; }; done)
  [ -n "$L" ] && sed -i "${L}s/cvss=[0-9.]*/cvss=9.8/" "$WORK/scanner.txt"
fi
save_set vrais_positifs "$VRAIS"; save_set faux_positifs "$FAUX"; save_kv le_plus_grave "$BEST"
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
le_plus_grave=
R
