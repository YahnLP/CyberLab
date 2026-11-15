. "$LAB_LIB"
phase "Lecture du mandat"
check_kv clauses_manquantes; check_set autorisees autorisees.txt
phase "Cyber Kill Chain"
for k in etape_k1 etape_k2 etape_k3 etape_k4 etape_k5; do check_kv $k; done
finish "Mandat analysé : seules les actions couvertes par l'autorisation seront menées."
