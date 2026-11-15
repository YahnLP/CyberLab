# SIM06 · Accès contrôlé et élévation de privilèges

Durée : 1 h 30 · Prérequis : P4 · Missions associées : SIM06-1, SIM06-2 (parcours pentest)

## Objectifs
- Auditer les comptes d'un serveur Linux : UID 0 caché, mot de passe vide, hachages faibles.
- Lire une configuration sudo et repérer une règle qui donne un shell root.
- Repérer un programme SUID qui n'a rien à faire sur le système.
- Proposer une correction qui retire le risque sans casser l'usage légitime.

## 1. L'essentiel
- Sous Linux, le droit « tout faire » est porté par l'**UID 0**, pas par le nom `root`. Un autre compte avec l'UID 0 est un administrateur déguisé.
- `/etc/passwd` liste les comptes ; `/etc/shadow` contient les mots de passe hachés. Un champ vide dans shadow veut dire connexion sans mot de passe ; `*` ou `!` veut dire pas de connexion par mot de passe.
- Le préfixe du hachage indique l'algorithme : `$1$` MD5 (faible), `$6$` SHA-512 (acceptable).
- **sudo** permet d'exécuter une commande avec les droits d'un autre compte. Une règle qui autorise un programme *interactif* (éditeur, `find`, `tar`, `awk`, pager) sans mot de passe permet en pratique de lancer un shell root.
- Un programme **SUID** s'exécute avec les droits de son propriétaire. Le système en contient quelques-uns connus ; un SUID dans `/usr/local`, `/opt` ou `/home` est suspect.

## 2. En pratique
```
awk -F: '$3==0' passwd.txt                # comptes dont l'UID est 0
awk -F: '$2==""' shadow-extrait.txt       # mots de passe vides
grep '\$1\$' shadow-extrait.txt           # hachages MD5
grep NOPASSWD sudoers.txt                 # règles sudo sans mot de passe
grep -Ev '^/usr/(bin|lib)/' suid-liste.txt   # SUID hors des chemins système
```
Sur un vrai système : `sudo -l` (mes droits sudo) et `find / -perm -4000 -type f 2>/dev/null` (liste des SUID).

## 3. Lire le résultat
- Un compte non-root avec `uid=0` est un constat grave, même si son nom est anodin.
- `*` et `!` ne sont pas des champs vides : seul un champ réellement vide ouvre la porte.
- Une règle `NOPASSWD: /usr/bin/systemctl restart nginx` est précise et sûre ; `NOPASSWD: /usr/bin/vim` ne l'est pas : on peut lancer un shell depuis l'éditeur.
- Comparez la liste SUID à une liste de référence du système : l'écart est le constat.

## 4. Côté défense
- Un seul compte UID 0, des comptes nominatifs, des mots de passe jamais vides, hachage SHA-512 ou mieux.
- Règles sudo limitées à des commandes précises, jamais à un programme capable de lancer un shell ; privilégier `sudoedit` pour modifier un fichier.
- Retirer les bits SUID inutiles (`chmod u-s`) et surveiller les changements par un contrôle d'intégrité.
- Journaliser les usages de sudo et alerter sur toute création de compte UID 0.

## 5. Erreurs fréquentes
- Renommer le compte au lieu de corriger son UID.
- Confondre « verrouillé » (`!`) et « sans mot de passe » (vide).
- Ajouter un mot de passe à une règle dangereuse : le risque reste, seule l'authentification change.
- Oublier de planifier le changement de mot de passe des comptes concernés.

## 6. Exercices
1. `awk -F: '$3==0' passwd.txt` affiche `root` et `maintenance`. Quel est votre constat ?
<details><summary>Réponse</summary>
Le compte `maintenance` possède tous les droits (UID 0) sous un nom anodin : constat grave. Mesure : lui donner un UID normal et des droits sudo précis si nécessaire, vérifier ses connexions passées, changer son mot de passe.
</details>

2. Une règle sudo autorise `tar` sans mot de passe pour un utilisateur. Pourquoi est-ce dangereux et que proposer ?
<details><summary>Réponse</summary>
`tar` peut exécuter une commande lors d'une sauvegarde, donc lancer un shell avec les droits root. Proposer une commande dédiée et figée (script ou règle précise) qui ne laisse pas choisir les options.
</details>

3. Un fichier `/opt/outils/export` apparaît dans la liste SUID. Quelles vérifications avant de retirer le bit ?
<details><summary>Réponse</summary>
Identifier son propriétaire et son rôle, vérifier qu'aucun service légitime n'en dépend, comparer à une sauvegarde ou à la référence du système, puis retirer le bit (`chmod u-s`) et relancer l'audit pour prouver la correction.
</details>
