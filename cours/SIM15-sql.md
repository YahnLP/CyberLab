# SIM15 · La couche SQL : erreurs et injection (base fictive)

Durée : 1 h 30 · Prérequis : SIM14 · Missions associées : SIM15-1, SIM15-2 (parcours pentest)

## Objectifs
- Lire un message d'erreur SQL et en tirer des informations sur le moteur et la requête.
- Montrer, sur une base de démonstration, qu'une saisie modifie une requête construite à la main.
- Expliquer pourquoi la requête préparée règle le problème.
- Rester dans une démonstration contrôlée, en lecture seule.

## 1. L'essentiel
- Une page construit parfois sa requête par **concaténation** : `... WHERE id = ` + saisie + ` AND visible = 1`. La saisie est alors du code SQL.
- Un **message d'erreur détaillé** montre la fin de la requête et révèle le moteur (MySQL, PostgreSQL, SQLite) et des noms de colonnes : c'est une fuite d'information.
- Avec `OR 1=1`, la condition est toujours vraie. Un **commentaire** SQL (`-- ` suivi d'un espace) supprime le reste de la requête, y compris un filtre comme `visible = 1`.
- La parade est la **requête préparée** : la structure est fixée, la saisie n'est qu'une valeur.
- Ici, la base et le site sont fictifs ; sur une vraie cible, ce type de test exige un mandat explicite.

## 2. En pratique
```
curl -i "http://www.lumen-sante.example/produit?id=1"              # fiche normale (JSON)
curl -i "http://www.lumen-sante.example/produit?id=1%27"           # apostrophe : erreur ?
curl "http://www.lumen-sante.example/produit?id=1%20OR%201=1"       # filtre visible encore actif
curl "http://www.lumen-sante.example/produit?id=1%20OR%201=1%20--%20"   # filtre neutralisé
```
`%27` représente l'apostrophe, `%20` l'espace.

## 3. Lire le résultat
- Un code **500** avec un message `ERROR 1064 … MySQL server version … near '...'` confirme que la saisie est dans la requête et révèle le moteur.
- Le texte après `near` est la fin de la requête : on y lit ici le nom de la colonne de filtrage.
- `1 OR 1=1` renvoie tous les produits **visibles** seulement : le `AND visible = 1` s'applique encore (priorité de AND sur OR).
- Avec le commentaire, la requête s'arrête avant le filtre : un produit réservé apparaît. C'est le constat à documenter.

## 4. Côté défense
- Requêtes préparées partout ; ne jamais construire du SQL avec une saisie.
- Compte de base à droits minimaux (lecture sur les seules tables nécessaires).
- Messages d'erreur génériques côté utilisateur, détail dans le journal du serveur.
- Valider le type attendu (un identifiant numérique doit être un entier).

## 5. Erreurs fréquentes
- Filtrer le mot `OR` : la variante `||`, la casse ou l'encodage la contourne.
- Masquer l'erreur sans corriger la construction de la requête : l'injection reste possible (en aveugle).
- Tester sur une base réelle « pour voir » : seule la démonstration fictive est autorisée ici.
- Récupérer et conserver des données personnelles réelles dans les preuves.

## 6. Exercices
1. `id=1'` renvoie `near '' AND visible = 1'`. Que révèle ce message ?
<details><summary>Réponse</summary>
La fin de la requête, donc l'existence et le nom de la colonne `visible`, et le fait que la saisie est insérée telle quelle. Correction : requête préparée et message d'erreur générique.
</details>

2. Pourquoi `1 OR 1=1` ne renvoie-t-il pas le produit réservé, alors que `1 OR 1=1 -- ` le renvoie ?
<details><summary>Réponse</summary>
Dans le premier cas `AND visible = 1` est toujours évalué : seuls les produits visibles passent. Le commentaire supprime ce filtre.
</details>

3. En une phrase, pourquoi une requête préparée empêche-t-elle l'injection ?
<details><summary>Réponse</summary>
La structure de la requête est fixée avant l'arrivée de la saisie, qui n'est transmise que comme une valeur et ne peut plus modifier la syntaxe.
</details>
