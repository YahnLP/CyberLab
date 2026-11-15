# SIM19 · Cloud : audit d'un compte (droits, stockage, clés)

Durée : 1 h 15 · Prérequis : P4 · Missions associées : SIM19-1, SIM19-2 (parcours pentest)

## Objectifs
- Relire des politiques d'accès et repérer un droit total.
- Repérer un espace de stockage ouvert au public, non chiffré ou sans journalisation.
- Identifier les clés d'accès anciennes.
- Prioriser les corrections d'un compte cloud.

## 1. L'essentiel
- Dans le cloud, la **frontière de sécurité est l'identité** : qui peut faire quoi sur quelle ressource. Une politique qui autorise toutes les actions sur toutes les ressources (`*` / `*`) donne les clés de tout le compte.
- Le **moindre privilège** consiste à ne donner que les actions et ressources nécessaires.
- Un espace de stockage peut être **public** par erreur. Il doit aussi être **chiffré** et **journalisé** pour que les accès laissent une trace.
- Les **clés d'accès** ont une durée de vie : une clé ancienne, jamais renouvelée, augmente le risque si elle a fuité.
- Ici, le compte est entièrement fictif : on audite des fichiers fournis, sans aucune connexion à un vrai service.

## 2. En pratique
```
grep '"actions":\["\*"\]' politiques-iam.jsonl     # droit total
grep public-lecture stockage.csv                    # espace ouvert à tous
awk -F';' '$3=="non" {print $1}' stockage.csv       # espaces non chiffrés
sort -t';' -k2 cles-acces.csv | head -3             # clés les plus anciennes
```

## 3. Lire le résultat
- Un seul utilisateur avec `*` / `*` est déjà trop : c'est un constat majeur même s'il s'agit d'un compte de service.
- Un espace en `public-lecture` est lisible par n'importe qui sur Internet : vérifier son contenu.
- Une colonne chiffrement ou journalisation à `non` est un écart à corriger, plus ou moins urgent selon la sensibilité des données.
- La date de création d'une clé donne son âge : au-delà de 90 jours, prévoir le renouvellement.

## 4. Côté défense
- Politiques minimales par utilisateur et par ressource, revue régulière.
- Stockage privé par défaut, chiffrement et journalisation activés partout.
- Rotation des clés, authentification multifacteur pour les comptes humains.
- Alertes sur les changements de politique et sur les accès anormaux.

## 5. Erreurs fréquentes
- Donner un droit total « temporairement » et l'oublier.
- Rendre un espace public pour dépanner un partage ponctuel.
- Désactiver la journalisation pour économiser : on ne pourra plus enquêter.
- Supprimer une clé sans vérifier ce qui l'utilise (risque d'arrêt de service).

## 6. Exercices
1. Un compte de sauvegarde a `actions: ["*"]`. Quelle correction ?
<details><summary>Réponse</summary>
Restreindre aux seules actions nécessaires (lecture et écriture sur l'espace de sauvegarde), tester la sauvegarde, puis relire la politique pour prouver la correction.
</details>

2. Un espace public contient des documents RH. Que faire en premier ?
<details><summary>Réponse</summary>
Le passer en privé immédiatement, consulter les journaux d'accès pour évaluer l'exposition, informer le responsable des données, puis revoir le processus qui l'avait ouvert.
</details>

3. Pourquoi la journalisation compte-t-elle dans l'audit ?
<details><summary>Réponse</summary>
Sans journal, un accès anormal ne laisse aucune trace : on ne peut ni détecter ni enquêter. Elle est une condition de la détection et de la preuve.
</details>
