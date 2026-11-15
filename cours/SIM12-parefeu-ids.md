# SIM12 · Périmètre réseau : pare-feu et détection d'intrusion

Durée : 1 h 30 · Prérequis : SIM03, SIM08 · Missions associées : SIM12-1, SIM12-2 (parcours pentest)

## Objectifs
- Relire des règles de pare-feu et repérer une ouverture trop large ou inutile.
- Comparer les règles aux services réellement à l'écoute.
- Trier des alertes de détection d'intrusion et reconnaître vos propres tests.
- Recommander des corrections précises.

## 1. L'essentiel
- Un **pare-feu** applique des règles dans l'ordre ; la **politique par défaut** s'applique à tout ce que les règles n'ont pas traité. La bonne pratique est `drop` par défaut, puis des autorisations précises.
- Une règle est « trop large » quand la source est `any` vers un service d'infrastructure (base de données, partages, administration). Une règle est « sans service » quand elle ouvre un port où rien n'écoute : elle ne sert à rien et élargit la surface d'attaque.
- Un **système de détection d'intrusion (IDS)** compare le trafic à des signatures et lève des alertes. Il produit du bruit : trier, qualifier, ajuster.
- Vos propres tests autorisés déclenchent des alertes : elles doivent être reconnues (heure, source, mandat) pour ne pas être traitées comme une attaque.

## 2. En pratique
```
cat regles-pare-feu.csv                                         # relire les règles
nmap -p- 192.168.20.12                                          # ce qui écoute vraiment sur www
grep -o '\[1:[0-9]*' alertes-ids.log | sort | uniq -c | sort -rn | head -1    # signature la plus fréquente
grep -o '{TCP} [0-9.]*' alertes-ids.log | sort | uniq -c | sort -rn           # alertes par source
```
Exemple d'alerte :
```
14:00:04 [**] [1:2001219:3] ET SCAN Potential SSH Scan [**] {TCP} 198.51.100.67:36365 -> 192.168.20.1:22
```

## 3. Lire le résultat
- Une règle `any → db:3306` signifie que la base est joignable depuis Internet : constat majeur.
- Comparez les ports visés par les règles à ceux que `nmap -p-` voit ouverts : l'écart désigne la règle à supprimer.
- La politique par défaut `accept` annule l'intérêt des autres règles : tout ce qui n'est pas interdit passe.
- Dans l'IDS, regroupez par signature, par source et par destination ; une source externe qui insiste sur une seule cible est l'attaque ; vos propres adresses sont des faux positifs attendus.

## 4. Côté défense
- Politique par défaut `drop`, règles minimales, sources restreintes (adresses du prestataire, réseau de gestion).
- Supprimer les règles sans service et documenter chaque règle (qui, pourquoi, jusqu'à quand).
- Ajuster les signatures bruyantes avec des exceptions ciblées plutôt que les désactiver.
- Rapprocher les alertes du planning des tests autorisés et conserver la trace dans le rapport.

## 5. Erreurs fréquentes
- Ajouter une règle `drop` à la fin sans retirer les règles trop larges placées avant.
- Désactiver la signature la plus bruyante : on perd aussi les vraies attaques.
- Modifier un commentaire de règle en croyant corriger l'ouverture.
- Considérer toute alerte de son propre poste comme une attaque, ou à l'inverse tout ignorer.

## 6. Exercices
1. La règle 5 autorise `any → 192.168.20.34:3306` « pour un prestataire ». Que proposez-vous ?
<details><summary>Réponse</summary>
Restreindre la source aux adresses du prestataire (ou à un VPN), limiter à la durée nécessaire, journaliser, puis relancer un scan externe pour prouver que la base n'est plus joignable depuis Internet.
</details>

2. Une règle ouvre le port 9000 vers www, mais `nmap -p-` ne voit que 22, 80 et 443. Que faites-vous ?
<details><summary>Réponse</summary>
La règle n'a pas de service associé : on vérifie auprès du responsable qu'elle n'est plus utilisée, puis on la supprime pour réduire la surface d'attaque.
</details>

3. Sur 40 alertes, 12 viennent de votre poste d'audit pendant la fenêtre de test. Comment les traitez-vous ?
<details><summary>Réponse</summary>
Ce sont des faux positifs attendus : on les rapproche du journal des actions et du mandat, on les note comme tels dans le rapport et on concentre le traitement sur les 28 autres.
</details>
