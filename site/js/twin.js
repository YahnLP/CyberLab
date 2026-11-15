// Jumeau numérique : une plage fictive générée à partir d'une graine. Tout est inventé (domaine .example, plages
// 192.168.x.0/24 et 203.0.113.0/24). Les outils simulés (tools.js), les panneaux et les missions lisent ce même objet.
export function rng(seed) { let a = seed >>> 0; const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { f: next, int: (a, b) => a + Math.floor(next() * (b - a + 1)), pick: l => l[Math.floor(next() * l.length)], shuffle: l => { const r = [...l]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; } }; }

const ORGS = [['Lumen Santé', 'lumen-sante'], ['Atelier Brise', 'atelier-brise'], ['Coopérative Aquitaine Bois', 'aquitaine-bois'], ['Clinique du Pin', 'clinique-du-pin'], ['Mairie de Valbonne', 'valbonne'], ['Imprimerie Landaise', 'imprimerie-landaise']];
const HIDDEN = ['dev', 'recette', 'test', 'preprod', 'ancien-site'];
const NAMES = ['www', 'mail', 'vpn', 'ftp', 'api', 'blog', 'shop', 'intranet', 'wiki', 'extranet', 'portail', 'support'];
const SSH = [['8.4p1', 'Debian 5+deb11u3', 1], ['9.2p1', 'Debian 2+deb12u2', 1]];
const WEB = [['nginx', '1.14.2', 0], ['nginx', '1.18.0', 1], ['nginx', '1.22.1', 1], ['Apache httpd', '2.4.38', 0], ['Apache httpd', '2.4.54', 1]];
const MYSQL = [['MySQL', '5.7.33', 0], ['MySQL', '8.0.32', 1]]; const SAMBA = [['Samba smbd', '4.9.5-Debian', 0], ['Samba smbd', '4.13.13-Debian', 1]];
const EXTRA = [{ port: 21, service: 'ftp', product: 'vsftpd', version: '3.0.3' }, { port: 23, service: 'telnet', product: 'Linux telnetd', version: '' }, { port: 5900, service: 'vnc', product: 'VNC', version: '(protocol 3.8)' }, { port: 8080, service: 'http-proxy', product: 'Jetty', version: '9.4.x' }, { port: 6379, service: 'redis', product: 'Redis key-value store', version: '5.0.14' }, { port: 9200, service: 'http', product: 'Elasticsearch REST API', version: '7.10.2' }];
export const DEFAULT_PORTS = [21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 993, 995, 1723, 3306, 3389, 5900, 8080];
const prodName = p => p.replace(' httpd', '').replace(' smbd', '').toLowerCase();
export const DAY = 'Sun, 15 Nov 2026'; export const SCAN_DATE = '2026-11-15 14:30';

