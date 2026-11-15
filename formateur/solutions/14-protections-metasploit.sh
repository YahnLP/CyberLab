#!/usr/bin/env bash
set -e
tail -n +2 binaires.txt | awk '{l=0; if($0 !~ /Full RELRO/)l++; if($0 !~ /Canary found/)l++; if($0 !~ /NX enabled/)l++; if($0 !~ /PIE enabled/)l++; if(l>=3) print $NF}' > binaires-a-recompiler.txt
awk -F' : ' '!/^#/ && $2!=2{print $1}' aslr.txt > hotes-aslr-faible.txt
grep -F -f avis.txt msf-services.csv | cut -d, -f1 | sort -u > hotes-a-traiter.txt
M=$(grep -o 'auxiliary/[^ ]*' modules.txt)
for f in binaires-a-recompiler.txt hotes-aslr-faible.txt hotes-a-traiter.txt; do [ -s $f ] || echo aucun > $f; done
sed -i "s#^module_sans_exploitation=.*#module_sans_exploitation=$M#" reponses.txt
