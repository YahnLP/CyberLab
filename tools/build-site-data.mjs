#!/usr/bin/env node
// Génère les données du simulateur web en exécutant les VRAIS setup.sh du dépôt.
// Pour chaque défi : N variantes (fichiers + réponses hachées) -> site/data/NN.json
// Les corrigés (jamais publiés) vont dans tests/web/solutions/NN.json pour les tests.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const N = +(process.env.VARIANTS || 12); const SKIP = new Set([]);
const walk = (d, base = d, o = {}) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, base, o); else o[path.relative(base, p)] = fs.readFileSync(p, 'utf8'); } return o; };
const meta = f => Object.fromEntries(fs.readFileSync(f, 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));

// Défi 01 : variantes « presque bonnes » (une erreur injectée après le corrigé), rejouées dans le VRAI correcteur
// pour vérifier que le correcteur JS refuse exactement les mêmes choses.
function mutants01(WORK, env, CH, orig, after, answers) {
  const acct = (after['reponses.txt'].match(/^compte=(.*)$/m) || [])[1]; const akPath = `srv01/home/${acct}/.ssh/authorized_keys`, crPath = `srv01/var/spool/cron/crontabs/${acct}`;
  const origKeys = orig[akPath], origCron = orig[crPath], cfg = after['srv01/etc/ssh/sshd_config'], nft = after['srv01/etc/nftables.conf'], rep = after['rapport.md'];
  const M = {
    'root autorisé': { 'srv01/etc/ssh/sshd_config': cfg.replace(/^PermitRootLogin.*$/m, 'PermitRootLogin yes') },
    'syntaxe sshd invalide': { 'srv01/etc/ssh/sshd_config': cfg + 'Foo bar\n' },
    'MaxAuthTries 4': { 'srv01/etc/ssh/sshd_config': cfg.replace(/^MaxAuthTries.*$/m, 'MaxAuthTries 4') },
    'blocage IP retiré': { 'srv01/etc/nftables.conf': nft.split('\n').filter(l => !/ip saddr/.test(l)).join('\n') },
    'clé frauduleuse revenue': { [akPath]: origKeys },
    'toutes les clés supprimées': { [akPath]: '' },
    'cron frauduleux revenu': { [crPath]: origCron },
    'cron légitime supprimé': { [crPath]: '# vide\n' },
    'mauvaise IP déclarée': { 'reponses.txt': after['reponses.txt'].replace(/^ip_attaquante=.*$/m, 'ip_attaquante=1.2.3.4') },
    'detecte.sh muet': { 'detecte.sh': '#!/usr/bin/env bash\n:\n' },
    'detecte.sh sans seuil': { 'detecte.sh': "#!/usr/bin/env bash\nawk '/Failed password/{for(i=1;i<=NF;i++) if($i==\"from\") c[$(i+1)]++} END{for(ip in c) if(c[ip]>=10) print ip, c[ip]}' \"$1\"\n" },
    'rapport : section Retest trop courte': { 'rapport.md': rep.replace(/## Retest[\s\S]*$/, '## Retest\nok\n') },
    'rapport : A COMPLETER': { 'rapport.md': rep + '\nA COMPLETER\n' },
    'journal original modifié': { 'srv01/var/log/auth.log': after['srv01/var/log/auth.log'] + 'Nov 15 23:59:59 srv01 sshd[1]: extra\n' },
    'SHA256SUMS altéré': { 'preuves/SHA256SUMS': after['preuves/SHA256SUMS'].replace(/^./, c => (c === '0' ? '1' : '0')) },
    'retest.txt absent': { 'preuves/retest.txt': null },
  };
  const norm = t => t.replace(/'[^']*'/g, "''").replace(/ : \/[^\n]*?line /, ' : line ');
  const wr = (k, c) => { const f = path.join(WORK, k); if (c === null) { fs.rmSync(f, { force: true }); return; } fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, c); };
  const res = [];
  for (const [name, patch] of Object.entries(M)) {
    for (const [k, c] of Object.entries(patch)) wr(k, c);
    if (patch['preuves/retest.txt'] !== null) fs.utimesSync(path.join(WORK, 'preuves/retest.txt'), new Date(Date.now() + 5000), new Date(Date.now() + 5000));
    let code = 0, out = ''; try { out = execFileSync('bash', [path.join(CH, 'check.sh')], { cwd: WORK, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { code = e.status || 1; out = String(e.stdout || ''); }
    const ko = out.split('\n').filter(l => /✘|\[KO\]/.test(l)).map(l => norm(l.replace(/^\s*(✘|\[KO\])\s*/, '').trim()));
    res.push({ name, delta: Object.fromEntries(Object.entries(patch).filter(([, c]) => c !== null)), removed: Object.entries(patch).filter(([, c]) => c === null).map(([k]) => k), realExit: code, realKo: ko });
    for (const k of Object.keys(patch)) wr(k, k in after ? after[k] : null);
  }
  return res;
}
fs.mkdirSync(path.join(ROOT, 'site/data'), { recursive: true }); fs.mkdirSync(path.join(ROOT, 'tests/web/solutions'), { recursive: true });
const index = [];
for (const dirName of fs.readdirSync(path.join(ROOT, 'challenges')).sort()) {
  const id = dirName.slice(0, 2); if (SKIP.has(id)) continue; const CH = path.join(ROOT, 'challenges', dirName); const m = meta(path.join(CH, 'meta.conf'));
  const sol = fs.readdirSync(path.join(ROOT, 'formateur/solutions')).find(f => f.startsWith(id + '-'));
  const variants = [], solutions = [];
  for (let v = 0; v < N; v++) {
    const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-')); const ANS = path.join(os.tmpdir(), 'ans-' + process.pid + '-' + id);
    fs.rmSync(ANS, { force: true });
    const env = { ...process.env, LC_ALL: 'C', WORK, CH, LAB_LIB: path.join(ROOT, 'engine/lib.sh'), ANSWER_FILE: ANS };
    execFileSync('bash', [path.join(CH, 'setup.sh')], { cwd: WORK, env, stdio: ['ignore', 'ignore', 'inherit'] });
    const files = walk(WORK); const execs = Object.keys(files).filter(k => fs.statSync(path.join(WORK, k)).mode & 0o111); const answers = Object.fromEntries(fs.readFileSync(ANS, 'utf8').split('\n').filter(Boolean).map(l => { const i = l.indexOf(':'); return [l.slice(0, i), l.slice(i + 1)]; }));
    if (id === '01') { // adaptations web : pas de clé d'hôte privée, retest via le contrôleur intégré, journal de rejeu précalculé
      delete files['srv01/etc/ssh/ssh_host_ed25519_key'];
      files['retest.sh'] = '#!/usr/bin/env bash\ncd "$(dirname "$0")" || exit 1\nmkdir -p preuves\nlab-controls | tee preuves/retest.txt\n';
      const RL = path.join(WORK, '.replay.log'); const rep = execFileSync('bash', ['-c', '. "$CH/gen-log.sh"; RA="203.0.113.$((RANDOM%100+100))"; RN=$((RANDOM%30+30)); gen_auth_log "$1" "$RA" "$RN" svc-x "198.51.100.$((RANDOM%200+10))" "192.168.10.$((RANDOM%200+10))" "$((RANDOM*32768+RANDOM))" "$1.ts"; echo "$RA $RN"', 'x', RL], { env, encoding: 'utf8' }).trim().split(' ');
      variants.push({ files, answers, exec: execs, replay: { log: fs.readFileSync(RL, 'utf8'), ip: rep[0], n: rep[1] } }); fs.rmSync(RL, { force: true }); fs.rmSync(RL + '.ts', { force: true });
    } else
    variants.push({ files, answers, exec: execs });
    // corrigé : fichiers créés ou modifiés par le formateur
    execFileSync('bash', [path.join(ROOT, 'formateur/solutions', sol)], { cwd: WORK, env, stdio: ['ignore', 'ignore', 'inherit'] });
    const after = walk(WORK); const delta = {}; for (const [k, c] of Object.entries(after)) if (files[k] !== c && !(id === '01' && (k === 'retest.sh' || k.endsWith('ssh_host_ed25519_key')))) delta[k] = c;
    // résultat du vrai correcteur pour comparaison
    let real = 0; try { execFileSync('bash', [path.join(CH, 'check.sh')], { cwd: WORK, env, stdio: 'ignore' }); } catch { real = 1; }
    const sol_ = { delta, realCheckExit: real };
    if (id === '01') sol_.mutants = mutants01(WORK, env, CH, files, after, answers);
    solutions.push(sol_); fs.rmSync(WORK, { recursive: true, force: true }); fs.rmSync(ANS, { force: true });
  }
  const chk = fs.readFileSync(path.join(CH, 'check.sh'), 'utf8'); const checks = []; let finishMsg = '';
  for (const raw of chk.split('\n')) { const l = raw.trim();
    let mm = /^phase "(.*?)"/.exec(l); if (mm) { checks.push({ t: 'phase', title: mm[1] }); }
    const loop = /^for (\w+) in ([^;]+); do check_(num|kv) \$\w+/.exec(l); if (loop) { for (const k of loop[2].trim().split(/\s+/)) checks.push({ t: loop[3], key: k }); continue; }
    for (const c of l.matchAll(/check_(set|num|kv) ([a-z_0-9]+)(?: ([^\s;]+))?/g)) { if (c[1] === 'set') checks.push({ t: 'set', key: c[2], file: c[3] }); else checks.push({ t: c[1], key: c[2] }); }
    mm = /^finish "(.*)"/.exec(l); if (mm) finishMsg = mm[1]; }
  const out = { id, checks, finish: id === '01' ? 'Incident traité de bout en bout : preuve, détection, confinement, correction, retest, rapport.' : finishMsg, special: { '09': 'synthese', '00': 'preuves', '01': 'ssh' }[id] || null, name: dirName, title: m.TITLE, module: m.MODULE, points: +m.POINTS, difficulty: +m.DIFFICULTY, enonce: fs.readFileSync(path.join(CH, 'enonce.txt'), 'utf8'), indices: fs.readFileSync(path.join(CH, 'indices.txt'), 'utf8').split('\n').filter(Boolean), variants };
  fs.writeFileSync(path.join(ROOT, 'site/data', id + '.json'), JSON.stringify(out));
  fs.writeFileSync(path.join(ROOT, 'tests/web/solutions', id + '.json'), JSON.stringify(solutions));
  index.push({ id, name: dirName, title: m.TITLE, module: m.MODULE, points: +m.POINTS, difficulty: +m.DIFFICULTY });
  console.log('ok', id, dirName, 'variantes:', variants.length, 'KB:', (fs.statSync(path.join(ROOT, 'site/data', id + '.json')).size / 1024) | 0);
}
fs.writeFileSync(path.join(ROOT, 'site/data/index.json'), JSON.stringify(index));
// leçons
const cd = path.join(ROOT, 'site/cours'); fs.mkdirSync(cd, { recursive: true });
const lessons = fs.readdirSync(path.join(ROOT, 'cours')).filter(f => f.endsWith('.md')); for (const f of lessons) fs.copyFileSync(path.join(ROOT, 'cours', f), path.join(cd, f));
fs.writeFileSync(path.join(ROOT, 'site/data/cours.json'), JSON.stringify(lessons.filter(f => f !== 'README.md')));

// Parcours : ordre pédagogique tiré de cours/README.md (leçon -> défi associé)
const rows = fs.readFileSync(path.join(ROOT, 'cours/README.md'), 'utf8').split('\n').filter(l => /^\| \[/.test(l)).map(l => { const c = l.split('|').map(x => x.trim()); const m = /\[(.*?)\]\((.*?)\)/.exec(c[1]); const d = /^(\d\d)/.exec(c[4]); return { code: m[1], file: m[2].replace(/\.md$/, ''), title: c[2], duree: c[3], defi: d ? d[1] : null }; });
const GROUPS = [['Fondations', c => c === '00'], ['Parcours professionnalisant', c => /^P([1-9]|1[01])$/.test(c)], ['Parcours avancés', c => /^P1[2-9]$/.test(c)], ['Cycle HAC', c => /^HAC/.test(c)]];
const web = new Set(index.map(d => d.id));
const parcours = GROUPS.map(([name, f]) => ({ name, steps: rows.filter(r => f(r.code)).map(r => ({ ...r, onWeb: r.defi ? web.has(r.defi) : false })) }));
fs.writeFileSync(path.join(ROOT, 'site/data/parcours.json'), JSON.stringify(parcours));
console.log('parcours', parcours.map(g => g.name + ':' + g.steps.length).join(' '));
