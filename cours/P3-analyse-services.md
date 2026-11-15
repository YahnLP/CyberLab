# P3 · Analyse des services

Durée : 1 h 15 · Prérequis : P2 · Défi associé : 04 · Services exposés

## Objectifs
- Interpréter les états de port.
- Identifier un service et sa version, et mesurer l'exposition.
- Relier chaque service ouvert à un besoin métier.

## 1. L'essentiel
Un port TCP est **open** (un service écoute), **closed** (la machine répond « rien ici ») ou **filtered** (un pare-feu ne répond pas). Un service ouvert est une **surface d'attaque** : on la justifie ou on la ferme.

| Port | Service | Point d'attention |
|---|---|---|
| 21 | FTP | identifiants en clair, anonyme |
| 22 | SSH | mots de passe faibles, clés, versions |
| 23 | Telnet | tout en clair, à bannir |
| 25 | SMTP | relais ouvert |
| 80/443 | HTTP/HTTPS | applications web |
| 139/445 | SMB | partages, versions anciennes |
| 161/udp | SNMP | communauté par défaut |

## 2. En pratique
```
nmap -p 1-1024 192.168.20.10          # ports courants
nmap -sV -p 22,80,445 192.168.20.10   # détection de version
ss -tulpn                             # côté serveur : qui écoute ?
```
Sortie type :
```
22/tcp  open  ssh   OpenSSH 9.2p1 Debian
80/tcp  open  http  Apache httpd 2.4.57
445/tcp filtered microsoft-ds
```

## 3. Lire le résultat
`filtered` n'est pas `closed` : un filtre existe. Une version détectée est un indice ; la vulnérabilité se vérifie ensuite (P5). Comparez avec `ss -tulpn` côté serveur : une différence révèle un filtrage ou un service lié à une seule interface.

## 4. Côté défense
Fermer ce qui est inutile, lier un service à l'interface nécessaire, filtrer par source (nftables), remplacer FTP/Telnet par SFTP/SSH.

## 5. Erreurs fréquentes
- Scanner uniquement les 1000 ports par défaut et conclure « rien d'autre ».
- Oublier UDP.
- Lancer un scan agressif en production sans accord.

## 6. Exercices
1. Que signifie `filtered` sur le port 445 ?
<details><summary>Réponse</summary>

Un pare-feu ou un filtre empêche de savoir si le port est ouvert : aucune réponse exploitable n'est revenue.
</details>

2. Quelle commande vérifie côté serveur les ports en écoute ?
<details><summary>Réponse</summary>

`ss -tulpn` (TCP et UDP, en écoute, numérique, avec le processus).
</details>
