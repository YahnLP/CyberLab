# SIM21 · Annuaire : revue des comptes et de la politique de mot de passe

Durée : 1 h 15 · Prérequis : P4, SIM06 · Missions associées : SIM21-1, SIM21-2 (parcours pentest)

## Objectifs
- Relire un export d'annuaire et repérer comptes à privilèges, comptes inactifs et mots de passe sans expiration.
- Évaluer une politique de mot de passe (longueur, verrouillage).
- Repérer les comptes de service qui ont des droits d'administration.
- Proposer un plan de nettoyage priorisé.

## 1. L'essentiel
- L'**annuaire** centralise les comptes et les groupes d'une organisation. Le groupe d'administration du domaine détient tous les droits : moins il compte de membres, mieux c'est.
- Un compte **inactif mais activé** est une porte oubliée : personne ne remarque son utilisation.
- Un mot de passe **sans expiration** n'est jamais renouvelé : s'il a fuité un jour, il reste valable.
- Une politique solide fixe une longueur minimale suffisante et un **verrouillage** après quelques échecs ; un seuil de 0 signifie des essais illimités.
- Un **compte de service** doit avoir les droits strictement nécessaires, jamais ceux d'un administrateur du domaine.
- Ici, l'annuaire est un export fictif : on travaille sur des fichiers fournis.

## 2. En pratique
```
grep -c "Admins du domaine" export-annuaire.csv                     # nombre d'administrateurs
awk -F';' '$3<"2026-08-17" && $5=="oui" {print $1}' export-annuaire.csv    # inactifs encore activés
awk -F';' '$4=="oui" {print $1}' export-annuaire.csv                # mots de passe sans expiration
grep Minimum politique-mdp.txt                                      # longueur minimale
grep "Admins du domaine" comptes-service.csv                        # comptes de service à privilèges
```

## 3. Lire le résultat
- Chaque administrateur du domaine doit avoir une justification ; deux ou trois comptes nominatifs suffisent souvent.
- La date de dernière connexion se compare comme du texte au format AAAA-MM-JJ.
- Une longueur minimale de 6 ou 8 caractères est faible ; viser 14 ou plus.
- Un compte de service administrateur du domaine est un constat majeur : s'il est compromis, tout le domaine l'est.

## 4. Côté défense
- Désactiver (avant de supprimer) les comptes inactifs, après vérification avec le responsable.
- Réduire les administrateurs, utiliser des comptes d'administration séparés des comptes de bureautique.
- Imposer l'expiration ou, mieux, des mots de passe longs et un contrôle contre les mots de passe courants.
- Revoir les comptes de service et leur donner des droits ciblés.

## 5. Erreurs fréquentes
- Supprimer d'un coup tous les comptes inactifs sans vérifier ceux qui servent à des tâches planifiées.
- Imposer un changement quotidien : les utilisateurs choisissent alors des mots de passe faibles.
- Oublier les comptes de service dans la revue.
- Désactiver la complexité « pour faciliter ».

## 6. Exercices
1. L'export compte cinq membres dans « Admins du domaine » pour douze comptes. Que recommandez-vous ?
<details><summary>Réponse</summary>
Réduire à ce qui est nécessaire (deux ou trois comptes nominatifs justifiés), séparer comptes d'administration et comptes de bureautique, et documenter chaque exception.
</details>

2. Un compte n'a pas été utilisé depuis mars et est encore actif. Quelle démarche ?
<details><summary>Réponse</summary>
Vérifier avec le responsable s'il est toujours utile, le désactiver (sans supprimer), surveiller les erreurs pendant une période, puis le supprimer si rien ne se manifeste.
</details>

3. `LockoutBadCount = 0` : pourquoi est-ce un constat ?
<details><summary>Réponse</summary>
Il n'y a aucun verrouillage : un attaquant peut essayer des mots de passe sans limite. Fixer un seuil (par exemple 5 à 10) avec une durée de verrouillage, et alerter sur les verrouillages en série.
</details>
