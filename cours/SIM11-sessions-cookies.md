# SIM11 · Sessions et cookies

Durée : 1 h 15 · Prérequis : SIM02 · Missions associées : SIM11-1, SIM11-2 (parcours pentest)

## Objectifs
- Lire les attributs d'un cookie (`Secure`, `HttpOnly`, `SameSite`) et dire ce qu'ils protègent.
- Reconnaître un identifiant de session prévisible.
- Détecter qu'une session n'est pas régénérée à la connexion (fixation de session).
- Proposer une durée de session raisonnable.

## 1. L'essentiel
- Le protocole HTTP n'a pas de mémoire : un **cookie de session** relie les requêtes d'un même visiteur. Qui possède le cookie possède la session.
- `Secure` : le cookie ne voyage qu'en HTTPS. `HttpOnly` : un script de la page ne peut pas le lire (limite le vol par injection de script). `SameSite` : limite l'envoi depuis un autre site.
- Un identifiant doit être **long et aléatoire**. Un simple numéro ou une valeur déduite de l'utilisateur se devine.
- À la connexion, l'application doit **changer l'identifiant** : sinon un attaquant qui a imposé un identifiant avant la connexion le partage ensuite avec la victime.
- La durée de vie d'une session limite le temps pendant lequel un identifiant volé reste utile.

## 2. En pratique
```
curl -i http://www.lumen-sante.example/connexion        # lit les en-têtes Set-Cookie
grep -v HttpOnly reponses-http.txt | grep Set-Cookie     # cookies sans HttpOnly
grep user=marie connexions-web.log | grep -o "sid=[0-9a-f]*"   # identifiants vus pour un utilisateur
```
Exemple d'en-tête :
```
Set-Cookie: PHPSESSID=49f7e81f834156a7b6a7cbfd121e00e6; Path=/; Secure; HttpOnly; SameSite=Lax
```

## 3. Lire le résultat
- L'absence d'un attribut n'apparaît pas : on le constate en comparant à la liste attendue.
- Une valeur à six chiffres consécutifs (100234, 100235) permet de deviner les sessions des autres : constat majeur.
- Si l'identifiant avant (`state=anon`) et après (`state=auth`) la connexion est identique, la session est fixable.
- `gc_maxlifetime` est en secondes : divisez par 60 pour obtenir des minutes.

## 4. Côté défense
- Poser `Secure`, `HttpOnly` et `SameSite` sur tous les cookies de session ; préférer `Strict` ou `Lax`.
- Générer les identifiants avec un générateur aléatoire de qualité, au moins 128 bits.
- Régénérer l'identifiant à la connexion et à chaque changement de droits ; invalider l'ancien.
- Fixer une durée d'inactivité courte et une durée absolue maximale ; proposer la déconnexion.

## 5. Erreurs fréquentes
- Chiffrer la valeur du cookie avec une clé fixe visible dans le code : la protection est illusoire.
- Allonger la durée de session « pour le confort » sans mesurer le risque.
- Oublier les cookies secondaires (panier, préférences) : un cookie prévisible peut révéler des données.
- Tester sur un site réel sans mandat : on se limite à la cible fournie.

## 6. Exercices
1. Un cookie `remember=100341` est posé sans `Secure`. Quels risques et quelles corrections ?
<details><summary>Réponse</summary>
Il peut être lu en clair sur un réseau non chiffré et deviné par incrément. Corrections : valeur aléatoire longue, attribut `Secure`, `HttpOnly`, durée limitée.
</details>

2. L'utilisateur `paul` garde le même `sid` avant et après connexion. Quel est le défaut et la correction ?
<details><summary>Réponse</summary>
Fixation de session : l'application ne régénère pas l'identifiant. Corriger en créant un nouvel identifiant à la connexion et en invalidant l'ancien.
</details>

3. `session.gc_maxlifetime = 7200`. Combien de minutes, et est-ce adapté à une application de gestion ?
<details><summary>Réponse</summary>
120 minutes. Pour une application sensible, une durée d'inactivité plus courte (15 à 30 minutes) est préférable, avec une durée absolue maximale.
</details>
