#!/usr/bin/env node
// Génère les données du simulateur web en exécutant les VRAIS setup.sh du dépôt.
// Pour chaque défi : N variantes (fichiers + réponses hachées) -> site/data/NN.json
// Les corrigés (jamais publiés) vont dans tests/web/solutions/NN.json pour les tests.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const N = +(process.env.VARIANTS || 12); const SKIP = new Set(['01']);
const walk = (d, base = d, o = {}) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, base, o); else o[path.relative(base, p)] = fs.readFileSync(p, 'utf8'); } return o; };
const meta = f => Object.fromEntries(fs.readFileSync(f, 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
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
    const files = walk(WORK); const answers = Object.fromEntries(fs.readFileSync(ANS, 'utf8').split('\n').filter(Boolean).map(l => { const i = l.indexOf(':'); return [l.slice(0, i), l.slice(i + 1)]; }));
    variants.push({ files, answers });
    // corrigé : fichiers créés ou modifiés par le formateur
    execFileSync('bash', [path.join(ROOT, 'formateur/solutions', sol)], { cwd: WORK, env, stdio: ['ignore', 'ignore', 'inherit'] });
    const after = walk(WORK); const delta = {}; for (const [k, c] of Object.entries(after)) if (files[k] !== c) delta[k] = c;
    // résultat du vrai correcteur pour comparaison
    let real = 0; try { execFileSync('bash', [path.join(CH, 'check.sh')], { cwd: WORK, env, stdio: 'ignore' }); } catch { real = 1; }
    solutions.push({ delta, realCheckExit: real }); fs.rmSync(WORK, { recursive: true, force: true }); fs.rmSync(ANS, { force: true });
  }
  const chk = fs.readFileSync(path.join(CH, 'check.sh'), 'utf8'); const checks = []; let finishMsg = '';
  for (const raw of chk.split('\n')) { const l = raw.trim();
    let mm = /^phase "(.*?)"/.exec(l); if (mm) { checks.push({ t: 'phase', title: mm[1] }); }
    const loop = /^for (\w+) in ([^;]+); do check_(num|kv) \$\w+/.exec(l); if (loop) { for (const k of loop[2].trim().split(/\s+/)) checks.push({ t: loop[3], key: k }); continue; }
    for (const c of l.matchAll(/check_(set|num|kv) ([a-z_0-9]+)(?: ([^\s;]+))?/g)) { if (c[1] === 'set') checks.push({ t: 'set', key: c[2], file: c[3] }); else checks.push({ t: c[1], key: c[2] }); }
    mm = /^finish "(.*)"/.exec(l); if (mm) finishMsg = mm[1]; }
  const out = { id, checks, finish: finishMsg, special: id === '09' ? 'synthese' : null, name: dirName, title: m.TITLE, module: m.MODULE, points: +m.POINTS, difficulty: +m.DIFFICULTY, enonce: fs.readFileSync(path.join(CH, 'enonce.txt'), 'utf8'), indices: fs.readFileSync(path.join(CH, 'indices.txt'), 'utf8').split('\n').filter(Boolean), variants };
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
