# SIM24 · Synthèse : investiguer un incident avec plusieurs journaux

Durée : 1 h 30 · Prérequis : SIM13, SIM22, SIM23 · Missions associées : SIM24-1 (parcours pentest)

## Objectifs
- Croiser un journal web et un journal d'authentification autour d'une même adresse.
- Reconstituer une chronologie complète, de la reconnaissance à la connexion.
- Rédiger des constats exploitables et une réponse proportionnée.

## 1. L'essentiel
- Un incident laisse des traces dans **plusieurs sources** ; chacune est partielle. Le recoupement par un élément commun (ici une adresse externe) donne l'histoire entière.
- Une chronologie typique : nombreuses requêtes en erreur (404) qui sondent des chemins, un dépôt de fichier, la demande de ce fichier, puis des tentatives de connexion et une réussite.
- Les faits à relever sont toujours les mêmes : **qui** (adresse, compte), **quand** (heures), **quoi** (fichier, requêtes), **résultat** (réussi ou non).
- La réponse suit un ordre : contenir, préserver les preuves, comprendre, éradiquer, restaurer, tirer les enseignements.

## 2. En pratique
```
grep -v '^192\.168\.' acces-web.log | awk '{print $1}' | sort | uniq -c | sort -rn
grep '^ADRESSE ' acces-web.log | grep -c ' 404'
grep POST acces-web.log
grep uploads acces-web.log
grep 'Accepted password' auth-ssh.log
```

## 3. Lire le résultat
- Le volume de 404 d'une seule adresse indique une exploration, pas un usage normal.
- Un POST suivi d'une demande en 200 sur un fichier du dossier de dépôt signale un fichier déposé puis utilisé.
- Les échecs SSH suivis d'une réussite pour un compte donné désignent le compte à traiter en priorité.
- Vérifiez toujours la cohérence des heures entre les journaux.

## 4. Côté défense
- Isoler le serveur, bloquer l'adresse, copier le fichier déposé comme preuve avant retrait.
- Interdire l'exécution de scripts dans le dossier de dépôt et valider les fichiers acceptés.
- Passer SSH aux clés, limiter les tentatives, réinitialiser le compte touché.
- Conserver les journaux hors du serveur et rédiger un rapport daté avec les constats et les mesures.

## 5. Erreurs fréquentes
- Supprimer le fichier ou les journaux avant d'en garder une copie.
- Ne regarder qu'une source et manquer le lien entre elles.
- Bloquer l'adresse sans traiter le compte ni le fichier déposé.
- Omettre les heures : sans elles, pas de chronologie.

## 6. Exercices
1. Quelles sont les trois premières actions après la découverte d'un fichier déposé et appelé ?
<details><summary>Réponse</summary>
Isoler le serveur, copier le fichier et les journaux comme preuves, puis bloquer l'adresse source avant d'analyser.
</details>

2. Pourquoi croiser les deux journaux plutôt que d'analyser le web seul ?
<details><summary>Réponse</summary>
Le journal web montre l'intrusion, le journal SSH montre l'accès obtenu ensuite : ensemble ils établissent l'étendue de l'incident.
</details>

3. Que contient un bon rapport de fin d'investigation ?
<details><summary>Réponse</summary>
Contexte, chronologie datée, constats chiffrés, mesures prises, mesures à prévoir et preuves conservées.
</details>
