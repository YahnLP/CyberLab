# Cadrage des modules SIM07, SIM09, SIM16 et SIM18

Statut : **proposition à valider par le formateur** avant toute écriture. Aucun de ces modules n'est réalisé.

## Principe commun

- Le simulateur reste **100 % fictif, hors ligne et défensif** : on analyse des données fournies (journaux, inventaires, fichiers inertes), on ne construit aucun outil d'attaque.
- Chaque mission garde le format du Parcours pentest : constats (face Red) puis mesure de défense (face Blue), contrôle sur des faits tirés du jumeau numérique, résolution testée avec les seuls outils simulés.
- Ce qui reste **volontairement hors périmètre** : capture ou cassage de secrets Wi-Fi, charges ou kits de phishing, malwares fonctionnels, commandes d'écriture sur des équipements industriels. Ces sujets sont enseignés par leurs **effets observables** et leurs **contre-mesures**.

## SIM07 · Analyse de fichiers suspects (inerte)

| Élément | Proposition |
|---|---|
| Idée | Triage d'un échantillon **fictif et inerte** (fichier texte qui imite des artefacts) : empreintes, chaînes lisibles, indicateurs de compromission (IoC) |
| SIM07-1 | Triage : type de fichier, empreintes SHA-256 et MD5 comparées à une liste d'IoC fournie, chaînes révélatrices (adresses, domaines) extraites avec `strings`, `grep`, `sha256sum` |
| SIM07-2 | Détection : rédiger une règle de détection simple (motifs et seuil) puis mesurer, sur un jeu de fichiers fictifs, les faux positifs et faux négatifs |
| Face Blue | Isolation, blocage des IoC, chasse sur le parc, sauvegardes saines |
| Leçon | SIM07-analyse-fichiers-suspects (1 h 15) |
| Outils à ajouter | `strings`, `file` (simulés) ; `md5sum` |
| Charge estimée | 2 missions, 1 leçon, ~0,5 jour de développement |
| Risque | Faible : aucun code exécutable, aucune charge utile |

## SIM09 · Ingénierie sociale : reconnaître et mesurer

| Élément | Proposition |
|---|---|
| Idée | Côté **sensibilisation et détection** : lire des messages fictifs, mesurer une campagne de sensibilisation autorisée |
| SIM09-1 | Analyse de messages fictifs : en-têtes, résultats SPF/DKIM/DMARC, liens trompeurs, domaines proches ; classer légitime ou suspect |
| SIM09-2 | Campagne de sensibilisation fictive : taux d'ouverture, de clic, de signalement par service ; repérer les services à former en priorité |
| Face Blue | Filtrage, DMARC en rejet, procédure de signalement, formation ciblée |
| Leçon | SIM09-ingenierie-sociale-defense (1 h 15) |
| Charge estimée | 2 missions, 1 leçon, ~0,5 jour |
| Risque | Faible : on **n'écrit pas** de message d'hameçonnage ; seuls des messages fictifs à analyser sont fournis |

## SIM16 · Réseaux sans fil : audit de configuration

| Élément | Proposition |
|---|---|
| Idée | Audit **défensif** à partir d'un inventaire fictif de bornes et de clients |
| SIM16-1 | Inventaire des bornes : chiffrement (ouvert, WPA2, WPA3), WPS activé, SSID invités non isolés, firmware ancien ; trier par criticité |
| SIM16-2 | Détection d'une borne **non autorisée** : comparer l'inventaire observé à la liste autorisée (SSID, adresse matérielle, canal) |
| Face Blue | WPA3 ou WPA2-Enterprise, WPS désactivé, VLAN invités, surveillance des bornes pirates |
| Leçon | SIM16-sans-fil-audit (1 h 15) |
| Charge estimée | 2 missions, 1 leçon, ~0,5 jour |
| Risque | Moyen : à rester strictement sur des inventaires. **Exclus** : captures d'authentification, cassage de clés, désauthentification |

## SIM18 · IoT et OT : inventaire et segmentation

| Élément | Proposition |
|---|---|
| Idée | Cartographier des équipements connectés fictifs et vérifier leur isolement |
| SIM18-1 | Inventaire : équipements, protocoles, firmware, services exposés ; repérer ceux qui ne devraient pas être joignables depuis le réseau bureautique |
| SIM18-2 | Règles de segmentation : relire des règles de pare-feu entre zones (bureautique, production, invités) et relever les flux interdits |
| Face Blue | Zones et conduits, passerelle contrôlée, mise à jour planifiée, surveillance passive |
| Leçon | SIM18-iot-ot-segmentation (1 h 15) |
| Charge estimée | 2 missions, 1 leçon, ~0,5 jour |
| Risque | Moyen : lecture seule. **Exclus** : écriture sur des automates, commandes de pilotage, exploitation de protocoles industriels |

## Décisions attendues

1. Valider, ajuster ou écarter chacun des quatre modules.
2. Confirmer la règle « effets observables et contre-mesures, jamais d'outil offensif ».
3. Ordre souhaité : proposition SIM09, SIM07, SIM16, SIM18 (du moins sensible au plus sensible).

Total estimé : 8 missions, 4 leçons, environ 2 jours de développement et de test.
