# P7 · Identités et réseau

Durée : 1 h 30 · Prérequis : P2, P3 · Défi associé : 01 (volet mots de passe)

## Objectifs
- Comprendre stockage, attaque et protection des mots de passe.
- Décrire l'annuaire Active Directory et Kerberos à haut niveau.
- Expliquer l'interception ARP et ses défenses.

## 1. Mots de passe
Un mot de passe n'est jamais stocké en clair mais sous forme de **hachage salé** avec un algorithme lent (bcrypt, scrypt, Argon2). Les attaques courantes : **dictionnaire** (essais de mots probables), **bourrage d'identifiants** (listes de fuites), **pulvérisation** (un mot de passe sur beaucoup de comptes). Défenses : MFA, verrouillage progressif, limitation, mots de passe longs, interdiction des mots de passe compromis, authentification SSH par clé.

## 2. Active Directory en deux minutes
Un **domaine** regroupe utilisateurs, groupes et machines, administrés par des **contrôleurs de domaine**. **Kerberos** délivre des tickets : on prouve son identité une fois, puis on présente des tickets aux services. Les risques viennent des comptes de service au mot de passe faible, des délégations excessives et des droits cumulés (chemins d'attaque). Défense : moindre privilège, comptes de service gérés, journalisation des événements d'authentification.

## 3. Interception ARP (homme du milieu local)
ARP n'authentifie pas les réponses : une machine du même segment peut annoncer « l'adresse de la passerelle, c'est moi ». Le trafic passe alors par elle. Signes : adresse MAC de la passerelle qui change dans `ip neigh`, doublons d'IP, avertissements du commutateur. Défenses : **Dynamic ARP Inspection**, ports sécurisés, VLAN, et surtout **chiffrement de bout en bout** (TLS, SSH) qui rend l'interception inexploitable.

## 4. Sans fil (vue d'ensemble)
WPA2/WPA3 protègent la confidentialité ; une phrase de passe courte reste vulnérable à une attaque par dictionnaire hors ligne sur un échange capturé. Préférer WPA3 ou WPA2-Enterprise (802.1X), désactiver WPS.

## 5. Lire un incident d'authentification
`grep "Failed password" /var/log/auth.log | grep -oE "([0-9]{1,3}\.){3}[0-9]{1,3}" | sort | uniq -c | sort -rn` classe les sources. Beaucoup d'échecs puis un `Accepted` depuis la même IP = **compromission**, pas simple tentative (voir le défi 01).

## 6. Exercices
1. Pourquoi saler un hachage ?
<details><summary>Réponse</summary>

Pour que deux mots de passe identiques donnent des hachages différents et pour empêcher les tables précalculées.
</details>

2. Quelle mesure rend l'interception ARP peu utile à l'attaquant ?
<details><summary>Réponse</summary>

Le chiffrement de bout en bout (HTTPS, SSH) : l'attaquant voit passer des données illisibles.
</details>
