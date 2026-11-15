#!/usr/bin/env bash
# Corrigé formateur : à lancer depuis ~/atelier/02-fiche-reconnaissance
set -e
EXA=$(awk '$1=="OUT"{print $2}' scope.txt | sed -n 1p); EXB=$(awk '$1=="OUT"{print $2}' scope.txt | sed -n 2p)
awk -v a="$EXA" -v b="$EXB" '
 $2=="IN" && $3=="A" {ip[$1]=$4}
 $2=="IN" && $3=="CNAME" {al[$1]=$4}
 function ok(x){return x ~ /^198\.51\.100\./ && x!=a && x!=b}
 END{for(h in ip) if(ok(ip[h])) print h".exemple.test"; for(n in al) if(ok(ip[al[n]])) print n".exemple.test"}' zone.txt > perimetre.txt
NMX=$(grep -c ' IN MX ' zone.txt)
S=$(grep -i '^Server:' headers.txt | sed 's/^[^:]*: *//')
case "$S" in nginx*) P=nginx; V=${S#nginx/};; *) P=apache; V=$(echo "$S" | sed 's#Apache/\([0-9.]*\).*#\1#');; esac
M=server; grep -qi '^X-Powered-By' headers.txt && M=server,x-powered-by
sed -i "s/^nb_mx=.*/nb_mx=$NMX/;s/^serveur=.*/serveur=$P/;s/^version_annoncee=.*/version_annoncee=$V/;s/^statut_version=.*/statut_version=hypothese/;s/^en_tetes_a_masquer=.*/en_tetes_a_masquer=$M/" reponses.txt
