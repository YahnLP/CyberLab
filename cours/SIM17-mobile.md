# SIM17 · Mobile : audit d'une application avant publication

Durée : 1 h 15 · Prérequis : SIM13 · Missions associées : SIM17-1, SIM17-2 (parcours pentest)

## Objectifs
- Relire le manifeste d'une application Android et repérer permissions inutiles et réglages dangereux.
- Reconnaître un composant exporté qui n'est pas protégé.
- Relire la configuration embarquée : clé en dur, adresse non chiffrée, épinglage de certificat, journalisation.
- Proposer des corrections adaptées à une publication en production.

## 1. L'essentiel
- Une application mobile est un paquet distribué à tous les utilisateurs : **tout ce qu'il contient est lisible** par n'importe lequel d'entre eux.
- Le **manifeste** déclare les permissions demandées, les composants et deux réglages sensibles : `debuggable` (doit être faux en production) et `allowBackup` (sauvegarde des données de l'application).
- Un composant avec `exported="true"` peut être appelé par d'autres applications. L'écran d'accueil l'est par nature ; tout autre composant exporté doit être protégé ou justifié.
- Le **principe du moindre privilège** s'applique aux permissions : une application de rendez-vous n'a pas besoin de lire les SMS.
- L'**épinglage de certificat** limite les certificats acceptés par l'application et réduit le risque d'interception.

## 2. En pratique
```
grep uses-permission AndroidManifest.xml          # permissions demandées
grep -o 'debuggable="[a-z]*"' AndroidManifest.xml  # mode débogage
grep 'exported="true"' AndroidManifest.xml          # composants accessibles aux autres applications
grep KEY config-appli.txt                            # secret embarqué
grep "http://" config-appli.txt                      # adresse non chiffrée
```

## 3. Lire le résultat
- Comparez chaque permission à la fonction annoncée de l'application : celles qui n'ont aucun lien sont à retirer.
- `debuggable="true"` en production permet d'inspecter l'application ; `allowBackup="true"` expose ses données lors d'une sauvegarde.
- Une clé qui commence par un préfixe de clé de service et figure dans la configuration doit être considérée comme **publique** : à révoquer et à remplacer.
- `log_level=DEBUG` en production peut écrire des données sensibles dans les journaux.

## 4. Côté défense
- Revue avant chaque publication : permissions, réglages du manifeste, composants exportés.
- Aucun secret dans l'application : les clés restent côté serveur, avec des jetons de courte durée.
- HTTPS partout, épinglage de certificat, journalisation limitée.
- Contrôle automatisé de ces points dans la chaîne de publication.

## 5. Erreurs fréquentes
- Encoder un secret en base64 : ce n'est pas une protection.
- Demander toutes les permissions « au cas où ».
- Laisser un point d'accès de test en HTTP « pour plus tard ».
- Corriger l'application sans révoquer la clé déjà publiée.

## 6. Exercices
1. L'application de rendez-vous demande `READ_CALL_LOG`. Que concluez-vous ?
<details><summary>Réponse</summary>
Permission sans rapport avec la fonction : à retirer. Un utilisateur peut aussi refuser l'application s'il la voit dans la liste des permissions.
</details>

2. `android:debuggable="true"` figure dans la version publiée. Quel est le risque et la correction ?
<details><summary>Réponse</summary>
L'application peut être inspectée et manipulée à l'exécution. Passer la valeur à false dans la version de production et contrôler ce réglage dans la chaîne de publication.
</details>

3. Une clé d'API figure dans la configuration embarquée. Quelles étapes, dans l'ordre ?
<details><summary>Réponse</summary>
Révoquer la clé, en émettre une nouvelle côté serveur, retirer la clé du code, publier une version corrigée, vérifier dans les journaux qu'elle n'a pas été utilisée anormalement.
</details>
