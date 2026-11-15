// Missions du cursus Ethical Hacking (EH) : chacune génère son jumeau numérique à partir d'une graine, puis se corrige
// sur les FAITS du jumeau (pas sur une commande précise) avec une face Red (observer) et une face Blue (défendre).
import { makeTwin, rng, hostByIp } from './twin.js';
import { makeTools, TOOL_NAMES } from './tools.js';
const given = (files, key) => { const t = files['reponses.txt']; if (t === undefined) return ''; for (const l of t.split('\n')) if (l.startsWith(key + '=')) return l.slice(key.length + 1).replace(/^\s+|\s+$/g, ''); return ''; };
const normList = v => [...new Set(v.toLowerCase().replace(/[èé]/g, 'e').replace(/\s+/g, '').split(',').filter(Boolean))].sort().join(',');
const normTxt = v => v.toLowerCase().replace(/\s+/g, ' ').trim();
const NODOT = v => v.replace(/\.$/, '');
// Question de défense à choix : l'ordre des propositions dépend de la graine (la bonne lettre change).
function defense(tw, salt, good, bads) { const R = rng(tw.seed * 31 + salt); const all = R.shuffle([good, ...bads]); const L = 'abc'; return { text: all.map((t, i) => `    ${L[i]}) ${t}`).join('\n'), correct: L[all.indexOf(good)] }; }
const tmpl = keys => `# Une ligne par constat : cle=valeur (sans espace autour du signe =)\n` + keys.map(k => `${k}=`).join('\n') + '\n';
const BASE_FILES = tw => ({});
const TOOLS_NOTE = 'Outils simulés disponibles : ping, host, dig, nslookup, nmap, curl (cibles fictives, aucun trafic réel).';
const PTS = (n) => n;

