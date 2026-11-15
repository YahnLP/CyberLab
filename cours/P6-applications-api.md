# P6 · Applications et API

Durée : 1 h 30 · Prérequis : P4, P5 · Défi associé : 07 · Contrôle d'accès d'une API

## Objectifs
- Lire un échange d'API REST et son authentification.
- Reconnaître les défauts d'autorisation et de gestion d'erreurs.
- Proposer des contrôles adaptés.

## 1. L'essentiel
Une API REST expose des **ressources** (`/api/v1/commandes/42`) manipulées par `GET`, `POST`, `PUT`, `DELETE`. L'authentification prouve **qui** vous êtes (jeton, cookie) ; l'**autorisation** décide **ce que** vous pouvez faire. Beaucoup d'incidents viennent d'une autorisation oubliée, pas d'un mot de passe faible.

Un jeton JWT comprend trois parties encodées en base64url : en-tête, charge utile, signature. Le contenu est **lisible** par tous ; seule la signature le protège de la modification.

## 2. En pratique
```
curl -s -H "Authorization: Bearer $JETON" http://api.exemple.test/api/v1/commandes/42 | jq .
echo "$JETON" | cut -d. -f2 | base64 -d 2>/dev/null | jq .   # lire la charge utile
```

## 3. Défauts classiques (à tester en lecture seule)
| Défaut | Signe | Contrôle |
|---|---|---|
| Accès à un objet d'autrui (IDOR / BOLA) | `/commandes/43` renvoie la commande d'un autre utilisateur | vérifier la propriété de l'objet côté serveur |
| Données excessives | la réponse contient des champs non affichés (adresse, hash) | renvoyer le strict nécessaire |
| Messages d'erreur bavards | trace de pile, nom de table | message générique, détail dans les journaux |
| Absence de limitation | 1000 requêtes/minute acceptées | rate limiting, quotas |
| Méthode inattendue | `DELETE` accepté pour un simple lecteur | autorisation par action |

## 4. Lire le résultat
Tester avec **deux comptes de test** : ce que A voit ne doit pas être accessible à B. Documentez la requête, la réponse et le compte utilisé.

## 5. Erreurs fréquentes
- Se fier au masquage côté interface : l'API reste appelable directement.
- Croire qu'un identifiant difficile à deviner remplace un contrôle d'accès.
- Stocker des secrets dans la charge utile d'un JWT.

## 6. Exercices
1. Le jeton contient `"role":"user"`. Un utilisateur peut-il le changer en `admin` ?
<details><summary>Réponse</summary>

Il peut éditer le texte, mais la signature ne correspondra plus : un serveur qui vérifie la signature rejette le jeton. Le risque apparaît si la signature n'est pas vérifiée.
</details>

2. Quel contrôle serveur corrige un IDOR ?
<details><summary>Réponse</summary>

Vérifier à chaque requête que l'objet demandé appartient à l'utilisateur authentifié (ou qu'il y a droit).
</details>
