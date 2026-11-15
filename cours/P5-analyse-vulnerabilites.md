# P5 · Analyse des vulnérabilités

Durée : 1 h 30 · Prérequis : P3, P4 · Défi associé : 06 · Trier les résultats d'un scanner

## Objectifs
- Distinguer détection, vérification et exploitation.
- Comprendre les trois grandes familles d'injection et leur correction.
- Qualifier un résultat de scanner (vrai positif, faux positif).

## 1. L'essentiel
Une **vulnérabilité** est une faiblesse ; une **CVE** est son identifiant public ; le **CVSS** note sa gravité. Un scanner **détecte** des indices ; l'analyste **vérifie** dans le modèle du laboratoire avant de conclure. On n'exploite jamais hors périmètre.

## 2. Les injections : le principe
Le programme mélange **données** et **instructions**. Exemple pédagogique, requête construite par concaténation :
```
requete = "SELECT * FROM users WHERE name = '" + saisie + "'"
```
Si `saisie` contient des caractères propres au langage SQL, la structure de la requête change. Même mécanisme pour les commandes système (injection de commande) et pour le HTML (XSS : le navigateur exécute du script injecté dans la page).

## 3. Les corrections
| Faille | Correction durable |
|---|---|
| Injection SQL | requêtes **paramétrées**, compte base à droits minimaux |
| Injection de commande | ne pas appeler un shell, liste blanche d'arguments |
| XSS | échappement à la sortie selon le contexte, `Content-Security-Policy`, cookie `HttpOnly` |

Filtrer des caractères « dangereux » n'est pas une correction : on corrige la **construction**.

## 4. En pratique (cible de laboratoire uniquement)
```
nmap -sV --script vuln 192.168.20.10     # indices de vulnérabilités
nikto -h http://192.168.20.10/ -maxtime 60s
```
Chaque ligne du rapport est un **candidat**. Vérifiez : le service est-il joignable ? La version correspond-elle ? Le contrôle de compensation existe-t-il ?

## 5. Lire le résultat
- Vrai positif : reproduit, impact démontré dans le modèle.
- Faux positif : la version est corrigée par le distributeur, ou le chemin n'est pas atteignable.
- Non vérifié : à indiquer comme tel dans le rapport.

## 6. Exercices
1. Pourquoi une requête paramétrée neutralise-t-elle l'injection SQL ?
<details><summary>Réponse</summary>

Le moteur reçoit la structure de la requête et les valeurs séparément : une valeur ne peut plus être interprétée comme du SQL.
</details>

2. Un scanner signale une CVE sur Apache 2.4.57 Debian. Que faites-vous avant de la reporter ?
<details><summary>Réponse</summary>

Vérifier le paquet réel et son niveau de correctifs (`apt changelog`, avis de sécurité Debian), car la version affichée ne reflète pas toujours les correctifs rétroportés.
</details>
