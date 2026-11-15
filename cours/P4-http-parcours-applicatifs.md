# P4 · HTTP et parcours applicatifs

Durée : 1 h 15 · Prérequis : P3 · Défi associé : 05 · Audit HTTP

## Objectifs
- Lire une requête et une réponse HTTP.
- Analyser en-têtes de sécurité, cookies et cycle de session.
- Cartographier les pages et paramètres d'une application, dans le périmètre.

## 1. L'essentiel
Une réponse HTTP = **ligne de statut** (`200`, `301`, `403`, `404`, `500`), **en-têtes**, **corps**. `HEAD` demande uniquement les en-têtes. Un **cookie de session** relie les requêtes d'un même utilisateur.

En-têtes de sécurité à connaître : `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `X-Frame-Options` ou `frame-ancestors`. Drapeaux de cookie : `Secure`, `HttpOnly`, `SameSite`.

## 2. En pratique
```
curl -v http://app.exemple.test/ 2>&1 | head -30
curl -sI https://app.exemple.test/ | grep -iE 'content-security|strict-transport|x-content'
curl -sc cookies.txt -o /dev/null http://app.exemple.test/login ; cat cookies.txt
```
Cartographie : suivre les liens, lire `robots.txt`, noter chaque formulaire et chaque paramètre (`?id=`, `?page=`). Un énumérateur de chemins (gobuster, ffuf) ne s'emploie qu'avec autorisation et débit limité.

## 3. Lire le résultat
- `403` = la ressource existe mais l'accès est refusé ; `404` = absente ; `500` = erreur serveur (informations possibles dans le message).
- Un cookie sans `HttpOnly` est lisible par un script de la page ; sans `Secure`, il peut transiter en clair.
- L'absence d'un en-tête de sécurité est un **contrôle à examiner**, pas une compromission.

## 4. Côté défense
Ajouter les en-têtes manquants, régénérer l'identifiant de session après connexion, durée de vie courte, déconnexion qui invalide côté serveur.

## 5. Erreurs fréquentes
- Tester une seule page et généraliser à toute l'application.
- Confondre en-tête absent et vulnérabilité exploitable.
- Oublier de comparer avant et après correction avec la **même** requête.

## 6. Exercices
1. Un cookie `sid=abc; Path=/` : quels drapeaux manquent ?
<details><summary>Réponse</summary>

`Secure`, `HttpOnly` et `SameSite`.
</details>

2. Pourquoi lire `robots.txt` ?
<details><summary>Réponse</summary>

Il liste des chemins que le site préfère ne pas indexer : indice d'inventaire, jamais un contrôle d'accès.
</details>
