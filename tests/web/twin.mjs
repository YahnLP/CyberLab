// Jumeau numérique : invariants de la plage, puis chaque mission est RÉSOLUE uniquement à partir des sorties des
// outils simulés (comme un stagiaire), puis corrigée. Usage : node tests/web/twin.mjs [NB_GRAINES]
import { makeTwin, cmpVer } from '../../site/js/twin.js'; import { MISSIONS, build } from '../../site/js/missions.js';
import { Shell, Stream } from '../../site/js/shell.js'; import { VFS } from '../../site/js/vfs.js';
const N = +(process.argv[2] || 40); let bad = 0, n = 0; const ko = m => { bad++; if (bad < 25) console.log('KO ' + m); };
// 1. invariants
for (let s = 1; s <= N * 5; s++) {
  const t = makeTwin(s); n++; const ips = t.hosts.map(h => h.ip); if (new Set(ips).size !== ips.length) ko(`graine ${s} : adresses en double`);
  if (t.inventory.some(h => h.name === t.exHost && h.ports.includes(t.exPort.port))) ko(`graine ${s} : le port en trop figure dans l'inventaire`);
  if (t.hosts.filter(h => h.shadow).length !== 1 || t.hosts.filter(h => !h.up).length !== 1) ko(`graine ${s} : hôte inconnu / absent`);
  const an = t.dns.filter(r => r.type === 'A').map(r => r.name); if (new Set(an).size !== an.length) ko(`graine ${s} : nom DNS en double`);
  const o = t.outdated; const p = t.H[o.host].ports.find(p => p.product.startsWith(o.product)); const min = t.policy.find(x => x[0] === o.product)[1]; if (!p || cmpVer(p.version.split(/[ -]/)[0], min) >= 0) ko(`graine ${s} : service obsolète incohérent`);
  const seen = new Set(); for (const h of t.hosts) for (const pp of h.ports) { const k = t.policy.find(x => pp.product.startsWith(x[0])); if (k && cmpVer(pp.version.split(/[ -]/)[0], k[1]) < 0) seen.add(h.name + ':' + k[0]); } const obs = seen.size; if (obs !== 1) ko(`graine ${s} : ${obs} services obsolètes au lieu de 1`);
  const act = t.subdomainWords.filter(w => t.dns.some(r => r.type === 'A' && r.name === `${w}.${t.domain}`)); if (!act.includes(t.hidden) || act.length !== 4) ko(`graine ${s} : sous-domaines actifs ${act}`);
}
// 2. résolution par les outils
const GOOD = { 'EH02-1': /Supprimer l'enregistrement/, 'EH02-2': /Masquer la version/, 'EH02-3': /échec strict/, 'EH03-1': /Identifier le propri/, 'EH03-2': /Limiter l'exposition/, 'EH03-3': /Fermer ou filtrer/ };
const letter = (enonce, re) => { const l = enonce.split('\n').find(l => /^\s+[abc]\) /.test(l) && re.test(l)); return l.trim()[0]; };
async function run(b, cmd) { const fs = new VFS(); fs.mkdirp('/w'); const sh = new Shell(fs, { home: '/w', cwd: '/w', tools: b.tools }); const o = new Stream(); await sh.run(cmd, { in: new Stream(''), out: o, err: o }); return o.s; }
const hostsUp = out => [...out.matchAll(/Nmap scan report for (?:\S+ \()?(\d+\.\d+\.\d+\.\d+)\)?/g)].map(m => m[1]);
const portsOf = out => [...out.matchAll(/^(\d+)\/tcp\s+open\s+(\S+)\s*(.*)$/gm)].map(m => ({ port: +m[1], service: m[2], ver: m[3].trim() }));
const SOLVE = {
  'EH02-1': async (b, f) => { const tw = b.tw; const act = []; for (const w of f['sous-domaines.txt'].trim().split('\n')) if ((await run(b, `host ${w}.${tw.domain}`)).includes('has address')) act.push(w); return { sous_domaines_actifs: act.join(','), ip_www: (await run(b, `dig +short www.${tw.domain}`)).trim(), sous_domaine_oublie: act.find(w => !['www', 'mail', 'vpn'].includes(w)) }; },
  'EH02-2': async (b) => { const d = b.tw.domain; const h = await run(b, `curl -I http://www.${d}/`); const get = k => (h.split('\r\n').find(l => l.toLowerCase().startsWith(k.toLowerCase() + ':')) || '').split(': ').slice(1).join(': ');
    const miss = ['Strict-Transport-Security', 'X-Frame-Options', 'X-Content-Type-Options', 'Content-Security-Policy'].filter(k => !get(k)); const rob = await run(b, `curl http://www.${d}/robots.txt`); let leak = '', file = '';
    for (const p of [...rob.matchAll(/Disallow: (\S+)/g)].map(m => m[1])) { const r = await run(b, `curl -i http://www.${d}${p}`); if (r.includes('200 OK') && r.includes('Index of')) { leak = p; file = /href="([^"]+)"/.exec(r)[1]; } }
    return { version_serveur: get('Server'), en_tetes_manquants: miss.join(','), technologie_exposee: get('X-Powered-By') || 'aucune', chemin_fuite: leak, fichier_expose: file }; },
  'EH02-3': async (b) => { const d = b.tw.domain; const mx = (await run(b, `dig +short MX ${d}`)).trim().split(' '); const txt = await run(b, `dig +short TXT ${d}`); const fin = /([-~+]all)/.exec(txt)[1]; return { serveur_mail: mx[1].replace(/\.$/, ''), priorite_mx: mx[0], filtrage_spf: { '-all': 'strict', '~all': 'souple', '+all': 'aucun' }[fin], ip_autorisee_spf: /ip4:(\S+)/.exec(txt)[1] }; },
  'EH03-1': async (b, f) => { const out = await run(b, `nmap -sn ${b.tw.net}.0/24`); const up = hostsUp(out).filter(i => !i.endsWith('.250')); const inv = f['inventaire.csv'].trim().split('\n').slice(1).map(l => l.split(';')); return { hotes_actifs: String(up.length), hote_inconnu: up.find(i => !inv.some(r => r[1] === i)), hote_absent: inv.find(r => !up.includes(r[1]))[0] }; },
  'EH03-2': async (b) => { const ip = b.tw.H.www.ip; const out = await run(b, `nmap -sV -p- ${ip}`); const ps = portsOf(out); const w = ps.find(p => p.port === 80); const ssh = ps.find(p => p.port === 22); return { ports_ouverts_www: ps.map(p => p.port).join(','), version_web: w.ver, version_ssh_www: /^OpenSSH (\S+)/.exec(ssh.ver)[1] }; },
  'EH03-3': async (b, f) => { const inv = Object.fromEntries(f['inventaire.csv'].trim().split('\n').slice(1).map(l => l.split(';')).map(r => [r[0], { ip: r[1], ports: r[3].split(',').filter(x => x !== '-').map(Number) }])); const pol = f['politique-versions.txt'].split('\n').filter(l => l.includes('>=')).map(l => l.split(' >= ')); const r = {};
    for (const name of ['gw', 'www', 'db', 'files']) { const ps = portsOf(await run(b, `nmap -sV -p- ${inv[name].ip}`)); for (const p of ps) { if (!inv[name].ports.includes(p.port)) { r.hote_port_inattendu = name; r.port_inattendu = String(p.port); } const k = pol.find(x => p.ver.includes(x[0]) || (x[0] === 'Samba' && /Samba/.test(p.ver)) || (x[0] === 'OpenSSH' && /OpenSSH/.test(p.ver))); if (k) { const v = (new RegExp(k[0] + '(?: httpd| smbd)? (\\S+)').exec(p.ver) || [])[1]; if (v && cmpVer(v.split('-')[0], k[1]) < 0) { r.hote_obsolete = name; r.service_obsolete = k[0]; } } } } return r; },
};
for (let s = 1; s <= N; s++) for (const m of MISSIONS) {
  n++; const b = build(m, s * 7919); const files = { ...b.files }; const ans = await SOLVE[m.id](b, files); const keys = Object.keys(ans);
  const mk = (a, defense) => ({ ...files, 'reponses.txt': Object.entries({ ...a, defense }).map(([k, v]) => `${k}=${v}`).join('\n') + '\n' });
  const good = letter(b.def.enonce, GOOD[m.id]); const r = b.def.check(mk(ans, good)); if (!r.ok) ko(`${m.id} graine ${s * 7919} : corrigé refusé ${JSON.stringify(r.lines.filter(l => l.k === 'ko').map(l => l.t))}`);
  if (b.def.check(files).ok) ko(`${m.id} : validé sans rien faire`);
  const wrongLetter = 'abc'.replace(good, '')[0]; if (b.def.check(mk(ans, wrongLetter)).ok) ko(`${m.id} : mauvaise mesure acceptée`);
  const k0 = keys[0]; if (b.def.check(mk({ ...ans, [k0]: 'zzz' }, good)).ok) ko(`${m.id} : réponse fausse acceptée (${k0})`);
  if (!b.tw.events.length) ko(`${m.id} : aucune trace côté défense`);
}
console.log(bad ? `ECHEC (${bad})` : `Jumeau numérique : ${n} contrôles, ${MISSIONS.length} missions résolues par les outils simulés sur ${N} plages`); process.exit(bad ? 1 : 0);
