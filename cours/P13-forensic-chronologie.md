# P13 · Forensic : chronologie et indicateurs

Durée : 1 h 30 · Prérequis : P8 · Défi associé : 16 · Reconstituer une chronologie

## Objectifs
- Construire une chronologie à partir de métadonnées de fichiers.
- Rapprocher des empreintes de fichiers d'indicateurs de compromission (IOC).
- Identifier la persistance laissée par un intrus.

## 1. Principes
Travailler sur une **copie**, calculer une empreinte (`sha256sum`) avant et après, noter chaque manipulation. Les horodatages se lisent en **UTC** ; convertir avec `date -u -d @<epoch>`.

## 2. Chronologie
Une ligne par événement : `epoch;chemin;type;utilisateur`. Types usuels : B (création), M (modification), A (accès), C (changement de métadonnées). `sort -n` remet l'ordre ; le premier événement anormal (fichier exécutable dans un dossier de téléversement, par exemple) marque le début probable de la compromission.

## 3. Indicateurs
Un IOC peut être une empreinte, un nom de fichier, une adresse. Comparer `sha256sum` des fichiers collectés à la liste d'IOC : une correspondance prouve la présence ; une absence ne prouve pas l'innocence (le fichier a pu être modifié).

## 4. Persistance
Chercher ce qui survit à un redémarrage : tâches cron, services systemd, clés SSH ajoutées, profils shell. Une modification dans `/etc/cron.d` juste après la création d'un fichier suspect est un signal fort.

## 5. Côté défense
Journaux centralisés, intégrité des fichiers (AIDE), alerte sur l'écriture de scripts dans les dossiers de téléversement, interdiction d'exécution depuis ces dossiers.

## 6. Exercices
1. Pourquoi convertir tous les horodatages en UTC ?
<details><summary>Réponse</summary>

Pour comparer des sources de fuseaux et d'heures d'été différents sans erreur d'une ou deux heures.
</details>

2. Aucun fichier ne correspond aux IOC. Peut-on conclure à l'absence d'intrusion ?
<details><summary>Réponse</summary>

Non : l'attaquant a pu recompiler ou renommer ses outils. On élargit à la chronologie, aux journaux et à la persistance.
</details>
