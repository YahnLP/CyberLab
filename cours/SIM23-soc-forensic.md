# SIM23 · SOC, forensic et purple team

Durée : 1 h 30 · Prérequis : SIM08, SIM12 · Missions associées : SIM23-1, SIM23-2, SIM23-3 (parcours pentest)

## Objectifs
- Reconstituer une chronologie à partir d'un journal d'authentification.
- Mesurer la couverture de détection d'un exercice rouge/bleu autorisé.
- Contrôler l'intégrité de fichiers en comparant des empreintes à une référence.
- Décrire les premières mesures de réponse à incident.

## 1. L'essentiel
- Le **SOC** surveille, trie et qualifie les alertes. Il s'appuie sur des journaux fiables et conservés.
- Une **chronologie** ordonne les faits (heure, source, compte, résultat) pour comprendre ce qui s'est passé. Un schéma classique : une série d'échecs depuis une même adresse, puis une réussite.
- Un exercice **purple team** associe équipe rouge (qui déroule un scénario autorisé) et équipe bleue (qui mesure ce qu'elle détecte). Le résultat est un **taux de détection** et une liste d'étapes à couvrir.
- Le contrôle d'**intégrité** compare les empreintes SHA-256 actuelles à une référence saine : fichier modifié, ajouté ou supprimé.
- En cas d'incident : contenir, préserver les preuves, comprendre, éradiquer, restaurer, tirer les enseignements.

## 2. En pratique
```
grep "Failed password" auth.log | grep -o "from [0-9.]*" | sort | uniq -c | sort -rn
grep "Accepted password" auth.log
awk -F';' '$3=="non" {print $2}' exercice-purple.csv
awk '{print $2}' empreintes-reference.txt | sort > ref.txt
awk '{print $2}' empreintes-actuelles.txt | sort > act.txt
comm -13 ref.txt act.txt        # présents seulement dans l'état actuel
comm -23 ref.txt act.txt        # présents seulement dans la référence
```

## 3. Lire le résultat
- Une adresse externe qui cumule des échecs puis réussit est le **fait central** : notez l'heure de la réussite et le compte.
- Une étape non détectée est une **lacune** ; la première étape non détectée est souvent la plus utile à corriger.
- Taux de détection = étapes détectées ÷ étapes totales × 100.
- Un fichier **ajouté** inattendu ou un fichier système **modifié** sans changement planifié sont des indices forts de compromission.

## 4. Côté défense
- Conserver les journaux hors du serveur, protégés en écriture, et synchroniser l'heure.
- Alerter sur les séries d'échecs suivies d'une réussite ; passer aux clés SSH et limiter les tentatives.
- Rejouer l'exercice après ajout de règles pour mesurer le progrès.
- Restaurer depuis une sauvegarde saine plutôt que « nettoyer » un système compromis ; refaire la référence d'empreintes après la restauration, pas avant.

## 5. Erreurs fréquentes
- Effacer les journaux ou le fichier suspect avant de l'avoir copié comme preuve.
- Recalculer la référence à partir de l'état compromis.
- Confondre l'heure du journal et l'heure locale sans vérifier le fuseau.
- Désactiver les règles qui font du bruit au lieu de les affiner.

## 6. Exercices
1. 18 échecs puis une réussite depuis la même adresse externe sur le compte `deploy`. Quelles actions ?
<details><summary>Réponse</summary>
Bloquer l'adresse, verrouiller ou réinitialiser le compte, examiner la session ouverte et les commandes lancées, conserver les journaux, passer l'accès SSH à clés uniquement.
</details>

2. Sur 8 étapes, 3 ne sont pas détectées. Quel est le taux de détection et la suite ?
<details><summary>Réponse</summary>
5 sur 8, soit 63 % (arrondi). Écrire des règles pour les 3 étapes non couvertes, rejouer le scénario, mesurer à nouveau.
</details>

3. Pourquoi ne pas recalculer la référence d'empreintes après une compromission ?
<details><summary>Réponse</summary>
La nouvelle référence intégrerait les fichiers modifiés ou ajoutés par l'attaquant et masquerait la compromission. On restaure d'abord depuis un état sain, puis on refait la référence.
</details>
