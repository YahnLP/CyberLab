. "$LAB_LIB"
phase "Audit des en-têtes et des cookies"
check_set audit audit.txt; check_set pages_en_erreur pages-en-erreur.txt; check_set cookies_sans_httponly cookies-sans-httponly.txt
finish "Audit HTTP réalisé : lacunes d'en-têtes, pages en erreur et cookies exposés identifiés."
