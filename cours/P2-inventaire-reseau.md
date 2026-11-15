# P2 · Inventaire réseau

Durée : 1 h · Prérequis : P1 · Défi associé : à créer

## Objectifs
- Lire une configuration IP et calculer une plage CIDR.
- Découvrir les hôtes d'un segment et comparer avec l'inventaire attendu.
- Expliquer ARP, ICMP et leurs limites.

## 1. L'essentiel
- Une adresse `192.168.20.37/24` : réseau `192.168.20.0`, masque `255.255.255.0`, 254 hôtes utilisables, diffusion `192.168.20.255`.
- **ARP** associe une adresse IP à une adresse MAC sur le même segment : la découverte ARP est fiable en local, car aucun pare-feu ne filtre ARP.
- **ICMP** (ping) peut être filtré : l'absence de réponse ne prouve pas l'absence de l'hôte.

## 2. En pratique
```
ip addr show                 # mes adresses
ip route                     # ma passerelle
ip neigh                     # table ARP déjà connue
nmap -sn 192.168.20.0/24     # découverte d'hôtes sans scan de ports
```
Sortie type de `nmap -sn` :
```
Nmap scan report for 192.168.20.10
Host is up (0.0004s latency).
MAC Address: 08:00:27:AA:BB:01 (PCS Systemtechnik)
Nmap done: 256 IP addresses (4 hosts up)
```

## 3. Lire le résultat
Comparez avec l'inventaire : hôtes attendus absents (éteints ? filtrés ?), hôtes **inconnus** présents (équipement non géré, poste personnel, intrus). L'écart est le résultat, pas la liste elle-même.

## 4. Côté défense
Inventaire à jour, 802.1X ou liste d'adresses MAC autorisées, alerte sur nouvel équipement, segmentation.

## 5. Erreurs fréquentes
- Conclure « hôte absent » après un ping sans réponse.
- Confondre nombre d'adresses (256) et nombre d'hôtes utilisables (254).
- Scanner un réseau plus large que le périmètre.

## 6. Exercices
1. Combien d'hôtes utilisables dans `10.0.4.0/22` ?
<details><summary>Réponse</summary>

Un /22 offre 2^10 = 1024 adresses, donc 1022 hôtes utilisables.
</details>

2. Pourquoi `ip neigh` est-il utile après un scan ?
<details><summary>Réponse</summary>

Il liste les couples IP/MAC appris : on voit les hôtes qui ont répondu, même si ICMP est filtré.
</details>
