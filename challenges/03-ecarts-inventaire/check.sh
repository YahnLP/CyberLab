. "$LAB_LIB"
phase "Rapprochement inventaire / réalité"
check_set inconnus inconnus.txt; check_set absents absents.txt
check_num hote_icmp_filtre; check_num adresses_utilisables
finish "Écarts identifiés : le réseau réel et l'inventaire sont rapprochés."
