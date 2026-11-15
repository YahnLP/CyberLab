. "$LAB_LIB"
HOSTS=($(shuf -e www mail vpn intranet dev test api crm wiki backup portail extranet | head -9))
EXA="198.51.100.$((RANDOM%40+60))"; EXB="198.51.100.$((RANDOM%40+130))"; OUT="203.0.113.$((RANDOM%200+10))"
declare -A IP
IP[${HOSTS[0]}]=$EXA; IP[${HOSTS[1]}]=$EXB; IP[${HOSTS[2]}]=$OUT
for i in 3 4 5 6 7 8; do IP[${HOSTS[$i]}]="198.51.100.$((i*10+RANDOM%8+5))"; done
ALIAS1=shop; ALIAS2=blog; T1=${HOSTS[$((3+RANDOM%6))]}; T2=${HOSTS[$((RANDOM%2))]}
NMX=$((RANDOM%3+2))
{
  echo '$ORIGIN exemple.test.'; echo '$TTL 3600'
  echo '@   IN SOA ns1.exemple.test. admin.exemple.test. ( 2026111501 7200 3600 1209600 3600 )'
  echo '@   IN NS  ns1.exemple.test.'
  for m in $(seq 1 $NMX); do echo "@   IN MX  $((m*10)) mx$m.exemple.test."; done
  echo '@   IN TXT "v=spf1 mx -all"'
  for h in $(shuf -e "${HOSTS[@]}"); do printf '%-6s IN A     %s\n' "$h" "${IP[$h]}"; done
  printf '%-6s IN CNAME %s\n' "$ALIAS1" "$T1"; printf '%-6s IN CNAME %s\n' "$ALIAS2" "$T2"
} > "$WORK/zone.txt"
cat > "$WORK/scope.txt" <<S
MANDAT AUD-2026-014 · périmètre autorisé
IN   198.51.100.0/24
OUT  $EXA   (équipement tiers)
OUT  $EXB   (équipement tiers)
Tout ce qui est hors de la plage IN, ou listé OUT, est interdit de test.
S
if [ $((RANDOM%2)) = 0 ]; then SV="nginx/1.22.1"; PROD=nginx; VER=1.22.1; else SV="Apache/2.4.57 (Debian)"; PROD=apache; VER=2.4.57; fi
MASK="server"; XP=""
if [ $((RANDOM%2)) = 0 ]; then XP="X-Powered-By: PHP/8.2.7"; MASK="server,x-powered-by"; fi
{ echo "HTTP/1.1 200 OK"; echo "Date: Sun, 15 Nov 2026 09:12:44 GMT"; echo "Server: $SV"; [ -n "$XP" ] && echo "$XP"
  echo "Content-Type: text/html; charset=UTF-8"; echo "Content-Length: 4812"; } > "$WORK/headers.txt"
EXPECT=""
for h in "${HOSTS[@]}"; do ip=${IP[$h]}; case "$ip" in "$EXA"|"$EXB"|203.*) ;; *) EXPECT+="$h.exemple.test"$'\n';; esac; done
tip(){ echo "${IP[$1]}"; }
inscope(){ case "$1" in "$EXA"|"$EXB"|203.*) return 1;; *) return 0;; esac; }
inscope "$(tip $T1)" && EXPECT+="$ALIAS1.exemple.test"$'\n'
inscope "$(tip $T2)" && EXPECT+="$ALIAS2.exemple.test"$'\n'
save_set perimetre "$EXPECT"; save_num nb_mx "$NMX"; save_kv serveur "$PROD"; save_num version_annoncee "$VER"
save_kv statut_version hypothese; save_kv en_tetes_a_masquer "$MASK"
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
nb_mx=
serveur=
version_annoncee=
statut_version=
en_tetes_a_masquer=
R
