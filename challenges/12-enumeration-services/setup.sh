. "$LAB_LIB"
ALLN=(www mail vpn intranet crm wiki backup paie rh gitlab sauvegarde-nas imprimante-compta)
SHUF=($(shuf -e "${ALLN[@]}")); PUB=("${SHUF[@]:0:5}"); INTERNE=("${SHUF[@]:5:4}")
# DNS : zone publique attendue vs transfert de zone obtenu
: > "$WORK/dns-public.txt"; for h in "${PUB[@]}"; do echo "$h.lab.test" >> "$WORK/dns-public.txt"; done
{ echo "; <<>> DiG 9.18 <<>> @192.168.20.2 lab.test AXFR"; echo "lab.test.  3600 IN SOA ns1.lab.test. admin.lab.test. 2026111501 7200 3600 1209600 3600"
  for h in "${PUB[@]}"; do echo "$h.lab.test. 3600 IN A 198.51.100.$((RANDOM%200+10))"; done
  for h in "${INTERNE[@]}"; do echo "$h.lab.test. 3600 IN A 10.0.$((RANDOM%5)).$((RANDOM%200+10))"; done
  echo "lab.test.  3600 IN SOA ns1.lab.test. admin.lab.test. 2026111501 7200 3600 1209600 3600"; echo ";; XFR size: $((${#PUB[@]}+${#INTERNE[@]}+2)) records"; } > "$WORK/axfr.txt"
INT=""; for h in "${INTERNE[@]}"; do case " ${PUB[*]} " in *" $h "*) ;; *) INT+="$h.lab.test"$'\n';; esac; done
# SMB : partages et accès anonyme
SH=(public docs-compta ressources-rh scans-imprimante sauvegardes projets); ANON=""
{ echo "smbclient -L //192.168.20.40 -N"; echo; printf '\tSharename       Type      Comment\n\t---------       ----      -------\n'
  for s in "${SH[@]}"; do printf '\t%-15s Disk      Partage %s\n' "$s" "$s"; done; printf '\tIPC$            IPC       IPC Service\n'; echo; echo "# Accès anonyme testé partage par partage (smbclient //192.168.20.40/PARTAGE -N -c ls)"; } > "$WORK/smb.txt"
for s in "${SH[@]}"; do if [ $((RANDOM%3)) = 0 ]; then echo "$s : NT_STATUS_OK (lecture anonyme possible)" >> "$WORK/smb.txt"; ANON+="$s"$'\n'
  else echo "$s : NT_STATUS_ACCESS_DENIED" >> "$WORK/smb.txt"; fi; done
[ -z "$ANON" ] && { sed -i "s/^public : NT_STATUS_ACCESS_DENIED/public : NT_STATUS_OK (lecture anonyme possible)/" "$WORK/smb.txt"; ANON="public"$'\n'; }
# SNMP : communauté et sysDescr
KER=$(shuf -e 5.10.0-27 6.1.0-18 4.19.0-25 -n1); COMM=$(shuf -e public private lab2026 -n1); LOC=$(shuf -e "Salle serveurs A" "Baie B2" -n1)
{ echo "snmpwalk -v2c -c $COMM 192.168.20.50 system"
  echo "SNMPv2-MIB::sysDescr.0 = STRING: Linux nas-01 $KER-amd64 #1 SMP Debian x86_64"
  echo "SNMPv2-MIB::sysContact.0 = STRING: admin@lab.test"; echo "SNMPv2-MIB::sysName.0 = STRING: nas-01"; echo "SNMPv2-MIB::sysLocation.0 = STRING: $LOC"; } > "$WORK/snmp.txt"
save_set hotes_internes_exposes "$INT"; save_set partages_anonymes "$ANON"
save_kv communaute_snmp "$COMM"; save_kv noyau_nas "$KER"; save_kv emplacement_nas "$(echo $LOC | tr ' ' '-')"
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
communaute_snmp=
noyau_nas=
emplacement_nas=
R
