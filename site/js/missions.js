// Missions du parcours pentest (SIM) : chacune génère son jumeau numérique à partir d'une graine, puis se corrige
// sur les FAITS du jumeau (pas sur une commande précise) avec une face Red (observer) et une face Blue (défendre).
import { makeTwin, rng, hostByIp } from './twin.js';
import { makeTools, TOOL_NAMES } from './tools.js';
import { sha256 } from './sha256.js';
const given = (files, key) => { const t = files['reponses.txt']; if (t === undefined) return ''; for (const l of t.split('\n')) if (l.startsWith(key + '=')) return l.slice(key.length + 1).replace(/^\s+|\s+$/g, ''); return ''; };
const normList = v => [...new Set(v.toLowerCase().replace(/[èé]/g, 'e').replace(/\s+/g, '').split(',').filter(Boolean))].sort().join(',');
const normTxt = v => v.toLowerCase().replace(/\s+/g, ' ').trim();
const NODOT = v => v.replace(/\.$/, '');
// Question de défense à choix : l'ordre des propositions dépend de la graine (la bonne lettre change).
function defense(tw, salt, good, bads) { const R = rng(tw.seed * 31 + salt); const all = R.shuffle([good, ...bads]); const L = 'abc'; return { text: all.map((t, i) => `    ${L[i]}) ${t}`).join('\n'), correct: L[all.indexOf(good)] }; }
const tmpl = keys => `# Une ligne par constat : cle=valeur (sans espace autour du signe =)\n` + keys.map(k => `${k}=`).join('\n') + '\n';
const BASE_FILES = tw => ({});
const TOOLS_NOTE = 'Outils simulés disponibles : ping, host, dig, nslookup, nmap, curl, smbclient, snmpget, snmpwalk (cibles fictives, aucun trafic réel).';
const PTS = (n) => n;

// kind : 'set' (liste normalisée), 'txt' (texte normalisé), 'num' (exact)
const ask = (key, kind, expected) => ({ key, kind, expected });
function checker(title, items, defOpt) {
  return (tw, files) => {
    const out = []; let fail = false; const say = (k, t) => out.push({ k, t });
    say('phase', '1. OBSERVER (Red) · constats chiffrés');
    for (const it of items(tw, files)) { const v = given(files, it.key); if (!v) { say('ko', `${it.key} : non renseigné`); fail = true; continue; }
      const ok = it.kind === 'set' ? normList(v) === normList(it.expected) : it.kind === 'num' ? v === String(it.expected) : normTxt(v) === normTxt(String(it.expected));
      if (ok) say('ok', it.key); else { say('ko', `${it.key} : valeur incorrecte`); fail = true; } }
    say('phase', '2. DÉFENDRE (Blue) · mesure prioritaire');
    const d = defOpt(tw), v = given(files, 'defense').toLowerCase(); if (!v) { say('ko', 'defense : non renseigné (a, b ou c)'); fail = true; } else if (v === d.correct) say('ok', 'defense'); else { say('ko', 'defense : ce n\'est pas la mesure la plus efficace et la moins risquée'); fail = true; }
    return { ok: !fail, lines: out };
  };
}
const head = (tw) => `${tw.orgName.toUpperCase()} — domaine ${tw.domain}, plage interne ${tw.net}.0/24 (votre poste : poste-audit, ${tw.net}.250).\nTout est fictif : cibles inventées, aucun trafic réel.\n${TOOLS_NOTE}\n`;
const faceBlue = (d) => `\nFACE DÉFENSE (Blue) — defense=a, b ou c : quelle est la mesure la plus efficace et la moins risquée ?\n${d.text}\n`;

