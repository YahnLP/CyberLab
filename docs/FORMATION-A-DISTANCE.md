# Formation à distance : plan, durée et coût (proposition)

Statut : **proposition à valider**. Les chiffres de coût sont des estimations posées sur des hypothèses explicites, à ajuster.

## 1. Nom

Trois pistes (vérifier la disponibilité auprès de l'INPI avant usage) :

| Nom | Idée |
|---|---|
| **Cap Cyber** (recommandé) | Court, parlant pour des reconversions : un cap à franchir, de la découverte à la pratique |
| Cyber Pratique | Insiste sur la pratique en laboratoire |
| CyberLab Campus | Rappelle le lab et la plateforme Campus, moins distinctif |

Sous-titre proposé : *S'initier à la cybersécurité par la pratique, avec un formateur et un laboratoire fictif*.

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
- **Webinaires** : 14 séances de 1 h 30 (≈ 21 h), une par semaine, en soirée, **enregistrées**. Contenu : démonstration, correction commentée d'une mission, questions, point de motivation.
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

### Option courte : **Cap Cyber Découverte** (niveau 1 seul)

4 semaines, ≈ 30 h, 4 webinaires. Entrée en matière pour curieux et étudiants, avec passerelle vers le parcours complet.

## 6. Évaluation

- Quiz de fin de niveau : 10 questions, seuil indicatif 70 %.
- Projet final (SIM24 + rapport) noté sur 20 :
  - exactitude des constats : 8 points ;
  - qualité des preuves (commandes, empreintes, horodatage) : 4 points ;
  - mesures de défense proposées et priorisées : 5 points ;
  - clarté du rapport : 3 points.
- Attestation de suivi nominative (non certifiante) si présence aux webinaires ≥ 70 % (ou visionnage des enregistrements) et projet ≥ 10/20.

## 7. Plateforme Campus (http://localhost:8000)

Constat : la page est atteignable depuis le navigateur de l'ordinateur et affiche une **connexion** (comptes créés par l'administrateur). Le contenu interne n'a pas été consulté : aucun identifiant n'a été saisi. Ce qui est supposé, à confirmer :

| Besoin | Rôle proposé |
|---|---|
| Parcours, calendrier, annonces | Campus |
| Webinaires | Lien de visio planifié dans Campus, enregistrements déposés |
| Exercices pratiques | Simulateur CyberLab (page publique, hors Campus) lié depuis chaque semaine |
| Dépôt des bilans et rapports | Campus (dépôt de fichiers) |
| Forum et permanence | Campus |
| Quiz | Campus, si disponible ; sinon quiz dans le simulateur |

À vérifier avant la mise en ligne : accessibilité, sauvegarde, RGPD (données des apprenants), droit d'auteur des enregistrements.

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

| Offre | Durée | Prix proposé |
|---|---|---|
| **Cap Cyber** (14 semaines, ≈ 105 h) | 14 sem. | **990 €** (tarif réduit étudiants et demandeurs d'emploi : 690 €) |
| **Cap Cyber Découverte** (≈ 30 h) | 4 sem. | **290 €** |

Repères du marché relevés en 2026 : formation débutant 75 h à 1 500 € (Jedha), 105 h à 1 800 € (via MaFormation), 130 h à 1 990 € (Studi), formations de 1 190 à 1 980 € non éligibles CPF (Esecad, Dawan). Ces offres sont souvent éligibles CPF, ce que Cap Cyber ne sera pas au lancement ; un prix inférieur se justifie.

### Équilibre par cohorte (offre complète à 990 €)

| Inscrits | Recettes | Résultat par cohorte |
|---|---|---|
| 8 | 7 920 € | − 1 030 € |
| 10 | 9 900 € | + 950 € |
| 12 | 11 880 € | + 2 930 € |
| 15 | 14 850 € | + 5 900 € |
| 20 (coût d'animation en hausse non compté) | 19 800 € | + 10 850 € environ |

Seuil de rentabilité : **9 apprenants** (≈ 8 950 ÷ 990). Découverte : coût d'animation ≈ 24 h (≈ 1 900 €), seuil ≈ 7 apprenants à 290 €.

Le résultat est une **valorisation de votre temps**, avant cotisations, impôts et TVA. Le régime de TVA de la formation et les cotisations sont à valider avec votre comptable.

## 10. Financement et conformité

- **CPF** : exige une certification inscrite au RNCP ou au Répertoire spécifique ; non visé au lancement. Piste ultérieure : faire reconnaître un bloc de compétences ou s'adosser à un organisme certificateur.
- **France Travail et OPCO** : exigent en général un organisme certifié **Qualiopi**. À étudier si la cible reconversion en dépend.
- **Paiement par les particuliers** : possible sans Qualiopi, avec contrat de formation, délai de rétractation de 14 jours, règlement intérieur et programme remis avant inscription.

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

1. Nom retenu : Cap Cyber ou autre ?
2. Offre : une seule (14 semaines) ou deux (avec Découverte) ?
3. Fonctions réelles de Campus (dépôt de fichiers, quiz, visio, forum) ?
4. Visez-vous Qualiopi et le CPF à moyen terme ?
5. Rythme des webinaires : soirée (18 h 30) ou autre créneau ?

## Sources des repères de marché

- Jedha, formation cybersécurité à distance : https://www.jedha.co/formation-cybersecurite/formation-cybersecurite-100-en-ligne
- MaFormation, fondamentaux de la cybersécurité (105 h) : https://www.maformation.fr/formation/les-fondamentaux-de-la-cybersecurite-formation-pour-les-debutants-204310
- Studi, participer à la gestion de la cybersécurité : https://www.studi.com/fr/formation/infrastructures-et-systemes/gestion-cybersecurite
- Blog du Modérateur, sélection de formations : https://www.blogdumoderateur.com/selection-formation-cybersecurite-224/
- Abby, tarif horaire formateur : https://abby.fr/guide/micro-entreprise/tarif-horaire-formateur-auto-entrepreneur
