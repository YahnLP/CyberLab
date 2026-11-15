# SO5 · Analyse applicative, Metasploit et restitution

Durée : 2 h · Prérequis : P5, SO3, SO4 · Défi associé : 14 · Protections mémoire et base Metasploit

## Objectifs
- Se repérer dans le framework Metasploit en laboratoire.
- Comprendre ce qu'est une charge utile et comment on s'en protège.
- Observer les protections mémoire contre les débordements de tampon.
- Restituer l'ensemble dans un rapport.

## 1. Metasploit : structure
Le framework organise des **modules** : `exploit` (profite d'une faiblesse), `auxiliary` (scan, énumération), `payload` (code exécuté après succès), `post` (actions après accès). Une base de données conserve hôtes, services et résultats.
```
msfdb init && msfconsole -q
msf6 > workspace -a lab-audit
msf6 > db_nmap -sV 192.168.20.10
msf6 > hosts ; services
msf6 > search type:auxiliary name:smb_version
```
Usage : cible de laboratoire uniquement, module choisi **après** vérification de la version (P5), effet consigné.

## 2. Charges utiles (principe)
Une charge utile est le code exécuté sur la machine cible une fois la faiblesse exploitée : ouverture d'un shell, connexion retour, etc. La défense repose sur : correctifs, antivirus/EDR, filtrage des flux sortants, journalisation des processus. Cette leçon n'explique pas la fabrication de charges : en laboratoire, on observe les artefacts (processus, connexions) qu'elles laissent pour écrire des **règles de détection**.

## 3. Débordement de tampon : observer les protections
Un débordement écrit au-delà d'un tampon et peut corrompre la mémoire adjacente. Les protections modernes :
| Protection | Effet |
|---|---|
| NX / DEP | la pile n'est pas exécutable |
| ASLR | adresses mémoire aléatoires à chaque exécution |
| Canari de pile | valeur sentinelle vérifiée avant le retour de fonction |
| PIE, RELRO | exécutable relogeable, table de relocalisation protégée |
Observation : `checksec --file=./programme` liste les protections actives ; `cat /proc/sys/kernel/randomize_va_space` donne l'état de l'ASLR (2 = complet).

## 4. Restitution
Reprenez la structure de la leçon P11 : synthèse, périmètre, constats avec preuves, gravité contextualisée, plan d'action, retest. Ajoutez une section **limites** (ce qui n'a pas été testé) et une **chronologie** des actions.

## 5. Erreurs fréquentes
- Lancer un module « pour voir » sans avoir vérifié la version.
- Conserver des preuves contenant des données réelles.
- Livrer un rapport sans retest ni recommandation vérifiable.

## 6. Exercices
1. Quel module Metasploit sert à énumérer sans exploiter ?
<details><summary>Réponse</summary>

Un module `auxiliary` (par exemple une détection de version).
</details>

2. Que mesure `randomize_va_space` ?
<details><summary>Réponse</summary>

Le niveau d'ASLR du noyau : 0 désactivé, 1 partiel, 2 complet.
</details>
