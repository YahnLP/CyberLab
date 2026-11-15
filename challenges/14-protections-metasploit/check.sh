. "$LAB_LIB"
phase "Durcissement et priorisation"
check_set binaires_a_recompiler binaires-a-recompiler.txt; check_set hotes_aslr_faible hotes-aslr-faible.txt; check_set hotes_a_traiter hotes-a-traiter.txt
check_kv module_sans_exploitation
finish "Surface de durcissement identifiée : binaires, ASLR et services à corriger en priorité."
