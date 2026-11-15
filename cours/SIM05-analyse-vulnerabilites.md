# SIM05 · Analyse de vulnérabilités et priorisation

Durée : 1 h 30 · Prérequis : SIM03, SIM04 · Missions associées : SIM05-1, SIM05-2 (parcours pentest)

## Objectifs
- Relier un produit et une version relevés au scan à un avis de sécurité.
- Lire un score de gravité (CVSS) et savoir s'il existe un exploit public.
- Classer des constats selon la gravité ET l'exposition.
- Rédiger un plan de correction avec retest.

## 1. L'essentiel
- Une **vulnérabilité** est une faiblesse connue d'un produit dans certaines versions. Un **avis de sécurité** donne l'identifiant, la version corrigée, le score et, parfois, la présence d'un exploit public.
- Le **score CVSS** (0 à 10) mesure la gravité technique. Il ne dit pas si l'organisation est réellement en danger : il faut y ajouter l'**exposition** (accessible depuis Internet, depuis le réseau interne, depuis un seul poste) et l'**intérêt** de la cible.
- La version affichée par un service est une **bannière** : elle peut être masquée ou fausse. Un constat se confirme par un second indice avant d'être affirmé.
- Une liste de constats sans ordre n'aide personne : on **priorise**, puis on corrige, puis on **retest**.

## 2. En pratique
```
nmap -sV -p- 192.168.20.12          # produits et versions, tous les ports
cat avis-securite.csv               # id;produit;corrigé_dans;score;exploit_public
```
Raisonnement pour un service relevé en `nginx 1.14.2` :
```
avis nginx : corrigé dans 1.18.0   ->   1.14.2 < 1.18.0   ->   service concerné
```
Grille simple de priorisation :
```
score = gravité × exposition
exposition : 3 si adresse publique dans le DNS, 1 sinon
```

## 3. Lire le résultat
- Comparez chaque version à la colonne « corrigé dans » : strictement inférieure = concerné ; égale ou supérieure = non concerné.
- Un exploit public (`oui`) augmente l'urgence : l'attaque est à la portée de n'importe qui.
- Deux constats de même gravité ne se traitent pas dans le même ordre si l'un est exposé à Internet et l'autre est interne.
- Notez l'hypothèse : « bannière lue à telle date, à confirmer par le propriétaire du serveur ».

## 4. Côté défense
- Maintenir un inventaire des produits et versions, et le croiser régulièrement avec les avis.
- Corriger d'abord ce qui est grave et exposé, tester la mise à jour, prévoir un retour arrière.
- Relancer le scan après correction : le retest est la preuve de fermeture du constat.
- Réduire la surface : ce qui n'est pas exposé n'a pas besoin d'être corrigé en urgence, mais doit l'être ensuite.

## 5. Erreurs fréquentes
- Traiter selon le score seul, sans regarder l'exposition.
- Masquer la bannière et considérer le problème réglé : la faille est toujours là.
- Tout corriger en même temps sans test ni plan de retour.
- Affirmer qu'un service « est vulnérable » sur la seule foi d'une bannière.

## 6. Exercices
1. Un service est en `Samba 4.9.5`, l'avis indique « corrigé dans 4.13.0 », CVSS 7,5, exploit public : oui. Est-il concerné ? Quelle urgence ?
<details><summary>Réponse</summary>
Oui : 4.9.5 est inférieure à 4.13.0. L'urgence est élevée à cause de l'exploit public ; elle dépend ensuite de l'exposition (Internet ou interne). Mesure : mise à jour testée, puis retest par un nouveau scan.
</details>

2. Constat A : gravité 5, serveur interne (exposition 1). Constat B : gravité 3, serveur public (exposition 3). Lequel d'abord, avec la grille « gravité × exposition » ?
<details><summary>Réponse</summary>
A vaut 5, B vaut 9 : on traite B d'abord. Le constat moins grave mais exposé à Internet présente le risque le plus immédiat avec cette grille.
</details>

3. Pourquoi relancer le scan après la correction ?
<details><summary>Réponse</summary>
C'est le retest : il prouve que la version corrigée est bien en place et que le constat est fermé, preuve à joindre au rapport.
</details>
