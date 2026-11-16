# Recherche : incidents réels liés aux firmwares (base de la leçon SIM25)

Date : 16/11/2026. Objectif : choisir des cas réels, publics et documentés pour des travaux pratiques **défensifs** (audit de fichiers fournis, priorisation des correctifs). Les cas sont résumés au niveau des faits et des causes ; aucune méthode d'attaque pas à pas n'est reprise dans le simulateur.

## Cas retenus

| Cas | Date | Ce qui s'est passé | Faiblesse de firmware illustrée | Sources |
|---|---|---|---|---|
| « Thingbot » dont un réfrigérateur | déc. 2013 à janv. 2014 | Plus de 750 000 courriels malveillants envoyés par environ 100 000 objets (routeurs, NAS, téléviseurs, au moins un réfrigérateur) ; peu d'envois par adresse, donc difficile à bloquer. Pas d'intrusion sophistiquée : mots de passe par défaut et mauvaise configuration. | Identifiants par défaut, équipements exposés sur Internet, services non sécurisables (telnet, ssh, SMTP) | [Proofpoint](https://www.proofpoint.com/us/threat-insight/post/Your-Fridge-is-Full-of-SPAM) |
| Botnet Mirai (caméras, enregistreurs) | 2016 | Caméras IP et enregistreurs infectés via telnet avec une courte liste d'identifiants par défaut ; une grande partie des appareils contenait des composants d'un même fabricant, avec des identifiants que l'utilisateur ne pouvait pas changer. Source publiée, nombreuses variantes. | Mot de passe fixe non modifiable, telnet actif, relais cloud actif par défaut | [Pindrop](https://www.pindrop.com/article/bugs-chinese-iot-components-aid-mirai-botnet-spread/), [SEC Consult](https://r.sec-consult.com/xmeye), [Kaspersky](https://securelist.com/is-mirai-really-as-black-as-its-being-painted/76954) |
| Imprimantes et scanners HP : mise à jour distante non authentifiée | 2011 (CVE-2011-4161) | Une fonction de mise à jour de firmware à distance, active par défaut, permettait à un attaquant non authentifié d'installer un firmware modifié. | Mise à jour non authentifiée ou non signée | [CERT/CC VU#717921](https://kb.cert.org/vuls/id/717921) |
| Imprimantes HP LaserJet : exécution de code à distance | 2025 (CVE-2025-26506 et suivants) | Correctifs publiés pour plusieurs gammes ; défaut de traitement d'une tâche d'impression pouvant mener à l'exécution de code. | Parc non inventorié, correctifs appliqués tard | [CCB Belgique](https://ccb.belgium.be/advisories/warning-critical-vulnerability-cve-2025-26506-cvss-92-specific-hp-laserjet-pro-hp) |
| VPNFilter puis Cyclops Blink (routeurs, NAS) | 2018, puis 2019 à 2022 | Logiciel malveillant installé sur des routeurs et NAS de petites structures ; Cyclops Blink se fait passer pour une « mise à jour » de firmware et reste après redémarrage et mise à jour légitime. | Persistance dans le firmware, nécessité de réinitialiser et réinstaller, vérification d'intégrité | [CISA AA22-054A](https://us-cert.cisa.gov/ncas/alerts/aa22-054a), [NCSC](https://www.ncsc.gov.uk/news/joint-advisory-shows-new-sandworm-malware-cyclops-blink-replaces-vpnfilter) |
| Caméras Hikvision et Dahua exploitées en masse | 2021 à 2026 | Failles anciennes (contournement d'authentification, injection de commandes) toujours exploitées des années après les correctifs ; campagne de 2026 visant plus de 14 500 caméras Dahua par essais de mots de passe, failles de 2021 et relais P2P. | Correctifs non appliqués, ports et relais P2P exposés (parfois ouverts automatiquement par UPnP), matériel hors support | [FBI IC3 (2024)](https://ic3.gov/CSA/2024/241216.pdf), [The Hacker News (2026)](https://thehackernews.com/2026/08/hackers-compromised-14500-dahua-devices.html) |

## Faiblesses récurrentes (grille de la leçon)

1. Identifiants par défaut ou fixes, parfois non modifiables.
2. Services anciens actifs (telnet) ou relais cloud actif par défaut.
3. Mises à jour non signées ou non vérifiées ; persistance dans le firmware.
4. Exposition à Internet (redirections, UPnP).
5. Parc non inventorié et correctifs tardifs, matériel sans support.

## Limites

- Les chiffres sont ceux des sources citées à leur date ; certains rapports de 2026 sont récents et leur attribution reste à confirmer.
- Le simulateur n'utilise que des **données fictives** et ne comporte ni analyse de firmware réel, ni outil d'exploitation, ni commande vers un équipement.
