# Cyber Déclic : formation à distance (plan, effort, coût)

Statut : **cadrage validé** (nom, offre, prix, financement, quatre modules complémentaires). Les chiffres de coût sont des estimations sur hypothèses explicites, à ajuster.

## 1. Décisions prises

| Sujet | Décision |
|---|---|
| Nom | **Cyber Déclic** (vérification INPI à faire avant usage) |
| Offre | Une seule offre, entrée **au fil de l'eau** (pas de date de session) |
| Prix | **990 €**, tarif réduit **690 €** (étudiants et demandeurs d'emploi) |
| Effort moyen | **6 h 30 par semaine**, soit environ **15 semaines** (**100 h** au total) |
| Financement | Ni CPF ni Qualiopi pour le moment |
| Communication avec le formateur | **E-mail en priorité** |
| Plateforme | **Tout est géré sur Campus** (formateur : modules et leçons ; responsable pédagogique : formation et affectation des apprenants). Le simulateur CyberLab est **indépendant** de la formation et sert de **support d'entraînement** |
| Contenus | **Nouveaux contenus rédigés pour les apprenants**, plus clairs que les leçons du simulateur : explications progressives, schémas, exemples fil rouge, encadrés « à retenir » et « erreur fréquente », mini-quiz. Les leçons du dépôt servent de base technique, pas de texte final |
| Modules complémentaires | SIM07, SIM09, SIM16, SIM18 validés (voir `CADRAGE-SIM07-09-16-18.md`) |

## 2. Nom et texte pour le site formaxionlandes.fr

Nom retenu : **Cyber Déclic**. Il parle du moment où l'on décide de se lancer (reconversion, curiosité). Les alternatives étudiées (Objectif Cyber, Cyber Immersion, Cap Cyber) sont écartées. « Cyber Academy » est à éviter : déjà utilisé par plusieurs acteurs.

### Texte d'accroche proposé

> **Cyber Déclic : passez de curieux à praticien en 15 semaines**
> Une formation 100 % à distance pour se lancer en cybersécurité, sans prérequis technique. À votre rythme et dès aujourd'hui : des leçons, des missions sur un laboratoire fictif réaliste et un formateur qui répond à vos questions. Vous terminez avec un rapport d'audit complet à montrer à un employeur ou à un jury.
>
> - Environ **6 h 30 par semaine** pendant 15 semaines (100 h), à votre rythme
> - Laboratoire en ligne : rien à installer
> - Suivi personnalisé par e-mail et attestation de réussite
> - Inscription à tout moment
> - **990 €** (690 € pour les étudiants et demandeurs d'emploi)

À garder prudent sur le site : ne promettre ni emploi ni certification reconnue ; écrire « attestation de formation, non certifiante » et « laboratoire fictif ».

## 3. Public et prérequis

- **Public** : personnes en reconversion, curieux, étudiants. Aucun diplôme requis.
- **Prérequis** : à l'aise avec un ordinateur. Aucune connaissance de Linux ou de réseau n'est exigée.
- **Matériel** : un navigateur récent. Le simulateur tourne dans le navigateur, rien à installer. Option : le lab Docker pour les plus à l'aise.
- **Cadre éthique** : charte d'usage acceptée à l'inscription (laboratoire fictif uniquement, aucun test sur un système réel sans autorisation écrite).

## 4. Objectifs

À l'issue de la formation, l'apprenant sait :
- lire des journaux, des captures et des configurations, et en tirer des constats prouvés ;
- conduire un audit de base dans un cadre autorisé (périmètre, preuves, restitution) ;
- relier chaque faiblesse à sa mesure de défense ;
- investiguer un incident simple à partir de plusieurs sources ;
- produire un rapport clair avec preuves horodatées et empreintes.

## 5. Format et effort

- **Rythme libre** : l'apprenant entre quand il veut et avance à son rythme. Accès conseillé : **6 mois** à partir de l'inscription.
- **Effort moyen** : **6 h 30 par semaine**. Selon le temps disponible :

| Temps par semaine | Durée totale |
|---|---|
| 4 h | environ 25 semaines |
| **6 h 30 (référence)** | **environ 15 semaines** |
| 10 h | environ 10 semaines |

- **Volume** : **100 h** (durée arrondie à la dizaine supérieure) = 96 h de travail personnel (leçons, défis, missions, projet) + ≈ 4 h d'échanges avec le formateur. Les durées de module sont des nombres entiers d'heures.
- **Suivi** : par e-mail en priorité (questions, retours sur le projet), avec le bilan exporté par l'apprenant (page `#/bilan`, .txt ou .json) à envoyer à l'adresse dédiée, et le suivi d'avancement de Campus.
- **Réponse du formateur** : engagement indicatif sous 2 jours ouvrés.

## 6. Plan de formation : 14 modules

Les références renvoient aux leçons (`cours/`) et missions déjà livrées. **Un module Campus par étape**, avec ses leçons et un QCM.

| N° | Module | Contenu | Effort |
|---|---|---|---|
| 1 | Terminal et méthode | Leçon 00, défi 00, règles d'engagement et preuves (SIM01) | 5 h |
| 2 | Reconnaître | P1, P2, défis 02 et 03, SIM02, SIM16 (sans fil) | 8 h |
| 3 | Services et scans | P3, SIM03, défi 04 | 6 h |
| 4 | Le web de base | P4, SIM13, défi 05 | 5 h |
| 5 | Vulnérabilités | P5, SIM05, défi 06, SIM26 (fiches CVE) | 6 h |
| 6 | Applications et API | P6, SIM14, défi 07 | 6 h |
| 7 | Sessions et SQL | SIM11, SIM15 (panneau Base SQL) | 6 h |
| 8 | Identités et énumération | P7, SIM04, SIM06, SIM09 (ingénierie sociale) | 9 h |
| 9 | Disponibilité et périmètre | P9, SIM10, SIM12, défi 08, SIM18 (IoT et OT) | 8 h |
| 10 | Mobile, cloud, certificats | SIM17, SIM19, SIM20 | 8 h |
| 11 | Annuaire | P12, SIM21, défi 15 | 5 h |
| 12 | Incident | P8, P13, SIM22, SIM23, défi 01, SIM07 (fichiers suspects) | 10 h |
| 13 | Corriger, prioriser, restituer | P10, P11, défi 09, SIM25 (firmwares) | 6 h |
| 14 | Projet final | SIM24 + rapport Casebook | 8 h |
| | **Total** | | **96 h** |

Compléments **optionnels** (hors volume) : Parcours sécurité offensive SO1 à SO5 et SIM08 (capture de trafic). Les leçons SIM07, SIM09, SIM16, SIM18, SIM25 et SIM26 sont **intégrées** aux modules ci-dessus (≈ 1 h 15 chacune, missions comprises).

## 7. Évaluation et attestation

- **QCM de chaque module** (hors projet) : 6 à 8 questions, seuil indicatif **70 %**.
- **Projet final** (SIM24 + rapport), noté sur 20 :
  - exactitude des constats : 8 points ;
  - qualité des preuves (commandes, empreintes, horodatage) : 4 points ;
  - mesures de défense proposées et priorisées : 5 points ;
  - clarté du rapport : 3 points.
- **Attestation de suivi** (certificat Campus, non certifiant) : tous les modules validés et projet **≥ 10/20**.

## 8. Plateforme Campus et rôles

Campus a été consulté avec votre session. Fonctions constatées et utilisées :

- **Modules** composés de leçons, de QCM, de livrables, d'épreuves blanches et d'exercices Python ; **formations** regroupant des modules.
- **Leçons en Markdown** (import de fichiers possible), avec tableaux, code, formules, vidéos, images, réponses déroulantes et **schémas Mermaid** (organigrammes, séquences, cycles) dessinés dans la leçon. Le SVG brut n'est **pas** conservé : les schémas passent par Mermaid.
- **QCM** : questions fixes (format texte) et banque de questions, seuil de réussite, nombre d'essais, correction détaillée.
- **Livrables** notés sur 20 points avec dépôts successifs et correction depuis « Corrections » : c'est le support du **projet final**.
- **Forum** (avec modération), **suivi des apprenants**, **certificats**, pages légales et RGPD.

| Rôle | Actions dans Campus |
|---|---|
| **Formateur** | Crée les **14 modules** et leurs **leçons** ; écrit les **QCM** et le **livrable** du projet ; corrige les livrables |
| **Responsable pédagogique** | Crée la formation **Cyber Déclic** (assemblage des modules publiés, dans l'ordre) ; **affecte les apprenants** ; suit les avancements ; délivre les certificats |

Bonnes pratiques :
- Les modules restent en **brouillon** jusqu'à relecture, puis sont publiés (un module non publié ne peut pas entrer dans une formation).
- Chaque leçon renvoie au simulateur CyberLab comme exercice d'entraînement.
- Chaque nouvelle entrée déclenche : affectation, e-mail d'accueil (charte, lien du simulateur, adresse de suivi).

À vérifier avant l'ouverture publique : accessibilité depuis Internet, sauvegardes (le module s'exporte en fichier .json), RGPD pour les apprenants extérieurs.

## 9. Temps de préparation (une fois)

Les contenus sont **réécrits pour les apprenants** (et non repris du simulateur) : cela représente l'essentiel de la charge.

| Tâche | Heures | Qui |
|---|---|---|
| Structuration des 14 modules et fiches de module | 15 | Formateur |
| Rédaction des **≈ 67 leçons** illustrées (explications, schémas Mermaid, exemples, mini-quiz) : ≈ 2 h par leçon, relecture comprise | 100 | Formateur |
| QCM (13 modules × 6 à 8 questions) et livrable du projet avec grille | 15 | Formateur |
| Charte, conditions, livret d'accueil, e-mails types | 10 | Formateur |
| Tests complets du parcours (compte apprenant de test) | 12 | Formateur |
| Création de la formation et réglages d'inscription | 4 | Responsable pédagogique |
| **Total** | **156 h** | |

La rédaction peut être assistée pour gagner du temps ; chaque leçon est **relue et publiée par le formateur**. À 80 € l'heure, la préparation représente **≈ 12 500 €** de temps valorisé (contre 8 480 € dans l'estimation initiale).

## 10. Coût

### Hypothèses

- Temps valorisé à **80 € / heure** (repère de marché : un TJM de 700 à 850 € HT pour 7 h correspond à 100 à 120 € / h pour un profil expérimenté).
- Suivi par apprenant : **5 h** (réponses aux e-mails 2 h, suivi hebdomadaire dans Campus 1 h, bilan de mi-parcours 0,5 h, correction du projet et retour 1,5 h) + **0,5 h** d'administration (affectation, accueil, attestation) = **5,5 h**, soit 440 €.
- Outils et hébergement : **1 000 € par an** (hypothèse à remplacer par vos coûts).
- Mix de tarifs : 70 % au plein tarif (990 €), 30 % au tarif réduit (690 €), soit un prix moyen de **900 €**.
- Préparation : 156 h × 80 € = **12 480 €**, à rentabiliser.

### Par apprenant

| | Montant |
|---|---|
| Prix moyen encaissé | 900 € |
| Coût variable (5,5 h) | 440 € |
| **Contribution par apprenant** | **460 €** (550 € au plein tarif, 250 € au tarif réduit) |

### Selon le nombre d'inscrits par an

| Inscrits par an | Recettes | Coût de suivi | Outils | Reste pour amortir la préparation (12 480 €) |
|---|---|---|---|---|
| 10 | 9 000 € | 4 400 € | 1 000 € | 3 600 € |
| 20 | 18 000 € | 8 800 € | 1 000 € | 8 200 € |
| 30 | 27 000 € | 13 200 € | 1 000 € | 12 800 € |

La préparation est rentabilisée à **environ 30 inscrits** (12 480 ÷ 460 ≈ 27, plus ≈ 2 pour les outils), soit **un an et demi** à 20 inscrits par an ou **trois ans** à 10. Si vous ne valorisez pas votre temps de rédaction, le coût réel de départ est surtout l'hébergement. Le **temps de suivi par apprenant** est le levier principal : chaque heure de suivi en plus coûte 80 € par inscrit.

Le résultat est une **valorisation de votre temps**, avant cotisations, impôts et TVA. Le régime de TVA de la formation et les cotisations sont à valider avec votre comptable.

### Repères du marché (2026)

Formation débutant 75 h à 1 500 € (Jedha), 105 h à 1 800 € (via MaFormation), 130 h à 1 990 € (Studi), 1 190 à 1 980 € non éligibles CPF (Esecad, Dawan). Un prix de 990 € se justifie par l'absence d'éligibilité CPF au lancement.

## 11. Financement et conformité

- Ni CPF ni Qualiopi pour le moment. Le CPF exige une certification inscrite au RNCP ou au Répertoire spécifique ; France Travail et les OPCO demandent en général un organisme certifié Qualiopi. Pistes possibles plus tard.
- Paiement par les particuliers : possible avec programme et conditions remis avant inscription, contrat de formation, délai de rétractation de 14 jours et règlement intérieur. À faire valider par votre comptable.
- Communication : ne pas laisser croire que la formation est finançable CPF.

## 12. Mise en place (sans date)

La formation étant en ligne et ouverte au fil de l'eau, l'ordre est :

| Étape | Qui | Condition de passage |
|---|---|---|
| 1. Créer les 14 modules, leçons et QCM (brouillon) | Formateur | Modules relus |
| 2. Publier les modules | Formateur | Parcours testé avec un compte de test |
| 3. Créer la formation et ouvrir les inscriptions | Responsable pédagogique | 14 modules publiés |
| 4. Mettre en ligne la page sur formaxionlandes.fr | Vous | Texte et prix validés |
| 5. Premiers apprenants (tarif libre pour un premier retour) | Responsable pédagogique | Charte et conditions prêtes |
| 6. Ajuster selon les retours (effort réel par module) | Formateur | 3 à 5 apprenants ayant terminé |

L'**effort réel par module** sera mesuré avec les premiers apprenants (temps déclaré à l'envoi du bilan) pour affiner les 6 h 30 hebdomadaires annoncées (100 h au total).

