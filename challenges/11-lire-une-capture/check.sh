. "$LAB_LIB"
phase "Identifiants exposés"
for k in serveur_ftp ftp_utilisateur ftp_mot_de_passe http_utilisateur http_mot_de_passe; do check_kv $k; done
phase "Anomalie ARP"
check_kv mac_usurpateur; check_num nb_reponses_usurpees
finish "Capture analysée : identifiants en clair et empoisonnement ARP identifiés."
