# Feuille de route : vers un parcours pentest complet

Date : 15/11/2026. Point de départ : le catalogue de la référence compte 24 modules (SIM01 à SIM24, 5 missions chacun, du cadrage au scénario final). Seules les thématiques sont reprises ici ; les missions, énoncés et données de CyberLab sont originaux et resteront les nôtres.

## Principes
- **Tout est fictif et fermé** : cibles inventées (plages 203.0.113.x, 198.51.100.x, 192.168.x), aucun trafic réel, aucun code d'exploitation fonctionnel. Les outils offensifs sont **simulés** : ils lisent une plage fictive et affichent une sortie plausible.
- **Chaque mission a deux faces** : observer (Red) puis détecter et corriger (Blue), avec preuve et retest. C'est la différence pédagogique de CyberLab.
- **Rien de payant** dans le simulateur. Le Docker reste la version « vraie machine ».
- Les sujets sensibles (ingénierie sociale, sans fil, DoS) restent au niveau **sensibilisation, détection et défense**.

## Couverture actuelle par module

| Module de la référence | Thème | Dans CyberLab aujourd'hui |
|---|---|---|
| SIM01 | Fondations, périmètre, preuves | Livré : leçon SIM01, missions SIM01-1 (mandat et périmètre) et SIM01-2 (preuve scellée SHA-256) |
| SIM02 | Reconnaissance | Défi 02 (fiche de reconnaissance), pas d'outils dig/whatweb |
| SIM03 | Scan réseau | Défis 03, 04, 12 (sorties fournies), pas de nmap simulé |
| SIM04 | Énumération | Livré : smbclient, snmpget, snmpwalk simulés ; missions SIM04-1 (SMB) et SIM04-2 (SNMP) |
| SIM05 | Analyse de vulnérabilités | Livré : missions SIM05-1 (avis et versions) et SIM05-2 (priorisation par exposition) |
| SIM06 | Accès contrôlé, privilèges | Défi 14 (protections), partiel |
| SIM07 | Analyse de malwares (inerte) | Absent |
| SIM08 | Capture et trafic | Défi 11 (lecture d'une capture) |
| SIM09 | Ingénierie sociale (sensibilisation) | Absent |
| SIM10 | Disponibilité, DoS | Défi 08 |
| SIM11 | Sessions, cookies | Défi 07 partiel |
| SIM12 | Périmètre, IDS, pare-feu | Défi 01 (nftables), partiel |
| SIM13 | Serveur web | Défi 05 |
| SIM14 | Application web | Défi 13 (revue de code) |
| SIM15 | SQL et couche données | Absent |
| SIM16 | Sans fil (simulé) | Absent |
| SIM17 | Mobile (artefacts) | Absent |
| SIM18 | IoT / OT | Absent |
| SIM19 | Cloud (IAM, métadonnées) | Absent |
| SIM20 | Cryptographie et PKI | Absent |
| SIM21 | Active Directory | Défi 15 |
| SIM22 | Pivot, mouvement latéral | Défi 17 |
| SIM23 | SOC, forensic, purple team | Défis 01, 16 |
| SIM24 | Scénario final multi-systèmes | Absent |

Bilan : 18 défis couvrent environ la moitié des thèmes, surtout par l'analyse de données fournies. Il manque la **pratique outillée** sur une plage vivante et 9 thèmes.

## Le gros chantier : un « jumeau numérique » commun
Une plage fictive générée par session (hôtes, ports, bannières, routes web, base de démonstration, comptes, journaux), lue par :
- les **outils simulés** : `ping`, `traceroute`, `dig`/`host`/`nslookup`, `nmap` (découverte, versions, ports), `curl -I`, `whatweb`, énumération de répertoires, `tcpdump`/`tshark` sur captures fournies, etc. ;
- les **panneaux** sous le terminal : Vue du lab, Web, Base SQL, Fichiers, Journal ;
- le **journal et les alertes** Blue : chaque action laisse une trace exploitable ;
- le **correcteur** : les missions se valident sur les faits et la remédiation, pas sur une commande exacte.
Cohérence exigée : une même ligne de données apparaît dans le terminal, la page web et la requête SQL.

## Phases proposées
1. **Socle jumeau numérique (livré en v0.13.0 : plage, ping, host, dig, nslookup, nmap, curl, panneaux Vue du lab et Web, missions SIM02 et SIM03)** : modèle de plage, générateur à graine, `ping`, `dig`/`host`, `nmap`, `curl`, panneaux Web et Base SQL, tests de cohérence. Modules **SIM01 à SIM05**.
2. **SIM06 à SIM12** : accès et privilèges, analyse de capture, disponibilité, sessions, périmètre (règles pare-feu et IDS rejouées).
3. **SIM13 à SIM15** : serveur web, application web, couche SQL sur base de démonstration (démonstration d'une requête vulnérable et de sa correction).
4. **SIM16 à SIM20** : sans fil, mobile, IoT/OT, cloud, cryptographie (hachage, certificats, encodage : possibles en vrai, hors ligne).
5. **SIM21 à SIM24** : annuaire, pivot, SOC et purple team, scénario final multi-systèmes.
6. **Transverse** : vue Red/Blue, rapport (Casebook déjà fait), mode Expert (fait), bilan élève exportable, puis la **formation distancielle Formaxion Landes** bâtie sur ces modules avec des approfondissements.

## Ordre de grandeur
24 modules à 3 ou 5 missions : 70 à 120 missions. À rythme actuel (une PR par lot), compter une PR pour le socle puis une PR par groupe de 2 ou 3 modules.