// kind : 'set' (liste normalisée), 'txt' (texte normalisé), 'num' (exact)
const ask = (key, kind, expected) => ({ key, kind, expected });
function checker(title, items, defOpt) {
  return (tw, files) => {
    const out = []; let fail = false; const say = (k, t) => out.push({ k, t });
    say('phase', '1. OBSERVER (Red) · constats chiffrés');
    for (const it of items(tw)) { const v = given(files, it.key); if (!v) { say('ko', `${it.key} : non renseigné`); fail = true; continue; }
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
// ---------------------------------------------------------------- EH02
{
  const d1 = tw => defense(tw, 1, `Supprimer l'enregistrement DNS ${tw.hidden} et arrêter le service qu'il désigne s'il est inutile`, ['Laisser en place : un nom peu connu n\'est pas exposé', 'Changer le nom du sous-domaine pour le rendre plus discret']);
  M.push({ id: 'EH02-1', title: 'Reconnaissance : noms publics du domaine', module: 'EH02 · Footprinting & Reconnaissance', points: 30, difficulty: 1, lesson: 'P1-reconnaissance-perimetre', code: 'EH02·1', duree: '35 min',
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
    check: checker('EH02-1', tw => [ask('sous_domaines_actifs', 'set', tw.subdomainWords.filter(w => tw.dns.some(r => r.type === 'A' && r.name === `${w}.${tw.domain}`)).join(',')), ask('ip_www', 'txt', tw.H.www.pub), ask('sous_domaine_oublie', 'txt', tw.hidden)], d1), finish: 'Reconnaissance passive terminée : vous avez retrouvé l\'actif oublié.' });
  const d2 = tw => defense(tw, 2, 'Masquer la version, ajouter les en-têtes de sécurité manquants et retirer l\'accès public à l\'index exposé', ['Interdire les robots dans robots.txt et ne rien changer d\'autre', 'Remplacer le certificat TLS par un certificat plus long']);
  M.push({ id: 'EH02-2', title: 'Reconnaissance : en-têtes et fuites d\'un serveur web', module: 'EH02 · Footprinting & Reconnaissance', points: 35, difficulty: 2, lesson: 'P1-reconnaissance-perimetre', code: 'EH02·2', duree: '40 min',
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
    check: checker('EH02-2', tw => [ask('version_serveur', 'txt', tw.web.server), ask('en_tetes_manquants', 'set', tw.web.missing.join(',')), ask('technologie_exposee', 'txt', tw.web.poweredBy || 'aucune'), ask('chemin_fuite', 'txt', tw.web.leakPath), ask('fichier_expose', 'txt', tw.web.leakFile)], d2), finish: 'Surface web lue sans rien casser : vous avez trouvé la fuite.' });
  const d3 = tw => defense(tw, 3, 'Passer la politique SPF en échec strict (-all), puis ajouter DKIM et DMARC', ['Ajouter une deuxième adresse IP autorisée dans le SPF', 'Supprimer l\'enregistrement MX pour masquer le serveur de messagerie']);
  M.push({ id: 'EH02-3', title: 'Reconnaissance : messagerie et enregistrements SPF', module: 'EH02 · Footprinting & Reconnaissance', points: 25, difficulty: 2, lesson: 'P1-reconnaissance-perimetre', code: 'EH02·3', duree: '30 min',
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
    check: checker('EH02-3', tw => [ask('serveur_mail', 'txt', NODOT(tw.dns.find(r => r.type === 'MX').value.split(' ')[1])), ask('priorite_mx', 'num', 10), ask('filtrage_spf', 'txt', { '-all': 'strict', '~all': 'souple', '+all': 'aucun' }[tw.spfKind]), ask('ip_autorisee_spf', 'txt', tw.dns.find(r => r.name === 'mail.' + tw.domain).value)], d3), finish: 'Messagerie cartographiée : vous savez qui peut usurper le domaine.' });
}
// ---------------------------------------------------------------- EH03
{
  const inv = tw => 'hote;ip;role;ports_attendus\n' + tw.inventory.map(h => `${h.name};${h.ip};${h.role};${h.ports.join(',') || '-'}`).join('\n') + '\n';
  const d4 = tw => defense(tw, 4, 'Identifier le propriétaire de l\'équipement inconnu, l\'isoler dans un réseau dédié et mettre l\'inventaire à jour', ['Ignorer : une imprimante ne présente aucun risque', 'Éteindre toute la plage réseau jusqu\'à nouvel ordre']);
  M.push({ id: 'EH03-1', title: 'Scan : découvrir les hôtes actifs', module: 'EH03 · Scanning Networks', points: 30, difficulty: 1, lesson: 'P2-inventaire-reseau', code: 'EH03·1', duree: '35 min',
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
    check: checker('EH03-1', tw => [ask('hotes_actifs', 'num', tw.hosts.filter(h => h.up && !h.self).length), ask('hote_inconnu', 'txt', tw.hosts.find(h => h.shadow).ip), ask('hote_absent', 'txt', tw.hosts.find(h => !h.up).name)], d4), finish: 'Écarts d\'inventaire trouvés : un équipement inconnu et un hôte disparu.' });
  const d5 = tw => defense(tw, 5, 'Limiter l\'exposition : n\'ouvrir que les ports utiles et filtrer le reste au pare-feu', ['Fermer uniquement le port 22 sur tous les serveurs', 'Désactiver la journalisation pour réduire le bruit']);
  M.push({ id: 'EH03-2', title: 'Scan : cartographier les ports du serveur web', module: 'EH03 · Scanning Networks', points: 35, difficulty: 2, lesson: 'HAC3-reconnaissance-services', code: 'EH03·2', duree: '40 min',
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
    check: checker('EH03-2', tw => [ask('ports_ouverts_www', 'set', tw.H.www.ports.map(p => p.port).join(',')), ask('version_web', 'txt', `${tw.H.www.ports.find(p => p.port === 80).product} ${tw.H.www.ports.find(p => p.port === 80).version}`), ask('version_ssh_www', 'txt', tw.H.www.ports.find(p => p.port === 22).version.split(' ')[0])], d5), finish: 'Carte des ports complète, y compris hors des ports courants.' });
  const d6 = tw => defense(tw, 6, 'Fermer ou filtrer le port non prévu, puis mettre à jour le service obsolète en planifiant un retest', ['Passer toutes les versions en « dernière version » le jour même sans test', 'Masquer les bannières et conserver les versions actuelles']);
  M.push({ id: 'EH03-3', title: 'Scan : écart avec l\'inventaire et la politique de versions', module: 'EH03 · Scanning Networks', points: 40, difficulty: 3, lesson: 'HAC3-reconnaissance-services', code: 'EH03·3', duree: '50 min',
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
    check: checker('EH03-3', tw => [ask('hote_port_inattendu', 'txt', tw.exHost), ask('port_inattendu', 'num', tw.exPort.port), ask('hote_obsolete', 'txt', tw.outdated.host), ask('service_obsolete', 'txt', tw.outdated.product)], d6), finish: 'Écarts relevés : un port en trop et un service sous le minimum.' });
}
export const MISSIONS = M;
export const TW = Object.fromEntries(M.map(m => [m.id, m]));
export function build(def, seed) { const tw = makeTwin(seed); const tools = makeTools(tw); const d = { ...def, twin: true, enonce: def.enonce(tw), name: def.id.toLowerCase(), module: def.module }; d.check = files => def.check(tw, files); d.tw = tw; return { def: d, tw, tools, files: def.setup(tw) }; }
export const GROUP = { name: 'Cursus Ethical Hacking', steps: M.map(m => ({ code: m.code, title: m.title, file: m.lesson, duree: m.duree, defi: m.id, onWeb: true })) };
export { TOOL_NAMES };
