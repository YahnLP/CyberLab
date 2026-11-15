# Changelog
## v0.9.0 — simulateur web (GitHub Pages)
- Site statique `site/` : terminal simulé (shell, awk, sed, sort, grep...), défis 02 à 17, correcteur, indices, score local, leçons.
- `tools/build-site-data.mjs` : génère 30 variantes par défi à partir des vrais `setup.sh`.
- Workflow `pages` (déploiement) et tests `tests/web/` (correcteur et émulateur comparés à bash).

## v0.8.0 — tests d'intégration
- `tests/docker-integration.sh` : construit l'image, vérifie ttyd, rejoue chaque corrigé dans le conteneur.
- Workflow GitHub Actions `tests` : contrôle des leçons, corrigés hors conteneur, intégration Docker.

## v0.7.0 — parcours avancés
- Leçons P12 (annuaire), P13 (forensic), P14 (segmentation) et défis 15 à 17 : audit d'un export d'annuaire, chronologie et IOC, matrice de flux et pivot.
- Analyse hors ligne et défense uniquement.

## v0.6.0 — défis du cycle HAC
- Défis 10 à 14 : analyse d'un mandat (et Cyber Kill Chain), lecture d'une capture réseau (identifiants en clair, empoisonnement ARP), énumération DNS/SMB/SNMP, revue de code web, protections mémoire et base Metasploit.
- Tous orientés analyse et défense, sans exploitation ni fabrication de charge.

## v0.5.0 — défis P9 et P11
- Défi 08 : saturation SYN (ss -ant), amplification (facteurs et débit reçu), RPO réel des sauvegardes.
- Défi 09 : calcul CVSS v3.1 réel (validé sur des scores NVD connus), priorisation selon exposition et criticité, synthèse pour la direction.

## v0.4.0 — défis P5 et P6
- Défi 06 : tri des alertes d'un scanner (vrais/faux positifs, correctifs rétroportés, `dpkg --compare-versions`).
- Défi 07 : contrôle d'accès d'une API (IDOR, erreurs bavardes, limitation de débit, décodage d'un JWT).

## v0.3.0 — défis P1 à P4
- Défis 02 à 05 : fiche de reconnaissance, écarts d'inventaire, services exposés, audit HTTP (données aléatoires, formats réels : zone DNS, nmap -oG, ip neigh, curl -si).
- engine/lib.sh : aides communes (réponses hachées, comparaison d'ensembles).
- tests/run-solution.sh joue tous les corrigés.

## v0.2.0 — cours
- 17 leçons : prise en main, parcours métier P1 à P11, cycle HAC 1 à 5 (contenu original).
- `tests/check-cours.sh` : structure, exercices corrigés, liens, adresses fictives.

## v0.1.0 — proposition
- Défi 01 « Incident SSH » (8 phases, données aléatoires, retest, rapport).
- Image : ajout openssh-client/openssh-server (sshd -T) et /run/sshd.
