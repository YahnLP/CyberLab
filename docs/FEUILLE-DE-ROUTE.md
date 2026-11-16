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
| SIM06 | Accès contrôlé, privilèges | Livré : missions SIM06-1 (comptes) et SIM06-2 (sudo et SUID) |
| SIM07 | Analyse de malwares (inerte) | Absent |
| SIM08 | Capture et trafic | Livré : missions SIM08-1 (balayage, mot de passe en clair) et SIM08-2 (exfiltration DNS) |
| SIM09 | Ingénierie sociale (sensibilisation) | Livré, volet défensif : tri de messages fictifs et mesure de campagne (SIM09-1, SIM09-2) |
| SIM10 | Disponibilité, DoS | Livré : missions SIM10-1 (rafale dans le journal web) et SIM10-2 (ressource saturée) |
| SIM11 | Sessions, cookies | Livré : missions SIM11-1 (attributs et valeur prévisible) et SIM11-2 (fixation de session) |
| SIM12 | Périmètre, IDS, pare-feu | Livré : missions SIM12-1 (revue de règles) et SIM12-2 (tri des alertes IDS) |
| SIM13 | Serveur web | Livré : missions SIM13-1 (configuration nginx) et SIM13-2 (sondage dans le journal) |
| SIM14 | Application web | Livré : missions SIM14-1 (XSS réfléchi via curl) et SIM14-2 (revue de code PHP) |
| SIM15 | SQL et couche données | Livré : route /produit à requête vulnérable simulée (mini-évaluateur SQL, base fictive) ; missions SIM15-1 (erreur) et SIM15-2 (filtre neutralisé) ; panneau Base SQL graphique livré (onglet des missions SIM15) |
| SIM16 | Sans fil (simulé) | Livré, volet défensif : audit d'un inventaire de bornes et détection d'une borne non autorisée (SIM16-1, SIM16-2) |
| SIM17 | Mobile (artefacts) | Livré, volet audit défensif : manifeste et configuration embarquée (SIM17-1, SIM17-2) |
| SIM18 | IoT / OT | Livré, volet défensif : inventaire d'équipements et revue des règles entre zones (SIM18-1, SIM18-2) |
| SIM19 | Cloud (IAM, métadonnées) | Livré, volet audit défensif : droits, stockage, clés (SIM19-1, SIM19-2) ; métadonnées à cadrer |
| SIM20 | Cryptographie et PKI | Livré, volet certificats : lecture et inventaire (SIM20-1, SIM20-2) |
| SIM21 | Annuaire (Active Directory fictif) | Livré, volet revue défensive (SIM21-1, SIM21-2) |
| SIM22 | Pivot, mouvement latéral | Livré, volet détection dans les journaux (SIM22-1) |
| SIM23 | SOC, forensic, purple team | Livré (SIM23-1, SIM23-2, SIM23-3) |
| SIM24 | Scénario final multi-systèmes | Livré, version investigation défensive sur deux journaux (SIM24-1) ; scénario plus large à étendre |
| SIM26 | Lire les CVE et corriger (ajout) | Livré, volet défensif : décodage de fiches et plan de correction (SIM26-1, SIM26-2) |

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
6. **Transverse** : vue Red/Blue, rapport (Casebook déjà fait), mode Expert (fait), bilan élève exportable (fait : page #/bilan), puis la **formation distancielle Formaxion Landes** bâtie sur ces modules avec des approfondissements.

## Ordre de grandeur
24 modules à 3 ou 5 missions : 70 à 120 missions. À rythme actuel (une PR par lot), compter une PR pour le socle puis une PR par groupe de 2 ou 3 modules.

## Documents de cadrage

- [`CADRAGE-SIM07-09-16-18.md`](CADRAGE-SIM07-09-16-18.md) : propositions défensives pour les quatre modules en attente (à valider).
- [`FORMATION-A-DISTANCE.md`](FORMATION-A-DISTANCE.md) : nom, plan, durée et coût de la formation à distance (à valider).
