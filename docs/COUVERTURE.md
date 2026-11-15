# Couverture par rapport à ce que propose Infrasec CyberLab

Sources : pages et API publiques observées avec un compte FREE (structure, offres annoncées). Aucun contenu payant n'a été copié.

| Fonction annoncée | Offre | Dans ce lab |
|---|---|---|
| Terminal Linux, TP guidés auto-vérifiés | FREE | Oui (vrai Debian, `defi`) |
| Cycle 9 phases (Préparer à Restituer) | FREE | Oui, 8 phases dans la sortie de `defi valider` |
| Mode Guidé / Expert | PRO (Expert) | Oui : énoncé complet + `defi indice` (-2 pts) |
| Evidence (preuve, intégrité) | STUDENT | Oui : sha256sum, original inchangé |
| Credentials | STUDENT | Oui : brute force, compte de service |
| Reports | STUDENT | Oui : rapport.md contrôlé |
| Remédiation + retest | FREE | Oui : retest.sh, 6 contrôles |
| SOC / détection | PRO | Oui : detecte.sh rejoué |
| Replay | PRO | Oui : rejeu sur un second journal |
| Attack path / persistance | PRO | Oui : clé SSH + cron |
| Forensic | PRO | Partiel : historique horodaté, mtime |
| Network, Web, AD, Metasploit, pivot | STUDENT/PRO | Non (autres défis à créer) |
| Exam | STUDENT | À faire : variante sans indices |
| Trainer dashboard, classes, analytics, SSO | ACADEMY | À faire : portail BashLab existant à réutiliser |

## Leçons
Les 17 leçons de `cours/` couvrent les modules annoncés (prise en main, P1 à P11, HAC 1 à 5). Défis pratiques : 01 (P7, P8, P10), 02 (P1), 03 (P2), 04 (P3), 05 (P4), 06 (P5), 07 (P6), 08 (P9), 09 (P11), 10 à 14 (HAC 1 à 5). Chaque leçon a son défi ; restent les modules non couverts par les leçons (AD, forensic avancé, pivot).
