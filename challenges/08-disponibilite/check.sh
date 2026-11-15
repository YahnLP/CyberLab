. "$LAB_LIB"
phase "Saturation, amplification, sauvegardes"
for k in syn_recv bande_recue_mbps rpo_reel_heures; do check_num $k; done
for k in origine_flood syncookies_actifs plus_amplifiant rpo_conforme derniere_restauration; do check_kv $k; done
finish "Disponibilité évaluée : attaque qualifiée, amplification chiffrée, sauvegardes mesurées."
