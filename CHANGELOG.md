# Changelog
## v0.11.0 — Casebook (simulateur web)
- Onglet « Casebook » sous le terminal : ajouter la sortie d'une commande aux preuves (empreinte SHA-256 de la sortie, horodatage, 20 preuves maximum), rédiger la conclusion, exporter le rapport en Markdown ou en HTML autonome. Tout reste dans le navigateur, conservé avec la progression.
- Test navigateur `tests/web/ui-casebook.mjs`, exécuté en CI.

## v0.10.1 — guide « Lab complet »
- Page `#/installer` du simulateur (bouton sur l'accueil et dans le menu) : installer le laboratoire complet sur une vraie machine avec Docker : poste seul, mode terminal, salle de formation (un conteneur par stagiaire), vérification, mise à jour, avertissement sur le port ouvert sans mot de passe. Blocs de commandes avec bouton Copier.
- Test navigateur `tests/web/ui-install.mjs` (mobile, copie, menu), exécuté en CI.

## v0.10.0 — mode Expert et panneau Comprendre / Journal (simulateur web)
- Mode Expert : bouton « Mode » sur chaque défi. Indices désactivés, chronomètre (en pause quand l'onglet est masqué), badge Expert et temps affichés à la réussite. Passer d'Expert à Guidé est possible, l'inverse n'est permis que si aucun indice n'a été utilisé.
- Panneau sous le terminal : « Comprendre » explique la dernière commande (chaîne de commandes, rôle de chaque étape, code de retour) et « Journal » garde les commandes du défi, conservées avec la progression.
- Test navigateur `tests/web/ui-expert.mjs` (13 vérifications), exécuté en CI.
- Audit de couverture face à la référence : `docs/COUVERTURE.md`.
## v0.9.3
- Correctif défi 06 : les identifiants CVE tirés au hasard pouvaient se répéter (environ 1 session sur 300), ce qui rendait le corrigé refusé ; tirage sans doublon.

## v0.9.2 — charte Formaxion et ergonomie
- Habillage aligné sur formaxionlandes.fr : bleu #0082CB, vert #39A848, bleu nuit #0F2939, Montserrat (comme le site), boutons en pilule, cartes arrondies, pied de page sombre. Logo chargé depuis formaxionlandes.fr avec repli texte.
- Page défi : fil d'Ariane, onglets Énoncé / Fichiers (fichiers cliquables), barre d'actions (Valider, Indice, Éditer reponses.txt, Énoncé, taille du texte, Recommencer), bannière de réussite avec défi suivant.
- Accueil : progression globale, progression par parcours, état par étape ; accessibilité (lien d'évitement, focus visible, mouvement réduit).

## v0.9.1 — accueil en parcours guidé
- Accueil du simulateur web réorganisé : Fondations, Parcours métier, Parcours avancés, Cycle HAC ; chaque étape = leçon puis défi, bouton Commencer / Reprendre, leçon suivante.
- Nouveau défi 00 « Prise en main : preuve et premières commandes » (copie de preuve, empreinte, premières mesures).

## v0.9.0 — simulateur web (GitHub Pages)
- Site statique `site/` : terminal simulé (shell, awk, sed, sort, grep...), défis 02 à 17, correcteur, indices, score local, leçons.
- `tools/build-site-data.mjs` : génère 30 variantes par défi à partir des vrais `setup.sh`.
- Workflow `pages` (déploiement) et tests `tests/web/` (correcteur et émulateur comparés à bash).

## v0.8.0 — tests d'intégration
- `tests/docker-integration.sh` : construit l'image, vérifie ttyd, rejoue chaque corrigé dans le conteneur.
- Workflow GitHub Actions `tests` : contrôle des leçons, corrigés hors conteneur, intégration Docker.

## v0.7.0 — parcours avancés
- Leçons P12 (annuaire), P13 (forensic), P14 (segmentation) et défis 15 à 17 : audit d'un export d'annuaire, chronologie et IOC, matrice de flux et pivot.
- Analyse hors ligne et défense uniquement.

## v0.6.0 — défis du cycle HAC
- Défis 10 à 14 : analyse d'un mandat (et Cyber Kill Chain), lecture d'une capture réseau (identifiants en clair, empoisonnement ARP), énumération DNS/SMB/SNMP, revue de code web, protections mémoire et base Metasploit.
- Tous orientés analyse et défense, sans exploitation ni fabrication de charge.

## v0.5.0 — défis P9 et P11
- Défi 08 : saturation SYN (ss -ant), amplification (facteurs et débit reçu), RPO réel des sauvegardes.
- Défi 09 : calcul CVSS v3.1 réel (validé sur des scores NVD connus), priorisation selon exposition et criticité, synthèse pour la direction.

## v0.4.0 — défis P5 et P6
- Défi 06 : tri des alertes d'un scanner (vrais/faux positifs, correctifs rétroportés, `dpkg --compare-versions`).
- Défi 07 : contrôle d'accès d'une API (IDOR, erreurs bavardes, limitation de débit, décodage d'un JWT).

## v0.3.0 — défis P1 à P4
- Défis 02 à 05 : fiche de reconnaissance, écarts d'inventaire, services exposés, audit HTTP (données aléatoires, formats réels : zone DNS, nmap -oG, ip neigh, curl -si).
- engine/lib.sh : aides communes (réponses hachées, comparaison d'ensembles).
- tests/run-solution.sh joue tous les corrigés.

## v0.2.0 — cours
- 17 leçons : prise en main, parcours métier P1 à P11, cycle HAC 1 à 5 (contenu original).
- `tests/check-cours.sh` : structure, exercices corrigés, liens, adresses fictives.

## v0.1.0 — proposition
- Défi 01 « Incident SSH » (8 phases, données aléatoires, retest, rapport).
- Image : ajout openssh-client/openssh-server (sshd -T) et /run/sshd.
