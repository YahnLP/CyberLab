# CyberLab

Laboratoire de cyber-défense en ligne de commande : un vrai terminal Linux par stagiaire (Docker + ttyd), des défis auto-corrigés sur des données réalistes générées au hasard à chaque session. Même moteur que BashLab (`defi liste`, `defi start`, `defi indice`, `defi valider`).

Créé par Formaxion Landes — © Yahn LE PRETTRE 2026. **Proposition non publiée : rien n'a été poussé sur GitHub.**

## Contenu actuel
| Défi | Séquence | Points |
|---|---|---|
| 01 · Incident SSH : détecter, contenir, corriger | Séquence 5 · Cyber-défense | 60 |

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
bash tests/run-solution.sh      # joue le corrigé formateur contre le défi
docker compose up --build       # terminal web sur le port 7681
```
Le corrigé (`formateur/solutions/`) n'est pas copié dans l'image.

## Ajouter un défi
`challenges/NN-nom/` avec `meta.conf`, `enonce.txt`, `indices.txt`, `setup.sh`, `check.sh` (voir le défi 01 : `gen-log.sh` et `controls.sh` sont des aides partagées facultatives).
