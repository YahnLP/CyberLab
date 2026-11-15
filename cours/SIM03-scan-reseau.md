# SIM03 · Scan réseau : hôtes, ports et services

Durée : 1 h 30 · Prérequis : P2, SIM02 · Missions associées : SIM03-1, SIM03-2, SIM03-3 (parcours pentest)

## Objectifs
- Découvrir les hôtes actifs d'une plage et comparer avec l'inventaire.
- Lire un résultat `nmap` : états de ports, services, versions.
- Choisir la portée d'un scan (ports courants ou tous les ports) et en mesurer le bruit.
- Comparer la réalité à l'inventaire et à une politique de versions.

## 1. L'essentiel
- Un scan se déroule en étapes : **découvrir les hôtes**, **énumérer les ports**, **identifier les services et versions**.
- Un port est **ouvert** (un service répond), **fermé** (la machine répond qu'il n'y a rien) ou **filtré** (un pare-feu ne répond pas, on ne sait pas).
- Par défaut, `nmap` ne teste que les 1000 ports les plus courants. Un service placé sur un port inhabituel n'apparaît pas : `-p-` teste les 65 535 ports.
- La détection de version (`-sV`) interroge chaque service pour lire sa bannière. Elle est plus précise et plus bruyante.
- Un scan est **visible** : pare-feu, sondes de détection et journaux le voient. Il se fait avec un mandat, dans le périmètre.

## 2. En pratique
```
nmap -sn 192.168.20.0/24              # quels hôtes répondent ? (aucun port testé)
nmap 192.168.20.12                    # ports courants
nmap -sV 192.168.20.12                # + versions des services
nmap -sV -p- 192.168.20.12            # tous les ports
nmap -p 22,80,443 192.168.20.12       # ports choisis
```
Sortie type de `nmap -sV` :
```
PORT    STATE SERVICE  VERSION
22/tcp  open  ssh      OpenSSH 8.4p1 Debian 5+deb11u3 (protocol 2.0)
80/tcp  open  http     nginx 1.18.0
443/tcp open  ssl/http nginx 1.18.0
```
Pour comparer à l'inventaire, notez les ports par hôte dans un tableau, puis écrivez l'écart avec `diff` ou `sort`/`comm`.

## 3. Lire le résultat
- Votre propre poste apparaît dans la découverte : ne le comptez pas parmi les équipements du réseau.
- Un hôte **actif mais absent de l'inventaire** est un équipement que personne ne surveille (imprimante, caméra, poste personnel).
- Un hôte **inventorié mais muet** est peut-être retiré, éteint ou filtré. Un enregistrement DNS qui subsiste confirme un inventaire en retard.
- « Not shown: 998 closed tcp ports » signifie que les autres ports testés sont fermés, pas qu'ils ont été oubliés.
- Une version inférieure au minimum de la **politique de versions** est un écart de conformité. Ce n'est pas une preuve d'exploitation : c'est un constat à traiter.

## 4. Côté défense
- Tenir un inventaire des hôtes et des ports attendus, et le comparer régulièrement à un scan autorisé.
- Fermer ou filtrer au pare-feu ce qui n'est pas prévu ; n'exposer que les ports utiles.
- Isoler les équipements non gérés dans un réseau dédié, identifier leur propriétaire, puis les inventorier ou les retirer.
- Mettre à jour les services sous le minimum, avec test, puis **retester** pour prouver la correction.
- Observer le bruit des scans : un balayage de nombreuses adresses ou de tous les ports d'un hôte doit déclencher une alerte.

## 5. Erreurs fréquentes
- Se contenter du scan par défaut et conclure « rien d'autre n'est ouvert ».
- Lancer un scan large ou répété sans mandat, ou en dehors du périmètre.
- Confondre « filtré » et « fermé », ou « ne répond pas au ping » et « absent ».
- Mettre à jour tous les services en même temps sans test, au risque de couper la production.

## 6. Exercices
1. `nmap -sn` annonce « 256 IP addresses (6 hosts up) ». Votre poste est l'un d'eux. Combien d'équipements du réseau répondent ?
<details><summary>Réponse</summary>
5 équipements, en excluant votre poste. Il reste à comparer ces cinq adresses à l'inventaire.
</details>

2. Un scan par défaut du serveur web montre les ports 22, 80 et 443. Pourquoi ne suffit-il pas pour affirmer qu'il n'y a rien d'autre ?
<details><summary>Réponse</summary>
Le scan par défaut ne teste que les 1000 ports les plus courants. Un service sur un port élevé ou inhabituel (6379, 9200…) ne serait pas vu. Il faut relancer avec `-p-` et noter l'écart.
</details>

3. Le service MySQL d'un serveur annonce 5.7.33 alors que la politique exige 8.0.28 au minimum. Quelle est la mesure prioritaire et comment la prouver ?
<details><summary>Réponse</summary>
Planifier la mise à jour avec test et sauvegarde (en limitant d'ici là l'accès au port 3306), puis relancer `nmap -sV` sur ce serveur : la version doit atteindre le minimum. La capture du retest sert de preuve dans le rapport.
</details>
