. "$LAB_LIB"
phase "1. Préserver la preuve"
P="$WORK/preuves"
if [ -f "$P/journal.log" ] && cmp -s "$P/journal.log" "$WORK/journal.log"; then echo "    ✔ copie de journal.log dans preuves/ (identique)"; else echo "    ✘ preuves/journal.log absent ou différent de l'original"; FAIL=1; fi
if [ -f "$P/SHA256SUMS" ] && grep -q 'journal.log' "$P/SHA256SUMS" && ( cd "$P" && sha256sum -c --status SHA256SUMS 2>/dev/null ); then echo "    ✔ SHA256SUMS valide (sha256sum -c)"; else echo "    ✘ preuves/SHA256SUMS absent ou invalide"; FAIL=1; fi
if [ "$(sha256sum "$WORK/journal.log" | cut -d' ' -f1)" = "$(truth_get _log)" ]; then echo "    ✔ journal original non altéré"; else echo "    ✘ le journal original a été modifié"; FAIL=1; fi
phase "2. Premières observations"
check_num nb_lignes; check_num nb_erreurs; check_kv hote_le_plus_actif
finish "Preuve préservée et premières mesures correctes."
