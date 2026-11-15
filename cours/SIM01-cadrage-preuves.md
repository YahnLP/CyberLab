# SIM01 · Cadrage, règles d'engagement et preuves

Durée : 1 h · Prérequis : P1 · Missions associées : SIM01-1, SIM01-2 (parcours pentest)

## Objectifs
- Lire un mandat d'audit et en déduire ce qui est autorisé, exclu et interdit.
- Refuser une cible hors périmètre, même à la demande du client.
- Capturer une preuve exploitable et la sceller avec une empreinte SHA-256.
- Tenir un journal d'actions qui permette de rejouer et de défendre le travail.

## 1. L'essentiel
- Un test d'intrusion n'est légal que dans un **cadre écrit** : mandat signé, périmètre précis, fenêtre de tests, exclusions, interdits, contacts d'urgence.
- Le périmètre se lit comme une intersection : une cible est autorisée si elle est **dans** le périmètre et **hors** de toute exclusion. Une adresse qui appartient à un tiers (hébergeur, fournisseur) n'est jamais couverte par l'accord du client seul.
- Une preuve est un résultat **brut, daté, complet et non modifié**. L'empreinte SHA-256 permet de démontrer qu'il n'a pas changé depuis la capture.
- Les règles d'engagement prévoient aussi l'arrêt : en cas d'impact sur la production, on s'arrête et on prévient.

## 2. En pratique
```
cat mandat.txt                         # relire le cadre avant toute action
cat cibles-candidates.txt              # comparer chaque adresse au périmètre
nmap -sV 192.168.20.12 > preuve-scan.txt     # capturer la sortie complète
sha256sum preuve-scan.txt              # sceller : 64 caractères hexadécimaux
```
Exemple de ligne de journal :
```
2026-11-15 21:04 | nmap -sV www | preuve-scan.txt | sha256 3f2c...e81a | périmètre : article 1
```

## 3. Lire le résultat
- Si une adresse figure dans l'article 2 (exclusions), elle reste exclue même si elle est dans la plage interne.
- Un serveur « du client » hébergé chez un tiers est **hors périmètre** tant que le tiers n'a pas autorisé par écrit.
- Si l'empreinte change alors que vous n'avez « rien fait », le fichier a été modifié : la preuve n'est plus recevable, il faut la refaire.
- Une preuve incomplète (sortie coupée, capture d'écran partielle) est contestable : redirigez toute la sortie dans un fichier.

## 4. Côté défense
- Le client a intérêt à fournir un mandat précis, une liste d'exclusions vérifiée et un contact joignable pendant la fenêtre.
- Surveiller les tests : les scans autorisés doivent apparaître dans les journaux aux horaires prévus ; tout le reste est un incident.
- Conserver les preuves dans un espace en lecture seule avec leurs empreintes.

## 5. Erreurs fréquentes
- « Le client est d'accord » : il ne peut pas autoriser le test d'un système qui ne lui appartient pas.
- Scanner avant d'avoir relu les exclusions.
- Enregistrer seulement une partie de la sortie, ou modifier le fichier pour le « nettoyer » avant de le sceller.
- Oublier d'horodater ou de noter la commande exacte.

## 6. Exercices
1. Le mandat exclut 192.168.20.34 (base de production). Le client écrit « vous pouvez la scanner, mais doucement ». Que faites-vous ?
<details><summary>Réponse</summary>
On ne scanne pas : le mandat signé prime sur un message informel. On demande un avenant écrit signé par la direction, qui précise la fenêtre, la méthode et les risques, puis seulement on agit.
</details>

2. Après avoir calculé l'empreinte d'une preuve, vous corrigez une faute de frappe dans le fichier. Que se passe-t-il ?
<details><summary>Réponse</summary>
L'empreinte change : elle ne correspond plus à celle notée dans le journal, donc la preuve n'est plus prouvée intacte. Il faut refaire la capture et recalculer l'empreinte, ou conserver l'original et annoter dans un autre fichier.
</details>

3. Quelles informations minimales notez-vous pour chaque action ?
<details><summary>Réponse</summary>
La date et l'heure, la commande exacte, la cible, la référence de l'article du mandat qui l'autorise, le nom du fichier de preuve et son empreinte SHA-256.
</details>
