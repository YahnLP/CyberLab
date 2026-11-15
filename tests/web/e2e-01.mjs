// Test de bout en bout : le corrigé formateur du défi 01 est exécuté TEL QUEL dans le terminal simulé, puis corrigé par le correcteur JS.
import fs from 'node:fs';
import { Shell, Stream } from '../../site/js/shell.js'; import { VFS } from '../../site/js/vfs.js';
import { runChecks } from '../../site/js/lib.js'; import { detectOutputs } from '../../site/js/ssh01.js';
const def = JSON.parse(fs.readFileSync(new URL('../../site/data/01.json', import.meta.url))); const sol = fs.readFileSync(new URL('../../formateur/solutions/01-incident-ssh.sh', import.meta.url), 'utf8');
let bad = 0;
for (const [i, v] of def.variants.entries()) {
  const fs_ = new VFS(); const W = '/h/atelier/01'; fs_.mkdirp(W); for (const [k, c] of Object.entries(v.files)) { const p = W + '/' + k; fs_.mkdirp(p.slice(0, p.lastIndexOf('/'))); fs_.write(p, c); if (v.exec.includes(k)) fs_.f.get(p).x = true; }
  const sh = new Shell(fs_, { home: '/h', cwd: W }); const o = new Stream(); const io = { in: new Stream(''), out: o, err: o };
  fs_.write('/h/sol.sh', sol); const rc = await sh.run('cd ' + W + ' && bash /h/sol.sh', io);
  const files = fs_.snapshot(W); const R = fs_.f.get(W + '/preuves/retest.txt')?.m; const watched = Object.keys(files).filter(k => /^srv01\/(etc\/ssh\/sshd_config|etc\/nftables\.conf|home\/[^/]+\/\.ssh\/authorized_keys|var\/spool\/cron\/crontabs\/[^/]+)$/.test(k));
  const fresh = R !== undefined && watched.every(k => !(fs_.f.get(W + '/' + k).m > R));
  const res = runChecks(def, v, files, { detect: await detectOutputs(v, files, { Shell, VFS, Stream }), fresh });
  console.log(i, 'rc', rc, res.ok ? 'OK' : 'KO', fresh ? '' : '(retest périmé)');
  if (!res.ok) { bad++; console.log(o.s.slice(-600)); console.log(res.lines.filter(l => l.k === 'ko').map(l => l.t)); }
}
console.log(bad ? `ECHEC (${bad})` : `Défi 01 : corrigé formateur exécuté dans le simulateur, ${def.variants.length} variantes validées`); process.exit(bad ? 1 : 0);