## 13. Risques et parades

| Risque | Parade |
|---|---|
| Décrochage (fréquent à distance) | Relance par e-mail si aucun bilan depuis 2 semaines ; objectifs hebdomadaires clairs |
| Niveau d'entrée hétérogène | Module 1 complet ; remise à niveau Linux en option |
| Temps de suivi sous-estimé | Suivre le temps réel, limiter les inscrits actifs, FAQ et réponses types |
| Campus indisponible | Contenus accessibles depuis le simulateur public ; repli sur e-mail |
| Usage abusif des techniques | Charte acceptée à l'inscription, laboratoire fictif, aucun outil offensif réel |
| Effort annoncé différent du réel | Mesurer et corriger dans l'annonce |

## 14. Questions ouvertes

1. Adresse e-mail dédiée au suivi (à créer).
2. Délai de réponse affiché : 2 jours ouvrés convient-il ?
3. Durée d'accès : 6 mois à partir de l'inscription convient-il ?
4. Les premiers apprenants : tarif libre, symbolique ou plein ?

## Sources des repères de marché

- Jedha, formation cybersécurité à distance : https://www.jedha.co/formation-cybersecurite/formation-cybersecurite-100-en-ligne
- MaFormation, fondamentaux de la cybersécurité (105 h) : https://www.maformation.fr/formation/les-fondamentaux-de-la-cybersecurite-formation-pour-les-debutants-204310
- Studi, participer à la gestion de la cybersécurité : https://www.studi.com/fr/formation/infrastructures-et-systemes/gestion-cybersecurite
- Blog du Modérateur, sélection de formations : https://www.blogdumoderateur.com/selection-formation-cybersecurite-224/
- Abby, tarif horaire formateur : https://abby.fr/guide/micro-entreprise/tarif-horaire-formateur-auto-entrepreneur
