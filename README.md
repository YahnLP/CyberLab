# CyberLab

Laboratoire de cyber-défense et de pentest en ligne de commande, en deux formes qui partagent les mêmes défis : un vrai terminal Linux par stagiaire (Docker + ttyd), ou un simulateur 100 % navigateur (GitHub Pages) avec un jumeau numérique d'organisation fictive (DNS, scan réseau, web) tiré au hasard à chaque session. Les défis sont auto-corrigés sur des données réalistes différentes pour chaque stagiaire, avec un mode Guidé, un mode Expert, un Casebook de preuves et un parcours pentest. Le moteur de défis (`defi liste`, `defi start`, `defi indice`, `defi valider`) est issu de BashLab, mais CyberLab évolue désormais de façon autonome.

Créé par Formaxion Landes — © Yahn LE PRETTRE 2026. 

## Contenu actuel
| Défi | Séquence | Points |
|---|---|---|
| 01 · Incident SSH : détecter, contenir, corriger | Séquence 5 · Cyber-défense | 60 |
| 00 · Prise en main : preuve et premières commandes | Fondations | 25 |
| 02 · Fiche de reconnaissance | Séquence 6 · Parcours professionnalisant | 30 |
| 03 · Écarts d'inventaire | Séquence 6 · Parcours professionnalisant | 30 |
| 04 · Services exposés | Séquence 6 · Parcours professionnalisant | 35 |
| 05 · Audit HTTP | Séquence 6 · Parcours professionnalisant | 35 |
| 06 · Trier les résultats d'un scanner | Séquence 6 · Parcours professionnalisant | 40 |
| 07 · Contrôle d'accès d'une API | Séquence 6 · Parcours professionnalisant | 40 |
| 08 · Disponibilité sous pression | Séquence 6 · Parcours professionnalisant | 40 |
| 09 · Priorisation des risques | Séquence 6 · Parcours professionnalisant | 45 |
| 10 · Analyse d'un mandat d'audit | Séquence 7 · Parcours sécurité offensive | 40 |
| 11 · Lire une capture réseau | Séquence 7 · Parcours sécurité offensive | 45 |
| 12 · Énumération de services | Séquence 7 · Parcours sécurité offensive | 45 |
| 13 · Revue de code d'une application web | Séquence 7 · Parcours sécurité offensive | 45 |
| 14 · Protections mémoire et base Metasploit | Séquence 7 · Parcours sécurité offensive | 50 |
| 15 · Audit d'un annuaire | Séquence 8 · Parcours avancés | 50 |
| 16 · Reconstituer une chronologie | Séquence 8 · Parcours avancés | 50 |
| 17 · Segmentation et pivot | Séquence 8 · Parcours avancés | 45 |

## Parcours pentest (simulateur web)
Missions sur une plage fictive générée à chaque session (jumeau numérique), avec outils simulés (`ping`, `host`, `dig`, `nslookup`, `nmap`, `curl`) : SIM02-1 à SIM02-3 (reconnaissance), SIM03-1 à SIM03-3 (scan). Chaque mission demande des constats (Red) puis une mesure de défense (Blue). Feuille de route : [`docs/FEUILLE-DE-ROUTE.md`](docs/FEUILLE-DE-ROUTE.md).

## Cours
17 leçons originales réparties en trois parcours (Fondations, Parcours professionnalisant P1 à P11, Parcours sécurité offensive SO1 à SO5) : voir [`cours/README.md`](cours/README.md). Contrôle de structure : `bash tests/check-cours.sh`.

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


## Simulateur web (GitHub Pages)

CyberLab fonctionne aussi **entièrement dans le navigateur**, sans Docker ni serveur : un terminal simulé, les défis 02 à 17, le correcteur automatique, les indices, le score (conservé sur l'appareil) et les leçons.

- **Activer la publication** : Settings > Pages > Source : *GitHub Actions*. Le workflow `pages` construit et publie le site à chaque fusion sur `main`.
- **Essayer en local** : `node tools/build-site-data.mjs && cd site && python3 -m http.server`, puis ouvrir http://127.0.0.1:8000.
- **Tests** : `bash tests/web/run-all.sh` (correcteur JavaScript comparé au correcteur bash sur toutes les variantes ; commandes de l'émulateur comparées à bash réel).

Principe : les données de chaque défi sont produites par les vrais scripts `setup.sh` (30 variantes tirées au hasard par défi), et le navigateur en choisit une. Le terminal réimplémente en JavaScript les commandes usuelles (ls, cat, grep, awk, sed, sort, uniq, cut, tr, wc, head, tail, paste, date, base64, sha256sum, pipes, redirections, boucles, variables).

Le bouton « Installer le lab complet sur une vraie machine » (page `#/installer`) détaille le déploiement Docker pour un poste ou une salle.

Modes : **Guidé** (indices à -2 point) et **Expert** (sans indices, chronomètre, badge). Sous le terminal, le panneau **Comprendre** interprète la dernière commande et le **Journal** garde l'historique du défi et le **Casebook** rassemble preuves et conclusion pour exporter un rapport (Markdown ou HTML).

Le défi 01 (incident SSH) est aussi jouable : `ssh-keygen -lf` et `sshd -T` sont simulés (résultats comparés aux vrais outils par `tests/web/diff-ssh.mjs`), et le correcteur est vérifié contre le vrai `check.sh` sur 16 erreurs injectées.

Limites connues : les outils réseau (nmap, curl, tcpdump) sont absents du simulateur, les données à analyser étant déjà fournies ; en cas de coupure d'octet au milieu d'un caractère accentué, `cut -c` et `head -c` peuvent différer légèrement de bash.
