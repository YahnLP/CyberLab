# HAC 4 · Sécurité des applications web

Durée : 2 h · Prérequis : P4, P5, P6 · Défi associé : 13 · Revue de code d'une application web

## Objectifs
- Utiliser un proxy d'interception pour observer et rejouer des requêtes.
- Comprendre SQLi, XSS, CSRF et les défauts de téléversement et d'authentification.
- Associer chaque faille à son correctif.

## 1. Le proxy d'interception
Burp Suite (ou OWASP ZAP) se place entre le navigateur et l'application : on voit chaque requête, on peut la modifier et la rejouer. Réglez le navigateur sur le proxy local (`127.0.0.1:8080`) et n'interceptez que la cible du laboratoire (OWASP BWA, DVWA, Juice Shop).

## 2. Les failles et leurs corrections
| Faille | Mécanisme | Correction |
|---|---|---|
| Injection SQL | une saisie modifie la structure de la requête | requêtes paramétrées, droits minimaux de la base |
| XSS | du script injecté s'exécute dans le navigateur d'un autre utilisateur | échappement contextuel, CSP, cookie `HttpOnly` |
| CSRF | le navigateur d'une victime connectée envoie une requête à son insu | jeton anti-CSRF, `SameSite`, vérification d'origine |
| Téléversement | un fichier exécutable est accepté | liste blanche de types, renommage, stockage hors racine web, aucune exécution |
| Authentification faible | absence de limitation, messages différents selon l'erreur | limitation, MFA, message unique, jeton de session régénéré |
| Contrôle d'accès | URL d'administration accessible sans droit | autorisation côté serveur à chaque requête |

## 3. Démarche en laboratoire
1. Cartographier (P4). 2. Pour chaque paramètre, observer le comportement normal. 3. Formuler une hypothèse de faiblesse. 4. La vérifier avec une requête minimale et reproductible. 5. Consigner requête, réponse, impact. 6. Proposer le correctif et **rejouer la même requête** après correction.

## 4. Lire le résultat
Une réponse différente n'est pas une preuve en soi : confirmez l'effet (donnée lue, action effectuée) et son périmètre. Notez ce qui n'a pas pu être vérifié.

## 5. Erreurs fréquentes
- S'en tenir à un filtre de caractères au lieu de corriger la construction.
- Tester sur une application réelle sans mandat.
- Rapporter un risque sans reproduction.

## 6. Exercices
1. Quel mécanisme protège le mieux contre le CSRF dans un site à cookie de session ?
<details><summary>Réponse</summary>

Un jeton anti-CSRF imprévisible lié à la session, complété par `SameSite` sur le cookie.
</details>

2. Pourquoi le renommage d'un fichier téléversé est-il recommandé ?
<details><summary>Réponse</summary>

Il évite que le nom ou l'extension choisis par l'utilisateur déterminent l'emplacement ou l'exécution du fichier.
</details>
