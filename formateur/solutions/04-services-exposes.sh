#!/usr/bin/env bash
set -e
grep '^Host:' scan.gnmap | awk -F'\t' '{split($1,a," "); ip=a[2]; n=split($2,p,", "); sub(/^Ports: /,"",p[1]); for(i=1;i<=n;i++){split(p[i],f,"/"); print ip, f[1], f[2]}}' > /tmp/ports.$$
OPEN=$(awk '$3=="open"' /tmp/ports.$$ | wc -l); FILT=$(awk '$3=="filtered"' /tmp/ports.$$ | wc -l)
awk -F';' 'NR>1{print $1, $2}' politique.csv > /tmp/pol.$$
awk 'NR==FNR{n=split($2,a,","); for(i=1;i<=n;i++) ok[$1":"a[i]]=1; next} $3=="open" && !(($1":"$2) in ok){print $1":"$2}' /tmp/pol.$$ /tmp/ports.$$ > non-conformes.txt
awk '$3=="open" && ($2==21||$2==23){print $1":"$2}' /tmp/ports.$$ > en-clair.txt
[ -s non-conformes.txt ] || echo aucun > non-conformes.txt; [ -s en-clair.txt ] || echo aucun > en-clair.txt
sed -i "s/^ports_ouverts=.*/ports_ouverts=$OPEN/;s/^ports_filtres=.*/ports_filtres=$FILT/" reponses.txt
