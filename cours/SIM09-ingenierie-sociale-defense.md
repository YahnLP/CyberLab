# SIM09 · Ingénierie sociale : reconnaître et mesurer

Durée : 1 h 15 · Prérequis : SIM12, SIM23 · Missions associées : SIM09-1, SIM09-2 (parcours pentest)

## Objectifs
- Expliquer pourquoi l'humain est une cible et comment s'en protéger.
- Trier des messages selon des signaux objectifs (authentification, adresses, liens).
- Mesurer une campagne de sensibilisation autorisée et en tirer un plan de formation.
- Proposer des mesures techniques et organisationnelles complémentaires.

## 1. L'essentiel
- L'**ingénierie sociale** vise la personne plutôt que la machine : urgence, autorité, curiosité, peur de rater quelque chose.
- Un message d'**hameçonnage** (phishing) imite un expéditeur connu pour obtenir un clic, une saisie de mot de passe ou un paiement.
- Les **signaux objectifs** sont plus fiables que l'impression : résultats **SPF**, **DKIM** et **DMARC** (l'expéditeur est-il autorisé et le message intact ?), adresse de réponse différente de l'expéditeur, lien réel différent du lien affiché, domaine proche du vôtre.
- Un seul signal faible ne suffit pas à conclure ; plusieurs signaux cumulés rendent le message suspect.
- Une **campagne de sensibilisation** envoie des messages d'entraînement, **autorisés et annoncés à la direction**, pour mesurer les clics et les signalements et former là où c'est utile.
- Ici, tous les messages et résultats sont fictifs : on **analyse**, on n'écrit aucun message d'attaque.

## 2. En pratique
```
awk -F';' '$5=="fail" || $6=="fail" || $7=="fail"' messages-recus.csv     # échecs d'authentification
awk -F';' '$3!=$4 {print $1, $3, $4}' messages-recus.csv                  # réponse vers une autre adresse
awk -F';' '$8!=$9 {print $1, $9}' messages-recus.csv                      # lien trompeur
awk -F';' 'NR>1 {printf "%s %.3f\n", $1, $4/$2}' campagne-sensibilisation.csv | sort -k2 -n
```

## 3. Lire le résultat
- Un message dont l'authentification échoue, qui demande une réponse vers une adresse gratuite et dont le lien mène à un autre domaine cumule trois signaux : il est suspect.
- Un domaine « proche » du vôtre (tiret ajouté, préfixe `secure-`, lettre changée) est un classique ; on le recense pour le bloquer.
- Taux de clic = cliqués ÷ envoyés. Le **taux global** se calcule avec les sommes, pas avec la moyenne des taux.
- Un fort taux de signalement est un bon signe : les personnes alertent le service informatique.

## 4. Côté défense
- Publier SPF, DKIM et DMARC (en mode rejet à terme) pour votre domaine, et filtrer les domaines proches.
- Ajouter un **bouton de signalement** et une procédure simple ; remercier les personnes qui signalent.
- Former en priorité les services les plus exposés, puis refaire une campagne pour mesurer le progrès.
- Ne pas sanctionner : la sanction décourage le signalement.

## 5. Erreurs fréquentes
- Se fier à l'apparence (logo, ton) plutôt qu'aux en-têtes.
- Conclure sur un seul signal (un DKIM absent n'est pas une preuve).
- Calculer le taux global en faisant la moyenne des taux de chaque service.
- Lancer une campagne sans autorisation ni information préalable de la direction.

## 6. Exercices
1. Un message vient de `compta@secure-votre-domaine.example`, avec SPF en échec et un lien vers un autre domaine. Que faites-vous ?
<details><summary>Réponse</summary>
Le considérer comme suspect (au moins deux signaux), ne pas cliquer, le signaler au service informatique, bloquer le domaine proche et vérifier qui l'a reçu.
</details>

2. Trois services ont 3, 5 et 6 clics pour 20, 25 et 24 messages. Quel est le service le plus exposé ?
<details><summary>Réponse</summary>
Taux : 15 %, 20 % et 25 % ; le troisième service est le plus exposé, donc prioritaire pour la formation.
</details>

3. Pourquoi ne pas sanctionner les personnes qui ont cliqué ?
<details><summary>Réponse</summary>
La peur de la sanction pousse à cacher l'erreur et à ne plus signaler, ce qui retarde la détection d'un vrai incident.
</details>
