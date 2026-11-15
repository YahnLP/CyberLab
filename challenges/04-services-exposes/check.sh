. "$LAB_LIB"
phase "Exposition des services"
check_num ports_ouverts; check_num ports_filtres
check_set non_conformes non-conformes.txt; check_set en_clair en-clair.txt
finish "Surface d'exposition qualifiée : écarts à la politique et protocoles en clair identifiés."
