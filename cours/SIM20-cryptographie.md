# SIM20 · Cryptographie : lire et suivre des certificats

Durée : 1 h · Prérequis : SIM13 · Missions associées : SIM20-1, SIM20-2 (parcours pentest)

## Objectifs
- Lire un relevé de certificat (validité, algorithme de signature, taille de clé).
- Dire si un certificat est expiré, proche de l'échéance ou obsolète.
- Tenir un inventaire des certificats et le trier par urgence.
- Proposer un plan de renouvellement.

## 1. L'essentiel
- Un **certificat** relie un nom (par exemple `www.exemple.example`) à une clé publique, signée par une autorité. Il a une **date de fin de validité** : après elle, les navigateurs signalent une erreur.
- L'**algorithme de signature** et la **taille de clé** déterminent la solidité : `sha1WithRSAEncryption` est obsolète, une clé RSA de 1024 bits est insuffisante. On vise SHA-256 et au moins 2048 bits.
- Un oubli de renouvellement provoque une **panne**, pas seulement un risque : l'inventaire et les alertes d'échéance sont une mesure de disponibilité.
- Les dates au format AAAA-MM-JJ se comparent comme du texte : la plus petite est la plus ancienne.

## 2. En pratique
```
grep "Not After" certificat.txt                       # fin de validité
grep Signature certificat.txt                          # algorithme de signature
grep "bit" certificat.txt                              # taille de clé
awk -F';' '$2<"2026-11-15"' inventaire-certificats.csv # certificats expirés
awk -F';' '$3=="sha1" {print $1}' inventaire-certificats.csv   # signatures obsolètes
```
Sur un vrai serveur, `openssl x509 -in cert.pem -noout -text` produit ce type de relevé.

## 3. Lire le résultat
- Comparez toujours la date de fin à la **date du jour** : un certificat « valide depuis un an » peut être expiré depuis hier.
- Une signature SHA-1 ou une clé de 1024 bits est un écart, même si le certificat est encore valide.
- Classez par urgence : expirés d'abord, puis ceux qui expirent sous 30 jours, puis les algorithmes obsolètes.

## 4. Côté défense
- Inventaire complet, alerte à 30 et 15 jours, propriétaire désigné pour chaque certificat.
- Renouvellement automatisé quand c'est possible, avec test avant bascule.
- Clés d'au moins 2048 bits, signature SHA-256 ou mieux.
- Retest après renouvellement : vérifier la nouvelle date et la chaîne de confiance.

## 5. Erreurs fréquentes
- Se fier à la date de création plutôt qu'à la date de fin.
- Remplacer tous les certificats le même jour sans test.
- Désactiver la vérification de certificat chez les clients pour « faire disparaître » l'erreur.
- Oublier les certificats internes (intranet, messagerie, VPN).

## 6. Exercices
1. Un certificat se termine le 2026-12-01 ; nous sommes le 2026-11-15. Est-il à traiter ?
<details><summary>Réponse</summary>
Oui : il expire dans 16 jours, donc dans la fenêtre des 30 jours. Planifier le renouvellement avec test.
</details>

2. Un certificat a une signature sha1 et une clé de 2048 bits. Quel est le constat ?
<details><summary>Réponse</summary>
La taille de clé est correcte mais la signature SHA-1 est obsolète : à remplacer par SHA-256 au prochain renouvellement, plus tôt si possible.
</details>

3. Pourquoi un oubli de renouvellement relève-t-il aussi de la disponibilité ?
<details><summary>Réponse</summary>
À l'expiration, les clients refusent la connexion : le service devient inaccessible. Le suivi des échéances protège donc le service autant que la sécurité.
</details>
