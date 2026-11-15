# SIM13 · Serveur web : configuration et exposition

Durée : 1 h 15 · Prérequis : SIM02 · Missions associées : SIM13-1, SIM13-2 (parcours pentest)

## Objectifs
- Relire une configuration nginx et repérer index ouvert, protocoles TLS obsolètes et version affichée.
- Recouper la configuration avec ce que le serveur envoie réellement.
- Reconnaître dans un journal un outil de sondage et ce qu'il a trouvé.
- Prioriser la correction d'un fichier exposé.

## 1. L'essentiel
- La configuration d'un serveur web fixe ce qu'il montre et ce qu'il cache. Une directive d'**index automatique** (`autoindex on`) transforme un dossier en liste de fichiers téléchargeables.
- Les protocoles **TLSv1 et TLSv1.1** sont obsolètes ; seuls TLSv1.2 et TLSv1.3 sont acceptables.
- `server_tokens on` laisse la version du serveur dans l'en-tête `Server`. Les en-têtes de sécurité (`Strict-Transport-Security`, `X-Frame-Options`…) se déclarent avec `add_header`.
- Les **outils de sondage** (comme Nikto) testent une liste de chemins connus : `/.env`, `/backup.zip`, `/dump.sql`… Un code **200** sur l'un d'eux signifie que le fichier existe et a été servi.

## 2. En pratique
```
grep -n autoindex nginx.conf                # index automatique et son bloc location
grep ssl_protocols nginx.conf               # protocoles TLS autorisés
grep -c add_header nginx.conf               # nombre d'en-têtes configurés
curl -I http://www.lumen-sante.example/     # ce que le serveur annonce vraiment
grep Nikto access.log | awk '{print $7, $9}'     # chemins testés et codes de réponse
```
Exemple de ligne de sondage :
```
198.51.100.40 - - [15/Nov/2026:15:05:11 +0000] "GET /.env HTTP/1.1" 200 1432 "-" "Nikto/2.5.0"
```

## 3. Lire le résultat
- Une directive peut être présente dans la configuration sans effet réel si un bloc plus spécifique la remplace : recoupez toujours avec `curl -I`.
- Un fichier de sauvegarde ou de configuration servi en 200 contient souvent des identifiants : traitez-le comme un secret compromis.
- 404 et 403 montrent que le serveur refuse ou ne connaît pas le chemin : le sondage a échoué pour ceux-là.
- Comptez les chemins distincts demandés : c'est la taille du sondage.

## 4. Côté défense
- Désactiver l'index automatique, retirer les protocoles obsolètes, masquer la version, ajouter les en-têtes de sécurité.
- Ne jamais déposer de sauvegardes ou de fichiers de configuration dans la racine publique.
- Si un fichier a été servi : le retirer, **changer les secrets** qu'il contient, chercher d'autres accès dans les journaux.
- Alerter sur les séries de 404 depuis une même adresse (signe d'un sondage).

## 5. Erreurs fréquentes
- Renommer le fichier exposé au lieu de le retirer.
- Bloquer seulement l'adresse du visiteur : un autre l'a peut-être déjà téléchargé.
- Corriger la configuration sans recharger le serveur ni retester.
- Oublier de changer les mots de passe contenus dans le fichier divulgué.

## 6. Exercices
1. `ssl_protocols TLSv1 TLSv1.2 TLSv1.3;` : constat et correction ?
<details><summary>Réponse</summary>
TLSv1 est obsolète et reste accepté. Retirer TLSv1 (et TLSv1.1), recharger nginx, puis retester avec un scan TLS ou `nmap`.
</details>

2. Le journal montre `GET /dump.sql ... 200 48210` pour une adresse inconnue. Quelle est la mesure prioritaire ?
<details><summary>Réponse</summary>
Retirer le fichier du site public immédiatement, considérer son contenu comme divulgué (changer les secrets, prévenir le responsable des données), puis chercher d'autres accès dans les journaux.
</details>

3. Pourquoi vérifier avec `curl -I` après avoir modifié `server_tokens` ?
<details><summary>Réponse</summary>
C'est le retest : la configuration peut ne pas être rechargée ou être remplacée ailleurs. L'en-tête `Server` doit n'afficher que `nginx`, sans version.
</details>
