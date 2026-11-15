. "$LAB_LIB"
phase "DNS, SMB, SNMP"
check_set hotes_internes_exposes hotes-internes.txt; check_set partages_anonymes partages-anonymes.txt
for k in communaute_snmp noyau_nas emplacement_nas; do check_kv $k; done
finish "Énumération analysée : expositions sans authentification identifiées et à corriger."
