# SIM22 · Mouvement latéral : le repérer dans les journaux

Durée : 1 h · Prérequis : SIM12, SIM23 · Missions associées : SIM22-1 (parcours pentest)

## Objectifs
- Expliquer ce qu'est un mouvement latéral du point de vue de la défense.
- Repérer, dans un journal de connexions internes, un poste qui enchaîne plusieurs serveurs.
- Distinguer un usage normal d'un comportement qui sort du schéma habituel.
- Proposer segmentation et surveillance adaptées.

## 1. L'essentiel
- Après une première compromission, l'étape suivante est souvent de **rebondir** d'une machine à l'autre à l'intérieur du réseau : c'est le mouvement latéral.
- Du côté défense, on le repère par une **rupture de schéma** : un poste de bureautique qui se connecte en administration (SSH) à plusieurs serveurs en peu de temps, alors qu'il n'accède normalement qu'au serveur de fichiers.
- La **segmentation** limite ce qu'un poste peut atteindre : si le réseau interdit les connexions d'administration depuis les postes, le rebond échoue.
- La détection s'appuie sur une **ligne de base** : qui parle à qui, sur quels ports, à quel rythme.
- Ici, le journal est fictif ; on analyse un fichier fourni.

## 2. En pratique
```
grep ssh connexions-internes.log                            # connexions d'administration
grep ssh connexions-internes.log | awk '{print $2}' | sort -u     # postes qui s'en servent
grep ssh connexions-internes.log | awk '{print $4}' | sort -u | wc -l   # nombre de destinations
grep ssh connexions-internes.log | head -1                  # première connexion SSH
```

## 3. Lire le résultat
- Les connexions vers le port 445 du serveur de fichiers sont le schéma habituel ; elles ne sont pas le signal.
- Le signal est une **séquence** : le même poste, plusieurs destinations d'administration différentes, en quelques minutes.
- La première destination donne le point d'entrée du rebond ; le nombre de destinations mesure l'étendue de l'exposition.
- Notez les heures : elles permettent de rapprocher d'autres journaux (authentification, pare-feu).

## 4. Côté défense
- Interdire l'administration (SSH, RDP) depuis les postes de bureautique ; passer par un poste ou un serveur de rebond contrôlé.
- Alerter sur les nouvelles relations poste → serveur et sur les séquences de connexions d'administration.
- Isoler le poste concerné, réinitialiser ses identifiants et ceux des serveurs atteints, puis rechercher d'autres traces.
- Limiter les comptes à privilèges et utiliser des identifiants différents par machine.

## 5. Erreurs fréquentes
- Se concentrer sur le poste de départ sans vérifier les serveurs atteints.
- Supprimer les journaux pour « faire propre » : on perd la preuve.
- Traiter l'incident serveur par serveur sans isoler d'abord le poste source.
- Ne pas comparer à la ligne de base : on ne sait pas ce qui est normal.

## 6. Exercices
1. Un poste de bureautique se connecte en SSH à trois serveurs en cinq minutes. Que faites-vous en premier ?
<details><summary>Réponse</summary>
Isoler le poste du réseau pour stopper le rebond, conserver les journaux, puis vérifier les trois serveurs et réinitialiser les identifiants concernés.
</details>

2. Pourquoi la segmentation aurait-elle limité l'incident ?
<details><summary>Réponse</summary>
Si les postes n'ont pas le droit de joindre l'administration des serveurs, les connexions SSH auraient été refusées dès la première tentative.
</details>

3. Quelles données notez-vous pour chaque connexion suspecte ?
<details><summary>Réponse</summary>
L'heure, la source, la destination et le port, le protocole, et le résultat (réussi ou non), pour pouvoir rapprocher d'autres journaux.
</details>
