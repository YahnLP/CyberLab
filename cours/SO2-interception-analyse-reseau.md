# SO2 · Interception et analyse réseau

Durée : 1 h 30 · Prérequis : P2, P7 · Défi associé : 11 · Lire une capture réseau

## Objectifs
- Capturer et lire du trafic sur un réseau de laboratoire.
- Reconnaître les protocoles qui exposent des identifiants.
- Comprendre l'interception ARP et ses contre-mesures.

## 1. Capturer
```
sudo tcpdump -i eth0 -n -w capture.pcap host 192.168.20.10 and port 21
tcpdump -n -r capture.pcap -A | head -40
```
`-n` évite la résolution de noms, `-w` écrit un fichier lisible plus tard dans Wireshark. Capturez uniquement sur votre réseau de laboratoire : l'écoute de trafic tiers est interdite.

## 2. Filtres utiles
| Besoin | Filtre tcpdump | Filtre Wireshark |
|---|---|---|
| Un hôte | `host 192.168.20.10` | `ip.addr == 192.168.20.10` |
| Un port | `port 80` | `tcp.port == 80` |
| Requêtes HTTP | `tcp port 80` | `http.request` |
| Trames ARP | `arp` | `arp` |

## 3. Protocoles en clair
FTP, Telnet, HTTP, POP3 transportent identifiants et données **lisibles** dans la capture. Dans Wireshark, « Suivre le flux TCP » reconstitue la conversation. Leçon : tout flux qui authentifie doit être chiffré (SFTP/SSH, HTTPS, IMAPS).

## 4. Interception ARP : lire la trace
Dans une capture, des réponses ARP **non sollicitées** répétées annonçant la même adresse IP avec une autre MAC trahissent un empoisonnement. Côté poste : `ip neigh` montre deux IP associées à la même MAC. Défenses : Dynamic ARP Inspection, entrées ARP statiques pour les équipements critiques, segmentation, chiffrement de bout en bout. HSTS et TLS rendent l'interception inexploitable pour les sites protégés.

## 5. Éthique et traces
Une capture contient des données personnelles : stockez-la dans `preuves/`, calculez son empreinte, limitez sa durée de conservation.

## 6. Exercices
1. Pourquoi un flux FTP est-il dangereux ?
<details><summary>Réponse</summary>

Identifiant et mot de passe circulent en clair : toute personne capable de capturer le trafic peut les lire.
</details>

2. Quel indice dans `ip neigh` suggère un empoisonnement ARP ?
<details><summary>Réponse</summary>

L'adresse MAC de la passerelle change, ou deux adresses IP différentes partagent la même MAC.
</details>
