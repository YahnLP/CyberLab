# SIM07 · Fichiers suspects : trier un échantillon inerte et mesurer une règle

Durée : 1 h 15 · Prérequis : P8, SIM23 · Missions associées : SIM07-1, SIM07-2 (parcours pentest)

## Objectifs
- Identifier un fichier par son **empreinte** et la comparer à des indicateurs de compromission (IoC).
- Chercher dans une liste de chaînes de texte les domaines et adresses déjà connus comme malveillants.
- Retrouver, sur un parc, les machines qui portent la même empreinte.
- Mesurer une règle de détection : faux positifs, faux négatifs, choix du seuil.

## 1. L'essentiel
- Dans cette leçon, l'« échantillon » est un **fichier texte inerte** : une simple liste de chaînes relevées. Il ne contient **aucun code** et rien ne s'exécute. Le travail porte sur l'analyse statique, jamais sur l'exécution.
- L'**empreinte** (SHA-256) identifie un fichier : le même contenu donne toujours la même empreinte, un seul caractère de différence en donne une toute autre. Elle sert à reconnaître un fichier connu et à le chercher sur d'autres machines.
- Un **indicateur de compromission (IoC)** est une trace connue : une empreinte, un domaine, une adresse IP. Trouver un IoC dans un fichier ou un journal est un **fait** ; en tirer une conclusion sur l'étendue de l'incident est une **hypothèse** à vérifier.
- Une **règle de détection** signale un fichier selon des critères (ici : un nombre de marqueurs supérieur ou égal à un seuil). Un **faux positif** est un fichier sain signalé à tort ; un **faux négatif** est un fichier malveillant non signalé.
- Le seuil est un compromis : bas, il rate peu de menaces mais fait du bruit ; haut, il est discret mais laisse passer des menaces.

## 2. En pratique
```
sha256sum echantillon.txt                                   # empreinte du fichier
awk -F";" 'NR>1 && $1!="sha256" {print $2}' ioc.csv > valeurs.txt   # domaines et adresses connus
grep -c -F -f valeurs.txt echantillon.txt                   # combien de lignes en contiennent
grep ";EMPREINTE$" parc-empreintes.csv | cut -d";" -f1       # machines qui portent cette empreinte
awk -F";" 'NR>1 && $3=="sain" && $2>=3' corpus.csv | wc -l  # faux positifs pour un seuil de 3
awk -F";" 'NR>1 && $3=="malveillant" && $2<3' corpus.csv | wc -l   # faux négatifs
```
Remplacez EMPREINTE par la valeur obtenue avec sha256sum.

## 3. Lire le résultat
- Une empreinte **identique** désigne le même fichier. Une empreinte qui diffère d'un seul caractère désigne un fichier **différent** : ne la comptez pas.
- Un domaine ou une adresse de la liste d'IoC trouvé dans l'échantillon est un constat. Comptez les indicateurs **présents**, pas ceux qui figurent seulement dans la liste.
- Une machine qui porte l'empreinte connue est à isoler et à examiner, mais l'absence d'une empreinte ailleurs ne prouve pas que le reste du parc est sain : le fichier a pu être modifié.
- Pour une règle, comptez séparément faux positifs et faux négatifs, puis additionnez-les pour comparer plusieurs seuils.

## 4. Côté défense
- Isoler les machines touchées, **garder une copie et l'empreinte** de l'échantillon comme preuve, puis le retirer.
- Bloquer les IoC au pare-feu et au proxy ; chercher la même empreinte et les mêmes domaines sur tout le parc et dans les journaux.
- Restaurer depuis des sauvegardes saines et vérifier par de nouvelles empreintes.
- Mesurer les règles avant de les déployer, sur un jeu de fichiers de test, et rejouer la mesure après chaque ajustement.

## 5. Erreurs fréquentes
- Supprimer l'échantillon avant d'en avoir gardé la copie et l'empreinte.
- Conclure d'une empreinte « presque » identique qu'il s'agit du même fichier.
- Abaisser le seuil à 1 « pour ne rien rater » sans mesurer le bruit.
- Désactiver une règle à la première fausse alerte au lieu de l'ajuster.
- Traiter un indicateur isolé comme la preuve d'une compromission générale.

## 6. Exercices
1. Deux machines affichent des empreintes qui ne diffèrent que d'un caractère. Portent-elles le même fichier ?
<details><summary>Réponse</summary>

Non. Une seule différence suffit à changer le contenu. La seconde machine porte un autre fichier, éventuellement une variante : elle se traite comme un constat distinct.
</details>

2. Une règle donne 4 faux positifs et 1 faux négatif au seuil 2, et 1 faux positif et 3 faux négatifs au seuil 3. Quel seuil choisir ?
<details><summary>Réponse</summary>

Au seuil 2 : 4 + 1 = 5 erreurs. Au seuil 3 : 1 + 3 = 4 erreurs. Le seuil 3 fait le moins d'erreurs au total, à condition de juger acceptable de laisser passer trois menaces : le choix dépend aussi du coût d'un faux négatif.
</details>

3. Pourquoi garder une copie de l'échantillon avant de le supprimer ?
<details><summary>Réponse</summary>

C'est la preuve : elle permet de recalculer l'empreinte, de chercher le fichier sur le parc, de mesurer les règles de détection et de documenter l'incident.
</details>
