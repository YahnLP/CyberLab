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
M.sort((a, b) => a.id.localeCompare(b.id));
export const MISSIONS = M;
export const TW = Object.fromEntries(M.map(m => [m.id, m]));
export function build(def, seed) { const tw = makeTwin(seed); const tools = makeTools(tw); const d = { ...def, twin: true, enonce: def.enonce(tw), name: def.id.toLowerCase(), module: def.module }; d.check = files => def.check(tw, files); d.tw = tw; return { def: d, tw, tools, files: def.setup(tw) }; }
export const GROUP = { name: 'Parcours pentest', steps: M.map(m => ({ code: m.code, title: m.title, file: m.lesson, duree: m.duree, defi: m.id, onWeb: true })) };
export { TOOL_NAMES };
