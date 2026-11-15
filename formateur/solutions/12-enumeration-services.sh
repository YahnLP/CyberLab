#!/usr/bin/env bash
set -e
awk '$3=="IN" && $4=="A"{sub(/\.$/,"",$1); print $1}' axfr.txt | sort -u > /tmp/axfr.$$; sort -u dns-public.txt > /tmp/pub.$$
comm -13 /tmp/pub.$$ /tmp/axfr.$$ > hotes-internes.txt
grep 'NT_STATUS_OK' smb.txt | awk '{print $1}' > partages-anonymes.txt
C=$(head -1 snmp.txt | sed 's/.*-c \([^ ]*\).*/\1/'); K=$(grep sysDescr snmp.txt | sed 's/.*nas-01 \([^ ]*\)-amd64.*/\1/')
L=$(grep sysLocation snmp.txt | sed 's/.*STRING: //' | tr ' ' '-')
sed -i "s/^communaute_snmp=.*/communaute_snmp=$C/;s/^noyau_nas=.*/noyau_nas=$K/;s/^emplacement_nas=.*/emplacement_nas=$L/" reponses.txt
