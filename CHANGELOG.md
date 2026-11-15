# Changelog
## Non publié

- Casebook côté Docker : commandes `defi preuve`, `defi preuves`, `defi preuve-suppr`, `defi conclusion` et `defi rapport` (rapport Markdown avec empreintes SHA-256, 20 preuves maximum, tout reste local). Test `tests/casebook-docker.sh`.
- Bilan de l'élève : page `#/bilan` (progression par parcours, points, indices), saisie du nom, impression ou PDF, export .txt et .json. Calcul local, rien n'est envoyé. Test navigateur `ui-bilan.mjs`.
- Parcours pentest, volet audit défensif : leçons SIM17 (mobile), SIM19 (cloud), SIM20 (certificats) et 6 missions : SIM17-1 (manifeste), SIM17-2 (configuration embarquée), SIM19-1 (droits, stockage public, clés), SIM19-2 (chiffrement et journalisation), SIM20-1 (lecture d'un certificat), SIM20-2 (inventaire des certificats).
- Parcours pentest, phase 5 : leçons SIM21 (annuaire), SIM22 (mouvement latéral), SIM23 (SOC, forensic, purple team) et 6 missions défensives (SIM21-1/2, SIM22-1, SIM23-1/2/3).
- Correction : la commande `comm` du simulateur accepte maintenant les options -1, -2, -3 et leurs combinaisons (-12, -13, -23).
- SIM16 (sans fil) et SIM18 (IoT/OT) sont reportés, à cadrer avec le formateur.
- Tests : 40 missions résolues dans le simulateur ; `tests/check-cours.sh` contrôle 39 leçons.

## Non publié

- Parcours pentest : leçons SIM13 (serveur web), SIM14 (application web), SIM15 (couche SQL) et 6 missions : SIM13-1, SIM13-2, SIM14-1, SIM14-2, SIM15-1, SIM15-2.
- Jumeau numérique : formulaire de recherche (chemin et paramètre tirés au hasard) qui renvoie la saisie sans l'échapper, page `/produit` à requête vulnérable simulée par un mini-évaluateur SQL (erreurs de type MySQL, `OR`, commentaires), catalogue fictif avec un produit réservé. Aucune base réelle, aucune donnée réelle.
- Tests : 28 missions résolues dans le simulateur (1320 contrôles) ; `tests/check-cours.sh` contrôle 33 leçons.

## Non publié

- Parcours pentest : leçons SIM10 (disponibilité), SIM11 (sessions et cookies), SIM12 (pare-feu et détection d'intrusion) et 6 missions : SIM10-1, SIM10-2, SIM11-1, SIM11-2, SIM12-1, SIM12-2.
- Données générées par graine : journal web nginx, métriques de supervision, en-têtes Set-Cookie, journal de connexions, règles de pare-feu, alertes IDS ; SIM12-1 se recoupe avec un scan `nmap -p-` du serveur web du jumeau.
- Tests : 22 missions résolues dans le simulateur (1080 contrôles) ; correction d'un défaut du solveur de test (lecture des lignes de `nmap` sans `-sV`).
- `tests/check-cours.sh` contrôle 30 leçons.

## Non publié

- Parcours pentest : leçons SIM06 (accès contrôlé et élévation de privilèges) et SIM08 (capture et analyse de trafic), 4 missions : SIM06-1 (UID 0 caché, mot de passe vide, hachages faibles), SIM06-2 (règle sudo dangereuse, SUID inattendu), SIM08-1 (balayage et mot de passe en clair), SIM08-2 (exfiltration par DNS).
- Données générées par graine (passwd, shadow, sudoers, SUID, captures au format tcpdump) ; missions résolues dans le simulateur avec awk, grep, sort et uniq.
- `tests/check-cours.sh` contrôle 27 leçons.

## Non publié

- Parcours pentest : leçons SIM01 (cadrage, règles d'engagement, preuves), SIM04 (énumération SMB et SNMP) et SIM05 (analyse de vulnérabilités et priorisation).
- 6 nouvelles missions : SIM01-1 (mandat et périmètre), SIM01-2 (preuve de scan scellée par SHA-256), SIM04-1 (partages SMB anonymes), SIM04-2 (SNMP et communauté devinée), SIM05-1 (avis de sécurité et versions), SIM05-2 (priorisation gravité × exposition).
- Jumeau numérique : partages SMB (dont un partage sensible lisible sans compte), imprimante SNMP, périmètre d'un mandat ; outils simulés `smbclient`, `snmpget`, `snmpwalk` avec traces côté défense.
- Tests : 12 missions résolues uniquement avec les sorties des outils simulés (680 contrôles), mission SIM01-2 jouée dans le terminal du navigateur, 25 leçons contrôlées.
- Parcours pentest : leçons SIM02 (reconnaissance et empreinte) et SIM03 (scan réseau), rattachées aux missions du jumeau numérique ; la vue Cours propose un bouton par mission.
- `tests/check-cours.sh` contrôle désormais 25 leçons.

## v0.13.0 — jumeau numérique et parcours pentest (SIM02, SIM03)
- **Jumeau numérique** : une plage fictive générée par session (domaine en .example, réseau 192.168.x.0/24, plages 203.0.113.x), conservée avec la progression : 8 hôtes dont un équipement inconnu et un hôte disparu, DNS public et interne, serveur web avec en-têtes et fuite, un port non prévu, un service obsolète.
- **Outils simulés** au format des vrais outils : `ping`, `host`, `dig`, `nslookup`, `nmap` (-sn, -sV, -p, -p-, -F, --open) et `curl` (-I, -i, -s, -L, -w). Chaque action laisse une trace côté défense.
- **6 missions** : SIM02 (noms publics, en-têtes et fuites web, messagerie SPF) et SIM03 (hôtes actifs, ports du serveur web, écart inventaire et politique de versions). Chaque mission a une face Red (constats corrigés sur les faits du jumeau) et une face Blue (mesure à choisir, ordre tiré de la graine). Nouveau groupe « Parcours pentest » sur l'accueil.
- Panneaux **Vue du lab** (ce que voit la défense, alertes) et **Web** (même réponse que curl -i) sous le terminal des missions.
- Tests : invariants de la plage sur 200 graines, les 6 missions sont résolues UNIQUEMENT à partir des sorties des outils (40 plages), mauvaises réponses refusées, test navigateur `ui-twin.mjs`.
- La couche SQL (panneau Base SQL) arrive avec le module SIM15.

## v0.12.0 — défi 01 sur le simulateur web
- Défi 01 (incident SSH, 60 points, 8 phases) jouable dans le navigateur : commandes `ssh-keygen -lf` et `sshd -T` simulées, retest 6 contrôles, détection rejouée sur un second journal, rapport contrôlé. La clé d'hôte privée n'est pas publiée.
- Terminal simulé : documents en ligne (`<<EOF`, `<<'EOF'`, `<<-EOF`), adresses `sed '\#re#d'`, `$$`, `set`, dossier `/tmp`, droits d'exécution conservés avec la progression.
- Tests : correcteur JS comparé au vrai correcteur bash sur des variantes « presque bonnes » (16 erreurs injectées par variante), le corrigé formateur est exécuté tel quel dans le simulateur (`tests/web/e2e-01.mjs`), `ssh-keygen`/`sshd -T` comparés aux vrais outils, test navigateur `ui-defi01.mjs`. Test différentiel de l'émulateur : 3 128 commandes identiques à bash.

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
- Accueil du simulateur web réorganisé : Fondations, Parcours professionnalisant, Parcours avancés, Parcours sécurité offensive ; chaque étape = leçon puis défi, bouton Commencer / Reprendre, leçon suivante.
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

## v0.6.0 — défis du parcours sécurité offensive
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
- 17 leçons : prise en main, parcours métier P1 à P11, parcours sécurité offensive SO1 à SO5 (contenu original).
- `tests/check-cours.sh` : structure, exercices corrigés, liens, adresses fictives.

## v0.1.0 — proposition
- Défi 01 « Incident SSH » (8 phases, données aléatoires, retest, rapport).
- Image : ajout openssh-client/openssh-server (sshd -T) et /run/sshd.
