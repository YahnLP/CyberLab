#!/usr/bin/env bash
set -e
tail -n +2 inventaire.csv | cut -d';' -f1 | sort -u > /tmp/inv.$$
grep 'Status: Up' scan-ping.gnmap | awk '{print $2}' | sort -u > /tmp/ping.$$
grep lladdr arp.txt | awk '{print $1}' | sort -u > /tmp/arp.$$
sort -u /tmp/ping.$$ /tmp/arp.$$ > /tmp/vus.$$
comm -13 /tmp/inv.$$ /tmp/vus.$$ > inconnus.txt
comm -23 /tmp/inv.$$ /tmp/vus.$$ > absents.txt
F=$(comm -12 /tmp/inv.$$ /tmp/arp.$$ | comm -23 - /tmp/ping.$$)
P=$(sed 's#.*/##' cidr.txt)
sed -i "s/^hote_icmp_filtre=.*/hote_icmp_filtre=$F/;s/^adresses_utilisables=.*/adresses_utilisables=$(( (1 << (32-P)) - 2 ))/" reponses.txt
