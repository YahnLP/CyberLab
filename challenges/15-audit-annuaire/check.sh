. "$LAB_LIB"
phase "Audit de l'annuaire"
check_set comptes_kerberoastables comptes-kerberoastables.txt; check_set comptes_sans_preauth comptes-sans-preauth.txt
check_set admins_inactifs admins-inactifs.txt; check_set admins_sans_expiration admins-sans-expiration.txt
check_num nb_comptes_actifs; check_kv correction_services
finish "Annuaire audité : comptes exposés identifiés et correction durable choisie."
