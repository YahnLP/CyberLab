// Compare les commandes simulées ssh-keygen -lf et sshd -T avec les vraies (si présentes sur la machine).
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFileSync, spawnSync } from 'node:child_process';
import { keygenLf, sshdT } from '../../site/js/ssh01.js';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const have = c => spawnSync('bash', ['-c', `command -v ${c} || test -x /usr/sbin/${c}`]).status === 0;
if (!have('ssh-keygen') || !have('sshd')) { console.log('diff-ssh : ssh-keygen ou sshd absent, test ignoré'); process.exit(0); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dssh-')); const hk = path.join(tmp, 'hk'); execFileSync('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-f', hk]);
const def = JSON.parse(fs.readFileSync(path.join(ROOT, 'site/data/01.json'))); let n = 0, bad = 0;
const sshd = process.env.SSHD || (fs.existsSync('/usr/sbin/sshd') ? '/usr/sbin/sshd' : 'sshd');
for (const v of def.variants) {
  const ak = Object.entries(v.files).find(([k]) => k.endsWith('authorized_keys'))[1]; const f = path.join(tmp, 'ak'); fs.writeFileSync(f, ak);
  const real = execFileSync('ssh-keygen', ['-lf', f], { encoding: 'utf8' }).trim().split('\n'); n++;
  if (JSON.stringify(real) !== JSON.stringify(keygenLf(ak))) { console.log('KO ssh-keygen -lf\n  réel :', real, '\n  émulé:', keygenLf(ak)); bad++; }
  const cfg = v.files['srv01/etc/ssh/sshd_config'];
  const variants = [cfg, cfg.replace(/^PermitRootLogin.*/m, 'PermitRootLogin no'), cfg.replace(/^PasswordAuthentication.*/m, 'PasswordAuthentication no').replace(/^MaxAuthTries.*/m, 'MaxAuthTries 3'), cfg + 'Foo bar\n', cfg.replace(/^PermitRootLogin.*/m, 'PermitRootLogin maybe'), cfg.replace(/^MaxAuthTries.*/m, 'MaxAuthTries abc'), 'PermitRootLogin no\n' + cfg, cfg.replace(/^PasswordAuthentication.*/m, 'passwordauthentication No')];
  for (const c of variants) {
    const cf = path.join(tmp, 'cfg'); fs.writeFileSync(cf, c); n++;
    const r = spawnSync(sshd, ['-T', '-f', cf, '-h', hk], { encoding: 'utf8' }); const e = sshdT(c);
    if ((r.status === 0) !== e.ok) { console.log(`KO sshd -T : validité réelle ${r.status === 0} / émulée ${e.ok}\n  ${r.stderr.split('\n')[0]}\n  ${e.err || ''}`); bad++; continue; }
    if (e.ok) { const re = Object.fromEntries(r.stdout.split('\n').filter(Boolean).map(l => l.split(' '))); for (const k of ['passwordauthentication', 'permitrootlogin', 'maxauthtries', 'port', 'pubkeyauthentication']) if (re[k] !== e.eff[k]) { console.log(`KO sshd -T ${k} : réel ${re[k]} / émulé ${e.eff[k]}`); bad++; } }
  }
}
fs.rmSync(tmp, { recursive: true, force: true }); console.log(bad ? `ECHEC (${bad})` : `ssh-keygen / sshd -T : ${n} comparaisons identiques aux vrais outils`); process.exit(bad ? 1 : 0);
