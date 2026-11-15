# P8 · Investigation d'incident

Durée : 1 h 30 · Prérequis : 00, P7 · Défi associé : 01 · Incident SSH

## Objectifs
- Appliquer une méthode : préserver, trier, reconstituer, conclure.
- Lire des journaux d'authentification et retrouver une persistance.
- Produire une chronologie fiable.

## 1. Méthode
1. **Préserver** : copier les preuves, calculer les empreintes, ne pas altérer l'original.
2. **Cadrer** : quoi, quand, quelles machines, quels comptes.
3. **Reconstituer** : une chronologie ordonnée, chaque ligne sourcée.
4. **Qualifier** : tentative, succès, activité après succès.
5. **Contenir puis corriger** (leçon P10), **restituer** (P11).

## 2. Sources utiles sous Linux
| Source | Contenu |
|---|---|
| `/var/log/auth.log` | connexions, `sudo`, échecs |
| `last`, `lastb` | historique des sessions et des échecs |
| `journalctl -u ssh --since "03:00"` | journal systemd d'un service |
| `~/.bash_history` | commandes (peut avoir été effacé) |
| `~/.ssh/authorized_keys` | clés autorisant la connexion |
| `crontab -l`, `/var/spool/cron/crontabs/` | tâches planifiées |
| `ls -l --time=ctime`, `stat` | dates de modification |

## 3. Retrouver la persistance
Un attaquant qui a un accès veut le conserver : clé SSH ajoutée, tâche cron, compte créé, service installé. Cherchez ce qui a été **modifié pendant la fenêtre de compromission** (`find / -newermt "2026-11-15 03:00" ! -newermt "2026-11-15 05:00" -type f 2>/dev/null`). L'empreinte d'une clé s'obtient avec `ssh-keygen -lf fichier`.

## 4. Fait ou hypothèse ?
- Fait : « Accepted password pour svc-backup depuis 203.0.113.77 à 03:19:26 ».
- Hypothèse : « le mot de passe était faible » (à confirmer : politique, historique).
Une chronologie ne contient que des faits sourcés ; les hypothèses sont listées à part.

## 5. Erreurs fréquentes
- Travailler directement sur le journal d'origine.
- Compter toutes les lignes contenant l'IP au lieu des seules lignes « Failed password ».
- Oublier le fuseau horaire en comparant des sources.

## 6. Exercices
1. Un journal contient 55 lignes `Failed password` pour une IP et 1 `Accepted`. Gravité ?
<details><summary>Réponse</summary>

Compromission probable du compte : succès après essais répétés depuis la même source. Il faut chercher l'activité ultérieure.
</details>

2. Quelle commande donne l'empreinte d'une clé publique ?
<details><summary>Réponse</summary>

`ssh-keygen -lf chemin/vers/la_cle.pub` (ou le fichier `authorized_keys` pour une seule clé par fichier).
</details>

## Pour aller plus loin
Faites le défi `defi start 01`.