const M = [];
// ---------------------------------------------------------------- SIM02
{
  const d1 = tw => defense(tw, 1, `Supprimer l'enregistrement DNS ${tw.hidden} et arrêter le service qu'il désigne s'il est inutile`, ['Laisser en place : un nom peu connu n\'est pas exposé', 'Changer le nom du sous-domaine pour le rendre plus discret']);
  M.push({ id: 'SIM02-1', title: 'Reconnaissance : noms publics du domaine', module: 'SIM02 · Reconnaissance et empreinte', points: 30, difficulty: 1, lesson: 'SIM02-reconnaissance-empreinte', code: 'SIM02·1', duree: '35 min',
    setup: tw => ({ 'reponses.txt': tmpl(['sous_domaines_actifs', 'ip_www', 'sous_domaine_oublie', 'defense']), 'sous-domaines.txt': tw.subdomainWords.join('\n') + '\n' }),
    enonce: tw => `${head(tw)}
MISSION : recensez ce que ${tw.orgName} expose sur Internet.
Le DSI indique trois services officiels : www, mail, vpn.

À FAIRE
  sous-domaines.txt   candidats à tester (un par ligne)
  1 sous_domaines_actifs   les noms (sans le domaine) qui existent vraiment
  2 ip_www                 l'adresse publique de www
  3 sous_domaine_oublie    le nom actif qui n'est pas dans la liste officielle
${faceBlue(d1(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['host NOM.' + 'DOMAINE interroge le DNS : « has address » = le nom existe, « not found » = il n\'existe pas.', 'Une boucle for sur sous-domaines.txt teste tous les candidats d\'un coup.', 'dig +short NOM.DOMAINE n\'affiche que l\'adresse.', 'Un nom actif absent de la liste officielle est un actif oublié : le candidat le plus risqué.', 'Le DNS est une carte de l\'exposition : on supprime ce qui ne sert plus.'],
    check: checker('SIM02-1', tw => [ask('sous_domaines_actifs', 'set', tw.subdomainWords.filter(w => tw.dns.some(r => r.type === 'A' && r.name === `${w}.${tw.domain}`)).join(',')), ask('ip_www', 'txt', tw.H.www.pub), ask('sous_domaine_oublie', 'txt', tw.hidden)], d1), finish: 'Reconnaissance passive terminée : vous avez retrouvé l\'actif oublié.' });
  const d2 = tw => defense(tw, 2, 'Masquer la version, ajouter les en-têtes de sécurité manquants et retirer l\'accès public à l\'index exposé', ['Interdire les robots dans robots.txt et ne rien changer d\'autre', 'Remplacer le certificat TLS par un certificat plus long']);
  M.push({ id: 'SIM02-2', title: 'Reconnaissance : en-têtes et fuites d\'un serveur web', module: 'SIM02 · Reconnaissance et empreinte', points: 35, difficulty: 2, lesson: 'SIM02-reconnaissance-empreinte', code: 'SIM02·2', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['version_serveur', 'en_tetes_manquants', 'technologie_exposee', 'chemin_fuite', 'fichier_expose', 'defense']) }),
    enonce: tw => `${head(tw)}
MISSION : que révèle le site web http://www.${tw.domain}/ sans l'attaquer ?

À FAIRE (lecture seule)
  1 version_serveur        valeur de l'en-tête Server, telle qu'affichée
  2 en_tetes_manquants     en-têtes de sécurité absents parmi :
                           Strict-Transport-Security, X-Frame-Options,
                           X-Content-Type-Options, Content-Security-Policy
  3 technologie_exposee    valeur de X-Powered-By, ou « aucune »
  4 chemin_fuite           chemin déclaré dans robots.txt dont le contenu est
                           lisible publiquement (une liste de fichiers)
  5 fichier_expose         nom du fichier sensible visible dans cette liste
${faceBlue(d2(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['curl -I affiche seulement les en-têtes de la réponse.', 'curl http://www.DOMAINE/robots.txt : robots.txt liste ce qu\'on voudrait cacher, donc ce qui mérite un regard.', 'Testez chaque chemin avec curl -i : le code 200 avec une liste de fichiers est une fuite, 401 est protégé.', 'En-tête manquant = absent de la réponse. Comparez avec la liste de l\'énoncé.', 'Une version précise dans Server aide l\'attaquant à choisir ses outils.'],
    check: checker('SIM02-2', tw => [ask('version_serveur', 'txt', tw.web.server), ask('en_tetes_manquants', 'set', tw.web.missing.join(',')), ask('technologie_exposee', 'txt', tw.web.poweredBy || 'aucune'), ask('chemin_fuite', 'txt', tw.web.leakPath), ask('fichier_expose', 'txt', tw.web.leakFile)], d2), finish: 'Surface web lue sans rien casser : vous avez trouvé la fuite.' });
  const d3 = tw => defense(tw, 3, 'Passer la politique SPF en échec strict (-all), puis ajouter DKIM et DMARC', ['Ajouter une deuxième adresse IP autorisée dans le SPF', 'Supprimer l\'enregistrement MX pour masquer le serveur de messagerie']);
  M.push({ id: 'SIM02-3', title: 'Reconnaissance : messagerie et enregistrements SPF', module: 'SIM02 · Reconnaissance et empreinte', points: 25, difficulty: 2, lesson: 'SIM02-reconnaissance-empreinte', code: 'SIM02·3', duree: '30 min',
    setup: tw => ({ 'reponses.txt': tmpl(['serveur_mail', 'priorite_mx', 'filtrage_spf', 'ip_autorisee_spf', 'defense']) }),
    enonce: tw => `${head(tw)}
MISSION : qui reçoit et qui peut envoyer le courrier de ${tw.domain} ?

À FAIRE
  1 serveur_mail        nom complet (FQDN, sans point final) du serveur de messagerie
  2 priorite_mx         priorité de cet enregistrement MX (nombre)
  3 filtrage_spf        « strict » (-all), « souple » (~all) ou « aucun » (+all)
  4 ip_autorisee_spf    adresse IP explicitement autorisée par le SPF (ip4:)
${faceBlue(d3(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['host -t MX DOMAINE ou dig MX DOMAINE donnent le serveur de messagerie.', 'Le SPF est un enregistrement TXT : dig TXT DOMAINE.', 'Le mécanisme final -all refuse, ~all accepte mais marque, +all autorise tout le monde.', 'Un SPF en +all permet à n\'importe qui d\'usurper le domaine.'],
    check: checker('SIM02-3', tw => [ask('serveur_mail', 'txt', NODOT(tw.dns.find(r => r.type === 'MX').value.split(' ')[1])), ask('priorite_mx', 'num', 10), ask('filtrage_spf', 'txt', { '-all': 'strict', '~all': 'souple', '+all': 'aucun' }[tw.spfKind]), ask('ip_autorisee_spf', 'txt', tw.dns.find(r => r.name === 'mail.' + tw.domain).value)], d3), finish: 'Messagerie cartographiée : vous savez qui peut usurper le domaine.' });
}
// ---------------------------------------------------------------- SIM03
{
  const inv = tw => 'hote;ip;role;ports_attendus\n' + tw.inventory.map(h => `${h.name};${h.ip};${h.role};${h.ports.join(',') || '-'}`).join('\n') + '\n';
  const d4 = tw => defense(tw, 4, 'Identifier le propriétaire de l\'équipement inconnu, l\'isoler dans un réseau dédié et mettre l\'inventaire à jour', ['Ignorer : une imprimante ne présente aucun risque', 'Éteindre toute la plage réseau jusqu\'à nouvel ordre']);
  M.push({ id: 'SIM03-1', title: 'Scan : découvrir les hôtes actifs', module: 'SIM03 · Scan réseau', points: 30, difficulty: 1, lesson: 'SIM03-scan-reseau', code: 'SIM03·1', duree: '35 min',
    setup: tw => ({ 'reponses.txt': tmpl(['hotes_actifs', 'hote_inconnu', 'hote_absent', 'defense']), 'inventaire.csv': inv(tw) }),
    enonce: tw => `${head(tw)}
MISSION : l'inventaire (inventaire.csv) est-il fidèle à la réalité du réseau ?

À FAIRE
  1 hotes_actifs   nombre d'hôtes qui répondent, SANS compter votre poste
  2 hote_inconnu   adresse IP de l'hôte actif absent de l'inventaire
  3 hote_absent    nom de l'hôte inventorié qui ne répond plus
${faceBlue(d4(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['nmap -sn 192.168.X.0/24 teste toute la plage sans scanner les ports.', 'Comparez la liste des adresses actives avec la colonne ip de l\'inventaire.', 'Votre poste (poste-audit, .250) apparaît dans la liste : ne le comptez pas.', 'Un hôte actif non inventorié est un équipement que personne ne surveille.'],
    check: checker('SIM03-1', tw => [ask('hotes_actifs', 'num', tw.hosts.filter(h => h.up && !h.self).length), ask('hote_inconnu', 'txt', tw.hosts.find(h => h.shadow).ip), ask('hote_absent', 'txt', tw.hosts.find(h => !h.up).name)], d4), finish: 'Écarts d\'inventaire trouvés : un équipement inconnu et un hôte disparu.' });
  const d5 = tw => defense(tw, 5, 'Limiter l\'exposition : n\'ouvrir que les ports utiles et filtrer le reste au pare-feu', ['Fermer uniquement le port 22 sur tous les serveurs', 'Désactiver la journalisation pour réduire le bruit']);
  M.push({ id: 'SIM03-2', title: 'Scan : cartographier les ports du serveur web', module: 'SIM03 · Scan réseau', points: 35, difficulty: 2, lesson: 'SIM03-scan-reseau', code: 'SIM03·2', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['ports_ouverts_www', 'version_web', 'version_ssh_www', 'defense']) }),
    enonce: tw => `${head(tw)}
MISSION : établissez la carte complète des ports ouverts du serveur web interne
www (${tw.H.www.ip}).

À FAIRE
  1 ports_ouverts_www   tous les ports TCP ouverts, séparés par des virgules
  2 version_web         produit et version du service sur le port 80 (ex : nginx 1.18.0)
  3 version_ssh_www     version OpenSSH (ex : 8.4p1)
${faceBlue(d5(tw))}
Attention : un scan par défaut ne teste que les 1000 ports les plus courants.
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['nmap ADRESSE teste les ports courants ; -p- teste les 65 535 ports.', '-sV demande la version du service derrière chaque port.', 'Un port ouvert inattendu peut être hors des ports courants : relancez avec -p-.', 'Notez la version exacte : sans elle, on ne peut pas dire si le service est à jour.'],
    check: checker('SIM03-2', tw => [ask('ports_ouverts_www', 'set', tw.H.www.ports.map(p => p.port).join(',')), ask('version_web', 'txt', `${tw.H.www.ports.find(p => p.port === 80).product} ${tw.H.www.ports.find(p => p.port === 80).version}`), ask('version_ssh_www', 'txt', tw.H.www.ports.find(p => p.port === 22).version.split(' ')[0])], d5), finish: 'Carte des ports complète, y compris hors des ports courants.' });
  const d6 = tw => defense(tw, 6, 'Fermer ou filtrer le port non prévu, puis mettre à jour le service obsolète en planifiant un retest', ['Passer toutes les versions en « dernière version » le jour même sans test', 'Masquer les bannières et conserver les versions actuelles']);
  M.push({ id: 'SIM03-3', title: 'Scan : écart avec l\'inventaire et la politique de versions', module: 'SIM03 · Scan réseau', points: 40, difficulty: 3, lesson: 'SIM03-scan-reseau', code: 'SIM03·3', duree: '50 min',
    setup: tw => ({ 'reponses.txt': tmpl(['hote_port_inattendu', 'port_inattendu', 'hote_obsolete', 'service_obsolete', 'defense']), 'inventaire.csv': inv(tw), 'politique-versions.txt': '# version minimale exigée par produit\n' + tw.policy.map(p => `${p[0]} >= ${p[1]}`).join('\n') + '\n' }),
    enonce: tw => `${head(tw)}
MISSION : comparez la réalité (scan) à l'inventaire (ports attendus) et à la
politique de versions des serveurs gw, www, db et files.

À FAIRE
  1 hote_port_inattendu   le serveur qui expose un port NON prévu dans l'inventaire
  2 port_inattendu        ce numéro de port
  3 hote_obsolete         le serveur dont un service est sous le minimum exigé
  4 service_obsolete      le produit concerné (OpenSSH, nginx, Apache, MySQL ou Samba)
${faceBlue(d6(tw))}
Fichiers : inventaire.csv, politique-versions.txt
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['nmap -sV -p- ADRESSE donne tous les ports et leurs versions (un serveur à la fois).', 'Comparez les ports trouvés à la colonne ports_attendus de l\'inventaire.', 'Comparez chaque version à politique-versions.txt : une version inférieure au minimum est obsolète.', 'Un seul serveur a un port en trop, un seul service est sous le minimum.', 'Le scan est bruyant : côté défense, il laisse des traces (onglet Vue du lab).'],
    check: checker('SIM03-3', tw => [ask('hote_port_inattendu', 'txt', tw.exHost), ask('port_inattendu', 'num', tw.exPort.port), ask('hote_obsolete', 'txt', tw.outdated.host), ask('service_obsolete', 'txt', tw.outdated.product)], d6), finish: 'Écarts relevés : un port en trop et un service sous le minimum.' });
}
// ---------------------------------------------------------------- SIM01 : cadrage et preuves
const candidates = tw => { const mail = tw.scope.thirdParty; return [...tw.hosts.filter(h => h.up && !h.self).map(h => h.ip), tw.H.www.pub, mail]; };
const mandat = tw => `MANDAT D'AUDIT — ${tw.orgName} (${tw.domain})
Signé le 02/11/2026 par la direction. Mission : test d'intrusion externe et interne.

1. Périmètre autorisé
   - Plage interne ${tw.net}.0/24
   - Site vitrine : adresse publique ${tw.H.www.pub} (serveur web www)
2. Exclusions
   - ${tw.scope.excluded} : base de données de production, AUCUN test, même passif
   - Tout système appartenant à un tiers (hébergeur de messagerie, fournisseur) :
     adresse ${tw.scope.thirdParty} (serveur de messagerie hébergé)
3. Fenêtre de tests
   - Du lundi au vendredi, de ${tw.scope.start}h00 à 0${tw.scope.end}h00
4. Interdits
   - Déni de service, hameçonnage du personnel, modification ou suppression de données
5. Obligations
   - Journal des actions horodaté ; toute preuve conservée avec son empreinte SHA-256
   - Arrêt immédiat et appel du DSI en cas d'impact sur la production
`;
{
  const d1 = tw => defense(tw, 11, 'Refuser de tester ce serveur tant que l\'hébergeur n\'a pas donné son autorisation écrite', ['Le tester la nuit pour limiter le bruit puisque le client le demande', 'Le tester uniquement avec des outils passifs']);
  M.push({ id: 'SIM01-1', title: 'Cadrage : lire le mandat et tenir le périmètre', module: 'SIM01 · Cadrage et preuves', points: 25, difficulty: 1, lesson: 'SIM01-cadrage-preuves', code: 'SIM01·1', duree: '25 min',
    setup: tw => ({ 'reponses.txt': tmpl(['cibles_autorisees', 'exclusion_production', 'heure_debut', 'defense']), 'mandat.txt': mandat(tw), 'cibles-candidates.txt': candidates(tw).join('\n') + '\n' }),
    enonce: tw => `${head(tw)}
MISSION : avant tout test, vérifiez ce que le mandat autorise. Aucun outil réseau
n'est nécessaire : tout se joue dans la lecture.

À FAIRE
  mandat.txt             le mandat signé par le client
  cibles-candidates.txt  adresses que l'équipe voudrait tester
  1 cibles_autorisees   les adresses candidates AUTORISÉES, séparées par des virgules
  2 exclusion_production l'adresse interne exclue (base de production)
  3 heure_debut          heure de début de la fenêtre de tests (nombre, ex : 20)
${faceBlue(d1(tw))}
Le client demande en plus de « jeter un œil » au serveur de messagerie hébergé chez un tiers.
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['Une cible est autorisée si elle est dans le périmètre ET qu\'aucune exclusion ne la touche.', 'Une adresse qui appartient à un tiers est exclue même si elle semble liée au client.', 'Regardez l\'article 2 du mandat : une adresse interne y est interdite, même en passif.', 'La fenêtre est écrite au point 3 : prenez l\'heure de début.'],
    check: checker('SIM01-1', tw => [ask('cibles_autorisees', 'set', candidates(tw).filter(i => i !== tw.scope.excluded && i !== tw.scope.thirdParty).join(',')), ask('exclusion_production', 'txt', tw.scope.excluded), ask('heure_debut', 'num', tw.scope.start)], d1), finish: 'Périmètre tenu : seules les cibles du mandat seront touchées, et vous savez pourquoi les autres sont exclues.' });
  const okPreuve = (tw, f) => { const t = f['preuve-scan.txt']; return t !== undefined && t.includes(`Nmap scan report for`) && t.includes(tw.H.www.ip) && /\n\d+\/tcp\s+open/.test(t) && t.includes('Nmap done'); };
  const d2 = tw => defense(tw, 12, 'Calculer l\'empreinte SHA-256 dès la capture et la noter dans le journal : toute modification ultérieure se verra', ['Renommer le fichier avec la date : le nom suffit à prouver l\'intégrité', 'Conserver la preuve dans un tableur modifiable pour pouvoir la mettre en forme']);
  M.push({ id: 'SIM01-2', title: 'Preuves : capturer, dater et sceller un résultat de scan', module: 'SIM01 · Cadrage et preuves', points: 35, difficulty: 2, lesson: 'SIM01-cadrage-preuves', code: 'SIM01·2', duree: '35 min',
    setup: tw => ({ 'reponses.txt': tmpl(['nb_ports_ouverts', 'empreinte', 'defense']) }),
    enonce: tw => `${head(tw)}
MISSION : le serveur web www (${tw.H.www.ip}) est dans le périmètre. Produisez une
preuve exploitable de son exposition.

À FAIRE
  1. Scannez www avec détection de versions et enregistrez la sortie COMPLÈTE dans
     preuve-scan.txt (redirection > ).
  2. Scellez la preuve : calculez son empreinte SHA-256.
  3. Ne modifiez plus preuve-scan.txt ensuite.
  1 nb_ports_ouverts   nombre de ports ouverts dans la preuve
  2 empreinte          empreinte SHA-256 de preuve-scan.txt (64 caractères)
${faceBlue(d2(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['nmap -sV ADRESSE > preuve-scan.txt enregistre la sortie dans un fichier.', 'sha256sum preuve-scan.txt affiche l\'empreinte (64 caractères hexadécimaux).', 'Comptez les lignes « open » du fichier : grep -c open preuve-scan.txt.', 'Si vous modifiez le fichier après avoir calculé l\'empreinte, elle ne correspond plus.'],
    check: checker('SIM01-2', (tw, f) => okPreuve(tw, f) ? [ask('nb_ports_ouverts', 'num', (f['preuve-scan.txt'].match(/^\d+\/tcp\s+open/gm) || []).length), ask('empreinte', 'txt', sha256(f['preuve-scan.txt']))] : [ask('nb_ports_ouverts', 'num', 'preuve-scan.txt valide manquante'), ask('empreinte', 'txt', 'preuve-scan.txt valide manquante')], d2), finish: 'Preuve scellée : n\'importe qui peut vérifier qu\'elle n\'a pas été modifiée depuis la capture.' });
}
// ---------------------------------------------------------------- SIM04 : énumération SMB / SNMP
{
  const anonShares = tw => tw.smb.shares.filter(s => s.anon).map(s => s.name);
  const d1 = tw => defense(tw, 41, 'Désactiver l\'accès anonyme (guest) sur les partages, exiger une authentification et vérifier les droits par groupe', ['Renommer le partage pour qu\'il soit moins évident', 'Cacher le partage de la liste sans modifier ses droits']);
  M.push({ id: 'SIM04-1', title: 'Énumération SMB : partages ouverts sans mot de passe', module: 'SIM04 · Énumération SMB et SNMP', points: 35, difficulty: 2, lesson: 'SIM04-enumeration-smb-snmp', code: 'SIM04·1', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['version_samba', 'partages_anonymes', 'partage_sensible', 'fichier_sensible', 'defense']) }),
    enonce: tw => `${head(tw)}
MISSION : le serveur de fichiers files (${tw.H.files.ip}) expose le port 445. Que livre-t-il à
quelqu'un qui n'a aucun compte ?

À FAIRE
  1 version_samba       version du service (ex : 4.13.13-Debian), relevée au scan
  2 partages_anonymes   les partages (hors IPC$) lisibles SANS mot de passe
  3 partage_sensible    le partage anonyme qui n'est pas « public »
  4 fichier_sensible    le fichier qui n'aurait jamais dû y être (nom exact)
${faceBlue(d1(tw))}
Les partages protégés refusent l'accès : c'est normal, ne les comptez pas.
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['nmap -sV -p 445 ADRESSE donne le produit et la version du service SMB.', 'smbclient -L //ADRESSE -N liste les partages sans mot de passe (-N).', 'smbclient //ADRESSE/PARTAGE -N -c "ls" tente de lire un partage : « ACCESS_DENIED » = protégé.', 'Le fichier sensible porte un nom évocateur (paie, contrats, export comptable).'],
    check: checker('SIM04-1', tw => [ask('version_samba', 'txt', tw.H.files.ports.find(p => p.port === 445).version), ask('partages_anonymes', 'set', anonShares(tw).join(',')), ask('partage_sensible', 'txt', tw.smb.sensitive.share), ask('fichier_sensible', 'txt', tw.smb.sensitive.file)], d1), finish: 'Énumération SMB terminée : un partage sensible était lisible par n\'importe qui sur le réseau.' });
  const d2 = tw => defense(tw, 42, 'Passer en SNMPv3 avec authentification et chiffrement, et limiter les requêtes aux adresses de supervision', ['Remplacer la communauté par un mot plus long en gardant SNMPv2c ouvert à tout le réseau', 'Désactiver la journalisation de l\'imprimante']);
  M.push({ id: 'SIM04-2', title: 'Énumération SNMP : une imprimante bavarde', module: 'SIM04 · Énumération SMB et SNMP', points: 35, difficulty: 2, lesson: 'SIM04-enumeration-smb-snmp', code: 'SIM04·2', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['communaute', 'firmware', 'contact', 'defense']), 'communautes.txt': tw.snmp.candidates.join('\n') + '\n' }),
    enonce: tw => `${head(tw)}
MISSION : l'imprimante du rez-de-chaussée (${tw.H['imprimante-rdc'].ip}) n'est pas dans l'inventaire. Elle répond au
protocole SNMP (supervision). Que révèle-t-elle ?

À FAIRE
  communautes.txt        mots de passe SNMP courants à essayer (un par ligne)
  1 communaute    la communauté SNMP en lecture qui fonctionne
  2 firmware      version du firmware de l'imprimante (ex : 2.4.1)
  3 contact       adresse de courriel déclarée comme contact (sysContact)
${faceBlue(d2(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['snmpwalk -v2c -c COMMUNAUTE ADRESSE liste les informations du système.', 'Une mauvaise communauté ne répond pas (« Timeout ») : essayez les mots de communautes.txt.', 'snmpget -v2c -c COMMUNAUTE ADRESSE sysContact.0 lit une seule valeur.', 'Le firmware est dans sysDescr, à la fin de la description.'],
    check: checker('SIM04-2', tw => [ask('communaute', 'txt', tw.snmp.community), ask('firmware', 'txt', tw.snmp.firmware), ask('contact', 'txt', tw.snmp.contact)], d2), finish: 'Imprimante énumérée : modèle, firmware et contact obtenus avec une simple communauté devinée.' });
}
// ---------------------------------------------------------------- SIM05 : analyse de vulnérabilités
const ADV = ['OpenSSH', 'nginx', 'Apache', 'MySQL', 'Samba'];
const advisories = tw => { const R = rng(tw.seed * 53 + 5); const out = []; let n = 14; for (const prod of ADV) { const key = prod; const fixed = (tw.policy.find(x => x[0] === key) || [0, { nginx: '1.18.0', Apache: '2.4.46', OpenSSH: '8.4p1', MySQL: '8.0.28', Samba: '4.13.0' }[key]])[1]; out.push({ id: `AVIS-2026-0${n++}`, product: prod, fixed, cvss: R.pick([5.3, 6.5, 7.5, 8.1, 9.8]), exploit: R.pick(['oui', 'non']) }); } return out; };
const advFile = tw => '# id;produit;corrigé_dans;score_cvss;exploit_public\n# Un service est concerné si sa version est INFÉRIEURE à « corrigé_dans ».\n' + advisories(tw).map(a => `${a.id};${a.product};${a.fixed};${a.cvss};${a.exploit}`).join('\n') + '\n';
{
  const d1 = tw => defense(tw, 51, 'Corriger en priorité le service concerné par l\'avis (mise à jour testée), puis relancer le scan pour prouver la correction', ['Attendre la prochaine mise à jour globale de l\'année', 'Masquer la bannière de version pour que le scanner ne le détecte plus']);
  M.push({ id: 'SIM05-1', title: 'Vulnérabilités : relier un service à son avis de sécurité', module: 'SIM05 · Analyse de vulnérabilités', points: 40, difficulty: 2, lesson: 'SIM05-analyse-vulnerabilites', code: 'SIM05·1', duree: '45 min',
    setup: tw => ({ 'reponses.txt': tmpl(['hote_concerne', 'produit_concerne', 'avis', 'score_cvss', 'exploit_public', 'defense']), 'avis-securite.csv': advFile(tw) }),
    enonce: tw => `${head(tw)}
MISSION : parmi les serveurs gw, www, db et files, un seul exécute un service concerné par un
avis de sécurité (avis-securite.csv). Retrouvez-le et qualifiez le risque.

À FAIRE
  1 hote_concerne     nom du serveur concerné
  2 produit_concerne  OpenSSH, nginx, Apache, MySQL ou Samba
  3 avis              identifiant de l'avis applicable (AVIS-2026-0xx)
  4 score_cvss        score CVSS de cet avis
  5 exploit_public    « oui » ou « non » : un code d'exploitation public existe-t-il ?
${faceBlue(d1(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['nmap -sV -p- ADRESSE sur chaque serveur donne produits et versions.', 'Comparez chaque version à la colonne corrigé_dans : version inférieure = concerné.', 'Un seul avis s\'applique : les autres produits sont à jour.', 'Copiez l\'identifiant et les deux dernières colonnes de la ligne de l\'avis trouvé.'],
    check: checker('SIM05-1', tw => { const a = advisories(tw).find(x => tw.outdated.product.startsWith(x.product)); return [ask('hote_concerne', 'txt', tw.outdated.host), ask('produit_concerne', 'txt', a.product), ask('avis', 'txt', a.id), ask('score_cvss', 'txt', a.cvss), ask('exploit_public', 'txt', a.exploit)]; }, d1), finish: 'Avis retrouvé : vous savez quel service corriger, avec quel niveau de gravité et si un exploit circule.' });
  const findings = tw => { const expo = h => tw.H[h].pub ? 3 : 1; const f = [{ id: 'C1', label: `Service obsolète : ${tw.outdated.product} sur ${tw.outdated.host}`, g: 4, e: expo(tw.outdated.host) }, { id: 'C2', label: `Partage SMB anonyme « ${tw.smb.sensitive.share} » sur files`, g: 5, e: expo('files') }, { id: 'C3', label: 'SNMP accessible avec une communauté devinable sur imprimante-rdc', g: 3, e: expo('imprimante-rdc') }, { id: 'C4', label: `Port ${tw.exPort.port} non prévu sur ${tw.exHost}`, g: 3, e: expo(tw.exHost) }, { id: 'C5', label: 'En-têtes de sécurité manquants sur www', g: 2, e: expo('www') }]; for (const x of f) x.score = x.g * x.e; return f.sort((a, b) => b.score - a.score || b.g - a.g || a.id.localeCompare(b.id)); };
  const csv = tw => '# id;constat;hote\n' + [['C1', `Service obsolète (${tw.outdated.product})`, tw.outdated.host], ['C2', 'Partage SMB lisible sans mot de passe', 'files'], ['C3', 'SNMP accessible avec une communauté devinable', 'imprimante-rdc'], ['C4', `Port ${tw.exPort.port} non prévu à l'inventaire`, tw.exHost], ['C5', 'En-têtes de sécurité manquants', 'www']].map(r => r.join(';')).join('\n') + '\n';
  const grille = '# Grille de priorisation\n# score = gravité × exposition\n# gravité : service obsolète 4 ; partage anonyme 5 ; SNMP devinable 3 ; port non prévu 3 ; en-têtes manquants 2\n# exposition : 3 si l\'hôte a une adresse PUBLIQUE dans le DNS, sinon 1\n# à score égal : le plus grave d\'abord, puis l\'ordre des identifiants\n';
  const d2 = tw => defense(tw, 52, 'Traiter dans l\'ordre du score : d\'abord ce qui est exposé à Internet et grave, puis le reste, avec un retest à chaque étape', ['Tout corriger en même temps le week-end sans plan de retour arrière', 'Commencer par les constats les plus faciles pour faire baisser le compteur']);
  M.push({ id: 'SIM05-2', title: 'Vulnérabilités : prioriser les constats par exposition', module: 'SIM05 · Analyse de vulnérabilités', points: 45, difficulty: 3, lesson: 'SIM05-analyse-vulnerabilites', code: 'SIM05·2', duree: '50 min',
    setup: tw => ({ 'reponses.txt': tmpl(['priorite_1', 'priorite_2', 'priorite_3', 'defense']), 'constats.csv': csv(tw), 'grille-priorisation.txt': grille }),
    enonce: tw => `${head(tw)}
MISSION : cinq constats attendent d'être traités (constats.csv). Classez les trois à traiter
en premier selon la grille du client (grille-priorisation.txt).

À FAIRE
  1 priorite_1   identifiant du constat à traiter en premier (ex : C2)
  2 priorite_2   le deuxième
  3 priorite_3   le troisième
${faceBlue(d2(tw))}
Pour connaître l'exposition, regardez quels hôtes ont une adresse publique dans le DNS (dig, host).
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['La grille donne gravité et exposition : multipliez-les pour chaque constat.', 'Un hôte est exposé s\'il a une adresse 203.0.113.x publiée dans le DNS (dig +short www.DOMAINE).', 'En cas d\'égalité, le plus grave passe d\'abord, puis l\'ordre C1, C2, …', 'Écrivez seulement l\'identifiant (C1 à C5) pour chaque priorité.'],
    check: checker('SIM05-2', tw => { const f = findings(tw); return [ask('priorite_1', 'txt', f[0].id), ask('priorite_2', 'txt', f[1].id), ask('priorite_3', 'txt', f[2].id)]; }, d2), finish: 'Priorités posées : le plan de correction suit le risque réel, pas l\'ordre de la liste.' });
}
// ---------------------------------------------------------------- SIM06 : accès contrôlé et privilèges (analyse d'un hôte Linux fictif)
const hex = (R, n) => Array.from({ length: n }, () => '0123456789abcdef'[R.int(0, 15)]).join('');
const b64 = (R, n) => Array.from({ length: n }, () => './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[R.int(0, 63)]).join('');
const accounts = tw => { const R = rng(tw.seed * 61 + 3); const extra = R.shuffle(['dsi', 'compta', 'support', 'deploy', 'maintenance', 'stagiaire2']).slice(0, 5); const uid0 = R.pick(extra.filter(n => ['support', 'maintenance', 'deploy'].includes(n))); const rest = extra.filter(n => n !== uid0); const empty = R.pick(rest); const weak = R.shuffle(rest.filter(n => n !== empty)).slice(0, 2);
  const users = [{ n: 'root', uid: 0 }, { n: 'daemon', uid: 1 }, { n: 'www-data', uid: 33 }, { n: 'sshd', uid: 105 }, ...extra.map((n, i) => ({ n, uid: n === uid0 ? 0 : 1000 + i }))];
  const hashes = {}; for (const u of users) { const sys = ['daemon', 'www-data', 'sshd'].includes(u.n); hashes[u.n] = sys ? '*' : u.n === empty ? '' : weak.includes(u.n) ? `$1$${b64(R, 8)}$${b64(R, 22)}` : `$6$${b64(R, 8)}$${b64(R, 86)}`; }
  return { users, hashes, uid0, empty, weak }; };
const passwdFile = a => a.users.map(u => `${u.n}:x:${u.uid}:${u.uid}:${u.n}:${u.uid === 0 && u.n === 'root' ? '/root' : '/home/' + u.n}:${['daemon', 'www-data', 'sshd'].includes(u.n) ? '/usr/sbin/nologin' : '/bin/bash'}`).join('\n') + '\n';
const shadowFile = a => a.users.map(u => `${u.n}:${a.hashes[u.n]}:20400:0:99999:7:::`).join('\n') + '\n';
const GTFO = ['vim', 'find', 'less', 'awk', 'tar'];
const sudoData = tw => { const R = rng(tw.seed * 67 + 9); const a = accounts(tw); const names = a.users.filter(u => u.uid >= 1000 || u.uid === 0).map(u => u.n).filter(n => n !== 'root'); const risky = R.pick(names.filter(n => n !== a.uid0)); const bin = R.pick(GTFO); const safeUser = R.pick(names.filter(n => n !== risky));
  const suspicious = R.pick(['/usr/local/bin/sync-data', '/opt/outils/export', '/home/deploy/.bin/vim.basic']);
  const sudoers = `# /etc/sudoers (extrait)\nDefaults\tenv_reset\nDefaults\tsecure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"\n\nroot\tALL=(ALL:ALL) ALL\n%admin\tALL=(ALL) ALL\n${safeUser}\tALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx\n${risky}\tALL=(root) NOPASSWD: /usr/bin/${bin}\n`;
  const std = ['/usr/bin/passwd', '/usr/bin/su', '/usr/bin/mount', '/usr/bin/umount', '/usr/bin/sudo', '/usr/bin/chsh', '/usr/bin/chfn', '/usr/bin/gpasswd', '/usr/bin/newgrp', '/usr/lib/openssh/ssh-keysign', '/usr/lib/dbus-1.0/dbus-daemon-launch-helper'];
  const list = R.shuffle([...std, suspicious]); return { risky, bin, suspicious, sudoers, suid: list.join('\n') + '\n' }; };
{
  const d1 = tw => defense(tw, 61, 'Passer le compte en UID normal, verrouiller les comptes sans mot de passe et remplacer les hachages MD5 par SHA-512 (changement de mot de passe forcé)', ['Renommer le compte UID 0 pour qu\'il passe inaperçu', 'Garder les hachages tels quels : ils sont déjà illisibles']);
  M.push({ id: 'SIM06-1', title: 'Comptes : UID 0 caché, mot de passe vide, hachages faibles', module: 'SIM06 · Accès contrôlé et privilèges', points: 35, difficulty: 2, lesson: 'SIM06-acces-privileges', code: 'SIM06·1', duree: '40 min',
    setup: tw => { const a = accounts(tw); return { 'reponses.txt': tmpl(['compte_uid0', 'compte_sans_mot_de_passe', 'comptes_hachage_faible', 'defense']), 'passwd.txt': passwdFile(a), 'shadow-extrait.txt': shadowFile(a) }; },
    enonce: tw => `${head(tw)}
MISSION : audit des comptes du serveur www. Deux fichiers sont fournis : une copie de
passwd.txt (comptes) et un extrait de shadow-extrait.txt (mots de passe hachés).

À FAIRE
  1 compte_uid0               le compte AUTRE que root qui a l'UID 0 (tous les droits)
  2 compte_sans_mot_de_passe  le compte dont le champ de mot de passe est vide
  3 comptes_hachage_faible    les comptes dont le hachage commence par $1$ (MD5), séparés par des virgules
${faceBlue(d1(tw))}
Rappel : « * » ou « ! » veut dire compte sans connexion par mot de passe, ce n'est PAS un champ vide.
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['awk -F: \'$3==0\' passwd.txt affiche les comptes dont l\'UID est 0.', 'awk -F: \'$2==""\' shadow-extrait.txt affiche les mots de passe vides.', 'grep \'\\$1\\$\' shadow-extrait.txt repère les hachages MD5 ($1$).', 'Un compte système a « * » : ce n\'est pas un mot de passe vide.'],
    check: checker('SIM06-1', tw => { const a = accounts(tw); return [ask('compte_uid0', 'txt', a.uid0), ask('compte_sans_mot_de_passe', 'txt', a.empty), ask('comptes_hachage_faible', 'set', a.weak.join(','))]; }, d1), finish: 'Comptes audités : un UID 0 caché, un mot de passe vide et des hachages faibles, relevés dans les fichiers.' });
  const d2 = tw => defense(tw, 62, 'Supprimer la règle sudo qui donne un shell, la remplacer par une commande dédiée sans échappement possible, et retirer le bit SUID inattendu', ['Ajouter un mot de passe sur la règle et conserver le même binaire', 'Interdire seulement la connexion SSH de cet utilisateur']);
  M.push({ id: 'SIM06-2', title: 'Privilèges : règle sudo dangereuse et binaire SUID inattendu', module: 'SIM06 · Accès contrôlé et privilèges', points: 40, difficulty: 3, lesson: 'SIM06-acces-privileges', code: 'SIM06·2', duree: '45 min',
    setup: tw => { const d = sudoData(tw); return { 'reponses.txt': tmpl(['utilisateur_a_risque', 'binaire_sudo_dangereux', 'binaire_suid_inattendu', 'defense']), 'sudoers.txt': d.sudoers, 'suid-liste.txt': d.suid }; },
    enonce: tw => `${head(tw)}
MISSION : un utilisateur sans privilèges peut-il devenir root sur le serveur www ? Deux
sources : sudoers.txt (règles sudo) et suid-liste.txt (résultat de find / -perm -4000).

À FAIRE
  1 utilisateur_a_risque      l'utilisateur dont la règle sudo permet d'obtenir un shell root
  2 binaire_sudo_dangereux    le programme concerné (nom seul : vim, find, less, awk ou tar)
  3 binaire_suid_inattendu    le chemin complet du programme SUID qui n'est pas un classique du système
${faceBlue(d2(tw))}
Une règle qui autorise un éditeur, un pager ou find sans mot de passe permet de lancer un shell.
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['Cherchez les lignes NOPASSWD : grep NOPASSWD sudoers.txt.', 'Un programme interactif (éditeur, find, tar, awk…) peut lancer un shell : c\'est la règle à risque.', 'Les programmes SUID classiques sont dans /usr/bin et /usr/lib ; cherchez un chemin ailleurs (/usr/local, /opt, /home) : grep -Ev "^/usr/(bin|lib)/" suid-liste.txt.', 'systemctl restart nginx est une commande précise : ce n\'est pas un shell.'],
    check: checker('SIM06-2', tw => { const d = sudoData(tw); return [ask('utilisateur_a_risque', 'txt', d.risky), ask('binaire_sudo_dangereux', 'txt', d.bin), ask('binaire_suid_inattendu', 'txt', d.suspicious)]; }, d2), finish: 'Élévation repérée : une règle sudo trop large et un programme SUID hors norme permettaient de devenir root.' });
}
// ---------------------------------------------------------------- SIM08 : capture et trafic (texte au format tcpdump, jamais de trafic réel)
const capture = tw => { const R = rng(tw.seed * 71 + 11); const clients = tw.hosts.filter(h => h.up && !h.self && h.ports.length === 0 && !h.shadow).concat([tw.H['poste-audit']]).map(h => h.ip); const web = tw.H.www.ip, gw = tw.H.gw.ip, db = tw.H.db.ip; const scanner = `${tw.net}.${R.int(150, 199)}`; const proto = R.pick(['ftp', 'http']); const user = R.pick(['marie.d', 'compta01', 'admin-site', 'plaquette']); const secret = `${R.pick(['Hiver', 'Soleil', 'Lagune'])}${R.int(2020, 2026)}!`; const ftpHost = tw.exHost === 'files' ? tw.H.files.ip : tw.H.files.ip;
  const lines = []; let t = 14 * 3600 + 20 * 60; const ts = () => { t += R.int(0, 2); const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(R.int(0, 999999)).padStart(6, '0')}`; };
  const pkt = (src, sp, dst, dp, flags, len, extra = '') => lines.push(`${ts()} IP ${src}.${sp} > ${dst}.${dp}: Flags [${flags}], length ${len}${extra}`);
  for (let i = 0; i < 8; i++) { const c = R.pick(clients); const sp = R.int(40000, 60000); pkt(c, sp, web, 443, 'S', 0); pkt(web, 443, c, sp, 'S.', 0); pkt(c, sp, web, 443, 'P.', R.int(200, 900)); lines.push(`${ts()} IP ${c}.${R.int(40000, 60000)} > ${gw}.53: ${R.int(1000, 60000)}+ A? ${R.pick(['www', 'mail', 'vpn'])}.${tw.domain}. (${R.int(30, 50)})`); }
  const ports = R.shuffle([21, 22, 23, 25, 80, 110, 139, 143, 443, 445, 1433, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9200, 27017]).slice(0, 14); for (const p of ports) pkt(scanner, 44000 + p % 100, db, p, 'S', 0);
  const c = R.pick(clients); const sp = R.int(40000, 60000);
  if (proto === 'ftp') { pkt(c, sp, ftpHost, 21, 'S', 0); pkt(c, sp, ftpHost, 21, 'P.', 16, `: FTP: USER ${user}`); pkt(ftpHost, 21, c, sp, 'P.', 34, ': FTP: 331 Please specify the password.'); pkt(c, sp, ftpHost, 21, 'P.', 16 + secret.length, `: FTP: PASS ${secret}`); pkt(ftpHost, 21, c, sp, 'P.', 23, ': FTP: 230 Login successful.'); }
  else { pkt(c, sp, web, 80, 'S', 0); pkt(c, sp, web, 80, 'P.', 212, `: HTTP: POST /login HTTP/1.1`); lines.push(`\tHost: www.${tw.domain}`); lines.push('\tContent-Type: application/x-www-form-urlencoded'); lines.push(`\tlogin=${user}&password=${secret}`); pkt(web, 80, c, sp, 'P.', 120, ': HTTP: HTTP/1.1 302 Found'); }
  for (let i = 0; i < 10; i++) { const c2 = R.pick(clients); pkt(c2, R.int(40000, 60000), web, 443, 'P.', R.int(120, 600)); }
  return { text: lines.join('\n') + '\n', scanner, target: db, proto, user, secret }; };
const dnsCapture = tw => { const R = rng(tw.seed * 73 + 17); const src = R.pick(tw.hosts.filter(h => h.up && !h.self && !h.shadow && h.name !== 'gw').map(h => h)); const evil = `${R.pick(['cdn-stat', 'update-check', 'sync-api'])}-${R.int(10, 99)}.example`; const n = R.int(18, 30); const lines = []; let t = 3 * 3600 + 12 * 60; const ts = () => { t += R.int(1, 3); return `0${Math.floor(t / 3600)}:${String(Math.floor(t % 3600 / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}.${String(R.int(0, 999999)).padStart(6, '0')}`; };
  const normal = [`www.${tw.domain}.`, `mail.${tw.domain}.`, 'debian.org.', 'security.debian.org.']; const all = [];
  for (let i = 0; i < n; i++) all.push({ ip: src.ip, name: `${hex(R, 40)}.${evil}.`, type: 'TXT' });
  for (let i = 0; i < 9; i++) all.push({ ip: R.pick(tw.hosts.filter(h => h.up && !h.self && !h.shadow).map(h => h.ip)), name: R.pick(normal), type: 'A' });
  for (const q of R.shuffle(all)) lines.push(`${ts()} IP ${q.ip}.${R.int(40000, 60000)} > ${tw.H.gw.ip}.53: ${R.int(1000, 60000)}+ ${q.type}? ${q.name} (${q.name.length + 4})`);
  return { text: lines.join('\n') + '\n', src, evil, n }; };
{
  const d1 = tw => defense(tw, 81, 'Remplacer le protocole par sa version chiffrée (SFTP, FTPS ou HTTPS), bloquer l\'ancien port et changer le mot de passe exposé', ['Conserver le protocole en clair mais changer l\'identifiant', 'Ne rien changer : le réseau interne est de confiance']);
  M.push({ id: 'SIM08-1', title: 'Capture : un balayage et un mot de passe en clair', module: 'SIM08 · Capture et trafic', points: 35, difficulty: 2, lesson: 'SIM08-capture-trafic', code: 'SIM08·1', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['ip_scanner', 'serveur_cible', 'protocole_en_clair', 'identifiant_expose', 'defense']), 'capture.txt': capture(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : le pare-feu a enregistré dix minutes de trafic (capture.txt, format tcpdump en
texte). Une machine inconnue est active et un mot de passe a circulé en clair.

À FAIRE
  1 ip_scanner          l'adresse qui envoie des paquets SYN vers de nombreux ports
  2 serveur_cible       l'adresse du serveur visé par ce balayage
  3 protocole_en_clair  ftp ou http : le protocole sur lequel le mot de passe est lisible
  4 identifiant_expose  l'identifiant qui apparaît dans cet échange
${faceBlue(d1(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['Les SYN sans réponse sont des « Flags [S] » : comptez-les par adresse source avec awk et sort | uniq -c.', 'Une adresse source qui contacte une seule cible sur 14 ports différents est un balayage de ports.', 'grep -n "PASS\\|password" capture.txt repère les mots de passe lisibles.', 'Notez le protocole (FTP: ou HTTP:) et l\'identifiant (USER ou login=).'],
    check: checker('SIM08-1', tw => { const c = capture(tw); return [ask('ip_scanner', 'txt', c.scanner), ask('serveur_cible', 'txt', c.target), ask('protocole_en_clair', 'txt', c.proto), ask('identifiant_expose', 'txt', c.user)]; }, d1), finish: 'Capture lue : balayage identifié et identifiants exposés repérés, sans rien rejouer.' });
  const d2 = tw => defense(tw, 82, 'Isoler le poste source, n\'autoriser que le résolveur interne vers l\'extérieur et alerter sur les requêtes DNS longues ou très nombreuses', ['Bloquer toutes les requêtes DNS de l\'entreprise', 'Ignorer : le DNS n\'est pas un canal de données']);
  M.push({ id: 'SIM08-2', title: 'Capture : exfiltration par requêtes DNS', module: 'SIM08 · Capture et trafic', points: 40, difficulty: 3, lesson: 'SIM08-capture-trafic', code: 'SIM08·2', duree: '45 min',
    setup: tw => ({ 'reponses.txt': tmpl(['hote_source', 'domaine_suspect', 'nombre_requetes', 'defense']), 'capture-dns.txt': dnsCapture(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : une nuit, le résolveur (${tw.H.gw.ip}) a reçu des requêtes étranges (capture-dns.txt). Un
poste interne semble sortir des données encodées dans des noms de domaine.

À FAIRE
  1 hote_source        le nom de l'hôte interne qui envoie ces requêtes (nom de la plage, ex : db)
  2 domaine_suspect    le domaine externe interrogé (sans le point final, ex : exemple.example)
  3 nombre_requetes    le nombre de requêtes TXT vers ce domaine
${faceBlue(d2(tw))}
Associez l'adresse source à l'hôte avec nmap -sn ou host -x ; un nom de 40 caractères hexadécimaux
suivi d'un domaine inhabituel est typique d'une exfiltration.
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep TXT capture-dns.txt isole les requêtes de type TXT.', 'awk \'{print $3}\' capture-dns.txt | sort | uniq -c montre quelle adresse source domine.', 'host ADRESSE (résolution inverse) donne le nom de l\'hôte interne.', 'Le domaine suspect est ce qui suit les 40 caractères hexadécimaux.'],
    check: checker('SIM08-2', tw => { const c = dnsCapture(tw); return [ask('hote_source', 'txt', c.src.name), ask('domaine_suspect', 'txt', c.evil), ask('nombre_requetes', 'num', c.n)]; }, d2), finish: 'Canal caché repéré : un poste interne exfiltrait des données par des requêtes DNS.' });
}
// ---------------------------------------------------------------- SIM10 : disponibilité (journal web et métriques, données fictives)
const pad2 = n => String(n).padStart(2, '0');
const flood = tw => { const R = rng(tw.seed * 83 + 1); return { m0: R.int(8, 18), dur: 3, attacker: `198.51.100.${R.int(10, 240)}`, path: R.pick(['/recherche', '/export', '/api/catalogue']), n: R.int(220, 320), sat: R.pick(['cpu', 'memoire', 'connexions']) }; };
const accessLog = tw => { const R = rng(tw.seed * 83 + 2); const F = flood(tw); const clients = Array.from({ length: 12 }, () => `203.0.113.${R.int(150, 250)}`); const pages = ['/', '/produits', '/contact', '/actualites', '/connexion', '/panier'];
  const rows = []; const row = (t, ip, path, st, sz) => rows.push({ t, line: `${ip} - - [15/Nov/2026:14:${pad2(Math.floor(t / 60))}:${pad2(t % 60)} +0000] "GET ${path} HTTP/1.1" ${st} ${sz} "-" "${ip === F.attacker ? 'python-requests/2.31' : 'Mozilla/5.0'}"` });
  for (let i = 0; i < 140; i++) row(R.int(0, 29 * 60 + 59), R.pick(clients), R.pick(pages), 200, R.int(800, 9000));
  for (let i = 0; i < F.n; i++) { const t = F.m0 * 60 + R.int(0, F.dur * 60 - 1); row(t, F.attacker, `${F.path}?q=${R.int(1, 99999)}`, R.f() < 0.45 ? 503 : 200, R.int(300, 2000)); }
  return rows.sort((a, b) => a.t - b.t).map(r => r.line).join('\n') + '\n'; };
const metrics = tw => { const R = rng(tw.seed * 83 + 3); const F = flood(tw); let o = '# heure;cpu_pct;memoire_pct;connexions\n# seuils : cpu 90 ; memoire 90 ; connexions 1000 (limite du serveur)\n'; let first = null, max = 0;
  for (let m = 0; m < 30; m++) { const hot = m >= F.m0 && m < F.m0 + F.dur; const v = { cpu: R.int(15, 30), memoire: R.int(40, 55), connexions: R.int(30, 60) };
    if (hot) { v.cpu = F.sat === 'cpu' ? R.int(92, 99) : R.int(55, 75); v.memoire = F.sat === 'memoire' ? R.int(91, 98) : R.int(60, 72); v.connexions = F.sat === 'connexions' ? R.int(1000, 1400) : R.int(400, 800); }
    o += `14:${pad2(m)};${v.cpu};${v.memoire};${v.connexions}\n`; const lim = { cpu: 90, memoire: 90, connexions: 1000 }[F.sat]; if (v[F.sat] >= lim) { if (first === null) first = `14:${pad2(m)}`; max = Math.max(max, v[F.sat]); } }
  return { text: o, first, max }; };
{
  const d1 = tw => defense(tw, 101, 'Limiter le débit par adresse sur le chemin ciblé, bloquer l\'adresse abusive et mettre en cache la page coûteuse', ['Redémarrer le serveur à chaque pic', 'Doubler la mémoire sans changer la configuration']);
  M.push({ id: 'SIM10-1', title: 'Disponibilité : retrouver la source d\'une saturation dans le journal web', module: 'SIM10 · Disponibilité sous pression', points: 35, difficulty: 2, lesson: 'SIM10-disponibilite', code: 'SIM10·1', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['ip_source', 'chemin_cible', 'nombre_requetes', 'minute_debut', 'defense']), 'access.log': accessLog(tw) }),
    enonce: tw => `${head(tw)}
MISSION : le site de ${tw.orgName} a ralenti pendant la demi-heure écoulée. Le journal du serveur
web (access.log, format nginx) est fourni. Retrouvez ce qui l'a saturé.

À FAIRE
  1 ip_source        l'adresse qui envoie une rafale de requêtes
  2 chemin_cible     le chemin visé, sans les paramètres (ex : /export)
  3 nombre_requetes  le nombre de requêtes de cette adresse
  4 minute_debut     la minute où la rafale commence (format HH:MM, ex : 14:12)
${faceBlue(d1(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['awk \'{print $1}\' access.log | sort | uniq -c | sort -rn | head montre qui envoie le plus de requêtes.', 'grep ADRESSE access.log | head montre le chemin visé : coupez avant le « ? ».', 'grep -c ADRESSE access.log compte les lignes de cette adresse.', 'Le champ 4 contient l\'heure : [15/Nov/2026:14:12:07 → gardez 14:12 de la première ligne.'],
    check: checker('SIM10-1', tw => { const F = flood(tw); return [ask('ip_source', 'txt', F.attacker), ask('chemin_cible', 'txt', F.path), ask('nombre_requetes', 'num', F.n), ask('minute_debut', 'txt', `14:${pad2(F.m0)}`)]; }, d1), finish: 'Saturation expliquée : une adresse unique a monopolisé le serveur sur un chemin coûteux.' });
  const d2 = tw => defense(tw, 102, 'Poser une limite de débit et une alerte sur la ressource qui sature, puis dimensionner après avoir confirmé la cause', ['Désactiver la supervision pour réduire la charge', 'Augmenter tous les seuils d\'alerte pour ne plus être dérangé']);
  M.push({ id: 'SIM10-2', title: 'Disponibilité : quelle ressource sature, et quand ?', module: 'SIM10 · Disponibilité sous pression', points: 35, difficulty: 2, lesson: 'SIM10-disponibilite', code: 'SIM10·2', duree: '35 min',
    setup: tw => ({ 'reponses.txt': tmpl(['ressource_saturee', 'premiere_minute_critique', 'valeur_max', 'defense']), 'metriques.csv': metrics(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : la supervision a relevé une mesure par minute (metriques.csv). Une seule ressource atteint
son seuil critique pendant l'incident.

À FAIRE
  1 ressource_saturee         cpu, memoire ou connexions
  2 premiere_minute_critique  la première minute où le seuil de cette ressource est atteint (HH:MM)
  3 valeur_max                la valeur la plus haute atteinte par cette ressource
${faceBlue(d2(tw))}
Les seuils sont rappelés en tête du fichier. Les autres ressources montent aussi, sans atteindre le leur.
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['Comparez chaque colonne à son seuil : cpu et mémoire à 90, connexions à 1000.', 'awk -F";" \'$2>=90\' metriques.csv liste les minutes où le processeur dépasse 90.', 'Trouvez la première ligne qui atteint le seuil, puis le maximum de la même colonne.', 'Ignorez les lignes de commentaire (#).'],
    check: checker('SIM10-2', tw => { const F = flood(tw); const m = metrics(tw); return [ask('ressource_saturee', 'txt', F.sat), ask('premiere_minute_critique', 'txt', m.first), ask('valeur_max', 'num', m.max)]; }, d2), finish: 'Saturation datée : vous savez quelle ressource a cédé en premier et à quelle minute.' });
}
// ---------------------------------------------------------------- SIM11 : sessions et cookies
const cookieSet = tw => { const R = rng(tw.seed * 89 + 3); const names = ['PHPSESSID', 'panier', 'prefs', 'remember', 'csrf']; const rows = names.map(n => ({ n, secure: R.f() < 0.5, httponly: R.f() < 0.5, samesite: R.pick(['Lax', 'Strict', null]), path: '/' })); rows[0].httponly = false; rows[1].secure = false; rows[2].httponly = true; rows[2].secure = true; const prev = R.pick(['panier', 'prefs', 'remember']); for (const r of rows) r.val = r.n === prev ? String(100000 + R.int(0, 9000)) : hex(R, 32); const sans = f => rows.filter(r => !r[f]).map(r => r.n); return { rows, prev, noHttp: sans('httponly'), noSecure: sans('secure') }; };
const cookieText = tw => { const c = cookieSet(tw); const pages = ['/connexion', '/panier', '/compte', '/preferences', '/profil']; return c.rows.map((r, i) => `### GET ${pages[i]}\nHTTP/1.1 200 OK\nServer: nginx\nSet-Cookie: ${r.n}=${r.val}; Path=${r.path}${r.secure ? '; Secure' : ''}${r.httponly ? '; HttpOnly' : ''}${r.samesite ? '; SameSite=' + r.samesite : ''}\n`).join('\n'); };
const sessionLog = tw => { const R = rng(tw.seed * 89 + 5); const users = R.shuffle(['marie', 'paul', 'sophie', 'jean', 'lea']).slice(0, 4); const fixed = R.pick(users); const lines = []; let t = 9 * 3600; const ts = () => { t += R.int(3, 40); return `${pad2(Math.floor(t / 3600))}:${pad2(Math.floor(t % 3600 / 60))}:${pad2(t % 60)}`; }; let fixedSid = '';
  for (const u of users) { const sid = hex(R, 16); lines.push(`${ts()} user=${u} GET /accueil sid=${sid} state=anon`); const sid2 = u === fixed ? sid : hex(R, 16); if (u === fixed) fixedSid = sid; lines.push(`${ts()} user=${u} POST /connexion result=ok sid=${sid2} state=auth`); lines.push(`${ts()} user=${u} GET /compte sid=${sid2} state=auth`); }
  return { text: lines.join('\n') + '\n', fixed, fixedSid, life: R.pick([1800, 3600, 7200, 14400, 86400]) }; };
{
  const d1 = tw => defense(tw, 111, 'Ajouter HttpOnly et Secure (et SameSite) sur les cookies de session et générer des identifiants aléatoires longs', ['Chiffrer la valeur du cookie avec une clé fixe visible dans le code', 'Raccourcir seulement le nom du cookie']);
  M.push({ id: 'SIM11-1', title: 'Cookies : attributs manquants et identifiant prévisible', module: 'SIM11 · Sessions et cookies', points: 35, difficulty: 2, lesson: 'SIM11-sessions-cookies', code: 'SIM11·1', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['cookies_sans_httponly', 'cookies_sans_secure', 'cookie_previsible', 'defense']), 'reponses-http.txt': cookieText(tw) }),
    enonce: tw => `${head(tw)}
MISSION : l'application web de ${tw.orgName} pose cinq cookies. reponses-http.txt contient les cinq
réponses (en-têtes Set-Cookie) relevées avec curl -i.

À FAIRE
  1 cookies_sans_httponly  les cookies SANS l'attribut HttpOnly (séparés par des virgules)
  2 cookies_sans_secure    les cookies SANS l'attribut Secure
  3 cookie_previsible      le cookie dont la valeur est un simple numéro : un attaquant peut deviner les autres
${faceBlue(d1(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep -v HttpOnly reponses-http.txt | grep Set-Cookie liste les cookies sans HttpOnly.', 'Même démarche pour Secure.', 'Une valeur aléatoire fait 32 caractères hexadécimaux ; une valeur de 6 chiffres est prévisible.', 'Notez le nom du cookie (avant le « = »).'],
    check: checker('SIM11-1', tw => { const c = cookieSet(tw); return [ask('cookies_sans_httponly', 'set', c.noHttp.join(',')), ask('cookies_sans_secure', 'set', c.noSecure.join(',')), ask('cookie_previsible', 'txt', c.prev)]; }, d1), finish: 'Cookies audités : attributs manquants et identifiant prévisible repérés.' });
  const d2 = tw => defense(tw, 112, 'Régénérer l\'identifiant de session à la connexion et invalider l\'ancien, avec une durée de vie courte', ['Allonger la durée de session pour éviter les reconnexions', 'Ajouter un mot de passe dans l\'URL de la page de connexion']);
  M.push({ id: 'SIM11-2', title: 'Sessions : identifiant non régénéré à la connexion', module: 'SIM11 · Sessions et cookies', points: 40, difficulty: 3, lesson: 'SIM11-sessions-cookies', code: 'SIM11·2', duree: '40 min',
    setup: tw => { const l = sessionLog(tw); return { 'reponses.txt': tmpl(['utilisateur_session_fixe', 'identifiant_reutilise', 'duree_session_minutes', 'defense']), 'connexions-web.log': l.text, 'config-session.txt': `# extrait de la configuration de l'application\nsession.cookie_httponly = 1\nsession.use_strict_mode = 0\nsession.gc_maxlifetime = ${l.life}   ; secondes\n` }; },
    enonce: tw => `${head(tw)}
MISSION : connexions-web.log relie, pour quatre utilisateurs, l'identifiant de session avant la
connexion (state=anon) et après (state=auth).

À FAIRE
  1 utilisateur_session_fixe  l'utilisateur dont l'identifiant NE CHANGE PAS à la connexion
  2 identifiant_reutilise     la valeur de cet identifiant (sid)
  3 duree_session_minutes     la durée de vie d'une session en minutes (config-session.txt, en secondes)
${faceBlue(d2(tw))}
Un identifiant inchangé après connexion permet à un attaquant de s'en servir s'il l'a fixé avant.
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['Pour chaque utilisateur, comparez le sid de la ligne GET /accueil à celui de la ligne POST /connexion.', 'grep user=NOM connexions-web.log | grep -o "sid=[0-9a-f]*" montre les identifiants de cet utilisateur.', 'Comparez le sid de la ligne state=anon à celui de la ligne POST /connexion.', 'Divisez la valeur de gc_maxlifetime par 60.'],
    check: checker('SIM11-2', tw => { const l = sessionLog(tw); return [ask('utilisateur_session_fixe', 'txt', l.fixed), ask('identifiant_reutilise', 'txt', l.fixedSid), ask('duree_session_minutes', 'num', l.life / 60)]; }, d2), finish: 'Fixation de session repérée : l\'identifiant ne changeait pas à la connexion.' });
}
// ---------------------------------------------------------------- SIM12 : périmètre, pare-feu, détection d'intrusion
const fwRules = tw => { const R = rng(tw.seed * 97 + 2); const bad = R.pick([{ port: 3306, to: 'db' }, { port: 445, to: 'files' }, { port: 22, to: 'gw' }]); const dead = R.pick([8443, 9000, 7001]); const policy = R.pick(['accept', 'drop']); const rows = [[1, 'accept', 'tcp', 'etabli', 'any', 'connexions déjà établies'], [2, 'accept', 'tcp', 'poste-audit', tw.H.gw.ip + ':22', 'administration SSH depuis le poste d\'audit'], [3, 'accept', 'tcp', 'any', `${tw.H.www.ip}:80`, 'site web'], [4, 'accept', 'tcp', 'any', `${tw.H.www.ip}:443`, 'site web TLS'], [5, 'accept', 'tcp', 'any', `${tw.H[bad.to].ip}:${bad.port}`, 'ouvert pour un prestataire'], [6, 'accept', 'tcp', 'any', `${tw.H.www.ip}:${dead}`, 'ancien service de test'], [7, 'accept', 'udp', 'interne', `${tw.H.gw.ip}:53`, 'résolveur DNS']];
  const text = '# n;action;proto;source;destination:port;commentaire\n' + rows.map(r => r.join(';')).join('\n') + `\n# politique par défaut du pare-feu : ${policy}\n`; return { text, bad: 5, dead: 6, policy, deadPort: dead }; };
{
  const d1 = tw => defense(tw, 121, 'Supprimer la règle ouverte à tous, restreindre aux adresses du prestataire, fermer la règle sans service et passer la politique par défaut à drop', ['Ajouter une règle drop à la fin et laisser les autres', 'Changer le commentaire de la règle ouverte']);
  M.push({ id: 'SIM12-1', title: 'Pare-feu : revue de règles (trop large, sans service)', module: 'SIM12 · Périmètre, pare-feu et détection', points: 35, difficulty: 2, lesson: 'SIM12-parefeu-ids', code: 'SIM12·1', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['regle_trop_large', 'regle_sans_service', 'politique_par_defaut', 'defense']), 'regles-pare-feu.csv': fwRules(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : revue des règles du pare-feu (regles-pare-feu.csv). Le serveur web est www (${tw.H.www.ip}).
Une règle ouvre un service d'infrastructure (base de données, fichiers, administration) à tout Internet ; une autre ouvre un port où rien n'écoute.

À FAIRE
  1 regle_trop_large     le numéro de la règle qui ouvre un service d'infrastructure à n'importe quelle source
  2 regle_sans_service   le numéro de la règle qui ouvre un port où aucun service n'écoute (vérifiez avec nmap -p- sur le serveur)
  3 politique_par_defaut accept ou drop (dernière ligne du fichier)
${faceBlue(d1(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['Une source « any » vers un port de base de données, de partage de fichiers ou d\'administration est un constat.', 'nmap -p- ADRESSE_WWW liste les ports réellement ouverts : comparez-les aux règles qui visent www.', 'Une règle qui autorise un port sans service ne sert qu\'à une surface d\'attaque inutile.', 'La politique est écrite dans le commentaire final du fichier.'],
    check: checker('SIM12-1', tw => { const f = fwRules(tw); return [ask('regle_trop_large', 'num', f.bad), ask('regle_sans_service', 'num', f.dead), ask('politique_par_defaut', 'txt', f.policy)]; }, d1), finish: 'Règles revues : une ouverture trop large et une règle sans service identifiées.' });
  const SIGS = [[2001219, 'ET SCAN Potential SSH Scan'], [2010937, 'ET SCAN Suspicious inbound to MySQL port 3306'], [2402000, 'ET DROP Dshield Block Listed Source'], [2013028, 'ET POLICY curl User-Agent Outbound'], [2100498, 'GPL ATTACK_RESPONSE id check returned root']];
  const idsLog = tw => { const R = rng(tw.seed * 97 + 8); const ext = `198.51.100.${R.int(20, 230)}`; const ext2 = `198.51.100.${R.int(231, 250)}`; const rows = []; let t = 14 * 3600; const ts = () => { t += R.int(1, 25); return `${pad2(Math.floor(t / 3600))}:${pad2(Math.floor(t % 3600 / 60))}:${pad2(t % 60)}`; }; const al = (sig, src, dst, dp) => rows.push(`${ts()} [**] [1:${sig[0]}:3] ${sig[1]} [**] {TCP} ${src}:${R.int(30000, 60000)} -> ${dst}:${dp}`);
    const nExt = R.int(26, 34), nAudit = R.int(9, 14), nOther = R.int(5, 8); const audit = tw.H['poste-audit'].ip;
    for (let i = 0; i < nExt; i++) al(SIGS[0], ext, tw.H.gw.ip, 22); for (let i = 0; i < nAudit; i++) al(R.pick([SIGS[0], SIGS[1], SIGS[3]]), audit, R.pick([tw.H.www.ip, tw.H.db.ip, tw.H.files.ip]), R.pick([22, 80, 445, 3306])); for (let i = 0; i < nOther; i++) al(R.pick([SIGS[2], SIGS[3]]), ext2, tw.H.www.ip, R.pick([80, 443]));
    const lines = R.shuffle(rows).map((l, i) => l); lines.sort(); const cnt = {}; for (const l of lines) { const sid = /\[1:(\d+):/.exec(l)[1]; cnt[sid] = (cnt[sid] || 0) + 1; } const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0]; const auditN = lines.filter(l => l.includes(`] {TCP} ${audit}:`)).length; return { text: lines.join('\n') + '\n', ext, top, auditN, audit }; };
  const d2 = tw => defense(tw, 122, 'Qualifier les alertes (rapprocher des tests autorisés), bloquer la source externe et ajuster les règles bruyantes plutôt que les désactiver', ['Désactiver la signature la plus bruyante', 'Ignorer toutes les alertes tant qu\'une seule n\'est pas confirmée']);
  M.push({ id: 'SIM12-2', title: 'Détection : trier les alertes et reconnaître vos propres tests', module: 'SIM12 · Périmètre, pare-feu et détection', points: 40, difficulty: 3, lesson: 'SIM12-parefeu-ids', code: 'SIM12·2', duree: '45 min',
    setup: tw => ({ 'reponses.txt': tmpl(['sid_le_plus_frequent', 'ip_attaque_externe', 'alertes_du_poste_audit', 'defense']), 'alertes-ids.log': idsLog(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : le détecteur d'intrusion a levé des alertes pendant l'heure écoulée (alertes-ids.log).
Certaines viennent de vos propres tests autorisés (votre poste : ${tw.H['poste-audit'].ip}), d'autres d'une source externe.

À FAIRE
  1 sid_le_plus_frequent    le numéro de signature (le nombre après [1:) qui apparaît le plus souvent
  2 ip_attaque_externe      l'adresse externe (198.51.100.x) la plus active sur la passerelle
  3 alertes_du_poste_audit  le nombre d'alertes dont la source est votre poste d'audit (faux positifs attendus)
${faceBlue(d2(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep -o \'\\[1:[0-9]*\' alertes-ids.log | sort | uniq -c | sort -rn | head -1 donne la signature la plus fréquente.', 'grep -o "{TCP} [0-9.]*" alertes-ids.log | sort | uniq -c | sort -rn compte les alertes par source.', 'grep -c ADRESSE_AUDIT alertes-ids.log compte les alertes de votre poste (cherchez « {TCP} ADRESSE »).', 'Une alerte provoquée par un test autorisé reste à noter, pas à traiter comme une attaque.'],
    check: checker('SIM12-2', tw => { const l = idsLog(tw); return [ask('sid_le_plus_frequent', 'num', l.top), ask('ip_attaque_externe', 'txt', l.ext), ask('alertes_du_poste_audit', 'num', l.auditN)]; }, d2), finish: 'Alertes triées : l\'attaque externe est isolée et vos propres tests sont reconnus.' });
}
// ---------------------------------------------------------------- SIM13 : serveur web (configuration et sondages)
const webConf = tw => { const R = rng(tw.seed * 101 + 4); const weak = R.pick([['TLSv1', 'TLSv1.1'], ['TLSv1.1'], ['TLSv1']]); const strong = ['TLSv1.2', 'TLSv1.3']; const protos = [...weak, ...strong]; const tokens = R.pick(['on', 'off']); const W = tw.web;
  const hdrs = W.present.map(h => `    add_header ${h} "${h === 'Strict-Transport-Security' ? 'max-age=31536000' : h === 'X-Frame-Options' ? 'SAMEORIGIN' : h === 'X-Content-Type-Options' ? 'nosniff' : "default-src 'self'"}" always;`);
  const text = `# /etc/nginx/sites-enabled/www (extrait)\nserver {\n    listen 443 ssl;\n    server_name www.${tw.domain};\n    ssl_protocols ${protos.join(' ')};\n    server_tokens ${tokens};\n${hdrs.join('\n')}\n    root /var/www/html;\n\n    location / {\n        try_files $uri $uri/ =404;\n    }\n    location ${W.leakPath} {\n        autoindex on;\n    }\n    location /admin/ {\n        auth_basic "Administration";\n        auth_basic_user_file /etc/nginx/.htpasswd;\n    }\n}\n`;
  return { text, weak, tokens, nHdr: W.present.length }; };
const probeLog = tw => { const R = rng(tw.seed * 101 + 6); const bot = `198.51.100.${R.int(10, 240)}`; const probes = R.shuffle(['/.git/config', '/.env', '/backup.zip', '/wp-login.php', '/phpmyadmin/', '/server-status', '/config.php.bak', '/admin.php', '/.htpasswd', '/dump.sql', '/test.php', '/info.php']); const exposed = R.pick(['/.env', '/backup.zip', '/dump.sql', '/config.php.bak']); const nProbe = R.int(8, 12); const used = probes.slice(0, nProbe); if (!used.includes(exposed)) used[0] = exposed; const clients = Array.from({ length: 8 }, () => `203.0.113.${R.int(150, 250)}`); const rows = []; const row = (t, ip, path, st, sz, ua = 'Mozilla/5.0') => rows.push({ t, line: `${ip} - - [15/Nov/2026:15:${pad2(Math.floor(t / 60))}:${pad2(t % 60)} +0000] "GET ${path} HTTP/1.1" ${st} ${sz} "-" "${ua}"` });
  for (let i = 0; i < 90; i++) row(R.int(0, 1799), R.pick(clients), R.pick(['/', '/produits', '/contact', '/actualites']), 200, R.int(900, 9000));
  const t0 = R.int(200, 900); used.forEach((pth, i) => row(t0 + i * 2, bot, pth, pth === exposed ? 200 : R.pick([404, 404, 403]), pth === exposed ? R.int(300, 4000) : 162, 'Nikto/2.5.0')); return { text: rows.sort((a, b) => a.t - b.t).map(r => r.line).join('\n') + '\n', bot, exposed, n: used.length }; };
{
  const d1 = tw => defense(tw, 131, 'Désactiver l\'index automatique, retirer les protocoles TLS obsolètes, masquer la version et ajouter les en-têtes de sécurité manquants', ['Garder la configuration et ajouter un robots.txt', 'Passer le serveur derrière un nom de domaine plus discret']);
  M.push({ id: 'SIM13-1', title: 'Serveur web : relire la configuration nginx', module: 'SIM13 · Serveur web', points: 35, difficulty: 2, lesson: 'SIM13-serveur-web', code: 'SIM13·1', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['chemin_index_ouvert', 'protocoles_tls_faibles', 'server_tokens', 'nombre_en_tetes_securite', 'defense']), 'nginx.conf': webConf(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : relisez la configuration du serveur web www (extrait nginx.conf) comme le ferait un auditeur.

À FAIRE
  1 chemin_index_ouvert        le chemin dont le contenu est listé automatiquement (autoindex on)
  2 protocoles_tls_faibles     les protocoles TLS obsolètes autorisés (TLSv1, TLSv1.1), séparés par des virgules
  3 server_tokens              la valeur de server_tokens (on ou off)
  4 nombre_en_tetes_securite   le nombre d'en-têtes de sécurité configurés (lignes add_header)
${faceBlue(d1(tw))}
Recoupez avec le site : curl -I http://www.${tw.domain}/ montre les en-têtes réellement envoyés.
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep -n autoindex nginx.conf donne la ligne ; remontez au bloc location voisin.', 'grep ssl_protocols nginx.conf liste les protocoles : TLSv1 et TLSv1.1 sont obsolètes.', 'grep -c add_header nginx.conf compte les en-têtes configurés (0 est possible).', 'server_tokens on laisse la version dans l\'en-tête Server.'],
    check: checker('SIM13-1', tw => { const c = webConf(tw); return [ask('chemin_index_ouvert', 'txt', tw.web.leakPath), ask('protocoles_tls_faibles', 'set', c.weak.join(',')), ask('server_tokens', 'txt', c.tokens), ask('nombre_en_tetes_securite', 'num', c.nHdr)]; }, d1), finish: 'Configuration relue : index ouvert, protocoles obsolètes et en-têtes manquants relevés.' });
  const d2 = tw => defense(tw, 132, 'Retirer immédiatement le fichier exposé du site public, changer les secrets qu\'il contient et bloquer les chemins sensibles', ['Renommer le fichier pour qu\'il soit moins évident', 'Bloquer uniquement l\'adresse de ce visiteur']);
  M.push({ id: 'SIM13-2', title: 'Serveur web : un outil de sondage a trouvé un fichier', module: 'SIM13 · Serveur web', points: 35, difficulty: 2, lesson: 'SIM13-serveur-web', code: 'SIM13·2', duree: '35 min',
    setup: tw => ({ 'reponses.txt': tmpl(['ip_sonde', 'nombre_chemins_testes', 'chemin_expose', 'defense']), 'access.log': probeLog(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : un visiteur a testé des chemins sensibles (sondage automatique). Retrouvez-le dans access.log et
dites ce qu'il a trouvé.

À FAIRE
  1 ip_sonde               l'adresse du visiteur dont l'agent client est « Nikto »
  2 nombre_chemins_testes  le nombre de chemins différents qu'il a demandés
  3 chemin_expose          le seul chemin sensible auquel le serveur a répondu 200
${faceBlue(d2(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep Nikto access.log isole les lignes de l\'outil.', 'awk \'{print $7}\' sur ces lignes | sort -u | wc -l compte les chemins distincts.', 'Le code de réponse est le champ 9 : 404 et 403 = refusé, 200 = trouvé.', 'Un fichier de configuration ou une sauvegarde qui répond 200 est un secret exposé.'],
    check: checker('SIM13-2', tw => { const l = probeLog(tw); return [ask('ip_sonde', 'txt', l.bot), ask('nombre_chemins_testes', 'num', l.n), ask('chemin_expose', 'txt', l.exposed)]; }, d2), finish: 'Sondage reconstitué : vous savez qui a cherché quoi, et ce que le serveur a livré.' });
}
// ---------------------------------------------------------------- SIM14 : application web (réflexion et revue de code)
{
  const d1 = tw => defense(tw, 141, 'Encoder la valeur à l\'affichage (échappement HTML) et ajouter une politique de contenu (CSP)', ['Interdire seulement le mot « script » dans la recherche', 'Mettre le formulaire en méthode POST sans autre changement']);
  M.push({ id: 'SIM14-1', title: 'Application web : une recherche qui renvoie ce qu\'on lui donne', module: 'SIM14 · Application web', points: 35, difficulty: 2, lesson: 'SIM14-application-web', code: 'SIM14·1', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['chemin_recherche', 'parametre', 'balise_renvoyee_telle_quelle', 'type_de_faille', 'defense']) }),
    enonce: tw => `${head(tw)}
MISSION : la page d'accueil de http://www.${tw.domain}/ propose une recherche. Étudiez-la avec curl, sans rien casser.

À FAIRE
  1 chemin_recherche             le chemin du formulaire de recherche (champ action)
  2 parametre                    le nom du champ de saisie (champ name)
  3 balise_renvoyee_telle_quelle oui ou non : si vous envoyez <i>x</i>, la balise revient-elle intacte dans la page ?
  4 type_de_faille               xss si c'est le cas (injection de script dans la page), sinon aucune
${faceBlue(d1(tw))}
Astuce : encodez les caractères spéciaux dans l'URL (%3C pour <, %3E pour >).
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['curl http://www.DOMAINE/ affiche la page : cherchez <form action=… et <input name=….', 'curl "http://www.DOMAINE/CHEMIN?PARAMETRE=test" montre où votre texte réapparaît.', 'Envoyez %3Ci%3Ex%3C/i%3E : si la page contient <i>x</i> tel quel, la sortie n\'est pas échappée.', 'Une valeur renvoyée sans échappement permet d\'injecter du code : c\'est une faille XSS réfléchie.'],
    check: checker('SIM14-1', tw => [ask('chemin_recherche', 'txt', tw.web.search.path), ask('parametre', 'txt', tw.web.search.param), ask('balise_renvoyee_telle_quelle', 'txt', 'oui'), ask('type_de_faille', 'txt', 'xss')], d1), finish: 'Réflexion mesurée : la page renvoie votre saisie sans l\'échapper, c\'est le principe d\'une faille XSS.' });
  const code = tw => { const R = rng(tw.seed * 103 + 8); const fill = n => Array.from({ length: n }, () => R.pick(['// vérifie la saisie', '// récupère les paramètres', '// TODO : factoriser', '// journalisation', '// compatibilité ancien site', '']));
    const hash = R.pick(['md5', 'sha1']); const conn = ['<?php', 'session_start();', "require 'config.php';", ...fill(R.int(2, 6)), "$login = $_POST['login'] ?? '';", "$pass  = $_POST['password'] ?? '';", ...fill(R.int(2, 5)), `$hash = ${hash}($pass);`, ...fill(R.int(1, 4))]; const sqlIdx = conn.length; conn.push('$sql = "SELECT id, role FROM utilisateurs WHERE login = \'$login\' AND mdp = \'$hash\'";', '$res = $db->query($sql);', 'if ($res && $res->num_rows === 1) { $_SESSION[\'user\'] = $login; header(\'Location: /compte\'); }');
    const rech = ['<?php', "require 'config.php';", ...fill(R.int(2, 6)), "$titre = htmlspecialchars($_GET['titre'] ?? '', ENT_QUOTES);", 'echo "<h1>$titre</h1>";', ...fill(R.int(2, 5))]; const xssIdx = rech.length; rech.push('echo "<p>Résultats pour : " . $_GET[\'q\'] . "</p>";', ...fill(R.int(1, 3)), '?>');
    return { conn: conn.join('\n') + '\n', rech: rech.join('\n') + '\n', sqlLine: sqlIdx + 1, xssLine: xssIdx + 1, hash }; };
  const d2 = tw => defense(tw, 142, 'Utiliser des requêtes préparées, hacher les mots de passe avec password_hash et échapper toute sortie affichée', ['Retirer les apostrophes de la saisie avec une liste noire', 'Passer le hachage de md5 à sha1']);
  M.push({ id: 'SIM14-2', title: 'Application web : relire le code de connexion et de recherche', module: 'SIM14 · Application web', points: 40, difficulty: 3, lesson: 'SIM14-application-web', code: 'SIM14·2', duree: '45 min',
    setup: tw => { const c = code(tw); return { 'reponses.txt': tmpl(['ligne_injection_sql', 'ligne_xss', 'fonction_hachage_faible', 'defense']), 'connexion.php': c.conn, 'recherche.php': c.rech }; },
    enonce: tw => `${head(tw)}
MISSION : revue de code de deux pages PHP (connexion.php et recherche.php). Trouvez les trois défauts.

À FAIRE
  1 ligne_injection_sql      numéro de la ligne de connexion.php qui construit la requête SQL avec la saisie
  2 ligne_xss                numéro de la ligne de recherche.php qui affiche une saisie sans l'échapper
  3 fonction_hachage_faible  la fonction de hachage du mot de passe (md5 ou sha1)
${faceBlue(d2(tw))}
La ligne 'htmlspecialchars' de recherche.php est un contre-exemple : elle est correcte.
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep -n SELECT connexion.php donne le numéro de la ligne de la requête.', 'grep -n "echo" recherche.php liste les affichages : lequel n\'est pas dans htmlspecialchars ?', 'grep -n "md5\\|sha1" connexion.php montre la fonction de hachage.', 'Une variable insérée directement dans une chaîne SQL est injectable.'],
    check: checker('SIM14-2', tw => { const c = code(tw); return [ask('ligne_injection_sql', 'num', c.sqlLine), ask('ligne_xss', 'num', c.xssLine), ask('fonction_hachage_faible', 'txt', c.hash)]; }, d2), finish: 'Code relu : une requête injectable, un affichage non échappé et un hachage faible repérés.' });
}
// ---------------------------------------------------------------- SIM15 : SQL (requête vulnérable simulée, sans base réelle)
{
  const d1 = tw => defense(tw, 151, 'Désactiver l\'affichage des erreurs détaillées côté utilisateur, les journaliser côté serveur et utiliser des requêtes préparées', ['Remplacer le message d\'erreur par un autre texte et garder la requête construite à la main', 'Augmenter la durée de conservation des journaux']);
  M.push({ id: 'SIM15-1', title: 'SQL : une erreur qui en dit trop', module: 'SIM15 · Couche SQL', points: 35, difficulty: 2, lesson: 'SIM15-sql', code: 'SIM15·1', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['code_http_erreur', 'moteur_de_base', 'colonne_du_filtre', 'defense']) }),
    enonce: tw => `${head(tw)}
MISSION : la page http://www.${tw.domain}/produit?id=1 affiche une fiche produit. Que révèle-t-elle quand
son paramètre est invalide ? (Base de démonstration fictive : aucune donnée réelle.)

À FAIRE
  1 code_http_erreur   le code HTTP renvoyé quand id contient une apostrophe (id=1')
  2 moteur_de_base     le moteur de base de données (mysql, postgresql ou sqlite), d'après le message
  3 colonne_du_filtre  le nom de la colonne de filtrage qui apparaît dans le message d'erreur
${faceBlue(d1(tw))}
Encodez l'apostrophe dans l'URL : %27. Utilisez curl -i pour voir le code de réponse.
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['curl -i "http://www.DOMAINE/produit?id=1%27" affiche l\'état HTTP et le message.', 'Le message commence par « ERROR 1064 » et parle de « MySQL server version ».', 'Après « near » apparaît la fin de la requête : un nom de colonne y figure.', 'Une apostrophe dans la saisie casse la requête : elle est donc construite par concaténation.'],
    check: checker('SIM15-1', tw => [ask('code_http_erreur', 'num', 500), ask('moteur_de_base', 'txt', 'mysql'), ask('colonne_du_filtre', 'txt', 'visible')], d1), finish: 'Erreur exploitée en lecture seule : le message révèle le moteur et la structure de la requête.' });
  const d2 = tw => defense(tw, 152, 'Utiliser des requêtes préparées (paramètres liés), un compte de base à droits minimaux et valider le type de id', ['Filtrer le mot OR dans la saisie', 'Cacher la page produit de la navigation']);
  M.push({ id: 'SIM15-2', title: 'SQL : afficher ce que le filtre cache', module: 'SIM15 · Couche SQL', points: 45, difficulty: 3, lesson: 'SIM15-sql', code: 'SIM15·2', duree: '45 min',
    setup: tw => ({ 'reponses.txt': tmpl(['nombre_produits_visibles', 'nombre_produits_total', 'produit_cache', 'prix_produit_cache', 'defense']) }),
    enonce: tw => `${head(tw)}
MISSION : la requête de /produit filtre les produits visibles (colonne visible = 1). Montrez qu'une saisie
construite pour la modifier fait apparaître le produit réservé (démonstration sur la base fictive).

À FAIRE
  1 nombre_produits_visibles   combien de produits la saisie « 1 OR 1=1 » renvoie (le filtre visible reste actif)
  2 nombre_produits_total      combien de produits renvoie la saisie qui neutralise aussi le filtre
  3 produit_cache              le nom du produit qui n'apparaît qu'avec cette saisie
  4 prix_produit_cache         son prix
${faceBlue(d2(tw))}
Indice de méthode : un commentaire SQL (-- suivi d'un espace) supprime le reste de la requête.
Dans l'URL : id=1%20OR%201=1%20--%20
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['curl "http://www.DOMAINE/produit?id=1%20OR%201=1" renvoie tous les produits visibles seulement.', 'Ajoutez %20--%20 : le filtre « AND visible = 1 » est coupé et un produit de plus apparaît.', 'Comptez les lignes avec wc -l ou grep -c nom.', 'Le produit réservé est celui qui n\'était pas dans la première liste.'],
    check: checker('SIM15-2', tw => { const v = tw.db.products.filter(p => p.visible); const h = tw.db.products.find(p => !p.visible); return [ask('nombre_produits_visibles', 'num', v.length), ask('nombre_produits_total', 'num', tw.db.products.length), ask('produit_cache', 'txt', h.nom), ask('prix_produit_cache', 'num', h.prix)]; }, d2), finish: 'Démonstration faite sur la base fictive : une saisie modifie la requête et expose une donnée réservée.' });
}
// ---------------------------------------------------------------- SIM17 : mobile (audit défensif d'une application fictive)
const manifest = tw => { const R = rng(tw.seed * 113 + 1); const bad = R.shuffle(['READ_SMS', 'RECORD_AUDIO', 'READ_CONTACTS', 'READ_CALL_LOG', 'ACCESS_FINE_LOCATION']).slice(0, 2); const dbg = R.pick(['true', 'false']); const bk = R.pick(['true', 'false']); const comp = R.pick(['DeepLinkActivity', 'ExportReceiver', 'FileShareProvider']);
  const perms = R.shuffle(['INTERNET', 'ACCESS_NETWORK_STATE', 'POST_NOTIFICATIONS', ...bad]).map(x => `    <uses-permission android:name="android.permission.${x}"/>`).join('\n');
  const text = `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="example.${tw.slug.replace(/-/g, '')}.rdv">\n${perms}\n    <application android:label="Rendez-vous" android:allowBackup="${bk}" android:debuggable="${dbg}">\n        <activity android:name=".MainActivity" android:exported="true">\n            <intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter>\n        </activity>\n        <service android:name=".sync.SyncService" android:exported="false"/>\n        <receiver android:name=".${comp}" android:exported="true"/>\n        <provider android:name=".SafeProvider" android:exported="false" android:authorities="example.rdv.safe"/>\n    </application>\n</manifest>\n`; return { text, bad, dbg, bk, comp }; };
const appConfig = tw => { const R = rng(tw.seed * 113 + 2); const key = `FAKEKEY-${hex(R, 24)}`; const legacy = `http://api-rdv.${tw.domain}/v2/rendez-vous`; const pin = R.pick(['true', 'false']); const level = R.pick(['DEBUG', 'INFO']);
  const lines = R.shuffle(['app_name=Rendez-vous', `base_url=https://api.${tw.domain}/v1/`, `legacy_endpoint=${legacy}`, `API_KEY=${key}`, `certificate_pinning=${pin}`, `log_level=${level}`, 'locale=fr_FR', `support_mail=support@${tw.domain}`]); return { text: lines.join('\n') + '\n', key, legacy, pin, level }; };
{
  const d1 = tw => defense(tw, 171, 'Retirer les permissions inutiles, désactiver debuggable et allowBackup en production et protéger les composants exportés par une permission', ['Demander ces permissions seulement à la première utilisation sans les justifier', 'Renommer les composants exportés']);
  M.push({ id: 'SIM17-1', title: 'Mobile : relire le manifeste d\'une application', module: 'SIM17 · Mobile', points: 35, difficulty: 2, lesson: 'SIM17-mobile', code: 'SIM17·1', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['permissions_injustifiees', 'debuggable', 'sauvegarde_autorisee', 'composant_exporte_a_risque', 'defense']), 'AndroidManifest.xml': manifest(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : une application de prise de rendez-vous (fictive) doit seulement accéder au réseau et envoyer des
notifications. Relisez son manifeste (AndroidManifest.xml) comme lors d'une revue avant publication.

À FAIRE
  1 permissions_injustifiees   les deux permissions sensibles sans rapport avec la fonction (nom court, ex : READ_SMS)
  2 debuggable                 true ou false
  3 sauvegarde_autorisee       valeur de allowBackup (true ou false)
  4 composant_exporte_a_risque le composant exporté (exported="true") qui n'est pas l'écran d'accueil (nom sans le point initial)
${faceBlue(d1(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep uses-permission AndroidManifest.xml liste les permissions demandées.', 'INTERNET, ACCESS_NETWORK_STATE et POST_NOTIFICATIONS sont justifiées ; les autres non.', 'grep -o \'debuggable="[a-z]*"\' donne la valeur ; même méthode pour allowBackup.', 'grep exported="true" montre les composants accessibles aux autres applications : MainActivity est l\'écran d\'accueil.'],
    check: checker('SIM17-1', tw => { const m = manifest(tw); return [ask('permissions_injustifiees', 'set', m.bad.join(',')), ask('debuggable', 'txt', m.dbg), ask('sauvegarde_autorisee', 'txt', m.bk), ask('composant_exporte_a_risque', 'txt', m.comp)]; }, d1), finish: 'Manifeste audité : permissions superflues et composant exposé relevés.' });
  const d2 = tw => defense(tw, 172, 'Retirer la clé du code et la révoquer, passer en HTTPS partout, activer l\'épinglage de certificat et réduire la verbosité des journaux', ['Encoder la clé en base64 dans l\'application', 'Garder le point d\'accès en HTTP mais derrière un nom discret']);
  M.push({ id: 'SIM17-2', title: 'Mobile : revue de la configuration embarquée', module: 'SIM17 · Mobile', points: 35, difficulty: 2, lesson: 'SIM17-mobile', code: 'SIM17·2', duree: '35 min',
    setup: tw => ({ 'reponses.txt': tmpl(['cle_en_dur', 'adresse_non_chiffree', 'epinglage_actif', 'niveau_de_journalisation', 'defense']), 'config-appli.txt': appConfig(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : la configuration embarquée de l'application (config-appli.txt, fictive) est distribuée à tous les
utilisateurs. Relisez-la avant la mise en production.

À FAIRE
  1 cle_en_dur               la valeur de API_KEY (commence par FAKEKEY-)
  2 adresse_non_chiffree     l'adresse qui commence par http:// (et non https://)
  3 epinglage_actif          valeur de certificate_pinning (true ou false)
  4 niveau_de_journalisation valeur de log_level (DEBUG ou INFO)
${faceBlue(d2(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep KEY config-appli.txt isole la clé.', 'grep "http://" config-appli.txt trouve l\'adresse non chiffrée.', 'grep pinning config-appli.txt et grep log_level config-appli.txt donnent les valeurs.', 'Tout ce qui est dans l\'application est lisible par ses utilisateurs : une clé en dur doit être révoquée.'],
    check: checker('SIM17-2', tw => { const c = appConfig(tw); return [ask('cle_en_dur', 'txt', c.key), ask('adresse_non_chiffree', 'txt', c.legacy), ask('epinglage_actif', 'txt', c.pin), ask('niveau_de_journalisation', 'txt', c.level)]; }, d2), finish: 'Configuration relue : clé en dur, adresse en clair, épinglage et journalisation évalués.' });
}
// ---------------------------------------------------------------- SIM19 : cloud (audit défensif d'un compte fictif)
const cloudData = tw => { const R = rng(tw.seed * 131 + 1); const users = R.shuffle(['svc-sauvegarde', 'svc-site', 'dev-marie', 'dev-paul', 'compta-lea']).slice(0, 4); const root = R.pick(users);
  const pol = users.map(u => `{"utilisateur":"${u}","actions":${u === root ? '["*"]' : '["stockage:Lire"]'},"ressources":${u === root ? '["*"]' : `["arn:fictif:stockage:::${R.pick(['sauvegardes', 'site', 'documents'])}/*"]`}}`).join('\n') + '\n';
  const bkts = R.shuffle(['sauvegardes', 'site-statique', 'documents-rh', 'journaux']); const pub = R.pick(bkts); const rows = bkts.map(b => ({ b, acl: b === pub ? 'public-lecture' : 'prive', enc: R.pick(['oui', 'oui', 'non']), log: R.pick(['oui', 'non']) })); rows[0].enc = 'non'; rows[1].log = 'non';
  const buckets = 'nom;acl;chiffrement;journalisation\n' + rows.map(r => `${r.b};${r.acl};${r.enc};${r.log}`).join('\n') + '\n';
  const dates = R.shuffle(['2024-03-10', '2025-01-18', '2026-09-02', '2026-10-21']); const keys = 'utilisateur;cree_le;derniere_utilisation\n' + users.map((u, i) => `${u};${dates[i]};2026-11-1${i}`).join('\n') + '\n'; const oldest = users[dates.indexOf('2024-03-10')];
  return { pol, buckets, keys, root, pub, oldest, noEnc: rows.filter(r => r.enc === 'non').map(r => r.b), noLog: rows.filter(r => r.log === 'non').map(r => r.b) }; };
{
  const d1 = tw => defense(tw, 191, 'Appliquer le moindre privilège (retirer le droit total), rendre le stockage privé et renouveler les clés anciennes', ['Garder les droits totaux mais changer le nom de l\'utilisateur', 'Rendre le stockage public pour simplifier les accès']);
  M.push({ id: 'SIM19-1', title: 'Cloud : droits trop larges, stockage public, clé ancienne', module: 'SIM19 · Cloud', points: 35, difficulty: 2, lesson: 'SIM19-cloud', code: 'SIM19·1', duree: '40 min',
    setup: tw => { const c = cloudData(tw); return { 'reponses.txt': tmpl(['utilisateur_droits_totaux', 'stockage_public', 'utilisateur_cle_la_plus_ancienne', 'defense']), 'politiques-iam.jsonl': c.pol, 'stockage.csv': c.buckets, 'cles-acces.csv': c.keys }; },
    enonce: tw => `${head(tw)}
MISSION : audit d'un compte cloud fictif de ${tw.orgName} : politiques d'accès (politiques-iam.jsonl), espaces de
stockage (stockage.csv) et clés d'accès (cles-acces.csv).

À FAIRE
  1 utilisateur_droits_totaux        l'utilisateur dont la politique autorise toutes les actions sur toutes les ressources
  2 stockage_public                  l'espace dont l'acl est « public-lecture »
  3 utilisateur_cle_la_plus_ancienne l'utilisateur dont la clé a été créée le plus tôt
${faceBlue(d1(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep \'"actions":\\["\\*"\\]\' politiques-iam.jsonl cherche le droit total.', 'grep public-lecture stockage.csv désigne l\'espace ouvert à tous.', 'sort -t";" -k2 cles-acces.csv trie par date de création (la plus ancienne en premier, hors en-tête).', 'Une clé ancienne et un droit total sont des constats prioritaires.'],
    check: checker('SIM19-1', tw => { const c = cloudData(tw); return [ask('utilisateur_droits_totaux', 'txt', c.root), ask('stockage_public', 'txt', c.pub), ask('utilisateur_cle_la_plus_ancienne', 'txt', c.oldest)]; }, d1), finish: 'Compte cloud audité : privilèges excessifs, stockage ouvert et clé ancienne repérés.' });
  const d2 = tw => defense(tw, 192, 'Activer le chiffrement et la journalisation sur chaque espace de stockage, en commençant par ceux qui contiennent des données personnelles', ['Activer la journalisation seulement sur l\'espace public', 'Supprimer les journaux pour économiser de l\'espace']);
  M.push({ id: 'SIM19-2', title: 'Cloud : chiffrement et journalisation du stockage', module: 'SIM19 · Cloud', points: 30, difficulty: 2, lesson: 'SIM19-cloud', code: 'SIM19·2', duree: '30 min',
    setup: tw => ({ 'reponses.txt': tmpl(['espaces_non_chiffres', 'espaces_sans_journalisation', 'defense']), 'stockage.csv': cloudData(tw).buckets }),
    enonce: tw => `${head(tw)}
MISSION : vérifiez l'hygiène des espaces de stockage fictifs de ${tw.orgName} (stockage.csv).

À FAIRE
  1 espaces_non_chiffres        les espaces dont la colonne chiffrement vaut « non » (séparés par des virgules)
  2 espaces_sans_journalisation les espaces dont la colonne journalisation vaut « non »
${faceBlue(d2(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['awk -F";" \'$3=="non" {print $1}\' stockage.csv liste les espaces non chiffrés.', 'Même méthode avec $4 pour la journalisation.', 'La première ligne est l\'en-tête du tableau : elle ne compte pas.', 'Sans journalisation, un accès anormal ne laisse aucune trace exploitable.'],
    check: checker('SIM19-2', tw => { const c = cloudData(tw); return [ask('espaces_non_chiffres', 'set', c.noEnc.join(',')), ask('espaces_sans_journalisation', 'set', c.noLog.join(','))]; }, d2), finish: 'Stockage évalué : espaces non chiffrés et sans journal identifiés.' });
}
// ---------------------------------------------------------------- SIM20 : cryptographie (audit défensif de certificats)
const certInfo = tw => { const R = rng(tw.seed * 137 + 2); const exp = R.pick(['2026-08-04', '2027-03-14', '2026-12-01', '2028-01-20']); const sig = R.pick(['sha1WithRSAEncryption', 'sha256WithRSAEncryption']); const bits = R.pick([1024, 2048, 4096]);
  const text = `Certificate:\n    Data:\n        Version: 3 (0x2)\n        Signature Algorithm: ${sig}\n        Issuer: CN = Autorite-Demo-${tw.slug}\n        Validity\n            Not Before: 2025-11-14\n            Not After : ${exp}\n        Subject: CN = www.${tw.domain}\n        Public Key Algorithm: rsaEncryption\n            RSA Public-Key: (${bits} bit)\n`; return { text, exp, sig, bits, expired: exp < '2026-11-15' ? 'oui' : 'non' }; };
const certInventory = tw => { const R = rng(tw.seed * 137 + 4); const names = R.shuffle(['www', 'mail', 'vpn', 'api', 'intranet']); const dates = R.shuffle(['2026-09-30', '2026-11-28', '2027-02-10', '2027-08-01', '2026-12-20']); const sigs = R.shuffle(['sha1', 'sha256', 'sha256', 'sha1', 'sha256']);
  const rows = names.map((n, i) => ({ n: `${n}.${tw.domain}`, d: dates[i], s: sigs[i] })); const text = 'hote;expiration;signature\n' + rows.map(r => `${r.n};${r.d};${r.s}`).join('\n') + '\n# date du relevé : 2026-11-15\n';
  return { text, expired: rows.filter(r => r.d < '2026-11-15').map(r => r.n), soon: rows.filter(r => r.d >= '2026-11-15' && r.d <= '2026-12-15').map(r => r.n), weak: rows.filter(r => r.s === 'sha1').map(r => r.n) }; };
{
  const d1 = tw => defense(tw, 201, 'Renouveler le certificat avant son expiration avec une clé d\'au moins 2048 bits et une signature SHA-256, puis automatiser le suivi des échéances', ['Prolonger la date d\'expiration dans l\'affichage du serveur', 'Désactiver la vérification de certificat chez les clients']);
  M.push({ id: 'SIM20-1', title: 'Cryptographie : lire un certificat', module: 'SIM20 · Cryptographie', points: 30, difficulty: 2, lesson: 'SIM20-cryptographie', code: 'SIM20·1', duree: '30 min',
    setup: tw => ({ 'reponses.txt': tmpl(['date_expiration', 'algorithme_signature', 'taille_cle', 'certificat_expire', 'defense']), 'certificat.txt': certInfo(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : relisez le certificat du serveur web www (certificat.txt, fictif, au format d'un relevé openssl).
Nous sommes le 15/11/2026.

À FAIRE
  1 date_expiration       la date « Not After » (format AAAA-MM-JJ)
  2 algorithme_signature  l'algorithme de signature (ex : sha256WithRSAEncryption)
  3 taille_cle            la taille de la clé RSA en bits (nombre)
  4 certificat_expire     oui si la date d'expiration est dépassée, sinon non
${faceBlue(d1(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep "Not After" certificat.txt donne la date de fin de validité.', 'grep Signature certificat.txt donne l\'algorithme : sha1 est obsolète.', 'grep "bit" certificat.txt donne la taille de clé : 1024 bits est insuffisant.', 'Comparez la date d\'expiration à la date du jour (2026-11-15).'],
    check: checker('SIM20-1', tw => { const c = certInfo(tw); return [ask('date_expiration', 'txt', c.exp), ask('algorithme_signature', 'txt', c.sig), ask('taille_cle', 'num', c.bits), ask('certificat_expire', 'txt', c.expired)]; }, d1), finish: 'Certificat lu : échéance, algorithme et taille de clé évalués.' });
  const d2 = tw => defense(tw, 202, 'Renouveler d\'abord les certificats expirés, planifier ceux qui expirent sous 30 jours et remplacer les signatures SHA-1', ['Attendre l\'expiration pour renouveler', 'Remplacer tous les certificats le même jour sans test']);
  M.push({ id: 'SIM20-2', title: 'Cryptographie : inventaire des certificats', module: 'SIM20 · Cryptographie', points: 35, difficulty: 2, lesson: 'SIM20-cryptographie', code: 'SIM20·2', duree: '35 min',
    setup: tw => ({ 'reponses.txt': tmpl(['certificats_expires', 'expirent_sous_30_jours', 'signatures_sha1', 'defense']), 'inventaire-certificats.csv': certInventory(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : inventaire des certificats de ${tw.orgName} (inventaire-certificats.csv, relevé du 15/11/2026).

À FAIRE
  1 certificats_expires      les hôtes dont la date d'expiration est antérieure au 2026-11-15 (séparés par des virgules)
  2 expirent_sous_30_jours   les hôtes dont l'expiration est entre le 2026-11-15 et le 2026-12-15 inclus
  3 signatures_sha1          les hôtes dont la signature est sha1
${faceBlue(d2(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['Les dates au format AAAA-MM-JJ se comparent comme du texte : awk -F";" \'$2<"2026-11-15"\'.', 'Pour la fenêtre de 30 jours, gardez les dates comprises entre 2026-11-15 et 2026-12-15.', 'awk -F";" \'$3=="sha1" {print $1}\' liste les signatures obsolètes.', 'Ignorez la ligne d\'en-tête et la ligne de commentaire (#).'],
    check: checker('SIM20-2', tw => { const c = certInventory(tw); return [ask('certificats_expires', 'set', c.expired.join(',')), ask('expirent_sous_30_jours', 'set', c.soon.join(',')), ask('signatures_sha1', 'set', c.weak.join(','))]; }, d2), finish: 'Inventaire trié : certificats expirés, proches de l\'échéance et à signature obsolète.' });
}
// ---------------------------------------------------------------- SIM23 : SOC, forensic et purple team (analyse défensive)
const authLog = tw => { const R = rng(tw.seed * 149 + 1); const ext = `198.51.100.${R.int(10, 240)}`; const acct = R.pick(['deploy', 'support', 'compta']); const nFail = R.int(12, 25); const rows = []; let t = 2 * 3600 + 40 * 60; const ts = () => { t += R.int(1, 6); return `Nov 15 ${pad2(Math.floor(t / 3600))}:${pad2(Math.floor(t % 3600 / 60))}:${pad2(t % 60)}`; }; let ok = '';
  for (let i = 0; i < 6; i++) rows.push({ t: R.int(0, 7200), l: `Accepted publickey for dsi from ${tw.net}.${R.int(100, 120)} port ${R.int(40000, 60000)} ssh2` });
  const base = []; for (let i = 0; i < nFail; i++) base.push(`Failed password for ${R.pick(['invalid user admin', 'invalid user test', 'root', acct, 'invalid user oracle'])} from ${ext} port ${R.int(30000, 60000)} ssh2`); base.push(`Accepted password for ${acct} from ${ext} port ${R.int(30000, 60000)} ssh2`, `pam_unix(sshd:session): session opened for user ${acct}`);
  const lines = base.map(l => { const x = ts(); if (l.startsWith('Accepted password')) ok = x.slice(7); return `${x} www sshd[${R.int(1000, 9999)}]: ${l}`; }); const others = rows.map(r => `Nov 15 ${pad2(Math.floor(r.t / 3600))}:${pad2(Math.floor(r.t % 3600 / 60))}:${pad2(r.t % 60)} www sshd[${R.int(1000, 9999)}]: ${r.l}`);
  const all = [...lines, ...others].sort(); return { text: all.join('\n') + '\n', ext, acct, nFail: lines.filter(l => l.includes('Failed password')).length, ok }; };
const purple = tw => { const R = rng(tw.seed * 149 + 2); const steps = ['Reconnaissance', 'Accès initial', 'Exécution', 'Persistance', 'Élévation de privilèges', 'Mouvement latéral', 'Collecte', 'Exfiltration']; const miss = R.shuffle(steps.map((_, i) => i)).slice(0, R.int(2, 4)).sort((a, b) => a - b); const rows = steps.map((n, i) => `${i + 1};${n};${miss.includes(i) ? 'non' : 'oui'};${miss.includes(i) ? '-' : `REGLE-${R.int(100, 999)}`}`);
  return { text: 'ordre;etape;detectee;regle\n' + rows.join('\n') + '\n', missing: miss.map(i => steps[i]), first: steps[miss[0]], n: miss.length, rate: Math.round((steps.length - miss.length) / steps.length * 100) }; };
const integrity = tw => { const R = rng(tw.seed * 149 + 3); const files = ['/etc/passwd', '/etc/ssh/sshd_config', '/etc/sudoers', '/usr/bin/sudo', '/usr/sbin/sshd', '/var/www/html/index.php', '/var/www/html/config.php', '/etc/crontab', '/etc/hosts', '/usr/local/bin/sauvegarde']; const added = R.pick(['/var/www/html/.cache.php', '/usr/local/bin/.update', '/etc/cron.d/maintenance']); const mod = R.pick(files.slice(0, 8)); const gone = R.pick(files.slice(8).concat(['/etc/hosts']));
  const ref = files.map(f => `${sha256(f + ':ref:' + tw.seed)}  ${f}`); const cur = files.filter(f => f !== gone).map(f => `${sha256(f + (f === mod ? ':modifie:' : ':ref:') + tw.seed)}  ${f}`); cur.push(`${sha256(added + tw.seed)}  ${added}`);
  return { ref: ref.join('\n') + '\n', cur: R.shuffle(cur).join('\n') + '\n', mod, added, gone }; };
{
  const d1 = tw => defense(tw, 231, 'Bloquer l\'adresse source, désactiver la connexion SSH par mot de passe au profit des clés, limiter les tentatives et vérifier la session du compte', ['Supprimer le journal d\'authentification pour repartir de zéro', 'Changer le port SSH et ne rien vérifier d\'autre']);
  M.push({ id: 'SIM23-1', title: 'SOC : reconstituer une connexion suspecte dans le journal', module: 'SIM23 · SOC, forensic et purple team', points: 35, difficulty: 2, lesson: 'SIM23-soc-forensic', code: 'SIM23·1', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['ip_source', 'compte_utilise', 'nombre_echecs', 'heure_acces_reussi', 'defense']), 'auth.log': authLog(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : l'alerte du SOC signale un accès SSH inhabituel au serveur www cette nuit (auth.log, format syslog).
Reconstituez ce qui s'est passé.

À FAIRE
  1 ip_source          l'adresse externe (198.51.100.x) qui accumule des échecs
  2 compte_utilise     le compte avec lequel elle a fini par se connecter
  3 nombre_echecs      le nombre de lignes « Failed password » venant de cette adresse
  4 heure_acces_reussi l'heure (HH:MM:SS) de la ligne « Accepted password » de cette adresse
${faceBlue(d1(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep "Failed password" auth.log | grep -o "from [0-9.]*" | sort | uniq -c | sort -rn montre les adresses qui échouent.', 'grep "Accepted password" auth.log donne la connexion réussie et le compte.', 'grep -c "Failed password.*ADRESSE" auth.log compte les échecs de cette adresse.', 'La ligne « Accepted publickey » des administrateurs internes est normale : ne la comptez pas.'],
    check: checker('SIM23-1', tw => { const a = authLog(tw); return [ask('ip_source', 'txt', a.ext), ask('compte_utilise', 'txt', a.acct), ask('nombre_echecs', 'num', a.nFail), ask('heure_acces_reussi', 'txt', a.ok)]; }, d1), finish: 'Chronologie établie : une série d\'échecs suivie d\'une connexion réussie depuis l\'extérieur.' });
  const d2 = tw => defense(tw, 232, 'Ajouter des règles de détection pour les étapes non couvertes, rejouer le scénario autorisé et mesurer à nouveau le taux de détection', ['Retirer les étapes non détectées du tableau', 'Désactiver les règles qui génèrent des alertes']);
  M.push({ id: 'SIM23-2', title: 'Purple team : mesurer la couverture de détection', module: 'SIM23 · SOC, forensic et purple team', points: 35, difficulty: 2, lesson: 'SIM23-soc-forensic', code: 'SIM23·2', duree: '35 min',
    setup: tw => ({ 'reponses.txt': tmpl(['etapes_non_detectees', 'nombre_etapes_non_detectees', 'taux_de_detection', 'defense']), 'exercice-purple.csv': purple(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : lors d'un exercice autorisé, l'équipe rouge a déroulé un scénario en huit étapes ; l'équipe bleue note si
chaque étape a déclenché une alerte (exercice-purple.csv).

À FAIRE
  1 etapes_non_detectees          les étapes dont la colonne detectee vaut « non » (noms exacts, séparés par des virgules)
  2 nombre_etapes_non_detectees   leur nombre
  3 taux_de_detection             pourcentage d'étapes détectées, arrondi à l'entier
${faceBlue(d2(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['awk -F";" \'$3=="non" {print $2}\' exercice-purple.csv liste les étapes non détectées.', 'Comptez-les avec wc -l ; le tableau compte 8 étapes.', 'Taux = (8 − non détectées) / 8 × 100.', 'Conservez les accents des noms d\'étapes (Accès initial, Élévation de privilèges…).'],
    check: checker('SIM23-2', tw => { const p = purple(tw); return [ask('etapes_non_detectees', 'set', p.missing.join(',')), ask('nombre_etapes_non_detectees', 'num', p.n), ask('taux_de_detection', 'num', p.rate)]; }, d2), finish: 'Couverture mesurée : vous savez quelles étapes passent inaperçues et quoi ajouter.' });
  const d3 = tw => defense(tw, 233, 'Isoler le serveur, comparer aux sauvegardes saines, analyser le fichier ajouté et restaurer les fichiers modifiés avant remise en service', ['Supprimer le fichier ajouté et remettre le serveur en ligne', 'Recalculer les empreintes de référence à partir de l\'état actuel']);
  M.push({ id: 'SIM23-3', title: 'Forensic : comparer les empreintes de fichiers à la référence', module: 'SIM23 · SOC, forensic et purple team', points: 40, difficulty: 3, lesson: 'SIM23-soc-forensic', code: 'SIM23·3', duree: '40 min',
    setup: tw => { const i = integrity(tw); return { 'reponses.txt': tmpl(['fichier_modifie', 'fichier_ajoute', 'fichier_supprime', 'defense']), 'empreintes-reference.txt': i.ref, 'empreintes-actuelles.txt': i.cur }; },
    enonce: tw => `${head(tw)}
MISSION : un contrôle d'intégrité compare l'état du serveur www à une référence saine (empreintes-reference.txt
et empreintes-actuelles.txt, format sha256sum).

À FAIRE
  1 fichier_modifie    le fichier présent des deux côtés dont l'empreinte a changé
  2 fichier_ajoute     le fichier présent seulement dans l'état actuel
  3 fichier_supprime   le fichier présent seulement dans la référence
${faceBlue(d3(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['sort -k2 sur chaque fichier met les deux listes dans le même ordre (par chemin).', 'awk \'{print $2}\' empreintes-reference.txt | sort > a.txt, puis comparez avec comm.', 'comm -23 liste ce qui n\'est que dans le premier fichier, comm -13 ce qui n\'est que dans le second.', 'Pour le fichier modifié : même chemin, empreinte différente (grep CHEMIN dans chaque fichier).'],
    check: checker('SIM23-3', tw => { const i = integrity(tw); return [ask('fichier_modifie', 'txt', i.mod), ask('fichier_ajoute', 'txt', i.added), ask('fichier_supprime', 'txt', i.gone)]; }, d3), finish: 'Intégrité contrôlée : un fichier modifié, un ajouté et un supprimé par rapport à la référence.' });
}
// ---------------------------------------------------------------- SIM21 : annuaire (audit défensif d'un export fictif)
const adUsers = tw => { const R = rng(tw.seed * 151 + 1); const names = R.shuffle(['amartin', 'bdupont', 'clefort', 'dgarcia', 'emoreau', 'fbernard', 'gpetit', 'hroux', 'ilambert', 'jfournier', 'kgirard', 'lmercier']); const groups = names.map(() => 'Utilisateurs'); const adm = R.shuffle([0, 1, 2, 3, 4]).slice(0, R.int(2, 3)); for (const i of adm) groups[i] = 'Admins du domaine';
  const stale = R.shuffle([2, 5, 6, 7, 8, 9]).slice(0, 3); const noexp = R.shuffle([0, 3, 5, 10, 11]).slice(0, 3);
  const rows = names.map((n, i) => ({ n, g: groups[i], last: stale.includes(i) ? R.pick(['2026-03-02', '2026-05-18', '2026-06-30']) : `2026-11-${pad2(R.int(1, 14))}`, noexp: noexp.includes(i) ? 'oui' : 'non', on: 'oui' })); rows[R.int(5, 11)].on = 'non';
  const staleOn = rows.filter(r => r.last < '2026-08-17' && r.on === 'oui').map(r => r.n); if (!staleOn.length) { rows[stale[0]].on = 'oui'; staleOn.push(rows[stale[0]].n); }
  return { text: 'compte;groupe;derniere_connexion;mdp_sans_expiration;actif\n' + rows.map(r => `${r.n};${r.g};${r.last};${r.noexp};${r.on}`).join('\n') + '\n', nAdm: rows.filter(r => r.g === 'Admins du domaine').length, staleOn: rows.filter(r => r.last < '2026-08-17' && r.on === 'oui').map(r => r.n), noexp: rows.filter(r => r.mdp === undefined && r.noexp === 'oui').map(r => r.n) }; };
const adPolicy = tw => { const R = rng(tw.seed * 151 + 2); const minLen = R.pick([6, 8, 10, 14]); const lock = R.pick([0, 5, 10]); const maxAge = R.pick([0, 90, 180]); const svc = R.shuffle(['svc-sauvegarde', 'svc-web', 'svc-impression', 'svc-supervision']); const adm = R.shuffle(svc).slice(0, 2).sort(); const text = `# Politique de mot de passe du domaine (extrait)\nMinimumPasswordLength = ${minLen}\nMaximumPasswordAge = ${maxAge}\nLockoutBadCount = ${lock}\nPasswordComplexity = 1\n`; const csv = 'compte;groupe\n' + svc.map(x => `${x};${adm.includes(x) ? 'Admins du domaine' : 'Comptes de service'}`).join('\n') + '\n'; return { text, csv, minLen, lock, adm }; };
{
  const d1 = tw => defense(tw, 211, 'Désactiver les comptes inactifs, retirer les droits d\'administration inutiles et imposer l\'expiration des mots de passe', ['Supprimer le groupe Admins du domaine', 'Renommer les comptes inactifs']);
  M.push({ id: 'SIM21-1', title: 'Annuaire : comptes à privilèges, inactifs et sans expiration', module: 'SIM21 · Annuaire', points: 35, difficulty: 2, lesson: 'SIM21-annuaire', code: 'SIM21·1', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['nombre_admins_domaine', 'comptes_inactifs_actifs', 'comptes_sans_expiration', 'defense']), 'export-annuaire.csv': adUsers(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : un export fictif de l'annuaire de ${tw.orgName} (export-annuaire.csv) sert de base à une revue des comptes.
Date du jour : 2026-11-15. Un compte est inactif si sa dernière connexion date de plus de 90 jours (avant le 2026-08-17).

À FAIRE
  1 nombre_admins_domaine     le nombre de comptes du groupe « Admins du domaine »
  2 comptes_inactifs_actifs   les comptes inactifs qui sont encore activés (actif = oui), séparés par des virgules
  3 comptes_sans_expiration   les comptes dont le mot de passe n'expire jamais (colonne mdp_sans_expiration = oui)
${faceBlue(d1(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep -c "Admins du domaine" export-annuaire.csv compte les administrateurs.', 'awk -F";" \'$3<"2026-08-17" && $5=="oui" {print $1}\' liste les comptes inactifs encore activés.', 'awk -F";" \'$4=="oui" {print $1}\' liste les mots de passe sans expiration.', 'Ignorez la ligne d\'en-tête.'],
    check: checker('SIM21-1', tw => { const a = adUsers(tw); return [ask('nombre_admins_domaine', 'num', a.nAdm), ask('comptes_inactifs_actifs', 'set', a.staleOn.join(',')), ask('comptes_sans_expiration', 'set', a.noexp.join(','))]; }, d1), finish: 'Revue faite : privilèges, inactivité et mots de passe sans expiration relevés.' });
  const d2 = tw => defense(tw, 212, 'Porter la longueur minimale à 14 caractères, activer le verrouillage après quelques échecs et retirer les comptes de service du groupe d\'administration', ['Imposer des changements de mot de passe tous les jours', 'Désactiver la complexité pour faciliter la saisie']);
  M.push({ id: 'SIM21-2', title: 'Annuaire : politique de mot de passe et comptes de service', module: 'SIM21 · Annuaire', points: 35, difficulty: 2, lesson: 'SIM21-annuaire', code: 'SIM21·2', duree: '35 min',
    setup: tw => { const p = adPolicy(tw); return { 'reponses.txt': tmpl(['longueur_minimale', 'seuil_de_verrouillage', 'comptes_service_administrateurs', 'defense']), 'politique-mdp.txt': p.text, 'comptes-service.csv': p.csv }; },
    enonce: tw => `${head(tw)}
MISSION : relisez la politique de mot de passe du domaine (politique-mdp.txt) et la liste des comptes de service
(comptes-service.csv).

À FAIRE
  1 longueur_minimale              valeur de MinimumPasswordLength
  2 seuil_de_verrouillage          valeur de LockoutBadCount (0 = jamais de verrouillage)
  3 comptes_service_administrateurs les comptes de service qui appartiennent au groupe « Admins du domaine »
${faceBlue(d2(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep Minimum politique-mdp.txt et grep Lockout politique-mdp.txt donnent les valeurs.', 'Un seuil de 0 veut dire que le compte n\'est jamais verrouillé : essais illimités.', 'grep "Admins du domaine" comptes-service.csv liste les comptes de service à privilèges.', 'Un compte de service n\'a pas besoin de droits d\'administration du domaine.'],
    check: checker('SIM21-2', tw => { const p = adPolicy(tw); return [ask('longueur_minimale', 'num', p.minLen), ask('seuil_de_verrouillage', 'num', p.lock), ask('comptes_service_administrateurs', 'set', p.adm.join(','))]; }, d2), finish: 'Politique relue : longueur, verrouillage et comptes de service à privilèges évalués.' });
}
// ---------------------------------------------------------------- SIM22 : mouvement latéral (détection dans les journaux internes)
const lateral = tw => { const R = rng(tw.seed * 157 + 1); const src = tw.H['compta-pc'].ip; const servers = R.shuffle([['gw', 22], ['www', 22], ['db', 22]]); const n = R.int(2, 3); const rows = []; let t = 13 * 3600 + 5 * 60; const ts = () => { t += R.int(2, 12); return `${pad2(Math.floor(t / 3600))}:${pad2(Math.floor(t % 3600 / 60))}:${pad2(t % 60)}`; };
  for (let i = 0; i < 14; i++) rows.push(`${ts()} ${R.pick([src, `${tw.net}.${R.int(100, 120)}`])} -> ${tw.H.files.ip}:445 smb ok`); const first = servers[0][0]; const seq = servers.slice(0, n).map(([h, p]) => `${tw.H[h].ip}:${p}`); const times = []; for (const d of seq) times.push(`${ts()} ${src} -> ${d} ${d.endsWith(':445') ? 'smb' : 'ssh'} ok`);
  const sorted = [...rows, ...times].sort(); return { text: sorted.join('\n') + '\n', src, n, first, firstTarget: seq[0].split(':')[0] }; };
{
  const d1 = tw => defense(tw, 221, 'Isoler le poste, réinitialiser ses identifiants et segmenter le réseau pour qu\'un poste ne puisse pas joindre directement plusieurs serveurs d\'administration', ['Supprimer les journaux de connexion internes', 'Autoriser tous les postes à joindre tous les serveurs pour simplifier le suivi']);
  M.push({ id: 'SIM22-1', title: 'Mouvement latéral : un poste qui enchaîne les serveurs', module: 'SIM22 · Mouvement latéral', points: 40, difficulty: 3, lesson: 'SIM22-mouvement-lateral', code: 'SIM22·1', duree: '40 min',
    setup: tw => ({ 'reponses.txt': tmpl(['poste_source', 'premier_serveur_atteint', 'nombre_serveurs_atteints', 'defense']), 'connexions-internes.log': lateral(tw).text }),
    enonce: tw => `${head(tw)}
MISSION : le journal des connexions internes (connexions-internes.log) montre un poste qui, en quelques minutes,
se connecte à plusieurs serveurs en SSH, alors que les postes n'accèdent normalement qu'au serveur de fichiers (port 445).

À FAIRE
  1 poste_source             l'adresse du poste qui se connecte en SSH à des serveurs
  2 premier_serveur_atteint  l'adresse du premier serveur contacté en SSH par ce poste
  3 nombre_serveurs_atteints le nombre de serveurs différents contactés par ce poste en SSH
${faceBlue(d1(tw))}
Réponses dans reponses.txt. Validation : defi valider`,
    indices: ['grep ssh connexions-internes.log isole les connexions SSH.', 'awk \'{print $2}\' sur ces lignes | sort -u donne le poste source.', 'La première ligne SSH (par heure) donne le premier serveur : le champ 4 sans le port.', 'Comptez les destinations distinctes avec sort -u | wc -l.'],
    check: checker('SIM22-1', tw => { const l = lateral(tw); return [ask('poste_source', 'txt', l.src), ask('premier_serveur_atteint', 'txt', tw.H[l.first].ip), ask('nombre_serveurs_atteints', 'num', l.n)]; }, d1), finish: 'Enchaînement repéré : un poste a rebondi sur plusieurs serveurs en SSH.' });
}
M.sort((a, b) => a.id.localeCompare(b.id));
export const MISSIONS = M;
export const TW = Object.fromEntries(M.map(m => [m.id, m]));
export function build(def, seed) { const tw = makeTwin(seed); const tools = makeTools(tw); const d = { ...def, twin: true, enonce: def.enonce(tw), name: def.id.toLowerCase(), module: def.module }; d.check = files => def.check(tw, files); d.tw = tw; return { def: d, tw, tools, files: def.setup(tw) }; }
export const GROUP = { name: 'Parcours pentest', steps: M.map(m => ({ code: m.code, title: m.title, file: m.lesson, duree: m.duree, defi: m.id, onWeb: true })) };
export { TOOL_NAMES };
