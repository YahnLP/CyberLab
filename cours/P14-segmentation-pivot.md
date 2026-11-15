# P14 · Segmentation et mouvement latéral

Durée : 1 h 15 · Prérequis : P2, P3 · Défi associé : 17 · Segmentation et pivot

## Objectifs
- Lire une matrice de flux et en déduire ce qu'un hôte compromis peut atteindre.
- Repérer les règles trop larges et mesurer le nombre de sauts vers un actif sensible.

## 1. Mouvement latéral
Une intrusion s'arrête rarement au premier hôte. Ce qui limite la suite, c'est la **segmentation** : quelles zones peuvent initier une connexion vers quelles autres, sur quels ports.

## 2. Lire une matrice de flux
Une règle se lit « source -> destination, protocole/port ». Un hôte compromis de la zone A atteint la zone B si une règle l'autorise, puis tout ce que B peut atteindre à son tour : c'est une **fermeture transitive**. Le nombre de sauts vers la zone des données est un bon indicateur de profondeur de défense.

## 3. Règles trop larges
Un port « any », une source ou une destination « any », une règle « tout depuis la DMZ » annulent la segmentation. Une règle légitime est précise : une source, une destination, un port, un motif.

## 4. Côté défense
Refuser par défaut, autoriser au plus juste, interdire les flux directs entre la DMZ et les données, administrer via une zone dédiée avec bastion, journaliser les refus.

## 5. Erreurs fréquentes
- Raisonner en « une règle » au lieu de chemins composés de plusieurs règles.
- Oublier qu'une règle est unidirectionnelle (le retour est géré par le suivi de connexion).

## 6. Exercices
1. La DMZ peut joindre l'application, qui peut joindre la base. La DMZ atteint-elle la base ?
<details><summary>Réponse</summary>

Indirectement oui, en deux sauts : un hôte de la DMZ compromis peut pivoter par l'application. Le risque dépend de la sécurité de l'application.
</details>

2. Quelle règle ajouter pour réduire le risque d'un « any » depuis la DMZ ?
<details><summary>Réponse</summary>

La remplacer par les flux strictement nécessaires (un port, une destination), et supprimer tout accès direct DMZ vers données.
</details>
