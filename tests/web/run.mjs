// Tests du simulateur web : correcteur JS contre les vrais correcteurs, puis émulateur contre bash.
import fs from 'node:fs'; import path from 'node:path';
import { runChecks } from '../../site/js/lib.js';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
let bad = 0, n = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'site/data')).filter(f => /^\d\d\.json$/.test(f))) {
  const id = f.slice(0, 2); const def = JSON.parse(fs.readFileSync(path.join(ROOT, 'site/data', f))); const sols = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/web/solutions', f)));
  def.variants.forEach((v, i) => {
    n++; const blank = runChecks(def, v, { ...v.files });
    if (blank.ok) { console.log(`KO ${id}#${i} : validé sans rien faire`); bad++; return; }
    const solved = runChecks(def, v, { ...v.files, ...sols[i].delta });
    if (!solved.ok) { console.log(`KO ${id}#${i} : corrigé refusé\n` + solved.lines.filter(l => l.k === 'ko').map(l => '   ' + l.t).join('\n')); bad++; }
    if (sols[i].realCheckExit !== 0) { console.log(`KO ${id}#${i} : le vrai correcteur refuse le corrigé`); bad++; }
  });
  // faux : une réponse altérée doit être refusée
  const v = def.variants[0]; const sol = { ...v.files, ...sols[0].delta }; const first = def.checks.find(c => c.t === 'num' || c.t === 'kv');
  if (first) { const t = sol['reponses.txt'].replace(new RegExp('^' + first.key + '=.*$', 'm'), first.key + '=zzz'); if (runChecks(def, v, { ...sol, 'reponses.txt': t }).ok) { console.log(`KO ${id} : réponse fausse acceptée`); bad++; } }
  console.log(`OK ${id} : ${def.variants.length} variantes`);
}
console.log(bad ? `ECHEC (${bad})` : `Correcteur : ${n} variantes conformes au correcteur bash`); process.exit(bad ? 1 : 0);
