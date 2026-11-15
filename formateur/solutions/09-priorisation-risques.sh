#!/usr/bin/env bash
set -e
cat > /tmp/cvss.$$.awk <<'AWK'
function ru(x,  i){ i=int(x*100000+0.5); if (i%10000==0) return i/100000; return (int(i/10000)+1)/10 }
function w(m,v,s){
  if(m=="AV") return (v=="N")?0.85:(v=="A")?0.62:(v=="L")?0.55:0.2
  if(m=="AC") return (v=="L")?0.77:0.44
  if(m=="PR") { if(v=="N") return 0.85; if(v=="L") return (s=="C")?0.68:0.62; return (s=="C")?0.5:0.27 }
  if(m=="UI") return (v=="N")?0.85:0.62
  return (v=="H")?0.56:(v=="L")?0.22:0 }
{ delete M; n=split($1,p,"/"); for(i=1;i<=n;i++){ split(p[i],kv,":"); M[kv[1]]=kv[2] }
  s=M["S"]; iss=1-(1-w("C",M["C"]))*(1-w("C",M["I"]))*(1-w("C",M["A"]))
  imp=(s=="U")?6.42*iss:7.52*(iss-0.029)-3.25*((iss-0.02)^15)
  ex=8.22*w("AV",M["AV"])*w("AC",M["AC"])*w("PR",M["PR"],s)*w("UI",M["UI"])
  if(imp<=0) sc=0; else if(s=="U") sc=ru((imp+ex>10)?10:imp+ex); else sc=ru((1.08*(imp+ex)>10)?10:1.08*(imp+ex))
  printf "%.1f\n", sc }
AWK
: > priorites.csv; best=""; bs=0; n1=0; ids=""
while IFS=';' read -r id titre vec act; do [ "$id" = id ] && continue
  sc=$(echo "$vec" | gawk -f /tmp/cvss.$$.awk); ex=$(awk -F';' -v a="$act" '$1==a{print $2}' actifs.csv); cr=$(awk -F';' -v a="$act" '$1==a{print $3}' actifs.csv)
  p=P3
  if awk "BEGIN{exit !($sc>=7.0)}" || { awk "BEGIN{exit !($sc>=4.0)}" && [ $ex = internet ]; }; then p=P2; fi
  if awk "BEGIN{exit !($sc>=9.0)}" || { awk "BEGIN{exit !($sc>=7.0)}" && [ $ex = internet ] && [ $cr = haute ]; }; then p=P1; n1=$((n1+1)); ids+="$id "; awk "BEGIN{exit !($sc>$bs)}" && { bs=$sc; best=$id; }; fi
  echo "$id;$sc;$p" >> priorites.csv
done < constats.csv
sed -i "s/^premiere_action=.*/premiere_action=$best/;s/^nombre_p1=.*/nombre_p1=$n1/" reponses.txt
cat > synthese.md <<S
# Synthèse pour la direction
Les constats $ids sont classés P1 : ils combinent une gravité technique élevée et un actif exposé ou critique. La première action concerne $best, au score le plus élevé de cette catégorie. Il faut décider d'allouer une équipe cette semaine pour corriger ces constats avant les autres, puis planifier un retest qui rejoue exactement les mêmes mesures et confirme la fermeture des failles.
S
