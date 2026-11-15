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
| Expert sans indices | Non | Non | À faire (examen) |
| Preuve, rapport, retest | Défis 01, 06, 09 | Idem | À généraliser |
| Casebook (dossier d'enquête) | Non | Non | À faire |
| Blue Team / SOC | Défis 01, 10, 11, 16 | Idem | |
| Forensic | Partiel (16) | Partiel | |
| Web / API | Lecture et audit (05, 07, 13) | Idem | Pas d'attaque interactive |
| Réseau (nmap, tcpdump) | Non | Non | Hors périmètre simulateur |
| AD, Metasploit, pivot | Analyse et défense (14, 15, 17) | Idem | Pas d'outil offensif |
| Panneau de vues sous le terminal (6 onglets, détail ci-dessous) | Non | Non | Écart important, base de la formation distancielle |
| Thèmes de terminal, complétion Tab | Non | Non | Confort |
| Bilan élève exportable | Score en ligne de commande | Progression locale | Export JSON ou PDF à faire |
| Cours | 20 leçons | 20 leçons | |
| Classes, formateurs, SSO, examens | Non | Non | Hors périmètre (payant chez la référence) |

## Panneau de vues de la référence (relevé en session)

Six onglets sous le terminal, alimentés par un même jeu de données fictives partagé entre terminal, web et SQL :

| Onglet | Contenu | Équivalent ici |
|---|---|---|
| Vue du lab | cible du scénario, disponibilité, alertes après action | Non |
| Comprendre | interprétation de la dernière commande exécutée | Non (indices seulement) |
| Web | portail de démonstration : catalogue, API JSON, santé, administration, recherche, statut HTTP interprété | Non (défi 05 par lecture de journaux) |
| Base SQL | 5 tables fictives, SELECT / WHERE / ORDER BY / LIMIT / COUNT(*), contrôles liés au TP | Non |
| Fichiers | explorateur du système virtuel (78 éléments) | Partiel : arborescence dans le terminal émulé |
| Journal | actions réussies du TP | Non |

Point clé : la cohérence entre vues. Une commande `curl`, une requête SQL et la page web lisent les mêmes lignes.

## Choix assumés
Aucune fonction payante dans le simulateur. Pas de comptes ni de serveur : tout tourne dans le navigateur.

## Priorités
1. Rapport et preuves sur tous les défis (mini-Casebook local).
2. Mode Expert sans indices avec chronomètre.
3. Porter le défi 01 sur le web.
4. Export du bilan élève.
5. Panneau de vues (Comprendre, Fichiers, Journal d'abord ; Web et SQL ensuite) sur un jeu de données partagé, pour la formation Formaxion Landes.
