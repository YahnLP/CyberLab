# SIM18 · IoT et OT : inventaire, exposition et segmentation

Durée : 1 h 15 · Prérequis : P2, SIM12 · Missions associées : SIM18-1, SIM18-2 (parcours pentest)

## Objectifs
- Dresser l'inventaire d'équipements connectés (IoT) et industriels (OT) et repérer ceux qui sont trop exposés.
- Relire des règles de pare-feu entre zones et relever les flux interdits.
- Proposer une segmentation en zones avec des flux justifiés.

## 1. L'essentiel
- L'**IoT** désigne les objets connectés (caméras, badgeuses, thermostats) ; l'**OT** désigne les équipements qui pilotent des machines (automates, capteurs de production). Leur priorité est la **disponibilité** et la **sûreté** : on ne les redémarre pas comme un poste de bureautique.
- Beaucoup de ces équipements parlent des protocoles **anciens et sans chiffrement** (par exemple telnet, ou des protocoles industriels sans authentification) et reçoivent peu de mises à jour. On ne peut pas toujours les corriger : on **limite ce qui peut les atteindre**.
- La **segmentation** découpe le réseau en **zones** (bureautique, production, invités, supervision). Les flux entre zones passent par un pare-feu et ne sont autorisés que s'ils sont **justifiés**.
- On ne communique jamais avec ces équipements pour « tester » : l'audit se fait sur un **inventaire** et sur la **configuration** du pare-feu. Cette leçon **n'enseigne aucune commande d'écriture ni de pilotage** : un ordre envoyé à un automate peut arrêter une chaîne de production ou mettre en danger des personnes.

## 2. En pratique (fichiers fournis, rien n'est envoyé aux équipements)
```
awk -F";" 'NR>1' inventaire-equipements.csv | wc -l                         # nombre d'équipements
awk -F";" '$3=="production" && $6=="oui" {print $1}' inventaire-equipements.csv   # production joignable depuis la bureautique
awk -F";" '$4=="telnet"' inventaire-equipements.csv | wc -l                  # protocole sans chiffrement
awk -F";" 'NR>1 && $7<=2021' inventaire-equipements.csv | wc -l              # firmware ancien
awk -F";" '$5=="autoriser" && $2=="invites" && $3!="internet"' regles-zones.csv   # flux invités interdits
```

## 3. Lire le résultat
- Un équipement de production **joignable depuis la bureautique** est une exposition : un poste compromis pourrait l'atteindre.
- Un protocole sans chiffrement n'est pas forcément une urgence immédiate, mais il impose de **protéger le chemin** (zone isolée, passerelle) et de prévoir son remplacement.
- Une règle « refuser » n'est jamais un problème de sécurité ; une règle « autoriser » doit toujours se justifier.
- La règle qui ouvre la **production aux invités** est la plus grave : elle relie la zone la moins fiable à la plus sensible.

## 4. Côté défense
- Zones et **conduits** : la production a sa propre zone ; ses échanges passent par une **passerelle contrôlée** et se limitent aux flux nécessaires.
- Refus par défaut entre zones ; chaque autorisation est justifiée, documentée et revue régulièrement.
- Mises à jour **planifiées** et testées sur un équipement pilote, dans une fenêtre de maintenance.
- Surveillance **passive** (observer le trafic sans rien envoyer aux équipements) pour détecter un nouveau flux ou un nouvel appareil.
- Inventaire tenu à jour, avec un propriétaire pour chaque équipement.

## 5. Erreurs fréquentes
- Interroger activement un équipement industriel « pour voir » : cela peut perturber la production.
- Ouvrir tout le trafic entre zones pendant une maintenance et oublier de le refermer.
- Ajouter une règle « tout autoriser » pour éviter les pannes : elle annule la segmentation.
- Brancher un équipement directement sur Internet pour le superviser.
- Penser qu'un équipement « qui marche » n'a pas besoin d'être inventorié.

## 6. Exercices
1. Un automate de production est joignable depuis la bureautique. Quelle correction proposer, et que vérifier avant de l'appliquer ?
<details><summary>Réponse</summary>

Placer l'automate dans la zone production et ne laisser passer que les flux de la passerelle de supervision. Avant de l'appliquer, identifier qui a besoin d'y accéder et prévoir un test dans une fenêtre de maintenance pour ne pas couper un flux légitime.
</details>

2. Une règle autorise « production vers Internet » sur le port 80. Pourquoi est-ce un constat ?
<details><summary>Réponse</summary>

Un équipement de production n'a normalement pas besoin d'Internet : ce flux ouvre une voie de sortie et d'entrée vers une zone sensible. À supprimer, ou à remplacer par un flux justifié via une passerelle.
</details>

3. Pourquoi privilégier une surveillance passive ?
<details><summary>Réponse</summary>

Elle observe le trafic existant sans rien envoyer aux équipements : aucun risque de perturber un équipement fragile, tout en détectant un nouvel appareil ou un flux inhabituel.
</details>
