# EH02 · Reconnaissance et empreinte d'une organisation

Durée : 1 h 30 · Prérequis : P1 · Missions associées : EH02-1, EH02-2, EH02-3 (parcours pentest)

## Objectifs
- Distinguer reconnaissance passive (sans toucher la cible) et active (la cible voit la requête).
- Lire des enregistrements DNS (A, MX, NS, TXT) et retrouver un actif oublié.
- Lire les en-têtes d'un serveur web et en déduire ce qu'il révèle.
- Interpréter une politique SPF et son effet sur l'usurpation de domaine.

## 1. L'essentiel
- **Passive** : on utilise des informations déjà publiques (DNS public, moteurs de recherche, certificats). La cible ne voit rien. **Active** : on interroge directement ses serveurs ; ses journaux gardent la trace.
- Le DNS est l'annuaire de l'exposition : chaque nom publié est une porte potentielle. Un nom qui n'est plus géré (recette, test, ancien site) est un **actif oublié**, donc rarement mis à jour.
- Une réponse HTTP raconte l'infrastructure : produit et version dans `Server`, technologie dans `X-Powered-By`, protections présentes ou absentes.
- Le **SPF** liste qui a le droit d'envoyer du courrier pour un domaine. Son mécanisme final décide du sort des autres : `-all` refuse, `~all` marque comme suspect, `+all` autorise tout le monde.
- Le périmètre prime : on ne sonde que ce que le mandat autorise.

## 2. En pratique
Dans le simulateur, les cibles sont fictives (domaine en `.example`). Les outils ressemblent aux vrais.
```
host www.lumen-sante.example           # le nom existe-t-il ?
dig +short www.lumen-sante.example     # seulement la valeur
dig MX lumen-sante.example             # serveur de messagerie
dig TXT lumen-sante.example            # SPF et autres textes
for w in $(cat sous-domaines.txt); do host $w.lumen-sante.example; done
curl -I http://www.lumen-sante.example/          # en-têtes seuls
curl http://www.lumen-sante.example/robots.txt   # ce que le site demande de ne pas indexer
```
Sortie type de `host` pour un nom existant puis inexistant :
```
www.lumen-sante.example has address 203.0.113.30
Host staging.lumen-sante.example not found: 3(NXDOMAIN)
```
Sortie type de `curl -I` :
```
HTTP/1.1 200 OK
Server: nginx/1.18.0
Content-Type: text/html; charset=UTF-8
X-Powered-By: PHP/7.4.33
```

## 3. Lire le résultat
- Un nom qui répond mais ne figure pas dans la liste officielle de l'organisation est un constat à qualifier : service oublié, test laissé en ligne, fournisseur non déclaré.
- `Server: nginx/1.18.0` donne une version exacte. Ce n'est pas une faille en soi, mais cela permet de chercher les faiblesses connues de cette version. `Server: nginx` sans version est plus discret.
- Un en-tête de sécurité **absent** n'apparaît pas : on le constate en comparant à une liste de référence (`Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`).
- `robots.txt` liste ce que l'on voudrait cacher. Un chemin cité qui répond `200` avec une liste de fichiers est une **fuite** ; `401` indique une protection en place.
- SPF en `+all` : n'importe qui peut envoyer du courrier au nom du domaine sans être rejeté.

## 4. Côté défense
- Faire l'inventaire des noms publiés et supprimer ceux qui ne servent plus, avec le service qu'ils désignent.
- Masquer la version du serveur, retirer `X-Powered-By`, ajouter les en-têtes de sécurité.
- Interdire l'affichage de l'index d'un dossier et déplacer les sauvegardes hors du site public. Un `robots.txt` n'est pas une protection.
- Passer le SPF en `-all` et compléter par DKIM et DMARC.
- Surveiller ses propres journaux DNS et web : une série de requêtes sur des noms inexistants trahit une recherche de sous-domaines.

## 5. Erreurs fréquentes
- Croire qu'un nom peu connu est protégé : il suffit de le deviner ou de le lire dans un certificat.
- Confondre ce qu'on **observe** (la version annoncée) et ce qu'on **suppose** (qu'elle est vulnérable). La bannière peut être fausse.
- Compter un en-tête présent comme conforme sans vérifier sa valeur.
- Oublier que la reconnaissance active laisse des traces : elle doit être couverte par le mandat.

## 6. Exercices
1. Un nom `recette.exemple.example` répond alors qu'il n'est pas dans la liste officielle. Quel constat écrire et quelle mesure proposer ?
<details><summary>Réponse</summary>
Constat : actif non déclaré exposé sur Internet (existence prouvée par la résolution DNS). Mesure : identifier son propriétaire, supprimer l'enregistrement et arrêter le service s'il est inutile, sinon le déclarer, le mettre à jour et le protéger. Retest : le nom ne doit plus se résoudre.
</details>

2. `curl -I` affiche `Server: Apache/2.4.38` et aucun en-tête de sécurité. Que peut-on affirmer ?
<details><summary>Réponse</summary>
On peut affirmer la version annoncée et l'absence des quatre en-têtes de référence. On ne peut pas affirmer que le serveur est vulnérable sans comparer cette version à une politique ou à une base de vulnérabilités. Recommandation : masquer la version, ajouter les en-têtes, planifier la mise à jour.
</details>

3. Un domaine publie `v=spf1 mx ip4:203.0.113.70 ~all`. Qui peut envoyer du courrier en son nom, et que conseillez-vous ?
<details><summary>Réponse</summary>
Le serveur MX et l'adresse 203.0.113.70 sont autorisés ; les autres expéditeurs sont marqués suspects (`~all`) mais pas systématiquement refusés. Conseil : passer à `-all` après vérification des expéditeurs légitimes, puis ajouter DKIM et DMARC.
</details>
