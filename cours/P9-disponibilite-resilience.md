# P9 · Disponibilité et résilience

Durée : 1 h · Prérequis : P3 · Défi associé : à créer

## Objectifs
- Expliquer les principales attaques contre la disponibilité.
- Mesurer et chiffrer un risque de saturation.
- Choisir des protections et vérifier qu'elles tiennent.

## 1. L'essentiel
La disponibilité est le « D » de la triade C-I-D. On l'attaque en épuisant une ressource : bande passante, table de connexions, processus, base de données.

| Famille | Principe | Défense |
|---|---|---|
| Inondation SYN | des demandes de connexion TCP jamais terminées remplissent la file d'attente | SYN cookies, limitation par source, pare-feu avec suivi d'état |
| Connexions lentes (Slowloris) | de nombreuses requêtes HTTP ouvertes mais jamais complétées occupent les travailleurs | délais d'expiration courts, limite de connexions par IP, reverse proxy |
| Amplification par réflexion | une petite requête à adresse source usurpée provoque une grande réponse vers la victime | filtrage anti-usurpation (BCP 38), fermer les résolveurs ouverts, limitation des réponses |
| Épuisement applicatif | une requête coûteuse répétée (recherche, export) | mise en cache, quotas, files d'attente |

## 2. Un calcul à savoir faire
Le **facteur d'amplification** vaut `taille de la réponse / taille de la requête`. Une requête de 60 octets qui provoque une réponse de 3 000 octets donne un facteur de 50. Avec 10 Mbit/s émis, la victime reçoit environ 500 Mbit/s.

## 3. En pratique (sur votre propre machine de test)
```
ss -s                                # résumé des connexions
ss -ant state syn-recv | wc -l       # connexions en attente
sysctl net.ipv4.tcp_syncookies       # 1 = protection active
```
On mesure toujours **avant** et **après** protection avec le même scénario de charge, en laboratoire isolé et jamais contre un tiers.

## 4. Résilience
Redondance (deux serveurs derrière un répartiteur), sauvegardes **testées** par restauration, supervision avec seuils, plan de reprise avec objectifs RTO (durée tolérable d'interruption) et RPO (perte de données tolérable).

## 5. Erreurs fréquentes
- Tester la charge sur un système partagé ou en production.
- Supposer qu'une sauvegarde fonctionne sans l'avoir restaurée.
- Ne pas définir de seuil d'alerte avant l'incident.

## 6. Exercices
1. Requête 80 octets, réponse 4 000 octets : facteur ?
<details><summary>Réponse</summary>

4000 / 80 = 50.
</details>

2. Que signifie RPO = 15 minutes ?
<details><summary>Réponse</summary>

On accepte de perdre au maximum les 15 dernières minutes de données : la sauvegarde ou la réplication doit être au moins aussi fréquente.
</details>
