. "$LAB_LIB"
# --- 1. protections des binaires (format checksec) ---
BIN=(/usr/sbin/agent-sauvegarde /usr/local/bin/lecteur-badges /opt/legacy/compteur /usr/bin/convertisseur-pdf /opt/app/serveur-impression /usr/local/bin/outil-rh)
echo "RELRO           STACK CANARY      NX            PIE             FILE" > "$WORK/binaires.txt"; RECO=""
for b in "${BIN[@]}"; do
  p=0; r="Partial RELRO"; c="No canary found"; n="NX disabled"; pi="No PIE"
  [ $((RANDOM%2)) = 0 ] && { r="Full RELRO"; p=$((p+1)); }; [ $((RANDOM%2)) = 0 ] && { c="Canary found"; p=$((p+1)); }
  [ $((RANDOM%3)) != 0 ] && { n="NX enabled"; p=$((p+1)); }; [ $((RANDOM%2)) = 0 ] && { pi="PIE enabled"; p=$((p+1)); }
  printf '%-15s %-17s %-13s %-15s %s\n' "$r" "$c" "$n" "$pi" "$b" >> "$WORK/binaires.txt"
  [ $p -le 1 ] && RECO+="$b"$'\n'
done
# --- 2. ASLR par hôte ---
echo "# cat /proc/sys/kernel/randomize_va_space relevé sur chaque hôte" > "$WORK/aslr.txt"; AS=""
for h in srv-web srv-bdd srv-fichiers srv-mail poste-dev; do v=$(shuf -e 2 2 2 1 0 -n1); echo "$h : $v" >> "$WORK/aslr.txt"; [ $v != 2 ] && AS+="$h"$'\n'; done
# --- 3. export de la base Metasploit (services) + avis ---
SV=("21,tcp,ftp,vsftpd 3.0.3" "21,tcp,ftp,ProFTPD 1.3.5" "22,tcp,ssh,OpenSSH 9.2p1" "22,tcp,ssh,OpenSSH 7.4" "80,tcp,http,Apache httpd 2.4.57" "80,tcp,http,Apache httpd 2.4.49" "445,tcp,smb,Samba smbd 4.17.12" "445,tcp,smb,Samba smbd 4.5.9" "3306,tcp,mysql,MariaDB 10.11.6" "25,tcp,smtp,Postfix smtpd")
echo "host,port,proto,name,info" > "$WORK/msf-services.csv"; HOSTS=($(shuf -i 10-90 -n 8)); AV=("ProFTPD 1.3.5" "Apache httpd 2.4.49" "Samba smbd 4.5.9" "OpenSSH 7.4"); TRAIT=""
printf '%s\n' "ProFTPD 1.3.5" "Apache httpd 2.4.49" > "$WORK/avis.txt"
for h in "${HOSTS[@]}"; do ip="192.168.20.$h"; for k in $(shuf -i 0-9 -n $((RANDOM%2+1))); do IFS=',' read -r p pr nm inf <<< "${SV[$k]}"; echo "$ip,$p,$pr,$nm,$inf" >> "$WORK/msf-services.csv"
  case "$inf" in "ProFTPD 1.3.5"|"Apache httpd 2.4.49") TRAIT+="$ip"$'\n';; esac; done; done
[ -z "$TRAIT" ] && { echo "192.168.20.${HOSTS[0]},21,tcp,ftp,ProFTPD 1.3.5" >> "$WORK/msf-services.csv"; TRAIT="192.168.20.${HOSTS[0]}"$'\n'; }
# --- 4. modules proposés ---
MODS=("exploit/unix/ftp/proftpd_modcopy" "auxiliary/scanner/smb/smb_version" "payload/linux/x64/shell_reverse_tcp" "post/linux/gather/enum_users_history")
echo "Modules affichés par « search » :" > "$WORK/modules.txt"; for m in $(printf '%s\n' "${MODS[@]}" | shuf); do echo "  $m" >> "$WORK/modules.txt"; done
save_set binaires_a_recompiler "${RECO:-aucun}"; save_set hotes_aslr_faible "${AS:-aucun}"; save_set hotes_a_traiter "$TRAIT"
save_kv module_sans_exploitation "auxiliary/scanner/smb/smb_version"
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
module_sans_exploitation=
R
