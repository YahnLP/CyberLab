. "$LAB_LIB"
. "$CH/controls.sh"
. "$CH/gen-log.sh"
h(){ printf '%s' "$1" | sha256sum | cut -d' ' -f1; }
S="$WORK/srv01"; FAIL=0
phase(){ printf '\n  \033[1m%s\033[0m\n' "$1"; }
bad(){ ko "$1" >/dev/null; echo "    ✘ $1"; FAIL=1; }
good(){ echo "    ✔ $1"; }
truth(){ grep -m1 "^$1:" "$ANSWER_FILE" | cut -d: -f2-; }
given(){ grep -m1 "^$1=" "$WORK/reponses.txt" 2>/dev/null | cut -d= -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'; }
chk_ans(){ local v; v=$(given "$1"); if [ -z "$v" ]; then bad "$1 : non renseigné"; ANS_OK=0
  elif [ "$(h "$v")" = "$(truth "$1")" ]; then good "$1"; else bad "$1 : valeur incorrecte"; ANS_OK=0; fi; }
ANS_OK=1

phase "1. PRÉPARER · préserver la preuve"
P="$WORK/preuves"
if [ -f "$P/auth.log" ] && cmp -s "$P/auth.log" "$S/var/log/auth.log"; then good "copie de auth.log dans preuves/ (identique à l'original)"; else bad "preuves/auth.log absent ou différent de l'original"; fi
if [ -f "$P/SHA256SUMS" ] && grep -q 'auth.log' "$P/SHA256SUMS" && ( cd "$P" && sha256sum -c --status SHA256SUMS 2>/dev/null ); then good "SHA256SUMS valide (sha256sum -c)"; else bad "preuves/SHA256SUMS absent ou invalide"; fi
if [ "$(sha256sum "$S/var/log/auth.log" | cut -d' ' -f1)" = "$(truth _log)" ]; then good "journal original non altéré"; else bad "le journal original a été modifié"; fi

phase "2. DÉCOUVRIR / ÉNUMÉRER · quantifier l'attaque"
chk_ans echecs_total; chk_ans ip_attaquante; chk_ans echecs_ip

phase "3. VALIDER LE RISQUE · tentative ou compromission ?"
chk_ans compte; chk_ans heure_succes; chk_ans statut

phase "4. CONSERVER LA PREUVE · persistance de l'attaquant"
chk_ans empreinte_cle; chk_ans cron_malveillant

phase "5. DÉTECTER · règle de détection rejouable"
D="$WORK/detecte.sh"
if [ -x "$D" ]; then
  T=$(mktemp -d); RA="203.0.113.$((RANDOM%100+100))"; RN=$((RANDOM%30+30))
  gen_auth_log "$T/replay.log" "$RA" "$RN" svc-x "198.51.100.$((RANDOM%200+10))" "192.168.10.$((RANDOM%200+10))" "$((RANDOM*32768+RANDOM))" "$T/ts"
  o1=$(cd "$WORK" && timeout 10 ./detecte.sh "$S/var/log/auth.log" 2>/dev/null)
  o2=$(cd "$WORK" && timeout 10 ./detecte.sh "$T/replay.log" 2>/dev/null)
  o3=$(cd "$WORK" && timeout 10 ./detecte.sh "$T/replay.log" 100000 2>/dev/null)
  N1=$(grep 'Failed password' "$S/var/log/auth.log" | grep -c "from $(given ip_attaquante) ")
  if [ "$ANS_OK" = 1 ] && [ "$(echo "$o1" | wc -l)" = 1 ] && [ "$(echo "$o1" | awk '{print $1" "$2}')" = "$(given ip_attaquante) $N1" ]; then good "journal de l'incident : seule l'IP attaquante ressort (seuil 10 par défaut)"
  else bad "journal de l'incident : attendu une seule ligne 'IP NOMBRE' pour l'attaquant"; fi
  if [ "$(echo "$o2" | wc -l)" = 1 ] && [ "$(echo "$o2" | awk '{print $1" "$2}')" = "$RA $RN" ]; then good "rejeu sur un autre journal : détection correcte, sans faux positif"
  else bad "rejeu sur un autre journal : sortie attendue '$RA $RN'"; fi
  if [ -z "$o3" ]; then good "le seuil passé en 2e argument est respecté"; else bad "avec un seuil de 100000, rien ne doit sortir"; fi
  rm -rf "$T"
else bad "detecte.sh absent ou non exécutable (usage : ./detecte.sh FICHIER [SEUIL])"; fi

phase "6. REMÉDIER / 7. RETESTER · contenir et corriger"
OUT=$(run_controls); CTRL_OK=$(echo "$OUT" | sed -n 's/^RETEST : \([0-9]*\)\/6.*/\1/p'); echo "$OUT" | sed 's/^  \[/    [/;/^RETEST srv01/d'
[ "$CTRL_OK" = 6 ] && [ "$ANS_OK" = 1 ] || { FAIL=1; [ "$ANS_OK" = 1 ] || echo "    ✘ les contrôles reposent sur vos constats (reponses.txt) : corrigez d'abord les phases 2 à 4"; }
R="$P/retest.txt"
fresh=1
for f in "$S/etc/ssh/sshd_config" "$S/etc/nftables.conf" "$S"/home/*/.ssh/authorized_keys "$S"/var/spool/cron/crontabs/*; do [ -e "$f" ] && [ "$f" -nt "$R" ] && fresh=0; done
if [ -f "$R" ] && grep -q 'RETEST : 6/6' "$R" && [ $fresh = 1 ]; then good "preuves/retest.txt : 6/6, postérieur à la dernière correction"
else bad "lancez ./retest.sh APRÈS vos corrections (preuves/retest.txt doit afficher 6/6)"; fi

phase "8. RESTITUER · rapport d'incident"
M="$WORK/rapport.md"
if [ -f "$M" ] && ! grep -q 'A COMPLETER' "$M"; then
  okr=1
  for s in "Faits" "Interprétation" "Impact" "Remédiation" "Retest"; do
    w=$(awk -v n="$s" '/^## /{p=($0=="## " n);next} p' "$M" | wc -w)
    [ "$w" -ge 15 ] || { okr=0; bad "section « $s » trop courte ($w mots, 15 minimum)"; }
  done
  [ $okr = 1 ] && good "5 sections renseignées"
  for k in ip_attaquante compte empreinte_cle; do v=$(given $k); grep -qF -- "$v" "$M" && [ -n "$v" ] || { bad "le rapport doit citer $k"; okr=0; }; done
  F=$(awk '/^## /{p=($0=="## Faits");next} p' "$M")
  echo "$F" | grep -qw "$(given echecs_total)" && echo "$F" | grep -qw "$(given echecs_ip)" && [ -n "$(given echecs_total)" ] && good "la section Faits cite les chiffres observés" || bad "la section Faits doit citer echecs_total et echecs_ip"
else bad "rapport.md manquant ou contient encore « A COMPLETER »"; fi

echo
[ $FAIL = 0 ] && ok "Incident traité de bout en bout : preuve, détection, confinement, correction, retest, rapport." || exit 1
