// Outils simulés (ping, dig, host, nslookup, nmap, curl) : ils lisent le jumeau numérique et affichent des sorties au
// format des vrais outils. Aucun trafic réel. Chaque action laisse une trace côté défense (twin.events).
import { DEFAULT_PORTS, DAY, SCAN_DATE, hostByIp, resolve, log } from './twin.js';
const pad = (s, n) => String(s).padEnd(n);
const isIp = s => /^\d{1,3}(\.\d{1,3}){3}$/.test(s);
const ipNum = ip => ip.split('.').reduce((a, b) => a * 256 + +b, 0);

export function makeTools(tw) {
  const err = io => io.err || io.out; const ME = tw.H['poste-audit'].ip;
  // --- DNS -------------------------------------------------------------
  const lookup = (name, type) => { name = name.replace(/\.$/, '').toLowerCase(); if (type === 'PTR') return []; return tw.dns.filter(d => d.name === name && (type === 'ANY' || d.type === type)); };
  const ptr = ip => { const h = tw.hosts.find(h => (h.ip === ip) && h.rdns !== false); return h ? `${h.name}.${tw.domain}.` : null; };
  const rev = ip => ip.split('.').reverse().join('.') + '.in-addr.arpa';
  const digOut = (qname, type, recs, status, short) => {
    if (short) return recs.map(r => r.value).join('\n') + (recs.length ? '\n' : '');
    const id = 20000 + (qname.length * 977) % 40000; const q = qname.endsWith('.') ? qname : qname + '.';
    let o = `\n; <<>> DiG 9.18.19-1~deb12u1-Debian <<>> ${qname}${type !== 'A' ? ' ' + type : ''}\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: ${status}, id: ${id}\n;; flags: qr rd ra; QUERY: 1, ANSWER: ${recs.length}, AUTHORITY: 0, ADDITIONAL: 1\n\n;; OPT PSEUDOSECTION:\n; EDNS: version: 0, flags:; udp: 1232\n;; QUESTION SECTION:\n;${q}\t\tIN\t${type}\n\n`;
    if (recs.length) { o += ';; ANSWER SECTION:\n'; for (const r of recs) o += `${r.name.endsWith('.') ? r.name : r.name + '.'}\t${r.ttl}\tIN\t${r.type}\t${r.value}\n`; o += '\n'; }
    return o + `;; Query time: ${3 + (qname.length % 17)} msec\n;; SERVER: ${tw.H.gw.ip}#53(${tw.H.gw.ip}) (UDP)\n;; WHEN: ${DAY} 14:30:12 UTC\n;; MSG SIZE  rcvd: ${60 + qname.length + recs.length * 20}\n\n`;
  };
  async function dig(args, io) {
    let short = false, type = 'A', name = null; const pos = []; for (const a of args) { if (a === '+short') short = true; else if (a.startsWith('@') || a.startsWith('+') || a === '-x') continue; else pos.push(a); }
    const isType = a => /^(A|AAAA|MX|NS|TXT|CNAME|SOA|PTR|ANY|AXFR)$/i.test(a); for (const a of pos) { if (isType(a) && pos.some(x => x !== a && !isType(x))) type = a.toUpperCase(); else if (!name) name = a; }
    if (args.includes('-x')) { const ip = args.find(a => isIp(a)); const r = ip && ptr(ip); log(tw, 'dns', `Requête DNS inverse pour ${ip}`, { src: ME }); if (short) { io.out.write(r ? r + '\n' : ''); return 0; } io.out.write(digOut(rev(ip || ''), 'PTR', r ? [{ name: rev(ip), ttl: 3600, type: 'PTR', value: r }] : [], r ? 'NOERROR' : 'NXDOMAIN', false)); return 0; }
    if (!name) { io.out.write('; <<>> DiG 9.18.19 <<>>\n'); return 0; }
    if (type === 'AXFR') { io.out.write(`\n; <<>> DiG 9.18.19-1~deb12u1-Debian <<>> ${name} AXFR\n;; global options: +cmd\n; Transfer failed.\n`); log(tw, 'dns', `Tentative de transfert de zone (AXFR) sur ${name} refusée`, { src: ME, sev: 'alerte' }); return 9; }
    const full = name.replace(/\.$/, '').toLowerCase(); const recs = lookup(full, type); log(tw, 'dns', `Requête ${type} pour ${full}`, { src: ME });
    io.out.write(digOut(full, type, recs, recs.length || tw.dns.some(d => d.name === full) ? 'NOERROR' : 'NXDOMAIN', short)); return 0;
  }
  async function host(args, io) {
    let type = null; const rest = []; for (let i = 0; i < args.length; i++) { if (args[i] === '-t') type = (args[++i] || '').toUpperCase(); else if (args[i].startsWith('-')) continue; else rest.push(args[i]); }
    const name = rest[0]; if (!name) { err(io).write('Usage: host [-t type] name [server]\n'); return 1; }
    log(tw, 'dns', `host ${name}`, { src: ME });
    if (isIp(name)) { const r = ptr(name); if (!r) { io.out.write(`Host ${rev(name).replace('.in-addr.arpa.', '')}.in-addr.arpa. not found: 3(NXDOMAIN)\n`); return 1; } io.out.write(`${rev(name)} domain name pointer ${r}\n`); return 0; }
    const full = name.replace(/\.$/, '').toLowerCase(); const out = []; const types = type ? [type] : ['A', 'MX'];
    for (const t of types) for (const r of lookup(full, t)) out.push(r.type === 'A' ? `${full} has address ${r.value}` : r.type === 'MX' ? `${full} mail is handled by ${r.value}` : r.type === 'NS' ? `${full} name server ${r.value}` : r.type === 'TXT' ? `${full} descriptive text ${r.value}` : `${full} ${r.type} ${r.value}`);
    if (!out.length) { io.out.write(`Host ${full} not found: 3(NXDOMAIN)\n`); return 1; } io.out.write(out.join('\n') + '\n'); return 0;
  }
  async function nslookup(args, io) {
    const pos = args.filter(a => !a.startsWith('-')); const name = pos[0]; if (!name) { err(io).write('nslookup : mode interactif non disponible\n'); return 1; }
    const type = (args.find(a => a.startsWith('-type=')) || '-type=A').slice(6).toUpperCase(); const full = name.replace(/\.$/, '').toLowerCase(); log(tw, 'dns', `nslookup ${full}`, { src: ME });
    let o = `Server:\t\t${tw.H.gw.ip}\nAddress:\t${tw.H.gw.ip}#53\n\n`; const recs = lookup(full, type);
    if (!recs.length) { io.out.write(`${o}** server can't find ${full}: NXDOMAIN\n`); return 1; }
    o += 'Non-authoritative answer:\n'; for (const r of recs) o += r.type === 'A' ? `Name:\t${r.name}\nAddress: ${r.value}\n` : r.type === 'MX' ? `${r.name}\tmail exchanger = ${r.value}\n` : r.type === 'NS' ? `${r.name}\tnameserver = ${r.value}\n` : `${r.name}\ttext = ${r.value}\n`; io.out.write(o + '\n'); return 0;
  }
  // --- ping ------------------------------------------------------------
  async function ping(args, io) {
    let c = 4; const rest = []; for (let i = 0; i < args.length; i++) { if (args[i] === '-c') c = Math.min(+args[++i] || 4, 10); else if (!args[i].startsWith('-')) rest.push(args[i]); }
    const t = rest[0]; if (!t) { err(io).write('ping: usage error: Destination address required\n'); return 2; }
    const ip = isIp(t) ? t : resolve(tw, t); if (!ip) { err(io).write(`ping: ${t}: Name or service not known\n`); return 2; }
    const h = hostByIp(tw, ip); log(tw, 'icmp', `ping vers ${ip}`, { src: ME });
    let o = `PING ${t} (${ip}) 56(84) bytes of data.\n`;
    if (!h || !h.up) { for (let i = 1; i <= c; i++) o += `From ${ME} icmp_seq=${i} Destination Host Unreachable\n`; o += `\n--- ${t} ping statistics ---\n${c} packets transmitted, 0 received, +${c} errors, 100% packet loss, time ${(c - 1) * 1000 + 3}ms\n\n`; io.out.write(o); return 1; }
    for (let i = 1; i <= c; i++) o += `64 bytes from ${h.rdns === false ? ip : `${h.name}.${tw.domain} (${ip})`}: icmp_seq=${i} ttl=${h.os === 'Windows' ? 128 : 64} time=${(h.lat + i * 0.03).toFixed(2)} ms\n`;
    o += `\n--- ${t} ping statistics ---\n${c} packets transmitted, ${c} received, 0% packet loss, time ${(c - 1) * 1001}ms\nrtt min/avg/max/mdev = ${h.lat.toFixed(3)}/${(h.lat + 0.06).toFixed(3)}/${(h.lat + 0.12).toFixed(3)}/0.035 ms\n`; io.out.write(o); return 0;
  }
  // --- nmap ------------------------------------------------------------
  const parsePorts = spec => { if (spec === '-') return Array.from({ length: 65535 }, (_, i) => i + 1); const out = new Set(); for (const part of spec.split(',')) { const m = /^(\d+)-(\d+)$/.exec(part); if (m) for (let p = +m[1]; p <= +m[2]; p++) out.add(p); else if (/^\d+$/.test(part)) out.add(+part); } return [...out].sort((a, b) => a - b); };
  const targets = spec => { spec = spec.trim(); const cidr = /^(\d+\.\d+\.\d+)\.0\/24$/.exec(spec); if (cidr) { const out = []; for (let i = 0; i <= 255; i++) out.push(`${cidr[1]}.${i}`); return { ips: out, label: spec }; } if (isIp(spec)) return { ips: [spec], label: spec }; const ip = resolve(tw, spec); return ip ? { ips: [ip], label: spec } : null; };
  async function nmap(args, io) {
    let sn = false, sV = false, ports = null, F = false, openOnly = false, tgt = null; for (let i = 0; i < args.length; i++) { const a = args[i]; if (a === '-sn' || a === '-sP') sn = true; else if (a === '-sV') sV = true; else if (a === '-F') F = true; else if (a === '--open') openOnly = true; else if (a === '-p') ports = args[++i]; else if (a.startsWith('-p') && a.length > 2) ports = a.slice(2); else if (a === '-p-') ports = '-'; else if (a.startsWith('-')) continue; else tgt = a; }
    if (!tgt) { err(io).write('Nmap 7.93 ( https://nmap.org )\nUsage: nmap [Scan Type(s)] [Options] {target specification}\n'); return 1; }
    const T = targets(tgt); if (!T) { err(io).write(`Failed to resolve "${tgt}".\nWARNING: No targets were specified, so 0 hosts scanned.\n`); io.out.write(`Nmap done: 0 IP addresses (0 hosts up) scanned in 0.03 seconds\n`); return 1; }
    const portList = ports ? parsePorts(ports) : F ? DEFAULT_PORTS.slice(0, 10) : DEFAULT_PORTS; const wide = ports === '-' || portList.length > 1000; const total = ports ? portList.length : 1000;
    let o = `Starting Nmap 7.93 ( https://nmap.org ) at ${SCAN_DATE} UTC\n`; let up = 0; const t0 = T.ips.length;
    log(tw, 'scan', sn ? `Balayage de découverte vu par le pare-feu : ${t0} adresse(s) sondée(s) depuis ${ME}` : `Scan de ports${sV ? ' avec détection de versions' : ''} vu par le pare-feu : ${T.label} depuis ${ME}${wide ? ' (65 535 ports)' : ''}`, { src: ME, sev: t0 > 1 || wide || sV ? 'alerte' : 'info', n: t0 });
    for (const ip of T.ips) {
      const h = hostByIp(tw, ip); if (!h || !h.up) { if (T.ips.length === 1) o += `Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn\n`; continue; } up++;
      const nm = h.rdns === false || h.self ? (h.self ? `${h.name}.${tw.domain}` : '') : `${h.name}.${tw.domain}`; const head = nm ? `${nm} (${ip})` : ip;
      o += `Nmap scan report for ${head}\nHost is up (${h.lat.toFixed(5)}s latency).\n`;
      if (sn) continue;
      const open = h.ports.filter(p => portList.includes(p.port) && (!ports || true)); const hidden = (ports ? portList.length : total) - open.length;
      if (!open.length) { o += `All ${ports ? portList.length : 1000} scanned ports on ${head} are in ignored states.\nNot shown: ${ports ? portList.length : 1000} closed tcp ports (conn-refused)\n`; continue; }
      if (hidden > 0 && !openOnly) o += `Not shown: ${hidden} closed tcp ports (conn-refused)\n`;
      const w = Math.max(...open.map(p => `${p.port}/tcp`.length), 4); const w2 = Math.max(...open.map(p => p.service.length), 7) + 1; o += `${pad('PORT', w)} STATE ${sV ? pad('SERVICE', w2) + 'VERSION' : 'SERVICE'}\n`;
      for (const p of open) { const ver = [p.product, p.version].filter(Boolean).join(' ') + (p.extra ? ` (${p.extra})` : ''); o += `${pad(p.port + '/tcp', w)} open  ${sV ? pad(p.service, w2) + ver : p.service}\n`; }
      if (sV) o += `Service Info: OS: ${h.os === 'Windows' ? 'Windows' : 'Linux'}; CPE: cpe:/o:${h.os === 'Windows' ? 'microsoft:windows' : 'linux:linux_kernel'}\n`;
    }
    o += `\nNmap done: ${T.ips.length} IP address${T.ips.length > 1 ? 'es' : ''} (${up} host${up > 1 ? 's' : ''} up) scanned in ${(1.8 + T.ips.length * 0.012 + (wide ? 4.6 : 0) + (sV ? up * 3.1 : 0)).toFixed(2)} seconds\n`;
    io.out.write(o.replace(/\n\nNmap done/, '\n\nNmap done')); return 0;
  }
  // --- web / curl ------------------------------------------------------
  const W = tw.web;
  const htmlHome = `<!DOCTYPE html>\n<html lang="fr"><head><title>${tw.orgName} - Accueil</title></head>\n<body><h1>${tw.orgName}</h1><p>Bienvenue sur le site de démonstration.</p><a href="/admin">Espace administration</a></body></html>\n`;
  const hdrs = (status, ctype, extra = []) => { const h = [`HTTP/1.1 ${status}`, `Server: ${W.server}`, `Date: ${DAY} 14:30:12 GMT`, `Content-Type: ${ctype}`]; if (W.poweredBy) h.push(`X-Powered-By: ${W.poweredBy}`); for (const n of W.present) h.push(n === 'Strict-Transport-Security' ? `${n}: max-age=31536000` : n === 'X-Frame-Options' ? `${n}: DENY` : n === 'X-Content-Type-Options' ? `${n}: nosniff` : `${n}: default-src 'self'`); return [...h, ...extra, 'Connection: keep-alive']; };
  const routes = { '/': () => ({ s: '200 OK', ct: 'text/html; charset=UTF-8', b: htmlHome, x: ['Set-Cookie: session=demo; Path=/'] }), '/index.html': () => routes['/'](), '/robots.txt': () => ({ s: '200 OK', ct: 'text/plain', b: `User-agent: *\nDisallow: /admin/\nDisallow: ${W.leakPath}\n` }), '/admin': () => ({ s: '301 Moved Permanently', ct: 'text/html', b: '', x: ['Location: /admin/'] }), '/admin/': () => ({ s: '401 Unauthorized', ct: 'text/html', b: '<h1>401 Authorization Required</h1>\n', x: ['WWW-Authenticate: Basic realm="Administration"'] }), '/api/health': () => ({ s: '200 OK', ct: 'application/json', b: '{"status":"ok"}\n' }), '/api/users': () => ({ s: '401 Unauthorized', ct: 'application/json', b: '{"error":"authentification requise"}\n' }), [W.leakPath]: () => ({ s: '200 OK', ct: 'text/html', b: `<html><head><title>Index of ${W.leakPath}</title></head><body><h1>Index of ${W.leakPath}</h1><pre><a href="${W.leakFile}">${W.leakFile}</a>   12-Nov-2026 02:00  48M</pre></body></html>\n` }) };
  const httpGet = (path, method = 'GET') => { const key = path.split('?')[0]; const r = routes[key]; const res = r ? r() : { s: '404 Not Found', ct: 'text/html', b: '<html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1></body></html>\n' }; return { status: res.s, headers: hdrs(res.s, res.ct, res.x || []), body: method === 'HEAD' ? '' : res.b }; };
  async function curl(args, io) {
    let head = false, incl = false, silent = false, follow = false, w = null, hostH = null, url = null; for (let i = 0; i < args.length; i++) { const a = args[i]; if (a === '-I' || a === '--head') head = true; else if (a === '-i' || a === '--include') incl = true; else if (a === '-s' || a === '--silent') silent = true; else if (a === '-L') follow = true; else if (a === '-w') w = args[++i]; else if (a === '-H') { const m = /^Host:\s*(.+)$/i.exec(args[++i] || ''); if (m) hostH = m[1]; } else if (a === '-o' || a === '-X' || a === '-A' || a === '-d' || a === '-u') i++; else if (a.startsWith('-')) continue; else url = a; }
    if (!url) { err(io).write('curl: try \'curl --help\' for more information\n'); return 2; }
    const m = /^(https?):\/\/([^/:]+)(?::(\d+))?(\/[^\s]*)?$/.exec(url.includes('://') ? url : 'http://' + url); if (!m) { err(io).write(`curl: (3) URL rejected: Malformed input to a URL function\n`); return 3; }
    const [, scheme, hst, prt, p0] = m; const path = p0 || '/'; const ip = isIp(hst) ? hst : resolve(tw, hst); if (!ip) { err(io).write(silent ? '' : `curl: (6) Could not resolve host: ${hst}\n`); return 6; }
    const h = hostByIp(tw, ip); const port = prt ? +prt : scheme === 'https' ? 443 : 80;
    if (!h || !h.up || !h.ports.some(p => p.port === port)) { err(io).write(silent ? '' : `curl: (7) Failed to connect to ${hst} port ${port} after 3 ms: Couldn't connect to server\n`); return 7; }
    log(tw, 'web', `${head ? 'HEAD' : 'GET'} ${path} sur ${hst}`, { src: ME });
    if (h !== W.host) { const body = '<html><body>Interface embarquée</body></html>\n'; if (head || incl) io.out.write(['HTTP/1.1 200 OK', 'Content-Type: text/html', 'Connection: close', '', ''].join('\r\n')); if (!head) io.out.write(body); return 0; }
    let cur = path, res = httpGet(cur, head ? 'HEAD' : 'GET'), hops = 0; while (follow && /^30[12]/.test(res.status) && hops++ < 5) { const loc = res.headers.find(x => x.startsWith('Location: ')).slice(10); cur = loc; res = httpGet(cur, head ? 'HEAD' : 'GET'); }
    let o = ''; if (head || incl) o += res.headers.join('\r\n') + '\r\n\r\n'; if (!head) o += res.body; if (w) o += w.replace('%{http_code}', res.status.split(' ')[0]).replace(/\\n/g, '\n'); io.out.write(o); return 0;
  }
  // --- SMB / SNMP ------------------------------------------------------
  const target = t => { const ip = isIp(t) ? t : resolve(tw, t); return ip ? hostByIp(tw, ip) : null; };
  const fileDate = 'Sun Nov 15 09:12:44 2026';
  async function smbclient(args, io) {
    let list = false, anon = false, user = null, cmd = null, tgt = null; for (let i = 0; i < args.length; i++) { const a = args[i]; if (a === '-L') { list = true; const n = args[i + 1]; if (n && !n.startsWith('-')) { tgt = n; i++; } } else if (a === '-N' || a === '--no-pass') anon = true; else if (a === '-U') user = args[++i]; else if (a === '-c') cmd = args[++i]; else if (!a.startsWith('-') && !tgt) tgt = a; }
    if (!tgt) { err(io).write('Usage: smbclient [-L host] [-N] [-U user] [-c cmd] //host/share\n'); return 1; }
    const m = /^(?:\\\\|\/\/)([^\\/]+)(?:[\\/](.+))?$/.exec(tgt); const hostArg = m ? m[1] : tgt; const share = m && m[2] ? m[2] : null; const h = target(hostArg);
    if (!h || !h.up) { err(io).write(`do_connect: Connection to ${hostArg} failed (Error NT_STATUS_HOST_UNREACHABLE)\n`); return 1; }
    if (h.name !== tw.smb.host) { err(io).write(`do_connect: Connection to ${hostArg} failed (Error NT_STATUS_CONNECTION_REFUSED)\n`); return 1; }
    if (user && !user.includes('%') ? false : !!user) { log(tw, 'smb', `Tentative d'ouverture de session SMB avec le compte ${user.split('%')[0]} sur ${h.name}`, { src: ME, sev: 'alerte' }); err(io).write('session setup failed: NT_STATUS_LOGON_FAILURE\n'); return 1; }
    if (list || !share) { log(tw, 'smb', `Liste des partages demandée sur ${h.name} sans authentification`, { src: ME, sev: 'alerte' }); let o = '\n\tSharename       Type      Comment\n\t---------       ----      -------\n'; for (const sh of tw.smb.shares) o += `\t${pad(sh.name, 16)}Disk      ${sh.comment}\n`; o += `\tIPC$            IPC       IPC Service (${h.name} server)\nSMB1 disabled -- no workgroup available\n`; io.out.write(o); return 0; }
    const sh = tw.smb.shares.find(x => x.name.toLowerCase() === share.toLowerCase()); if (!sh) { err(io).write(`tree connect failed: NT_STATUS_BAD_NETWORK_NAME\n`); return 1; }
    if (!anon || !sh.anon) { log(tw, 'smb', `Accès refusé au partage ${sh.name} (${anon ? 'anonyme' : 'sans mot de passe'})`, { src: ME, sev: 'info' }); err(io).write('tree connect failed: NT_STATUS_ACCESS_DENIED\n'); return 1; }
    log(tw, 'smb', `Accès anonyme réussi au partage ${sh.name} sur ${h.name}`, { src: ME, sev: 'alerte' });
    if (!cmd) { err(io).write('smbclient : mode interactif non disponible dans le simulateur, utilisez -c "ls"\n'); return 1; }
    for (const c of cmd.split(';').map(x => x.trim()).filter(Boolean)) { if (c === 'ls' || c.startsWith('ls ')) { let o = `  .                                   D        0  ${fileDate}\n  ..                                  D        0  ${fileDate}\n`; for (const [n, sz] of sh.files) o += `  ${pad(n, 36)}N${String(sz).padStart(9)}  ${fileDate}\n`; o += `\n\t\t10253032 blocks of size 1024. 6840112 blocks available\n`; io.out.write(o); } else err(io).write(`${c.split(' ')[0]}: commande non disponible dans le simulateur (utilisez ls)\n`); }
    return 0;
  }
  const MIB = [['1.3.6.1.2.1.1.1.0', 'SNMPv2-MIB::sysDescr.0', 'STRING', () => `"${tw.snmp.sysDescr}"`], ['1.3.6.1.2.1.1.3.0', 'DISMAN-EVENT-MIB::sysUpTimeInstance', 'Timeticks', () => '(8412330) 9 days, 17:22:03.30'], ['1.3.6.1.2.1.1.4.0', 'SNMPv2-MIB::sysContact.0', 'STRING', () => `"${tw.snmp.contact}"`], ['1.3.6.1.2.1.1.5.0', 'SNMPv2-MIB::sysName.0', 'STRING', () => `"${tw.snmp.sysName}"`], ['1.3.6.1.2.1.1.6.0', 'SNMPv2-MIB::sysLocation.0', 'STRING', () => `"${tw.snmp.location}"`], ['1.3.6.1.2.1.2.1.0', 'IF-MIB::ifNumber.0', 'INTEGER', () => '1'], ['1.3.6.1.2.1.43.5.1.1.17.1', 'Printer-MIB::prtGeneralSerialNumber.1', 'STRING', () => `"${tw.snmp.serial}"`]];
  const snmpParse = (args, io, tool) => {
    let ver = null, comm = null; const pos = []; for (let i = 0; i < args.length; i++) { const a = args[i]; if (a === '-v') ver = args[++i]; else if (a.startsWith('-v')) ver = a.slice(2); else if (a === '-c') comm = args[++i]; else if (a.startsWith('-')) continue; else pos.push(a); }
    if (!ver || !comm || !pos.length) { err(io).write(`Usage: ${tool} -v 1|2c -c COMMUNITY HOST [OID]\n`); return null; }
    const h = target(pos[0]); if (!h || !h.up || h.name !== tw.snmp.host) { log(tw, 'snmp', `Requête SNMP sans réponse vers ${pos[0]}`, { src: ME, sev: 'info' }); err(io).write(`Timeout: No Response from ${pos[0]}.\n`); return null; }
    if (ver !== '1' && ver !== '2c') { err(io).write(`snmp : version ${ver} non disponible dans le simulateur (utilisez 1 ou 2c)\n`); return null; }
    if (comm !== tw.snmp.community) { log(tw, 'snmp', `Requête SNMP avec une communauté inconnue ("${comm}") vers ${h.name}`, { src: ME, sev: 'info' }); err(io).write(`Timeout: No Response from ${pos[0]}.\n`); return null; }
    log(tw, 'snmp', `Lecture SNMP réussie sur ${h.name} avec la communauté "${comm}"`, { src: ME, sev: 'alerte' }); return { h, oid: pos[1] || null };
  };
  const oidOf = o => { if (!o) return null; o = o.replace(/^\./, '').replace(/^iso\./, '1.'); const f = MIB.find(r => r[0] === o || r[1].toLowerCase().endsWith('::' + o.toLowerCase()) || r[1].toLowerCase() === o.toLowerCase()); return f ? f[0] : o; };
  async function snmpwalk(args, io) { const p = snmpParse(args, io, 'snmpwalk'); if (!p) return 1; const base = oidOf(p.oid) || '1.3.6.1.2.1'; const rows = MIB.filter(r => r[0] === base || r[0].startsWith(base + '.')); if (!rows.length) { io.out.write(`${p.oid}: No more variables left in this MIB View (It is past the end of the MIB tree)\n`); return 0; } io.out.write(rows.map(r => `${r[1]} = ${r[2]}: ${r[3]()}`).join('\n') + '\n'); return 0; }
  async function snmpget(args, io) { const p = snmpParse(args, io, 'snmpget'); if (!p) return 1; const oid = oidOf(p.oid); const r = oid && MIB.find(x => x[0] === oid); if (!r) { io.out.write(`${p.oid || ''}: No Such Object available on this agent at this OID\n`); return 0; } io.out.write(`${r[1]} = ${r[2]}: ${r[3]()}\n`); return 0; }
  return { dig, host, nslookup, ping, nmap, curl, smbclient, snmpget, snmpwalk, _http: (url) => { const r = httpGet(url); return r; } };
}
export const TOOL_NAMES = ['dig', 'host', 'nslookup', 'ping', 'nmap', 'curl', 'smbclient', 'snmpget', 'snmpwalk'];
