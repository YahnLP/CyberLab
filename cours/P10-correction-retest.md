# P10 · Correction et retest

Durée : 1 h · Prérequis : P5 à P8 · Défi associé : 01 · Incident SSH

## Objectifs
- Choisir un contrôle adapté à la faiblesse observée.
- Corriger sans casser le service attendu.
- Prouver l'effet par un retest identique à la mesure initiale.

## 1. Cycle
Constat (preuve) → correctif proposé → **changement planifié et approuvé** → application → **retest avec la même mesure** → conclusion datée. Un correctif non retesté n'est qu'une hypothèse.

## 2. Contenir, puis corriger
- **Confinement** (immédiat, réversible) : bloquer une source, désactiver un compte, isoler une machine.
- **Correction** (cause racine) : durcir la configuration, corriger le code, mettre à jour.
- **Recouvrement** : renouveler les secrets exposés, restaurer, surveiller.

## 3. Exemple : durcir SSH
Dans `sshd_config` :
```
PasswordAuthentication no
PermitRootLogin no
MaxAuthTries 3
```
Vérifier les **valeurs effectives**, pas le fichier : `sshd -T -f sshd_config | grep -E 'passwordauthentication|permitrootlogin|maxauthtries'`. Tester la syntaxe avant de recharger : `sshd -t`. Garder une session ouverte pendant le rechargement pour ne pas se verrouiller dehors.

## 4. Pare-feu : l'ordre compte
Avec nftables, la première règle qui correspond s'applique. Un `ip saddr 203.0.113.77 drop` placé **après** `tcp dport 22 accept` ne bloque rien.

## 5. Retest
Rejouer la mesure : même commande, même cible, même condition. Ajouter un contrôle de **non-régression** : le service légitime fonctionne toujours (la sauvegarde planifiée tourne, l'administrateur se connecte par clé). Consigner la sortie, la date et l'empreinte du fichier.

## 6. Erreurs fréquentes
- Supprimer toute la table cron au lieu de la seule ligne frauduleuse.
- Corriger sans renouveler le secret exposé.
- Conclure sur la seule lecture du fichier de configuration.

## 7. Exercices
1. Pourquoi `sshd -T` est-il préférable à un `grep` du fichier ?
<details><summary>Réponse</summary>

Il affiche la configuration réellement appliquée, après lecture des inclusions et des valeurs par défaut.
</details>

2. Donnez deux preuves de retest valables pour la suppression d'une clé SSH frauduleuse.
<details><summary>Réponse</summary>

L'empreinte de la clé n'apparaît plus dans `authorized_keys` (`ssh-keygen -lf`) et la clé légitime y figure toujours ; une tentative de connexion avec l'ancienne clé échoue.
</details>
