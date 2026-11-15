. "$LAB_LIB"
phase "Segmentation"
check_set zones_atteignables zones-atteignables.txt; check_set regles_larges regles-larges.txt; check_num sauts_vers_db
finish "Segmentation évaluée : chemins de pivot, règles larges et profondeur identifiés."
