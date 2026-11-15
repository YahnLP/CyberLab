. "$LAB_LIB"
phase "Fiche de reconnaissance"
check_set perimetre perimetre.txt
check_num nb_mx; check_kv serveur; check_num version_annoncee; check_kv statut_version; check_kv en_tetes_a_masquer
finish "Fiche complète : périmètre respecté, faits et hypothèses séparés."
