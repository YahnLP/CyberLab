#!/usr/bin/env bash
set -e
mkdir -p preuves && cp -p journal.log preuves/ && ( cd preuves && sha256sum journal.log > SHA256SUMS )
H=$(awk '{print $3}' journal.log | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')
sed -i "s/^nb_lignes=.*/nb_lignes=$(wc -l < journal.log)/;s/^nb_erreurs=.*/nb_erreurs=$(grep -c ERREUR journal.log)/;s/^hote_le_plus_actif=.*/hote_le_plus_actif=$H/" reponses.txt
