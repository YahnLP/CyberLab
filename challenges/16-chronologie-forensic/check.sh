. "$LAB_LIB"
phase "Chronologie et indicateurs"
check_set fichiers_ioc fichiers-ioc.txt; check_kv heure_debut_utc; check_kv fichier_persistance; check_num nb_evenements_apres
finish "Chronologie reconstituée : début de l'intrusion, indicateurs et persistance identifiés."
