# Contrôles de remédiation (utilisés par retest.sh ET par check.sh). Requiert $WORK.
SSHD=/usr/sbin/sshd
ans(){ grep -m1 "^$1=" "$WORK/reponses.txt" 2>/dev/null | cut -d= -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'; }
run_controls() {
  local S="$WORK/srv01" n=0 eff rc ip acct fpr rogue
  ip=$(ans ip_attaquante); acct=$(ans compte); fpr=$(ans empreinte_cle); rogue=$(ans cron_malveillant)
  echo "RETEST srv01 - $(date '+%Y-%m-%d %H:%M:%S')"
  c(){ if [ "$1" = 1 ]; then echo "  [OK] $2"; n=$((n+1)); else echo "  [KO] $2"; fi; }
  eff=$($SSHD -T -f "$S/etc/ssh/sshd_config" -h "$S/etc/ssh/ssh_host_ed25519_key" 2>&1); rc=$?
  if [ $rc -ne 0 ]; then
    c 0 "sshd_config invalide (sshd -T) : $(echo "$eff" | head -1)"; c 0 "PermitRootLogin non évalué"; c 0 "MaxAuthTries non évalué"
  else
    c "$(echo "$eff" | grep -qx 'passwordauthentication no' && echo 1 || echo 0)" "authentification par mot de passe désactivée (sshd -T)"
    c "$(echo "$eff" | grep -qx 'permitrootlogin no' && echo 1 || echo 0)" "connexion root interdite (sshd -T)"
    c "$(echo "$eff" | awk '$1=="maxauthtries"{print ($2<=3)?1:0}')" "MaxAuthTries <= 3 (sshd -T)"
  fi
  c "$(awk -v ip="$ip" 'BEGIN{d=0;a=0} /^[ \t]*#/{next} { if(!d && ip!="" && index($0,"ip saddr " ip) && $0 ~ /drop/) d=NR; if(!a && $0 ~ /tcp dport 22 .*accept|tcp dport 22 accept/) a=NR } END{print (d>0 && (a==0 || d<a))?1:0}' "$S/etc/nftables.conf" 2>/dev/null)" "IP ${ip:-?} bloquée AVANT la règle d'acceptation du port 22 (nftables)"
  local ak="$S/home/$acct/.ssh/authorized_keys" nk=0 bad=0 l f
  if [ -n "$acct" ] && [ -f "$ak" ]; then
    f=$(mktemp)
    while IFS= read -r l; do case "$l" in ''|'#'*) continue;; esac
      printf '%s\n' "$l" > "$f"; nk=$((nk+1))
      [ "$(ssh-keygen -lf "$f" 2>/dev/null | awk '{print $2}')" = "$fpr" ] && bad=1
    done < "$ak"; rm -f "$f"
  fi
  c "$([ -n "$fpr" ] && [ $nk -ge 1 ] && [ $bad -eq 0 ] && echo 1 || echo 0)" "clé frauduleuse retirée, clé légitime conservée (ssh-keygen -lf)"
  local cr="$S/var/spool/cron/crontabs/$acct"
  c "$([ -n "$rogue" ] && [ -f "$cr" ] && ! grep -qF -- "$rogue" "$cr" && grep -q 'backup.sh' "$cr" && echo 1 || echo 0)" "tâche cron frauduleuse supprimée, sauvegarde légitime conservée"
  echo "RETEST : $n/6"
  CTRL_OK=$n
}
