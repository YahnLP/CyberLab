// Tests du simulateur web : correcteur JS contre les vrais correcteurs, puis émulateur contre bash.
import fs from 'node:fs'; import path from 'node:path';
import { runChecks } from '../../site/js/lib.js'; import { detectOutputs } from '../../site/js/ssh01.js'; import { Shell, Stream } from '../../site/js/shell.js'; import { VFS } from '../../site/js/vfs.js';
const ex = async (def, v, files) => def.special === 'ssh' ? { detect: await detectOutputs(v, files, { Shell, VFS, Stream }), fresh: true } : undefined;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
let bad = 0, n = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'site/data')).filter(f => /^\d\d\.json$/.test(f))) {
  const id = f.slice(0, 2); const def = JSON.parse(fs.readFileSync(path.join(ROOT, 'site/data', f))); const sols = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/web/solutions', f)));
  for (const [i, v] of def.variants.entries()) {
    n++; const blank = runChecks(def, v, { ...v.files }, await ex(def, v, { ...v.files }));
    if (blank.ok) { console.log(`KO ${id}#${i} : validé sans rien faire`); bad++; continue; }
    const sf = { ...v.files, ...sols[i].delta }; const solved = runChecks(def, v, sf, await ex(def, v, sf));
    if (!solved.ok) { console.log(`KO ${id}#${i} : corrigé refusé\n` + solved.lines.filter(l => l.k === 'ko').map(l => '   ' + l.t).join('\n')); bad++; }
    for (const mu of sols[i].mutants || []) {
      const mf = { ...sf, ...mu.delta }; for (const k of mu.removed || []) delete mf[k];
      const r = runChecks(def, v, mf, await ex(def, v, mf)); const norm = t => t.replace(/'[^']*'/g, "''").replace(/ : \/[^\n]*?line /, ' : line ');
      const js = r.lines.filter(l => l.k === 'ko' || (l.k === 'raw' && l.t.includes('[KO]'))).map(l => norm(l.t.replace(/^\s*\[KO\]\s*/, '').trim())).sort(); const re = [...mu.realKo].sort();
      if (r.ok !== (mu.realExit === 0) || JSON.stringify(js) !== JSON.stringify(re)) { console.log(`KO ${id}#${i} mutant « ${mu.name} » : JS ${r.ok ? 'accepte' : 'refuse'} / bash ${mu.realExit === 0 ? 'accepte' : 'refuse'}\n   JS  : ${JSON.stringify(js)}\n   bash: ${JSON.stringify(re)}`); bad++; }
    }
    if (sols[i].realCheckExit !== 0) { console.log(`KO ${id}#${i} : le vrai correcteur refuse le corrigé`); bad++; }
  }
  // faux : une réponse altérée doit être refusée
  const v = def.variants[0]; const sol = { ...v.files, ...sols[0].delta }; const first = def.checks.find(c => c.t === 'num' || c.t === 'kv');
  if (first) { const t = sol['reponses.txt'].replace(new RegExp('^' + first.key + '=.*$', 'm'), first.key + '=zzz'); if (runChecks(def, v, { ...sol, 'reponses.txt': t }).ok) { console.log(`KO ${id} : réponse fausse acceptée`); bad++; } }
  console.log(`OK ${id} : ${def.variants.length} variantes`);
}
console.log(bad ? `ECHEC (${bad})` : `Correcteur : ${n} variantes conformes au correcteur bash`); process.exit(bad ? 1 : 0);
