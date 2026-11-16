# SIM16 · Réseaux sans fil : audit de configuration et bornes non autorisées

Durée : 1 h 15 · Prérequis : P2, SIM12 · Missions associées : SIM16-1, SIM16-2 (parcours pentest)

## Objectifs
- Relire l'inventaire des bornes d'une organisation selon une politique (chiffrement, WPS, firmware, isolation des invités).
- Repérer une borne non autorisée et une borne qui imite un réseau officiel.
- Proposer les corrections adaptées, sans jamais toucher au trafic d'autrui.

## 1. L'essentiel
- Un réseau sans fil est une porte **dans l'air** : son périmètre dépasse les murs. L'audit porte sur la **configuration** des bornes de l'organisation, à partir d'un inventaire.
- **Chiffrement** : « ouvert » ne protège rien ; WPA2 est le minimum, WPA3 est préférable, WPA2-Enterprise (authentification par compte, norme 802.1X) convient aux organisations car chaque personne a son propre accès.
- **WPS** simplifie la connexion par un code court, mais ce code est un point faible : on le désactive.
- Le **firmware** d'une borne se met à jour comme un système : une version trop ancienne cumule les failles connues.
- Un réseau **invités** doit être **isolé** : un visiteur ne doit pas atteindre le réseau interne, ni les autres visiteurs.
- Une borne **non autorisée** est une borne absente de la liste officielle ; la plus dangereuse est celle qui **reprend le nom d'un réseau officiel** (« jumeau malveillant ») pour attirer les connexions.
- Le périmètre prime : on audite ses propres bornes, avec mandat. Cette leçon **n'enseigne ni capture ni cassage de clés** : ces techniques relèvent d'un cadre juridique strict et ne sont pas nécessaires pour auditer une configuration.

## 2. En pratique (fichiers fournis, rien n'est capturé)
```
awk -F";" '$4=="oui"' inventaire-bornes.csv | wc -l           # bornes avec WPS actif
awk -F";" '$3=="ouvert" {print $2}' inventaire-bornes.csv      # réseaux sans chiffrement
awk -F";" 'NR>1 && $6+0 < 3.4 {print $1}' inventaire-bornes.csv   # firmware sous le minimum
awk -F";" '$5=="non" {print $2}' inventaire-bornes.csv         # invités non isolés
awk -F";" 'NR>1 {print $2}' bornes-autorisees.csv > officielles.txt
awk -F";" 'NR>1 {print $2}' bornes-observees.csv | grep -v -F -f officielles.txt   # adresses inconnues
```

## 3. Lire le résultat
- Un réseau ouvert n'est pas forcément une faute pour un réseau public prévu, mais il l'est pour un réseau d'entreprise. La **politique** tranche.
- Comparez les versions comme des **nombres** (3.10 et 3.9 se comparent avec soin) ou, mieux, avec l'outil de gestion qui connaît le format.
- Une adresse matérielle inconnue est un **constat** ; qu'elle soit hostile est une **hypothèse**. Un téléphone qui partage sa connexion crée aussi une borne « non autorisée » sans malveillance.
- Le signal le plus alarmant est un **même nom de réseau** associé à une **autre adresse matérielle** que celle de l'inventaire.

## 4. Côté défense
- WPA3 ou WPA2-Enterprise, WPS désactivé, mots de passe longs et renouvelés pour les réseaux à clé partagée.
- Réseau invités sur un **VLAN dédié**, isolation des clients, débit limité.
- Mise à jour planifiée et testée des firmwares ; inventaire tenu à jour.
- Surveillance continue des bornes visibles : alerte sur toute adresse inconnue ou tout nom officiel avec une autre adresse ; localisation et débranchement de la borne pirate.
- Authentification forte sur le réseau interne (802.1X) pour qu'un poste ne se connecte pas à une borne inconnue.

## 5. Erreurs fréquentes
- Croire que masquer le nom du réseau (SSID) protège : il reste visible pour qui écoute.
- Changer le mot de passe du Wi-Fi sans rechercher la borne pirate : elle reste en place.
- Conserver WPS « pour les visiteurs » : c'est une porte dérobée.
- Considérer toute adresse inconnue comme une attaque, sans vérifier d'abord un équipement personnel.
- Tester des réseaux qui ne sont pas les vôtres : hors mandat, c'est interdit.

## 6. Exercices
1. Un réseau invités est en WPA2, WPS désactivé, mais isolation = non. Que dire ?
<details><summary>Réponse</summary>

Le chiffrement et WPS sont conformes, mais un visiteur peut atteindre d'autres machines : constat majeur. Correction : VLAN dédié aux invités avec isolation des clients et règles de pare-feu vers l'interne.
</details>

2. Une borne observée annonce « Entreprise » avec une adresse matérielle absente de la liste officielle. Constat et mesure ?
<details><summary>Réponse</summary>

Constat : un réseau portant un nom officiel est émis par une adresse non autorisée (probable jumeau malveillant, à confirmer). Mesure : localiser la borne par la force du signal, la débrancher, prévenir les utilisateurs et renforcer l'authentification (802.1X).
</details>

3. Pourquoi ne pas régler le problème en cachant le nom de réseau ?
<details><summary>Réponse</summary>

Le nom reste détectable, et seules les personnes légitimes sont gênées. La protection vient du chiffrement, de l'authentification et du contrôle des bornes.
</details>
