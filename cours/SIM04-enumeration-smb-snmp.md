# SIM04 · Énumération SMB et SNMP

Durée : 1 h 30 · Prérequis : SIM03 · Missions associées : SIM04-1, SIM04-2 (parcours pentest)

## Objectifs
- Lister les partages SMB d'un serveur sans compte et tester l'accès à chacun.
- Interroger un équipement en SNMP et exploiter ce qu'il révèle.
- Distinguer ce qui est observé (accès réussi, valeur lue) de ce qui est supposé.
- Proposer une correction : suppression de l'accès anonyme, SNMPv3, filtrage.

## 1. L'essentiel
- **SMB** (port 445) sert le partage de fichiers. Un serveur peut annoncer la liste de ses partages à un client sans compte, puis accepter ou refuser la lecture partage par partage. Un partage « invité » est lisible par n'importe qui sur le réseau.
- **SNMP** (port UDP 161) sert à superviser des équipements : imprimantes, commutateurs, routeurs. Les versions 1 et 2c n'ont pas d'authentification réelle : un mot, la **communauté**, joue le rôle de mot de passe, transmis en clair.
- L'énumération consiste à demander poliment ce que le service répond déjà : noms, versions, contacts. Elle précède toute exploitation et reste soumise au mandat.

## 2. En pratique
```
nmap -sV -p 445 192.168.20.43                 # produit et version du service SMB
smbclient -L //192.168.20.43 -N               # liste des partages sans mot de passe (-N)
smbclient //192.168.20.43/public -N -c "ls"   # lire un partage
snmpwalk -v2c -c public 192.168.20.210        # tout le système
snmpget -v2c -c public 192.168.20.210 sysContact.0
```
Sortie type de `smbclient -L` :
```
	Sharename       Type      Comment
	---------       ----      -------
	public          Disk      Documents publics
	compta          Disk      Comptabilité
	IPC$            IPC       IPC Service
```
Sortie type d'un accès refusé :
```
tree connect failed: NT_STATUS_ACCESS_DENIED
```

## 3. Lire le résultat
- Apparaître dans la liste n'est pas être lisible : testez chaque partage. `ACCESS_DENIED` signifie que le partage est protégé, c'est un bon signe.
- Un partage lisible sans mot de passe **qui contient un fichier sensible** (paie, contrats, exports) est un constat majeur, quel que soit son nom.
- `IPC$` est un canal technique, on ne le compte pas comme partage de données.
- Avec SNMP, l'absence de réponse (« Timeout ») veut dire communauté refusée **ou** service filtré. Essayez une courte liste de communautés courantes, pas un dictionnaire massif : chaque essai laisse une trace.
- `sysDescr` donne le modèle et le firmware, `sysContact` une adresse réelle, `sysLocation` un lieu : autant d'éléments utiles à un attaquant.

## 4. Côté défense
- Interdire l'accès invité sur tous les partages, exiger un compte et gérer les droits par groupe. Cacher ou renommer un partage ne protège rien.
- Ne jamais déposer de documents sensibles sur un partage accessible largement ; contrôler régulièrement le contenu des partages.
- Passer en **SNMPv3** avec authentification et chiffrement, ou à défaut restreindre SNMP aux adresses de supervision et supprimer les communautés par défaut.
- Journaliser et surveiller : listage de partages anonyme, essais de communautés inconnues.

## 5. Erreurs fréquentes
- Conclure qu'un partage est exposé parce qu'il est listé, sans avoir testé la lecture.
- Changer le nom de la communauté en conservant SNMPv2c ouvert : le mot reste lisible en clair sur le réseau.
- Oublier que l'imprimante ou le NAS non inventorié est aussi une cible du mandat... ou du risque.
- Télécharger des fichiers sensibles pour « prouver » : on constate la présence (nom, taille), on ne copie pas de données personnelles.

## 6. Exercices
1. `smbclient -L` liste trois partages, mais un seul est lisible avec `-N`. Combien de partages anonymes comptez-vous ?
<details><summary>Réponse</summary>
Un seul. La liste n'est pas la preuve d'un accès ; seul le partage qui répond au `ls` sans mot de passe est anonyme. Les autres répondent `ACCESS_DENIED`.
</details>

2. Une imprimante répond à `snmpwalk -c public`. Quelles données sensibles y trouvez-vous et que recommandez-vous ?
<details><summary>Réponse</summary>
Modèle, version du firmware, adresse de contact, emplacement, numéro de série : utiles pour cibler une faille ou une usurpation. Recommandation : SNMPv3 avec authentification, ou SNMP limité aux adresses de supervision et communauté par défaut supprimée, puis mise à jour du firmware.
</details>

3. Pourquoi masquer un partage (« browseable = no ») ne suffit-il pas ?
<details><summary>Réponse</summary>
Le partage reste accessible à qui connaît son nom : seul le droit d'accès protège. La correction est d'exiger l'authentification et de limiter les droits.
</details>
