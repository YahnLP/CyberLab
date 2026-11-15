. "$LAB_LIB"
phase "Revue de code"
check_set failles failles.txt; check_num nb_failles; check_kv correction_sqli; check_kv correction_xss
finish "Revue terminée : failles réelles identifiées, corrections durables choisies."
