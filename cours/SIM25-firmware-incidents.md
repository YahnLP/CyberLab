# SIM25 · Firmwares : leçons d'incidents réels

Durée : 1 h 15 · Prérequis : P2, SIM18 · Missions associées : SIM25-1, SIM25-2 (parcours pentest)

## Objectifs
- Reconnaître, dans des incidents réels, les faiblesses de firmware qui reviennent.
- Auditer un parc à partir de fichiers de configuration fournis.
- Prioriser les correctifs selon la version, la gravité et l'exposition.

## 1. Le firmware, qu'est-ce que c'est ?
Le firmware est le logiciel embarqué d'un équipement (caméra, imprimante, routeur, réfrigérateur connecté). Il est souvent un petit Linux avec des services (telnet, web, partage) et des identifiants intégrés. Contrairement à un poste de travail, il est **rarement mis à jour**, **rarement inventorié** et reste en service des années.

## 2. Incidents réels étudiés (résumés ; sources dans `docs/RECHERCHE-INCIDENTS-FIRMWARE.md`)
- **Frigo « thingbot » (2013-2014)** : environ 100 000 objets, dont un réfrigérateur, ont envoyé 750 000 courriels malveillants. Cause : mots de passe par défaut et exposition sur Internet.
- **Mirai (2016)** : caméras et enregistreurs pris par telnet avec une courte liste d'identifiants par défaut ; parfois impossibles à changer.
- **HP, mise à jour distante (2011)** : un firmware pouvait être remplacé à distance sans authentification, fonction active par défaut. En 2025, de nouveaux correctifs HP rappellent l'importance de suivre les bulletins.
- **VPNFilter et Cyclops Blink (2018-2022)** : logiciels malveillants sur routeurs et NAS, persistants après redémarrage et mise à jour ; la remédiation demande une réinstallation.
- **Hikvision et Dahua (2021-2026)** : failles corrigées depuis des années mais toujours exploitées sur les caméras non mises à jour, avec relais P2P et ports exposés.

## 3. Cinq faiblesses qui reviennent
1. **Identifiants par défaut ou fixes.**
2. **Services anciens ou relais cloud actifs** sans besoin (telnet, P2P).
3. **Mises à jour non signées** : on ne peut pas prouver que l'image vient de l'éditeur.
4. **Exposition à Internet** : redirections de ports, UPnP.
5. **Parc non inventorié, correctifs tardifs, matériel sans support.**

## 4. En pratique (fichiers fournis, rien n'est envoyé aux équipements)
```
awk -F";" '$2=="oui" {print $1}' audit-firmware.csv                  # telnet actif
awk -F";" '$3=="oui" && $4=="non" {print $1}' audit-firmware.csv     # mot de passe fixe + maj non signée
awk -F";" 'NR==FNR{f[$1]=$2; next} FNR>1 && $3<f[$2] && $4=="internet" {print $1}' bulletins-editeur.csv parc-equipements.csv
```
La dernière commande « joint » deux fichiers : le premier fournit le build corrigé par modèle, le second liste le parc.

## 5. Lire le résultat
- Un équipement qui cumule **mot de passe fixe + mise à jour non signée** ne peut ni être sécurisé ni être remis en confiance : on l'**isole ou on le remplace**.
- Un équipement vulnérable **exposé à Internet** passe avant un équipement vulnérable interne ; à exposition égale, on traite d'abord la gravité critique.
- Un équipement sans correctif disponible (fin de support) se remplace ; en attendant, on le coupe d'Internet et on l'isole (voir SIM18).

## 6. Côté défense
- **Inventaire** : modèle, version, emplacement, propriétaire, date de fin de support.
- **Premier jour** : changer les identifiants par défaut, couper les services inutiles (telnet, P2P, UPnP).
- **Mises à jour** : n'installer que des images signées par l'éditeur, depuis son site ; vérifier l'empreinte annoncée ; tester sur un équipement pilote.
- **Après compromission d'un routeur ou d'un NAS** : une simple mise à jour ne suffit pas ; réinitialiser, réinstaller l'image officielle, changer tous les secrets.
- **Segmentation et surveillance** : zone dédiée, aucun accès direct depuis Internet, alertes sur les flux inhabituels.
- **Achats** : exiger des mises à jour de sécurité suivies et un mot de passe initial unique par appareil.

## 7. Erreurs fréquentes
- Croire qu'un objet « qui fonctionne » n'a pas besoin de correctif.
- Ouvrir un port « temporairement » pour la maintenance et l'oublier.
- Laisser l'UPnP ouvrir des ports tout seul.
- Installer un firmware trouvé sur un site tiers.
- Corriger dans l'ordre alphabétique plutôt que par risque.

## 8. Exercices
1. Une caméra a un mot de passe fixe et une mise à jour non signée. Que faire ?
<details><summary>Réponse</summary>

L'isoler dans une zone sans accès depuis Internet, couper les services inutiles et prévoir son remplacement : elle ne peut pas être sécurisée par configuration seule.
</details>

2. Deux équipements ont la même faille : l'un exposé à Internet, l'autre interne. Lequel corriger d'abord, et pourquoi ?
<details><summary>Réponse</summary>

L'équipement exposé : il est joignable par n'importe qui. L'interne vient ensuite, avec un contrôle des flux entre zones.
</details>

3. Un routeur a été infecté, puis mis à jour. Est-il sain ?
<details><summary>Réponse</summary>

Pas forcément : certains logiciels malveillants survivent à la mise à jour. Il faut réinitialiser, réinstaller l'image officielle vérifiée et changer les secrets.
</details>
