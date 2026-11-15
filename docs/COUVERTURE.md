# Audit de couverture : CyberLab face à Infrasec CyberLab

Date : 15/11/2026. Sources : compte FREE de la plateforme de référence (portail, formules, interface de mission) et état du dépôt. Aucun contenu de la référence n'est copié : seules les fonctions sont comparées.

## Offre de la référence (relevé)

| Formule | Tarif | Catalogue | Remarques |
|---|---|---|---|
| FREE | 0 € | 10 TP, 20 scénarios, 1 session | modes Guidé et Semi-guidé |
| Student | 25 €/mois | 100 TP | |
| Pro | 49 €/mois | 156 TP | AD, Metasploit, pivot, SOC, mode Expert |
| Academy | sur devis | 156 TP | cohortes, formateurs, examens, analytics |
| Enterprise | sur devis | 156 TP | SSO, gouvernance |

## Couverture

| Fonction de la référence | Docker | Simulateur web | Écart |
|---|---|---|---|
| Terminal et TP auto-vérifiés | Oui (18 défis) | Oui (17 défis, 01 absent) | Défi 01 non porté |
| Variantes aléatoires | Oui | Oui (30 par défi) | |
| Guidé / Semi-guidé | Énoncé + indices (-2 pt) | Idem | |
| Expert sans indices | Non | Oui (v0.10.0, chronomètre et badge) | Docker : à faire |
| Preuve, rapport, retest | Défis 01, 06, 09 | Idem | À généraliser |
| Casebook (dossier d'enquête) | Non | Oui (v0.11.0, preuves, conclusion, export) | Docker : à faire |
| Blue Team / SOC | Défis 01, 10, 11, 16 | Idem | |
| Forensic | Partiel (16) | Partiel | |
| Web / API | Lecture et audit (05, 07, 13) | Idem | Pas d'attaque interactive |
| Réseau (nmap, tcpdump) | Non | Non | Hors périmètre simulateur |
| AD, Metasploit, pivot | Analyse et défense (14, 15, 17) | Idem | Pas d'outil offensif |
| Vue du lab, journal, jumeau numérique | Non | Non | Base de la formation distancielle |
| Thèmes de terminal, complétion Tab | Non | Non | Confort |
| Bilan élève exportable | Score en ligne de commande | Progression locale | Export JSON ou PDF à faire |
| Cours | 20 leçons | 20 leçons | |
| Classes, formateurs, SSO, examens | Non | Non | Hors périmètre (payant chez la référence) |

## Choix assumés
Aucune fonction payante dans le simulateur. Pas de comptes ni de serveur : tout tourne dans le navigateur.

## Priorités
1. ~~Rapport et preuves sur tous les défis~~ (Casebook fait côté simulateur web ; côté Docker, à porter).
2. ~~Mode Expert sans indices avec chronomètre~~ (fait côté simulateur web).
3. Porter le défi 01 sur le web.
4. Export du bilan élève.
5. Vue du lab et journal, pour la formation Formaxion Landes.
