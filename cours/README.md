# Cours CyberLab : parcours et leçons

Leçons originales, rédigées pour CyberLab (aucun contenu repris d'une autre plateforme). Chaque leçon suit le même plan : objectifs, notions, pratique, lecture du résultat, côté défense, erreurs fréquentes, exercices corrigés. Données fictives (plages de documentation 203.0.113.0/24, 198.51.100.0/24, réseaux privés).

## Parcours

| Parcours | Public | Leçons |
|---|---|---|
| **Fondations** | débutants | 00 |
| **Parcours professionnalisant** (reconnaissance à restitution) | tout stagiaire | P1 à P11 |
| **Cycle HAC** (audit d'intrusion complet) | stagiaires avancés | HAC 1 à HAC 5 |
| **Parcours avancés** (annuaire, forensic, segmentation) | stagiaires avancés | P12 à P14 |
| **Cursus Ethical Hacking** (simulateur web, jumeau numérique) | stagiaires avancés | EH02, EH03 (puis EH01, EH04 et suivants) |

Ordre conseillé : 00, P1 à P4, P5 et P6, P7 à P9, P10 et P11 ; le cycle HAC peut se suivre en parallèle à partir de P4.

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
| [HAC1](HAC1-cadrage-methodologie.md) | Cadrage et méthodologie d'un audit | 1 h 15 | 10 · Analyse d'un mandat d'audit |
| [HAC2](HAC2-interception-analyse-reseau.md) | Interception et analyse réseau | 1 h 30 | 11 · Lire une capture réseau |
| [HAC3](HAC3-reconnaissance-services.md) | Reconnaissance avancée et énumération | 1 h 30 | 12 · Énumération de services |
| [HAC4](HAC4-securite-web.md) | Sécurité des applications web | 2 h | 13 · Revue de code d'une application web |
| [HAC5](HAC5-analyse-applicative-restitution.md) | Analyse applicative, Metasploit, restitution | 2 h | 14 · Protections mémoire et base Metasploit |

Les leçons sont écrites pour un usage **autorisé et en laboratoire**. Les défis 00 et 02 à 17 suivent le même principe que le défi 01 : données générées au hasard, constats à rédiger, correcteur automatique. Chaque leçon a désormais son défi.

## Cursus Ethical Hacking

| Leçon | Titre | Durée | Missions |
|---|---|---|---|
| [EH02](EH02-reconnaissance-footprinting.md) | Reconnaissance et empreinte d'une organisation | 1 h 30 | EH02-1, EH02-2, EH02-3 |
| [EH03](EH03-scan-reseau.md) | Scan réseau : hôtes, ports et services | 1 h 30 | EH03-1, EH03-2, EH03-3 |
