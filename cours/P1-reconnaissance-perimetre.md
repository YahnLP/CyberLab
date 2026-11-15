# P1 · Reconnaissance et périmètre

Durée : 1 h · Prérequis : leçon 00 · Défi associé : à créer

## Objectifs
- Distinguer reconnaissance passive et active.
- Cadrer un périmètre et une règle d'engagement.
- Séparer un **fait observé** d'une **hypothèse**.

## 1. L'essentiel
- **Passive** : on collecte sans contacter la cible (annuaires de noms de domaine, certificats publics, offres d'emploi, dépôts publics).
- **Active** : on envoie du trafic à la cible (ping, scan, requête HTTP). Elle laisse des traces et exige une autorisation.
- Le **périmètre** liste ce qui est dans le test (par exemple `192.168.20.0/24`, `app.exemple.test`) et ce qui est exclu. Les **règles d'engagement** fixent horaires, volumes et contacts d'urgence.

## 2. En pratique (domaine fictif `exemple.test`)
```
whois exemple.test             # titulaire, dates, serveurs de noms
dig exemple.test A +short      # adresse(s) IPv4
dig exemple.test MX +short     # serveurs de messagerie
curl -sI http://app.exemple.test/   # en-têtes HTTP seulement
```
Sortie type de `curl -sI` :
```
HTTP/1.1 200 OK
Server: Apache/2.4.57 (Debian)
X-Powered-By: PHP/8.2.7
```

## 3. Lire le résultat
| Observation (fait) | Hypothèse à vérifier |
|---|---|
| L'en-tête annonce Apache 2.4.57 | La version réelle peut être masquée ou rétroportée |
| `X-Powered-By: PHP/8.2.7` | PHP est probablement utilisé, version non confirmée |

Une bannière est un **indice d'inventaire**, pas une vulnérabilité. On ne parle de vulnérabilité qu'après vérification.

## 4. Côté défense
Réduire les bannières (`ServerTokens Prod`, `expose_php = Off`), tenir un inventaire des sous-domaines, surveiller les certificats émis pour ses domaines.

## 5. Erreurs fréquentes
- Scanner une adresse « voisine » non listée au périmètre.
- Présenter une version lue dans une bannière comme prouvée.
- Oublier de dater et de conserver les sorties brutes.

## 6. Exercices
1. Un scan hors horaires convenus est-il acceptable s'il ne casse rien ?
<details><summary>Réponse</summary>

Non : les règles d'engagement font partie de l'autorisation. Un écart doit être validé par écrit avant d'agir.
</details>

2. Rédigez un fait et une hypothèse à partir de `Server: nginx`.
<details><summary>Réponse</summary>

Fait : l'en-tête Server vaut « nginx ». Hypothèse : le serveur frontal est nginx, éventuellement un reverse proxy devant une autre application.
</details>
