. "$LAB_LIB"
NET="192.168.20"; SRV="$NET.$((RANDOM%30+10))"; GW="$NET.1"; CL=$((RANDOM%60+100))
LEG=$(printf '08:00:27:%02x:%02x:%02x' $((RANDOM%256)) $((RANDOM%256)) $((RANDOM%256)))
EVIL=$(printf '08:00:27:%02x:%02x:%02x' $((RANDOM%256)) $((RANDOM%256)) $((RANDOM%256))); [ "$EVIL" = "$LEG" ] && EVIL="08:00:27:ee:ee:01"
FU=$(shuf -e marie paul lucas sophie hugo -n1); FP=$(shuf -e Printemps26 Soleil2026 Azerty123 Bienvenue1 Mdp-labo -n1)
HU=$(shuf -e admin gestionnaire support -n1); HP=$(shuf -e Chat-noir7 Tableau2026 Rentree-26 Pass1234 -n1)
NARP=$((RANDOM%9+6)); ts="@T"
B="$(mktemp -d)"; i=0
blk(){ i=$((i+1)); cat > "$B/b$(printf '%02d' $i)"; }
CP=$((RANDOM%20000+40000))
blk <<X
$ts IP $NET.$CL.$CP > $SRV.21: Flags [S], seq 100, win 64240, length 0
$ts IP $SRV.21 > $NET.$CL.$CP: Flags [S.], seq 500, ack 101, win 65160, length 0
$ts IP $NET.$CL.$CP > $SRV.21: Flags [P.], seq 1:12, ack 22, win 502, length 11: FTP: USER $FU
$ts IP $SRV.21 > $NET.$CL.$CP: Flags [P.], seq 22:56, ack 12, win 509, length 34: FTP: 331 Please specify the password.
$ts IP $NET.$CL.$CP > $SRV.21: Flags [P.], seq 12:28, ack 56, win 502, length 16: FTP: PASS $FP
$ts IP $SRV.21 > $NET.$CL.$CP: Flags [P.], seq 56:79, ack 28, win 509, length 23: FTP: 230 Login successful.
X
AUTH=$(printf '%s:%s' "$HU" "$HP" | base64)
blk <<X
$ts IP $NET.$((CL+1)).$((CP+7)) > $SRV.80: Flags [P.], seq 1:210, ack 1, win 502, length 209: HTTP: GET /admin HTTP/1.1
E..x.@.@........
Host: intranet.exemple.test
Authorization: Basic $AUTH
User-Agent: curl/7.88.1
$ts IP $SRV.80 > $NET.$((CL+1)).$((CP+7)): Flags [P.], seq 1:300, ack 210, win 509, length 299: HTTP: HTTP/1.1 200 OK
X
for k in 1 2 3; do blk <<X
$ts IP $NET.$((CL+2)).$((CP+k*3)) > $SRV.443: Flags [P.], seq 1:$((500+k)), ack 1, win 502, length $((500+k))
E....@.@..........  .....N..H..a.O..;.....)....S..
$ts IP $SRV.443 > $NET.$((CL+2)).$((CP+k*3)): Flags [P.], seq 1:1400, ack $((501+k)), win 509, length 1399
X
done
blk <<X
$ts ARP, Request who-has $GW tell $NET.$CL, length 46
$ts ARP, Reply $GW is-at $LEG, length 46
X
blk <<X
$ts ARP, Request who-has $NET.$((CL+3)) tell $GW, length 46
$ts ARP, Reply $NET.$((CL+3)) is-at 08:00:27:5c:11:2a, length 46
X
for k in $(seq 1 $NARP); do blk <<X
$ts ARP, Reply $GW is-at $EVIL, length 46
X
done
blk <<X
$ts ARP, Reply $GW is-at $LEG, length 46
X
cat $(ls "$B"/b* | shuf) | awk 'BEGIN{srand(); s=10*3600+2*60} /^@T/{s+=rand()*3; h=int(s/3600); m=int((s%3600)/60); sec=s%60; sub(/^@T/, sprintf("%02d:%02d:%09.6f", h,m,sec))} {print}' > "$WORK/capture.txt"
rm -rf "$B"
echo "Passerelle officielle : $GW  adresse MAC légitime : $LEG" > "$WORK/passerelle.txt"
save_kv ftp_utilisateur "$FU"; save_kv ftp_mot_de_passe "$FP"; save_kv http_utilisateur "$HU"; save_kv http_mot_de_passe "$HP"
save_kv mac_usurpateur "$EVIL"; save_num nb_reponses_usurpees "$NARP"; save_kv serveur_ftp "$SRV"
cat > "$WORK/reponses.txt" <<'R'
# cle=valeur (sans espace autour du signe =)
serveur_ftp=
ftp_utilisateur=
ftp_mot_de_passe=
http_utilisateur=
http_mot_de_passe=
mac_usurpateur=
nb_reponses_usurpees=
R
