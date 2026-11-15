# Changelog
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
