# P11 · Risque et restitution

Durée : 1 h 15 · Prérequis : P5, P10 · Défi associé : 09 · Priorisation des risques

## Objectifs
- Évaluer un risque avec CVSS et le contexte métier.
- Construire un rapport lisible par la direction et par les techniciens.

## 1. Risque = probabilité × impact
Le **CVSS v3.1** note la gravité technique de 0 à 10 : 0,1-3,9 faible ; 4,0-6,9 moyenne ; 7,0-8,9 élevée ; 9,0-10 critique. Il ne tient pas compte de **votre** contexte : un serveur de test isolé et un serveur de paie n'ont pas le même risque.

## 2. Lire un vecteur CVSS
`AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H` signifie : attaque par le réseau, complexité faible, aucun privilège, aucune interaction, portée inchangée, impact élevé sur confidentialité, intégrité et disponibilité = **9,8 (critique)**.
`AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N` : compte requis, lecture seule de données = **6,5 (moyenne)**.

## 3. Matrice et priorisation
| | Impact faible | Impact moyen | Impact fort |
|---|---|---|---|
| Probabilité forte | moyen | élevé | critique |
| Probabilité moyenne | faible | moyen | élevé |
| Probabilité faible | faible | faible | moyen |

Ajoutez : exposition à Internet, présence d'une exploitation connue, valeur des données, contrôle compensatoire.

## 4. Structure d'un rapport
1. **Synthèse pour la direction** (une page : ce qui s'est passé, le risque, la décision attendue).
2. **Périmètre et méthode** (dates, autorisations, limites).
3. **Constats** : pour chacun, faits observés + preuve, interprétation, gravité, **recommandation** précise.
4. **Plan d'action** priorisé avec propriétaire et échéance.
5. **Retest** : mesure initiale, mesure finale, conclusion.
6. **Annexes** : sorties brutes, empreintes des preuves.

## 5. Erreurs fréquentes
- Copier la sortie d'un scanner sans interprétation.
- Mélanger faits et hypothèses.
- Recommandation vague (« mettre à jour ») au lieu d'une action vérifiable.

## 6. Exercices
1. Un score de 9,8 impose-t-il toujours d'intervenir en priorité ?
<details><summary>Réponse</summary>

Non : le contexte compte. Un service non exposé et sans donnée sensible peut passer après une faille moyenne sur un système exposé.
</details>

2. Réécrivez « corriger SSH » en recommandation vérifiable.
<details><summary>Réponse</summary>

« Désactiver PasswordAuthentication et PermitRootLogin dans sshd_config, fixer MaxAuthTries à 3, puis vérifier avec `sshd -T` ; échéance 7 jours, responsable : administration système. »
</details>
