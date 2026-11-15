# SO3 · Reconnaissance avancée et énumération de services

Durée : 1 h 30 · Prérequis : P1 à P3 · Défi associé : 12 · Énumération de services

## Objectifs
- Énumérer DNS, ports et services d'une cible de laboratoire.
- Lire une énumération SMB, SNMP et SMTP.
- Proposer la réduction d'exposition correspondante.

## 1. DNS
```
dig @192.168.20.2 lab.test NS +short
dig @192.168.20.2 lab.test AXFR      # transfert de zone : doit être REFUSÉ pour un tiers
```
Un transfert de zone réussi livre toute la liste des noms internes : c'est une **mauvaise configuration**. Correction : n'autoriser le transfert qu'aux serveurs secondaires déclarés (`allow-transfer`).

## 2. Cartographie des ports
```
nmap -sS -p- -T3 192.168.20.10          # tous les ports TCP, débit raisonnable
nmap -sV -sC -p 22,80,139,445 192.168.20.10   # versions et scripts par défaut
```
Un scan complet est long et bruyant : prévenez le contact défini au mandat.

## 3. Énumération de services
| Service | Que regarder | Risque typique |
|---|---|---|
| SMB | partages visibles, accès invité, version | partage ouvert, protocole ancien (SMBv1) |
| SNMP | communauté lisible, informations système | communauté par défaut `public` |
| SMTP | commandes VRFY/EXPN, relais | divulgation d'utilisateurs, relais ouvert |

Exemples en lecture seule : `smbclient -L //192.168.20.10 -N`, `snmpwalk -v2c -c public 192.168.20.10 system`.

## 4. Lire le résultat
Notez pour chaque service : version observée, authentification demandée ou non, informations obtenues sans identifiant. Une information obtenue **sans authentification** est un constat à part entière.

## 5. Côté défense
Désactiver SMBv1 et l'accès invité, changer ou désactiver SNMP v1/v2c au profit de SNMPv3, restreindre VRFY/EXPN, filtrer les ports de gestion depuis les seuls réseaux d'administration.

## 6. Exercices
1. Que prouve un transfert de zone AXFR réussi depuis un poste quelconque ?
<details><summary>Réponse</summary>

Que le serveur DNS autorise le transfert à n'importe qui : la liste complète des enregistrements de la zone est exposée.
</details>

2. Pourquoi privilégier SNMPv3 ?
<details><summary>Réponse</summary>

Il apporte authentification et chiffrement ; v1/v2c reposent sur une « communauté » en clair.
</details>
