# P12 · Annuaire et Active Directory

Durée : 1 h 30 · Prérequis : P7 · Défi associé : 15 · Audit d'un annuaire

## Objectifs
- Lire un export d'annuaire (comptes, groupes, attributs) et repérer les comptes à risque.
- Comprendre pourquoi certains attributs facilitent le vol d'identifiants, et comment les corriger.

## 1. Pourquoi l'annuaire est une cible
L'annuaire centralise les identités : qui le contrôle contrôle le domaine. Un audit commence donc par un **export en lecture seule** (comptes, groupes, drapeaux), analysé hors ligne.

## 2. Attributs à examiner
- **Groupes privilégiés** (Domain Admins, Administrateurs) : liste courte, comptes nominatifs, jamais de compte inactif.
- **Mot de passe sans expiration** (DONT_EXPIRE_PASSWORD) : acceptable pour un compte géré (gMSA), risqué pour un humain.
- **Compte avec SPN** (Service Principal Name) : un ticket de service est chiffré avec le secret du compte ; si le mot de passe est faible, il peut être deviné hors ligne (Kerberoasting). Correctif : mots de passe longs et aléatoires, ou comptes de service gérés (gMSA).
- **Pré-authentification Kerberos désactivée** (DONT_REQ_PREAUTH) : permet de demander des données chiffrées avec le secret du compte sans le connaître (AS-REP roasting). Correctif : réactiver la pré-authentification.
- **Dernière connexion** : un compte privilégié inactif depuis plus de 90 jours est à désactiver.

## 3. Lire un export
Format CSV séparé par des points-virgules : `awk -F';' '$4!=""' annuaire.csv` isole les comptes avec SPN ; `grep 'Domain Admins'` les administrateurs. Filtrer d'abord les comptes **actifs** : un compte désactivé est un constat mineur.

## 4. Côté défense
Modèle en niveaux (tiering) : un administrateur du domaine ne se connecte jamais sur un poste utilisateur. Revue trimestrielle des groupes privilégiés, alertes sur toute modification de ces groupes, gMSA pour les services.

## 5. Erreurs fréquentes
- Compter les comptes désactivés comme des risques actifs.
- Corriger le symptôme (changer un mot de passe) sans changer la pratique (compte de service géré).

## 6. Exercices
1. Un compte de service avec SPN et un mot de passe de 30 caractères aléatoires est-il toujours un problème ?
<details><summary>Réponse</summary>

Le risque est très réduit : la devinette hors ligne devient irréalisable. Il reste à documenter le compte et à planifier la rotation.
</details>

2. Quelle est la différence de gravité entre un administrateur actif sans expiration de mot de passe et un administrateur désactivé inactif ?
<details><summary>Réponse</summary>

Le premier est un constat à traiter en priorité (accès actif, secret durable) ; le second est un reste d'inventaire à nettoyer, sans exposition immédiate.
</details>
