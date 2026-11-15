# SIM08 · Capture et analyse de trafic

Durée : 1 h 30 · Prérequis : P2, SIM03 · Missions associées : SIM08-1, SIM08-2 (parcours pentest)

## Objectifs
- Lire une capture de trafic en texte (format tcpdump) et en extraire les faits utiles.
- Repérer un balayage de ports, un protocole en clair et un canal caché.
- Rattacher une adresse à un hôte de l'inventaire.
- Recommander une correction réseau mesurable.

## 1. L'essentiel
- Une capture est une liste de paquets : heure, source et port, destination et port, drapeaux TCP, longueur, parfois un extrait applicatif.
- Un **balayage de ports** se voit par un même émetteur qui envoie des SYN (`Flags [S]`) vers de **nombreux ports différents** d'une même cible, sans établir de session.
- Un protocole **en clair** (FTP, Telnet, HTTP) laisse lire identifiants et mots de passe dans la capture. Les versions chiffrées (SFTP, SSH, HTTPS) ne le permettent pas.
- Le **DNS** peut servir de canal caché : de longs noms pseudo-aléatoires suivis d'un domaine externe, en grand nombre, depuis un seul poste.
- Capturer du trafic est encadré : un mandat, un périmètre, et le traitement prudent des données personnelles qu'on y trouve.

## 2. En pratique
```
grep 'Flags \[S\]' capture.txt | awk '{print $3}' | sort | uniq -c | sort -rn   # SYN par source
awk '$3 ~ /192.168.20.180/ {print $5}' capture.txt | sort -u                       # cibles d'une source
grep -n 'PASS\|password\|USER' capture.txt                                          # secrets lisibles
grep TXT capture-dns.txt | awk '{print $3}' | sort | uniq -c                        # requêtes TXT par source
host 192.168.20.42                                                                  # nom de l'hôte
```
Exemple de ligne de capture :
```
14:20:58.412161 IP 192.168.20.250.41922 > 192.168.20.42.21: Flags [P.], length 16: FTP: USER plaquette
```

## 3. Lire le résultat
- Une adresse qui n'apparaît dans aucun inventaire et sonde des ports est un équipement à identifier d'urgence.
- Dans un balayage, comptez les **ports distincts** par source, pas seulement le nombre de paquets.
- Un mot de passe vu en clair doit être considéré comme **compromis** : changement obligatoire.
- Des noms DNS de 40 caractères hexadécimaux sous un même domaine inhabituel signalent une exfiltration. Comptez les requêtes et identifiez la source.

## 4. Côté défense
- Migrer vers des protocoles chiffrés et fermer les ports en clair.
- Segmenter pour que les postes ne parlent pas librement aux serveurs sensibles, et alerter sur les balayages.
- Forcer les postes à utiliser le résolveur interne, filtrer le DNS sortant et alerter sur les requêtes longues ou très nombreuses vers un domaine rare.
- Isoler le poste suspect avant de le réinstaller, puis conserver la capture comme preuve avec son empreinte.

## 5. Erreurs fréquentes
- Conclure « attaque » après un seul SYN : un client normal en envoie aussi.
- Oublier que la capture contient des données personnelles : la protéger et la limiter au besoin de l'audit.
- Bloquer tout le DNS : l'entreprise s'arrête. On cible la source et le domaine.
- Changer l'identifiant mais pas le mot de passe exposé.

## 6. Exercices
1. L'adresse A envoie 14 SYN vers 14 ports du même serveur, l'adresse B en envoie 6 vers le port 443 de deux serveurs. Laquelle balaye ?
<details><summary>Réponse</summary>
A : 14 ports distincts sur une même cible. B contacte un seul port, comportement normal d'un client.
</details>

2. Une capture montre `PASS Hiver2026!` en FTP. Que faites-vous ?
<details><summary>Réponse</summary>
Le mot de passe est compromis : le faire changer, remplacer FTP par SFTP ou FTPS, fermer le port 21 si possible. Dans le rapport, masquer le mot de passe et citer le numéro de ligne de la capture.
</details>

3. Un poste envoie 24 requêtes TXT aux noms de la forme `9bb5...c8.cdn-stat-72.example`. Que concluez-vous et que proposez-vous ?
<details><summary>Réponse</summary>
Probable exfiltration par DNS depuis ce poste. Proposer de l'isoler, de n'autoriser que le résolveur interne vers l'extérieur, d'alerter sur les noms longs et de bloquer le domaine après vérification.
</details>
