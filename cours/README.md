# Cours CyberLab : parcours et leçons

Leçons originales, rédigées pour CyberLab (aucun contenu repris d'une autre plateforme). Chaque leçon suit le même plan : objectifs, notions, pratique, lecture du résultat, côté défense, erreurs fréquentes, exercices corrigés. Données fictives (plages de documentation 203.0.113.0/24, 198.51.100.0/24, réseaux privés).

## Parcours

| Parcours | Public | Leçons |
|---|---|---|
| **Fondations** | débutants | 00 |
| **Parcours professionnalisant** (reconnaissance à restitution) | tout stagiaire | P1 à P11 |
| **Parcours sécurité offensive** (audit d'intrusion complet) | stagiaires avancés | SO1 à SO5 |
| **Parcours avancés** (annuaire, forensic, segmentation) | stagiaires avancés | P12 à P14 |
| **Parcours pentest** (simulateur web, jumeau numérique) | stagiaires avancés | SIM01 à SIM06 et SIM08, SIM10 à SIM15, SIM17, SIM19, SIM20 |

Ordre conseillé : 00, P1 à P4, P5 et P6, P7 à P9, P10 et P11 ; le parcours sécurité offensive peut se suivre en parallèle à partir de P4.

## Leçons

| Leçon | Titre | Durée | Défi associé |
|---|---|---|---|
| [00](00-prise-en-main.md) | Prise en main du terminal et de la méthode | 45 min | 00 · Prise en main : preuve et premières commandes |
| [P1](P1-reconnaissance-perimetre.md) | Reconnaissance et périmètre | 1 h | 02 · Fiche de reconnaissance |
| [P2](P2-inventaire-reseau.md) | Inventaire réseau | 1 h | 03 · Écarts d'inventaire |
| [P3](P3-analyse-services.md) | Analyse des services | 1 h 15 | 04 · Services exposés |
| [P4](P4-http-parcours-applicatifs.md) | HTTP et parcours applicatifs | 1 h 15 | 05 · Audit HTTP |
| [P5](P5-analyse-vulnerabilites.md) | Analyse des vulnérabilités | 1 h 30 | 06 · Trier les résultats d'un scanner |
| [P6](P6-applications-api.md) | Applications et API | 1 h 30 | 07 · Contrôle d'accès d'une API |
| [P7](P7-identites-reseau.md) | Identités et réseau | 1 h 30 | 01 (volet mots de passe) |
| [P8](P8-investigation-incident.md) | Investigation d'incident | 1 h 30 | 01 · Incident SSH |
| [P9](P9-disponibilite-resilience.md) | Disponibilité et résilience | 1 h | 08 · Disponibilité sous pression |
| [P10](P10-correction-retest.md) | Correction et retest | 1 h | 01 · Incident SSH |
| [P11](P11-risque-restitution.md) | Risque et restitution | 1 h 15 | 09 · Priorisation des risques |
| [P12](P12-annuaire-active-directory.md) | Annuaire et Active Directory | 1 h 30 | 15 · Audit d'un annuaire |
| [P13](P13-forensic-chronologie.md) | Forensic : chronologie et indicateurs | 1 h 30 | 16 · Reconstituer une chronologie |
| [P14](P14-segmentation-pivot.md) | Segmentation et mouvement latéral | 1 h 15 | 17 · Segmentation et pivot |
| [SO1](SO1-cadrage-methodologie.md) | Cadrage et méthodologie d'un audit | 1 h 15 | 10 · Analyse d'un mandat d'audit |
| [SO2](SO2-interception-analyse-reseau.md) | Interception et analyse réseau | 1 h 30 | 11 · Lire une capture réseau |
| [SO3](SO3-reconnaissance-services.md) | Reconnaissance avancée et énumération | 1 h 30 | 12 · Énumération de services |
| [SO4](SO4-securite-web.md) | Sécurité des applications web | 2 h | 13 · Revue de code d'une application web |
| [SO5](SO5-analyse-applicative-restitution.md) | Analyse applicative, Metasploit, restitution | 2 h | 14 · Protections mémoire et base Metasploit |

Les leçons sont écrites pour un usage **autorisé et en laboratoire**. Les défis 00 et 02 à 17 suivent le même principe que le défi 01 : données générées au hasard, constats à rédiger, correcteur automatique. Chaque leçon a désormais son défi.

## Parcours pentest

| Leçon | Titre | Durée | Missions |
|---|---|---|---|
| [SIM01](SIM01-cadrage-preuves.md) | Cadrage, règles d'engagement et preuves | 1 h | SIM01-1, SIM01-2 |
| [SIM02](SIM02-reconnaissance-empreinte.md) | Reconnaissance et empreinte d'une organisation | 1 h 30 | SIM02-1, SIM02-2, SIM02-3 |
| [SIM03](SIM03-scan-reseau.md) | Scan réseau : hôtes, ports et services | 1 h 30 | SIM03-1, SIM03-2, SIM03-3 |
| [SIM04](SIM04-enumeration-smb-snmp.md) | Énumération SMB et SNMP | 1 h 30 | SIM04-1, SIM04-2 |
| [SIM05](SIM05-analyse-vulnerabilites.md) | Analyse de vulnérabilités et priorisation | 1 h 30 | SIM05-1, SIM05-2 |
| [SIM06](SIM06-acces-privileges.md) | Accès contrôlé et élévation de privilèges | 1 h 30 | SIM06-1, SIM06-2 |
| [SIM08](SIM08-capture-trafic.md) | Capture et analyse de trafic | 1 h 30 | SIM08-1, SIM08-2 |
| [SIM10](SIM10-disponibilite.md) | Disponibilité : repérer une saturation | 1 h 15 | SIM10-1, SIM10-2 |
| [SIM11](SIM11-sessions-cookies.md) | Sessions et cookies | 1 h 15 | SIM11-1, SIM11-2 |
| [SIM12](SIM12-parefeu-ids.md) | Périmètre réseau : pare-feu et détection d'intrusion | 1 h 30 | SIM12-1, SIM12-2 |
| [SIM13](SIM13-serveur-web.md) | Serveur web : configuration et exposition | 1 h 15 | SIM13-1, SIM13-2 |
| [SIM14](SIM14-application-web.md) | Application web : saisies, affichage et revue de code | 1 h 30 | SIM14-1, SIM14-2 |
| [SIM15](SIM15-sql.md) | La couche SQL : erreurs et injection (base fictive) | 1 h 30 | SIM15-1, SIM15-2 |
| [SIM17](SIM17-mobile.md) | Mobile : audit d'une application avant publication | 1 h 15 | SIM17-1, SIM17-2 |
| [SIM19](SIM19-cloud.md) | Cloud : audit d'un compte (droits, stockage, clés) | 1 h 15 | SIM19-1, SIM19-2 |
| [SIM20](SIM20-cryptographie.md) | Cryptographie : lire et suivre des certificats | 1 h | SIM20-1, SIM20-2 |
