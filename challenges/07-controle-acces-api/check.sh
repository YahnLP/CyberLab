. "$LAB_LIB"
phase "Contrôle d'accès et jetons"
check_set acces_non_autorises acces-non-autorises.txt; check_set reponses_bavardes reponses-bavardes.txt
check_kv limitation_en_place; check_kv utilisateur_du_jeton; check_kv role_du_jeton
finish "Audit d'API réalisé : défauts d'autorisation, fuites d'erreurs et jeton analysés."
