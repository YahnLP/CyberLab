. "$LAB_LIB"
NET="192.168.$((RANDOM%3*10+20))"
# port|service|version
SVC=("21|ftp|vsftpd 3.0.3" "22|ssh|OpenSSH 9.2p1 Debian 2+deb12u2" "23|telnet|Linux telnetd" "25|smtp|Postfix smtpd" "80|http|Apache httpd 2.4.57 ((Debian))" "443|https|nginx 1.22.1" "445|microsoft-ds|Samba smbd 4.17.12-Debian" "3306|mysql|MariaDB 10.11.6")
HOSTS=($(shuf -i 10-90 -n 6)); : > "$WORK/scan.gnmap"; echo "ip;ports_autorises" > "$WORK/politique.csv"
echo "# Nmap 7.93 scan initiated Sun Nov 15 10:02:11 2026 as: nmap -sV -oG - $NET.0/24" > "$WORK/scan.gnmap"
OPEN=0; FILT=0; NONCONF=""; CLAIR=""
for h in "${HOSTS[@]}"; do
  ip="$NET.$h"; idx=($(shuf -i 0-7 -n $((RANDOM%3+3)))); allowed=""; line=""; ign=1000
  nopen=0
  for k in "${idx[@]}"; do IFS='|' read -r p s v <<< "${SVC[$k]}"
    st=open; [ $((RANDOM%5)) = 0 ] && st=filtered
    if [ $st = open ]; then OPEN=$((OPEN+1)); nopen=$((nopen+1)); case $p in 21|23) CLAIR+="$ip:$p"$'\n';; esac
      # politique : le plus souvent conforme, parfois dérive
      if [ $((RANDOM%4)) = 0 ] && [ $p != 22 ]; then NONCONF+="$ip:$p"$'\n'; else allowed+="$p,"; fi
      line+="$p/open/tcp//$s//$v/, "
    else FILT=$((FILT+1)); line+="$p/filtered/tcp//$s///, "; fi
    ign=$((ign-1))
  done
  [ -z "$allowed" ] && allowed="22,"
  # un hôte garde ftp autorisé (legacy) pour distinguer clair et non conforme
  printf 'Host: %s ()\tPorts: %s\tIgnored State: closed (%s)\n' "$ip" "${line%, }" "$ign" >> "$WORK/scan.gnmap"
  echo "$ip;${allowed%,}" >> "$WORK/politique.csv"
done
echo "# Nmap done at Sun Nov 15 10:02:40 2026 -- 256 IP addresses (6 hosts up) scanned in 29.14 seconds" >> "$WORK/scan.gnmap"
save_num ports_ouverts "$OPEN"; save_num ports_filtres "$FILT"
save_set non_conformes "${NONCONF:-aucun}"; save_set en_clair "${CLAIR:-aucun}"
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
ports_ouverts=
ports_filtres=
R
