. "$LAB_LIB"
phase "Qualification des alertes"
check_set vrais_positifs vrais-positifs.txt; check_set faux_positifs faux-positifs.txt; check_kv le_plus_grave
finish "Alertes qualifiées : seules les vulnérabilités réelles sont retenues pour le rapport."
