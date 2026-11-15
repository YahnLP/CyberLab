# 00 · Prise en main du terminal et de la méthode

Durée : 45 min · Prérequis : aucun · Défi associé : à créer

## Objectifs
- Se repérer dans une arborescence et manipuler des fichiers.
- Conserver une observation comme preuve, sans jamais modifier l'original.
- Connaître le cadre : on ne teste que ce qui est autorisé, dans le périmètre.

## 1. L'essentiel
Un terminal exécute des commandes dans un **répertoire courant**. Un chemin est **absolu** s'il commence par `/`, sinon il est **relatif** au répertoire courant. Chaque commande lit des entrées, écrit une sortie et renvoie un **code retour** (0 = succès).

| Besoin | Commande |
|---|---|
| Où suis-je ? | `pwd` |
| Que contient ce dossier ? | `ls -la` |
| Changer de dossier | `cd dossier`, `cd ..`, `cd ~` |
| Lire un fichier | `cat`, `head -n 5`, `tail -n 5`, `less` |
| Créer un dossier / un fichier | `mkdir preuves`, `touch note.txt` |
| Copier en conservant la date | `cp -p source cible` |
| Rediriger la sortie | `commande > fichier` (remplace), `>> fichier` (ajoute) |
| Enchaîner | `cmd1 \| cmd2` (la sortie de 1 devient l'entrée de 2) |

## 2. Droits et propriétaires
`ls -l` affiche `-rw-r--r-- 1 stagiaire stagiaire 120 nov. 15 10:02 note.txt` : type, droits (propriétaire, groupe, autres), propriétaire, taille, date. `chmod 600 fichier` réserve la lecture et l'écriture au propriétaire. Un secret (clé privée) ne doit jamais être lisible par les autres.

## 3. Garder une preuve exploitable
1. Travaillez dans un dossier `preuves/`.
2. Copiez la donnée d'origine avec `cp -p`, ne la modifiez jamais.
3. Calculez son empreinte : `sha256sum auth.log > SHA256SUMS`, vérifiez-la plus tard avec `sha256sum -c SHA256SUMS`.
4. Notez la commande et l'heure : `date` et `history | tail`.

## 4. Le cadre avant la technique
Tout test se fait avec une **autorisation écrite**, sur un **périmètre** précis (machines, plages d'adresses, dates). Dans CyberLab, toutes les données sont fictives et locales. Hors laboratoire, sortir du périmètre est une infraction même avec de bonnes intentions.

## 5. Erreurs fréquentes
- `>` écrase le fichier cible : utilisez `>>` pour ajouter.
- Oublier les guillemets autour d'un nom avec espace.
- Travailler sur l'original au lieu d'une copie.

## 6. Exercices
1. Créez `preuves/note.txt` contenant « première observation » en une seule commande.
<details><summary>Réponse</summary>

`mkdir -p preuves && echo "première observation" > preuves/note.txt`
</details>

2. Que fait `ls -la | wc -l` ?
<details><summary>Réponse</summary>

Elle compte les lignes de la liste détaillée (entrées du dossier plus la ligne « total »).
</details>

## Pour aller plus loin
`man bash`, `man ls`, puis la leçon P1.