export function makeTwin(seed) {
  const R = rng(seed); const [orgName, slug] = R.pick(ORGS); const domain = slug + '.example'; const N = R.int(20, 200); const net = `192.168.${N}`; const pub = n => `203.0.113.${n}`;
  const badKind = R.pick(['web', 'mysql', 'samba']); const pk = (l, bad) => R.pick(l.filter(x => bad ? !x[2] : x[2]));
  const ssh = R.pick(SSH), web = pk(WEB, badKind === 'web'), my = pk(MYSQL, badKind === 'mysql'), sm = pk(SAMBA, badKind === 'samba');
  const sv = (port, service, product, version, extra = '') => ({ port, proto: 'tcp', state: 'open', service, product, version, extra });
  const hosts = [
    { name: 'gw', ip: `${net}.1`, role: 'routeur / pare-feu', os: 'Linux', up: true, lat: 0.3, ports: [sv(22, 'ssh', 'OpenSSH', `${ssh[0]} ${ssh[1]}`, 'protocol 2.0'), sv(53, 'domain', 'dnsmasq', '2.80')] },
    { name: 'www', ip: `${net}.${R.int(10, 19)}`, pub: pub(R.int(20, 60)), role: 'serveur web', os: 'Linux', up: true, lat: 0.4, ports: [sv(22, 'ssh', 'OpenSSH', `${ssh[0]} ${ssh[1]}`, 'protocol 2.0'), sv(80, 'http', web[0], web[1]), sv(443, 'ssl/http', web[0], web[1])] },
    { name: 'db', ip: `${net}.${R.int(30, 39)}`, role: 'base de données', os: 'Linux', up: true, lat: 0.5, ports: [sv(22, 'ssh', 'OpenSSH', `${ssh[0]} ${ssh[1]}`, 'protocol 2.0'), sv(3306, 'mysql', my[0], my[1])] },
    { name: 'files', ip: `${net}.${R.int(40, 49)}`, role: 'partages de fichiers', os: 'Linux', up: true, lat: 0.6, ports: [sv(22, 'ssh', 'OpenSSH', `${ssh[0]} ${ssh[1]}`, 'protocol 2.0'), sv(445, 'netbios-ssn', sm[0], sm[1])] },
    { name: 'compta-pc', ip: `${net}.${R.int(100, 120)}`, role: 'poste de travail', os: 'Windows', up: true, lat: 1.1, ports: [] },
    { name: 'ancien-nas', ip: `${net}.${R.int(60, 69)}`, role: 'stockage retiré', os: 'Linux', up: false, lat: 0, ports: [] },
    { name: 'imprimante-rdc', ip: `${net}.${R.int(200, 220)}`, role: 'imprimante (non inventoriée)', os: 'embarqué', up: true, lat: 2.3, ports: [sv(80, 'http', 'embedded HTTP', ''), sv(631, 'ipp', 'CUPS', '2.2'), sv(9100, 'jetdirect', '', '')], rdns: false, shadow: true },
    { name: 'poste-audit', ip: `${net}.250`, role: 'votre poste', os: 'Linux', up: true, lat: 0.1, ports: [], self: true },
  ];
  const H = Object.fromEntries(hosts.map(h => [h.name, h]));
  // un service non prévu sur un serveur de l'inventaire
  const exHost = R.pick(['gw', 'www', 'db', 'files']); const ex = R.pick(EXTRA); const exPort = sv(ex.port, ex.service, ex.product, ex.version); H[exHost].ports.push(exPort); H[exHost].ports.sort((a, b) => a.port - b.port);
  // un seul service obsolète (version inférieure au minimum de la politique)
  const webKey = web[0] === 'nginx' ? 'nginx' : 'Apache';
  const MIN = { OpenSSH: '8.4p1', nginx: '1.18.0', Apache: '2.4.46', MySQL: '8.0.28', Samba: '4.13.0' };
  const policyRows = [['OpenSSH', MIN.OpenSSH], [webKey, MIN[webKey]], ['MySQL', MIN.MySQL], ['Samba', MIN.Samba]];
  const outdated = badKind === 'web' ? { host: 'www', product: webKey } : badKind === 'mysql' ? { host: 'db', product: 'MySQL' } : { host: 'files', product: 'Samba' };
  // DNS : public (203.0.113.x) et interne (192.168.x)
  const hidden = R.pick(HIDDEN); const pubNames = R.shuffle(NAMES.filter(n => !['www', 'mail', 'vpn'].includes(n))).slice(0, 2); const dns = [];
  const add = (name, type, value, ttl = 300) => dns.push({ name: name === '@' ? domain : `${name}.${domain}`, type, value, ttl });
  add('www', 'A', H.www.pub); add('mail', 'A', pub(R.int(61, 90))); add('vpn', 'A', pub(R.int(91, 120))); add(hidden, 'A', pub(R.int(121, 150)));
  add('@', 'MX', `10 mail.${domain}.`); add('@', 'NS', `ns1.${domain}.`); add('@', 'NS', `ns2.${domain}.`);
  const spfKind = R.pick(['-all', '~all', '+all']); add('@', 'TXT', `"v=spf1 mx ip4:${dns.find(d => d.name === 'mail.' + domain).value} ${spfKind}"`);
  for (const h of hosts) if (!h.pub && (h.rdns !== false || h.self)) add(h.name, 'A', h.ip);
  // web : routes, en-têtes, fuites
  const secHeaders = ['Strict-Transport-Security', 'X-Frame-Options', 'X-Content-Type-Options', 'Content-Security-Policy']; const present = R.shuffle(secHeaders).slice(0, R.int(0, 2)); const missing = secHeaders.filter(h => !present.includes(h));
  const leakPath = R.pick(['/sauvegardes/', '/old/', '/dev/']); const poweredBy = R.pick(['PHP/7.4.33', 'PHP/8.1.12', null]); const serverHdr = R.f() < 0.75 ? `${web[0] === 'nginx' ? 'nginx' : 'Apache'}/${web[1]}` : (web[0] === 'nginx' ? 'nginx' : 'Apache');
  const leakFile = R.pick(['dump-clients.sql.gz', 'export-2025.csv', 'sauvegarde.tar.gz']);
  const twin = { seed, orgName, slug, domain, net, hosts, H, dns, hidden, spfKind, exHost, exPort, outdated, policy: policyRows, inventory: hosts.filter(h => !h.shadow && !h.self).map(h => ({ name: h.name, ip: h.ip, role: h.role, ports: h.ports.filter(p => p !== exPort).map(p => p.port) })),
    web: { host: H.www, server: serverHdr, poweredBy, present, missing, leakPath, leakFile, tech: web[0] }, events: [], subdomainWords: R.shuffle([...NAMES.slice(0, 9), hidden, 'ns1', 'staging', 'backup']).filter((x, i, a) => a.indexOf(x) === i) };
  // partages SMB (serveur files) et SNMP (imprimante non inventoriée) : tirés dans un générateur séparé pour ne pas décaler les autres données
  const R2 = rng(seed * 977 + 13); const sens = R2.pick([['rh', 'Dossiers RH', 'paie-2026.xlsx'], ['scans', 'Documents numérisés', 'contrats-clients.zip'], ['archives', 'Archives anciennes', 'export-comptabilite.csv']]);
  twin.smb = { host: 'files', shares: [{ name: 'public', comment: 'Documents publics', anon: true, files: [['plaquette.pdf', 482113], ['tarifs-2026.pdf', 120934]] }, { name: sens[0], comment: sens[1], anon: true, sensitive: true, files: [['lisez-moi.txt', 214], [sens[2], R2.int(90000, 900000)]] }, { name: 'compta', comment: 'Comptabilité', anon: false, files: [] }], sensitive: { share: sens[0], file: sens[2] } };
  const fw = R2.pick(['2.4.1', '3.1.0', '4.0.2', '5.2.7']); const model = R2.pick(['Kyocera ECOSYS M2540', 'Ricoh MP 2014', 'Brother MFC-L8690']); const who = R2.pick([['marie', 'durand'], ['paul', 'lenoir'], ['sophie', 'garcia']]);
  twin.snmp = { host: 'imprimante-rdc', candidates: ['public', 'private', 'community', 'admin', 'snmp', slug], community: R2.pick(['public', 'private', 'community']), sysDescr: `${model} firmware ${fw}`, firmware: fw, model, sysName: `IMPR-RDC-${R2.int(10, 99)}`, contact: `${who[0]}.${who[1]}@${domain}`, location: 'Rez-de-chaussée, accueil', serial: `${R2.pick(['VKH', 'W3Q', 'XR7'])}${R2.int(100000, 999999)}` };
  twin.scope = { start: R2.pick([19, 20, 21]), end: 6, excluded: H.db.ip, thirdParty: dns.find(d => d.name === 'mail.' + domain).value };
  return twin;
}
export function cmpVer(a, b) { const pa = String(a).match(/\d+/g)?.map(Number) || [0], pb = String(b).match(/\d+/g)?.map(Number) || [0]; for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d < 0 ? -1 : 1; } return 0; }
export const hostByIp = (tw, ip) => tw.hosts.find(h => h.ip === ip || h.pub === ip);
export function resolve(tw, name) { name = name.replace(/\.$/, '').toLowerCase(); const full = name.includes('.') ? name : `${name}.${tw.domain}`; const r = tw.dns.find(d => d.type === 'A' && d.name === full); return r ? r.value : null; }
export const log = (tw, type, msg, extra = {}) => tw.events.push({ type, msg, ...extra });
