#!/usr/bin/env bash
set -e
: > failles.txt
grep -q 'htmlspecialchars' app/recherche.php || echo "recherche.php;xss" >> failles.txt
grep -q 'prepare(' app/login.php || echo "login.php;sqli" >> failles.txt
grep -q 'in_array' app/upload.php || echo "upload.php;upload" >> failles.txt
grep -q '^if (!hash_equals' app/profil.php || echo "profil.php;csrf" >> failles.txt
sed -i "s/^nb_failles=.*/nb_failles=$(wc -l < failles.txt)/;s/^correction_sqli=.*/correction_sqli=requete-parametree/;s/^correction_xss=.*/correction_xss=echappement-sortie/" reponses.txt
