# CyberLab

Laboratoire de cyber-défense en ligne de commande : un vrai terminal Linux par stagiaire (Docker + ttyd), des défis auto-corrigés sur des données réalistes générées au hasard à chaque session. Même moteur que BashLab (`defi liste`, `defi start`, `defi indice`, `defi valider`).

Créé par Formaxion Landes — © Yahn LE PRETTRE 2026. 

## Contenu actuel
| Défi | Séquence | Points |
|---|---|---|
| 01 · Incident SSH : détecter, contenir, corriger | Séquence 5 · Cyber-défense | 60 |
| 02 · Fiche de reconnaissance | Séquence 6 · Parcours métier | 30 |
| 03 · Écarts d'inventaire | Séquence 6 · Parcours métier | 30 |
| 04 · Services exposés | Séquence 6 · Parcours métier | 35 |
| 05 · Audit HTTP | Séquence 6 · Parcours métier | 35 |
| 06 · Trier les résultats d'un scanner | Séquence 6 · Parcours métier | 40 |
| 07 · Contrôle d'accès d'une API | Séquence 6 · Parcours métier | 40 |
| 08 · Disponibilité sous pression | Séquence 6 · Parcours métier | 40 |
| 09 · Priorisation des risques | Séquence 6 · Parcours métier | 45 |
| 10 · Analyse d'un mandat d'audit | Séquence 7 · Cycle HAC | 40 |
| 11 · Lire une capture réseau | Séquence 7 · Cycle HAC | 45 |
| 12 · Énumération de services | Séquence 7 · Cycle HAC | 45 |
| 13 · Revue de code d'une application web | Séquence 7 · Cycle HAC | 45 |
| 14 · Protections mémoire et base Metasploit | Séquence 7 · Cycle HAC | 50 |

## Cours
17 leçons originales réparties en trois parcours (Fondations, Parcours métier P1 à P11, Cycle HAC 1 à 5) : voir [`cours/README.md`](cours/README.md). Contrôle de structure : `bash tests/check-cours.sh`.

## Pourquoi c'est réaliste
- `auth.log` au format syslog Debian, avec du bruit crédible (cron, scanners, fautes de frappe d'un admin, sudo), généré par gawk.
- Vraies clés SSH ED25519 (`ssh-keygen`) : l'empreinte à retrouver est celle d'une vraie clé.
- Configuration validée par le vrai `sshd -T` (valeurs effectives), pas par un `grep`.
- Preuve : `sha256sum -c`, journal d'origine vérifié inchangé.
- Règle nftables : l'ordre compte (le drop doit précéder l'accept du port 22).
- Détection rejouée sur un second journal inconnu (anti-triche, faux positifs).
- Retest horodaté, postérieur aux corrections ; rapport structuré.

## Tester
```bash
bash tests/run-solution.sh      # joue chaque corrigé formateur contre son défi (ou : run-solution.sh 03)
docker compose up --build       # terminal web sur le port 7681
```
Le corrigé (`formateur/solutions/`) n'est pas copié dans l'image.

## Ajouter un défi
`challenges/NN-nom/` avec `meta.conf`, `enonce.txt`, `indices.txt`, `setup.sh`, `check.sh` (voir le défi 01 : `gen-log.sh` et `controls.sh` sont des aides partagées facultatives).

## Licence

© 2026 Yahn LE PRETTRE - Formaxion Landes. Distribué sous licence **EUPL 1.2** (fichier `LICENSE`). Le nom et l'identité visuelle ne sont pas couverts par cette licence.
