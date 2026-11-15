# SIM10 · Disponibilité : repérer et expliquer une saturation

Durée : 1 h 15 · Prérequis : P3, SIM08 · Missions associées : SIM10-1, SIM10-2 (parcours pentest)

## Objectifs
- Lire un journal d'accès web et isoler une source qui monopolise le serveur.
- Lire des mesures de supervision et identifier la ressource qui sature en premier.
- Distinguer une surcharge légitime d'une rafale abusive.
- Proposer des mesures qui protègent le service sans le couper.

## 1. L'essentiel
- La **disponibilité** est l'un des trois piliers de la sécurité. Un service saturé est un incident, même sans intrusion.
- Une saturation vient d'une ressource qui atteint sa limite : processeur, mémoire, connexions simultanées, bande passante. Une seule cède en premier ; les autres montent par effet de chaîne.
- Une **rafale de requêtes** depuis une même adresse sur un chemin coûteux (recherche, export) suffit à ralentir un site. On la reconnaît par le volume, le rythme et un agent client atypique.
- Tester la disponibilité d'un client sans mandat explicite est interdit : les tests de charge sont soumis à accord écrit et fenêtre précise.

## 2. En pratique
```
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head      # qui envoie le plus
grep 198.51.100.40 access.log | head -3                             # que demande-t-elle ?
grep -c 198.51.100.40 access.log                                    # combien de requêtes
awk -F';' '$2>=90' metriques.csv                                    # minutes où le processeur dépasse 90 %
```
Exemple de ligne du journal :
```
198.51.100.40 - - [15/Nov/2026:14:12:07 +0000] "GET /recherche?q=4812 HTTP/1.1" 503 512 "-" "python-requests/2.31"
```

## 3. Lire le résultat
- Un seul visiteur qui génère la moitié du journal en quelques minutes n'est pas un client normal.
- Les codes 503 en série confirment que le serveur n'arrive plus à répondre.
- Dans les métriques, repérez la **première** minute où un seuil est franchi : c'est l'heure de début de l'incident.
- Une ressource qui monte sans atteindre son seuil n'est pas la cause : ne la corrigez pas en premier.

## 4. Côté défense
- Limiter le débit par adresse et par chemin, mettre en cache les pages coûteuses, bloquer temporairement l'adresse abusive.
- Alerter sur la ressource qui sature, pas seulement sur la panne finale.
- Dimensionner ensuite : ajouter de la capacité sans traiter la cause ne fait que repousser le problème.
- Garder les journaux : ils servent de preuve et de base pour régler les seuils.

## 5. Erreurs fréquentes
- Redémarrer le serveur à chaque pic sans chercher la cause.
- Bloquer toute une plage d'adresses qui contient aussi de vrais clients.
- Relever les seuils d'alerte pour « ne plus être dérangé ».
- Confondre le jour de pointe commercial (pic réparti, tous chemins) et une rafale ciblée.

## 6. Exercices
1. Une adresse totalise 280 requêtes en trois minutes sur `/export`, les autres visiteurs une dizaine chacune. Que concluez-vous ?
<details><summary>Réponse</summary>
Rafale abusive probable sur un chemin coûteux. Mesures : limiter le débit par adresse, bloquer l'adresse, mettre l'export en cache ou en tâche différée, puis vérifier que la charge retombe.
</details>

2. Le processeur est à 70 %, la mémoire à 95 % pendant l'incident. Quelle ressource a saturé ?
<details><summary>Réponse</summary>
La mémoire (seuil 90 % dépassé). Le processeur est élevé mais sous son seuil : il n'est pas la ressource limitante.
</details>

3. Pourquoi ne pas simplement doubler la mémoire ?
<details><summary>Réponse</summary>
Sans limiter la cause, la rafale peut saturer la nouvelle capacité aussi. On traite d'abord la source (débit, blocage, cache), puis on dimensionne en connaissance de cause.
</details>
