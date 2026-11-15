# SIM14 · Application web : saisies, affichage et revue de code

Durée : 1 h 30 · Prérequis : SIM13 · Missions associées : SIM14-1, SIM14-2 (parcours pentest)

## Objectifs
- Vérifier avec `curl` si une page renvoie une saisie sans l'échapper (XSS réfléchi).
- Lire du code PHP et repérer requête SQL construite à la main, affichage non échappé, hachage faible.
- Expliquer le risque en une phrase et proposer la correction juste.
- Rester dans la cible fournie, sans dégrader le service.

## 1. L'essentiel
- Une application web reçoit des **saisies** (formulaire, URL, cookies) et produit des pages. Tout ce qui entre doit être validé, tout ce qui sort doit être **encodé** pour son contexte (HTML, SQL, URL).
- **XSS réfléchi** : la page affiche la saisie telle quelle ; si elle contient du code, il s'exécute dans le navigateur de la victime qui suit un lien piégé.
- **Injection SQL** : une saisie insérée dans une chaîne SQL peut en changer le sens. La parade est la **requête préparée** (paramètres liés).
- Les mots de passe ne se stockent ni en clair ni avec `md5` ou `sha1` : on utilise un algorithme lent et salé (`password_hash`).

## 2. En pratique
```
curl http://www.lumen-sante.example/                          # repérer <form action=… et <input name=…
curl "http://www.lumen-sante.example/recherche?q=%3Ci%3Ex%3C/i%3E"   # la balise <i> revient-elle intacte ?
grep -n SELECT connexion.php          # lignes qui construisent une requête
grep -n echo recherche.php            # affichages : lesquels ne sont pas échappés ?
grep -n "md5\|sha1" connexion.php     # hachage faible
```
Dans l'URL, `%3C` représente `<` et `%3E` représente `>`.

## 3. Lire le résultat
- Si `<i>x</i>` revient **tel quel** dans la page, la sortie n'est pas échappée. Une page correcte renverrait `&lt;i&gt;x&lt;/i&gt;`.
- Une variable placée directement dans une chaîne SQL (`WHERE login = '$login'`) est injectable.
- `htmlspecialchars()` autour d'un affichage est correct ; son absence sur la ligne voisine est le défaut.
- Notez le **fichier et le numéro de ligne** de chaque constat : c'est la preuve et l'indication de correction.

## 4. Côté défense
- Échapper toute sortie selon son contexte, ajouter une politique de contenu (`Content-Security-Policy`).
- Requêtes préparées, compte de base de données à droits minimaux, validation du type des paramètres.
- Hachage avec `password_hash` et vérification avec `password_verify`.
- Relecture de code systématique des pages qui touchent à l'authentification et à l'affichage de saisies.

## 5. Erreurs fréquentes
- Corriger par une **liste noire** (retirer « script » ou les apostrophes) : elle se contourne.
- Passer de `md5` à `sha1` : le problème reste le même.
- Ne tester que la page d'accueil et oublier les paramètres des autres pages.
- Tester une application tierce sans mandat : ici seule la cible fournie est concernée.

## 6. Exercices
1. La recherche renvoie `Résultats pour : <i>x</i>` après l'envoi de `<i>x</i>`. Quel est le constat ?
<details><summary>Réponse</summary>
XSS réfléchi : la saisie est renvoyée sans échappement. Correction : encoder la sortie en HTML, ajouter une CSP, retester avec la même requête.
</details>

2. `$sql = "... WHERE login = '$login' ..."` : pourquoi est-ce dangereux et que faire ?
<details><summary>Réponse</summary>
La saisie est interprétée comme du SQL, donc modifiable par un attaquant. Utiliser une requête préparée avec des paramètres liés.
</details>

3. Pourquoi ne pas interdire le mot « script » dans la saisie ?
<details><summary>Réponse</summary>
Une liste noire se contourne (autres balises, autres encodages). Seul l'encodage de la sortie traite la cause.
</details>
