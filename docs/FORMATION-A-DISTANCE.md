# Formation à distance : plan, durée et coût (proposition)

Statut : **cadrage validé sur l'offre, le prix, le créneau et le financement** (échange du 15/11/2026). Reste à valider : le nom définitif. Les chiffres de coût sont des estimations posées sur des hypothèses explicites, à ajuster.

**Décisions prises** : une seule offre (14 semaines) à **990 €**, tarif réduit **690 €** (étudiants et demandeurs d'emploi) ; pas de CPF ni de Qualiopi pour le moment ; webinaires en soirée, **à 20 h** (créneau à gérer en temps voulu). L'option courte « Découverte » à 290 € n'est **pas retenue**.

## 1. Nom (pour le site formaxionlandes.fr)

Constat du marché : les formations à distance en cybersécurité portent surtout des noms génériques (« Bootcamp cybersécurité », « Fondamentaux de la cybersécurité », « Cyber Academy », « Cyber University »), ce qui les rend peu mémorables. Le nom **« Cyber Academy »** est déjà utilisé par plusieurs acteurs (Deloitte, SysDream, Mailinblack) : à éviter. Un nom vendeur pour des reconversions et des curieux doit promettre un **changement** et une **pratique**, pas décrire un programme.

| Rang | Nom | Pourquoi | Sous-titre type |
|---|---|---|---|
| 1 (recommandé) | **Cyber Déclic** | Parle du moment où l'on décide de se lancer (reconversion, curiosité) ; court, mémorable, aucun résultat identique trouvé parmi les formations en cybersécurité | *14 semaines pour se lancer en cybersécurité, par la pratique, avec un formateur* |
| 2 | **Objectif Cyber** | Clair, orienté but ; plus banal | *De zéro à votre premier audit, à distance* |
| 3 | **Cyber Immersion** | Insiste sur la pratique en laboratoire ; évoque un bootcamp | *Un laboratoire fictif, un formateur, 14 semaines* |
| 4 | **Cap Cyber** | Proposition initiale, sobre | *S'initier et pratiquer la cybersécurité* |

Avant adoption : vérifier la disponibilité auprès de l'INPI (marque) et du nom de domaine ou de la page dédiée. La recherche web effectuée n'est pas une garantie juridique.

### Texte d'accroche proposé pour le site (version « Cyber Déclic »)

> **Cyber Déclic : passez de curieux à praticien en 14 semaines**
> Une formation 100 % à distance pour se lancer en cybersécurité, sans prérequis technique. Chaque semaine : des leçons, des missions sur un laboratoire fictif réaliste et un webinaire en direct avec votre formateur. Vous terminez avec un rapport d'audit complet à montrer à un employeur ou à un jury.
>
> - 14 semaines, environ 105 heures, à votre rythme (≈ 7 h 30 par semaine)
> - 14 webinaires en direct à 20 h, enregistrés
> - Laboratoire en ligne : rien à installer
> - Suivi personnalisé et attestation de réussite
> - **990 €** (690 € étudiants et demandeurs d'emploi)

Points à garder prudents sur le site : ne pas promettre un emploi ni une certification reconnue ; préciser « attestation de formation, non certifiante » et « laboratoire fictif ».

## 2. Public et prérequis

- **Public** : personnes en reconversion, curieux, étudiants. Aucun diplôme requis.
- **Prérequis** : à l'aise avec un ordinateur ; aucune connaissance de Linux ni de réseau exigée (le niveau 1 les apporte).
- **Matériel** : un navigateur récent. Le simulateur tourne dans le navigateur, rien à installer. Option : le lab Docker pour les plus à l'aise.
- **Cadre éthique** : charte d'usage signée (laboratoire fictif uniquement, aucun test sur un système réel sans autorisation écrite).

## 3. Objectifs

À l'issue de la formation, l'apprenant sait :
- lire des journaux, des captures et des configurations, et en tirer des constats prouvés ;
- conduire un audit de base dans un cadre autorisé (périmètre, preuves, restitution) ;
- relier chaque faiblesse à sa mesure de défense ;
- investiguer un incident simple à partir de plusieurs sources ;
- produire un rapport clair avec preuves horodatées et empreintes.

## 4. Format

- **Durée** : 14 semaines, environ **105 heures** par apprenant (≈ 7 h 30 par semaine).
- **Autonomie** : ≈ 84 h (leçons, défis, missions du simulateur, projet final).
- **Webinaires** : 14 séances de 1 h 30 (≈ 21 h), une par semaine, en soirée **à 20 h** (20 h à 21 h 30), **enregistrées**. Contenu : démonstration, correction commentée d'une mission, questions, point de motivation.
- **Suivi** : permanence en ligne (forum ou messagerie de Campus) 1 h 30 par semaine, bilan individuel de mi-parcours (15 min), bilan final (30 min).
- **Preuve de progression** : chaque semaine l'apprenant exporte son **bilan** (page `#/bilan`, .txt ou .json) et le dépose sur Campus. Le formateur suit l'avancement sans envoi automatique de données.
- **Évaluation** : quiz de fin de niveau (Campus) et projet final noté sur grille (voir § 6).
- **Cohorte** : 8 à 20 apprenants (base de calcul : 15).

## 5. Plan de formation

Les références renvoient aux leçons (`cours/`) et missions déjà livrées.

### Niveau 1 · Premiers pas (semaines 1 à 4, ≈ 30 h)

| Sem. | Thème | Contenu | Webinaire |
|---|---|---|---|
| 1 | Terminal et méthode | Leçon 00, défi 00, règles d'engagement et preuves (SIM01) | Accueil, charte, démonstration du lab |
| 2 | Reconnaître | P1, P2, défis 02 et 03, SIM02 | Corriger une fiche de reconnaissance |
| 3 | Services et scans | P3, SIM03, défi 04 | Lire un scan, bruit et détection |
| 4 | Web de base | P4, SIM13, défi 05 ; quiz niveau 1 | Audit HTTP en direct |

### Niveau 2 · Auditer (semaines 5 à 10, ≈ 45 h)

| Sem. | Thème | Contenu | Webinaire |
|---|---|---|---|
| 5 | Vulnérabilités | P5, SIM05, défi 06 | Trier des résultats, faux positifs |
| 6 | Applications et API | P6, SIM14, défi 07 | Contrôle d'accès, revue de code |
| 7 | Sessions et SQL | SIM11, SIM15 (panneau Base SQL) | Une erreur qui en dit trop |
| 8 | Identités et énumération | P7, SIM04, SIM06 | Comptes, partages, privilèges |
| 9 | Disponibilité et périmètre | P9, SIM10, SIM12, défi 08 | Pare-feu et détection |
| 10 | Mobile, cloud, certificats | SIM17, SIM19, SIM20 | Auditer sans outil offensif |

### Niveau 3 · Défendre et investiguer (semaines 11 à 14, ≈ 30 h)

| Sem. | Thème | Contenu | Webinaire |
|---|---|---|---|
| 11 | Annuaire | P12, SIM21, défi 15 | Revue de comptes |
| 12 | Incident | P8, P13, SIM22, SIM23, défi 01 | Chronologie et purple team |
| 13 | Corriger, prioriser, restituer | P10, P11, défi 09 | Risque et rapport |
| 14 | Projet final | SIM24 + rapport Casebook | Restitutions orales |

Parcours **optionnels** pour les plus avancés (hors volume ci-dessus) : Parcours sécurité offensive SO1 à SO5, SIM08 (capture de trafic), SIM07/09/16/18 une fois validés.

## 6. Évaluation

- Quiz de fin de niveau : 10 questions, seuil indicatif 70 %.
- Projet final (SIM24 + rapport) noté sur 20 :
  - exactitude des constats : 8 points ;
  - qualité des preuves (commandes, empreintes, horodatage) : 4 points ;
  - mesures de défense proposées et priorisées : 5 points ;
  - clarté du rapport : 3 points.
- Attestation de suivi nominative (non certifiante) si présence aux webinaires ≥ 70 % (ou visionnage des enregistrements) et projet ≥ 10/20.

## 7. Plateforme Campus (http://localhost:8000)

Consultée avec votre session ouverte, en lecture seule (aucune modification, aucun identifiant saisi). Fonctions constatées :

- **Modules** composés de leçons et de QCM, regroupés en **formations** ; 20 modules existent déjà (TSSR, démonstration, CSE), ce qui donne le modèle à suivre.
- **Suivi des apprenants** par formation, avec avancement individuel et nombre de **certificats valides** : la page de suivi sert de tableau de bord du formateur.
- **Certificats** : à utiliser pour l'attestation de réussite non certifiante.
- Pages légales, politique de confidentialité et « Mes données personnelles » (RGPD) présentes.

Non constaté (à vérifier) : dépôt de fichiers par l'apprenant, planification des webinaires, forum ou messagerie.

| Besoin | Rôle proposé |
|---|---|
| Parcours, leçons, QCM | Campus : une formation « Cyber Déclic » avec 3 modules (un par niveau) et 14 sous-parties hebdomadaires ; les QCM de fin de niveau y sont saisis |
| Exercices pratiques | Simulateur CyberLab (page publique), lié depuis chaque semaine |
| Suivi | Page « Suivi des apprenants » de Campus + bilan exporté (`#/bilan`) |
| Webinaires | Lien de visio dans l'annonce de la semaine ; enregistrements en lien |
| Dépôt des bilans et rapports | Campus si disponible, sinon e-mail dédié |
| Attestation | Certificat Campus |

À vérifier avant la mise en ligne publique : accessibilité depuis Internet, sauvegarde, RGPD pour les apprenants extérieurs, droit d'auteur des enregistrements.

## 8. Estimation du temps de préparation (une fois)

| Tâche | Heures |
|---|---|
| Structuration des 14 semaines et fiches séance | 20 |
| Intégration des contenus sur Campus (liens, consignes, calendrier) | 30 |
| Quiz de fin de niveau (3 × 10 questions) et grille du projet | 15 |
| Supports de webinaires (14 séances) | 35 |
| Charte, règlement, livret d'accueil | 8 |
| Tests complets (parcours élève) | 12 |
| **Total** | **120 h** |

Les contenus pédagogiques eux-mêmes (40 leçons, 41 missions, 17 défis) sont déjà produits.

## 9. Coût

### Hypothèses

- Valorisation du temps du formateur : **80 € / heure** (repère de marché : un TJM de 700 à 850 € HT pour 7 h correspond à 100 à 120 € / h pour un profil expérimenté, avec des TJM plus bas en sous-traitance).
- Cohorte de **15** apprenants, 14 semaines.
- Hébergement Campus, visio et outils : **1 000 € par an** (hypothèse, à remplacer par vos coûts réels).
- Amortissement de la préparation sur **4 cohortes**.
- Qualiopi (nécessaire pour les financements publics) : **non chiffré ici**, coût d'audit à demander à un organisme certificateur.

### Coût par cohorte

| Poste | Heures | Coût |
|---|---|---|
| Webinaires (14 × 1 h 30) | 21 | 1 680 € |
| Préparation hebdomadaire (14 × 1 h) | 14 | 1 120 € |
| Permanence en ligne (14 × 1 h 30) | 21 | 1 680 € |
| Bilans individuels et corrections (15 × 1 h 30) | 22,5 | 1 800 € |
| **Animation** | **78,5** | **≈ 6 300 €** |
| Préparation amortie (120 h × 80 € ÷ 4) | 30 | 2 400 € |
| Outils et hébergement (1 000 € ÷ 4) | | 250 € |
| **Coût complet par cohorte** | | **≈ 8 950 €** |

Soit environ **600 € par apprenant** à 15 inscrits.

### Prix proposés (hors financement public)

| Offre | Durée | Prix retenu |
|---|---|---|
| **Cyber Déclic** (nom à confirmer ; ≈ 105 h) | 14 sem. | **990 €** (tarif réduit étudiants et demandeurs d'emploi : **690 €**) |

Repères du marché relevés en 2026 : formation débutant 75 h à 1 500 € (Jedha), 105 h à 1 800 € (via MaFormation), 130 h à 1 990 € (Studi), formations de 1 190 à 1 980 € non éligibles CPF (Esecad, Dawan). Ces offres sont souvent éligibles CPF, ce que la formation ne sera pas au lancement ; un prix inférieur se justifie.

### Équilibre par cohorte (offre complète à 990 €)

| Inscrits | Recettes | Résultat par cohorte |
|---|---|---|
| 8 | 7 920 € | − 1 030 € |
| 10 | 9 900 € | + 950 € |
| 12 | 11 880 € | + 2 930 € |
| 15 | 14 850 € | + 5 900 € |
| 20 (coût d'animation en hausse non compté) | 19 800 € | + 10 850 € environ |

Seuil de rentabilité : **9 apprenants** au tarif plein (≈ 8 950 ÷ 990) ; avec un tarif réduit à 690 € pour une partie des inscrits, viser **10 à 11 apprenants**.

Le résultat est une **valorisation de votre temps**, avant cotisations, impôts et TVA. Le régime de TVA de la formation et les cotisations sont à valider avec votre comptable.

## 10. Financement et conformité

- **Décision** : ni CPF ni Qualiopi pour le moment. Le CPF exige une certification inscrite au RNCP ou au Répertoire spécifique ; France Travail et les OPCO demandent en général un organisme certifié Qualiopi. Ces pistes restent possibles plus tard.
- **Paiement par les particuliers** : possible sans Qualiopi, avec programme et conditions remis avant inscription, contrat de formation, délai de rétractation de 14 jours et règlement intérieur. À faire valider par votre comptable ou conseil (régime de TVA, mentions obligatoires).
- **Communication** : ne pas laisser croire que la formation est finançable CPF ; parler d'« attestation de formation ».

## 11. Calendrier proposé

| Étape | Durée |
|---|---|
| Validation du cadrage (nom, offre, prix) | 1 semaine |
| Préparation (120 h) | 4 à 5 semaines |
| Cohorte pilote gratuite ou à tarif symbolique (8 apprenants), retours | 14 semaines |
| Ajustements, ouverture commerciale | 2 semaines |

## 12. Risques et parades

| Risque | Parade |
|---|---|
| Décrochage des apprenants (fréquent à distance) | Webinaire hebdomadaire, relance si bilan non déposé, binômes |
| Niveau d'entrée hétérogène | Niveau 1 complet ; module de remise à niveau Linux en option |
| Campus indisponible | Contenus accessibles depuis le simulateur public ; repli sur messagerie |
| Usage abusif des techniques | Charte signée, lab fictif, aucun outil offensif réel |
| Charge de suivi sous-estimée | Plafond de 20 apprenants, permanence cadrée |

## 13. Questions ouvertes

1. Nom définitif : Cyber Déclic (recommandé) ou une des alternatives ?
2. Campus : dépôt de fichiers, visio, forum disponibles ou à prévoir ?
3. Date de la cohorte pilote et nombre de places ?
4. Pilote gratuit ou à tarif symbolique ?

## Sources des repères de marché

- Panorama des noms de formations : Studi, Liora, Guardia, OpenClassrooms, Deloitte Cyber Academy, SysDream (consultés en 2026)
- Jedha, formation cybersécurité à distance : https://www.jedha.co/formation-cybersecurite/formation-cybersecurite-100-en-ligne
- MaFormation, fondamentaux de la cybersécurité (105 h) : https://www.maformation.fr/formation/les-fondamentaux-de-la-cybersecurite-formation-pour-les-debutants-204310
- Studi, participer à la gestion de la cybersécurité : https://www.studi.com/fr/formation/infrastructures-et-systemes/gestion-cybersecurite
- Blog du Modérateur, sélection de formations : https://www.blogdumoderateur.com/selection-formation-cybersecurite-224/
- Abby, tarif horaire formateur : https://abby.fr/guide/micro-entreprise/tarif-horaire-formateur-auto-entrepreneur
