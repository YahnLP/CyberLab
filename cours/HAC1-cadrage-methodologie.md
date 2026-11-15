# HAC 1 · Cadrage et méthodologie d'un audit

Durée : 1 h 15 · Prérequis : 00 · Défi associé : à créer

## Objectifs
- Structurer un audit avec un modèle de référence.
- Rédiger un mandat d'autorisation.
- Situer les tests dans le cadre juridique et réglementaire.

## 1. Modèles de référence
**Cyber Kill Chain** (7 étapes) : reconnaissance, armement, livraison, exploitation, installation, commande et contrôle, actions sur objectifs. Utile côté défense : une chaîne rompue tôt limite les dégâts. **PTES** et le **guide OWASP** décrivent le déroulé d'un test d'intrusion : pré-engagement, collecte, modélisation des menaces, analyse des vulnérabilités, exploitation, post-exploitation, rapport. **MITRE ATT&CK** catalogue tactiques et techniques observées, pratique pour nommer ce qu'on détecte.

## 2. Le mandat (autorisation écrite)
Il contient au minimum : identité du commanditaire et de l'auditeur, **périmètre** (machines, plages, applications, comptes de test), **exclusions**, dates et horaires, techniques autorisées ou interdites (déni de service, ingénierie sociale), contacts d'urgence, traitement et destruction des données collectées, confidentialité, signature des deux parties. Sans mandat valable : pas de test.

## 3. Règles d'engagement
Arrêt immédiat si un impact imprévu apparaît, information du contact en cas de découverte critique, aucune donnée réelle emportée, journal horodaté de chaque action.

## 4. Cadre juridique (repères, à confirmer avec un juriste)
L'accès frauduleux à un système est un délit (code pénal, articles 323-1 et suivants). L'autorisation écrite du propriétaire est la condition de légalité du test. La directive **NIS 2** et le règlement **DORA** renforcent les exigences de gestion des risques et de tests de résilience pour de nombreuses entités ; ils justifient souvent la demande d'audit, sans dispenser de mandat.

## 5. Ingénierie sociale
Un prétexte (faux appel, hameçonnage de test) n'est possible que si le mandat l'autorise explicitement, avec limites claires, sans collecte de données personnelles inutiles et avec information a posteriori des personnes concernées.

## 6. Exercices
1. Citez trois éléments indispensables d'un mandat.
<details><summary>Réponse</summary>

Périmètre, dates et horaires, signature des deux parties (autres éléments valables : exclusions, techniques autorisées, contacts d'urgence).
</details>

2. À quelle étape de la Kill Chain correspond la lecture d'un enregistrement DNS public ?
<details><summary>Réponse</summary>

La reconnaissance.
</details>
