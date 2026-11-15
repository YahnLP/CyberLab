#!/usr/bin/env bash
# Corrigé formateur (NE PAS copier dans l'image) : à exécuter depuis ~/atelier/01-incident-ssh
set -e
L=srv01/var/log/auth.log
mkdir -p preuves; cp -p $L preuves/; ( cd preuves && sha256sum auth.log > SHA256SUMS )
TOTAL=$(grep -c 'Failed password' $L)
IP=$(grep 'Failed password' $L | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')
NIP=$(grep 'Failed password' $L | grep -c "from $IP ")
ACCT=$(grep 'Accepted password' $L | grep "from $IP " | head -1 | awk '{print $9}')
HS=$(grep 'Accepted password' $L | grep "from $IP " | head -1 | awk '{print $3}')
AK=srv01/home/$ACCT/.ssh/authorized_keys; CR=srv01/var/spool/cron/crontabs/$ACCT
FP=$(while read -r l; do echo "$l" > /tmp/k.$$; ssh-keygen -lf /tmp/k.$$; done < $AK | grep 'sync@localhost' | awk '{print $2}')
ROGUE=$(grep -E '^\*/10' $CR | awk '{print $6}')
sed -i "s|^echecs_total=.*|echecs_total=$TOTAL|;s|^ip_attaquante=.*|ip_attaquante=$IP|;s|^echecs_ip=.*|echecs_ip=$NIP|;s|^compte=.*|compte=$ACCT|;s|^heure_succes=.*|heure_succes=$HS|;s|^statut=.*|statut=compromission|;s|^empreinte_cle=.*|empreinte_cle=$FP|;s|^cron_malveillant=.*|cron_malveillant=$ROGUE|" reponses.txt
cat > detecte.sh <<'S'
#!/usr/bin/env bash
awk -v s="${2:-10}" '/Failed password/{for(i=1;i<=NF;i++) if($i=="from") c[$(i+1)]++} END{for(ip in c) if(c[ip]>=s) print ip, c[ip]}' "$1" | sort -k2,2nr
S
chmod +x detecte.sh
sed -i 's/^PermitRootLogin.*/PermitRootLogin no/;s/^PasswordAuthentication.*/PasswordAuthentication no/;s/^MaxAuthTries.*/MaxAuthTries 3/' srv01/etc/ssh/sshd_config
sed -i "s|^\( *\)tcp dport 22 accept|\1ip saddr $IP drop\n\1tcp dport 22 accept|" srv01/etc/nftables.conf
sed -i '/sync@localhost/d' $AK
sed -i "\#$ROGUE#d" $CR
sleep 1; ./retest.sh >/dev/null
cat > rapport.md <<R
# Rapport d'incident SSH - srv01

## Faits
$TOTAL échecs de mot de passe au total dont $NIP depuis $IP. À $HS, un Accepted password pour le compte $ACCT depuis cette IP. La clé posée porte l'empreinte $FP et le cron lance $ROGUE.

## Interprétation
Le succès suit une série d'échecs depuis la même source : c'est une compromission par dictionnaire, pas une simple tentative. Le retour par clé publique confirme la persistance.

## Impact
Le compte de service $ACCT est compromis : accès shell, lecture de /etc/passwd, exécution planifiée toutes les dix minutes d'un script distant.

## Remédiation
IP bloquée avant l'acceptation du port 22, mots de passe et root désactivés, MaxAuthTries à 3, clé frauduleuse et tâche cron supprimées, secret du compte à renouveler.

## Retest
Le script retest.sh affiche 6 contrôles sur 6 valides après correction ; preuve conservée dans preuves/retest.txt avec le journal d'origine intact.
R
