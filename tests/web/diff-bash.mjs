// Test différentiel : mêmes commandes dans bash réel et dans l'émulateur, sorties comparées.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { execFileSync } from 'node:child_process';
import { VFS } from '../../site/js/vfs.js'; import { Shell, Stream } from '../../site/js/shell.js';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const T = [
  "head -n 5 F", "wc -l F", "wc -w F", "sort F | uniq -c | sort -rn | head -3", "awk '{print $1}' F | sort -u | head", "grep -c e F",
  "grep -v '^#' F | cut -d';' -f1 | sort -u | head -5", "sed 's/[0-9]/N/g' F | head -3", "awk -F';' 'NR>1{c[$1]++}END{for(k in c)print k,c[k]}' F | sort",
  "tr a-z A-Z < F | head -2", "grep -E '[0-9]+\\.[0-9]+' F | wc -l", "grep -o '[0-9][0-9.]*' F | sort -u | head", "sort -t';' -k2,2 -n F | head -3", "sort -k2 F | head -3",
  "sort -r F | head -2", "nl F | tail -2", "tail -n +2 F | head -2", "awk 'length>20' F | wc -l", "awk '{n+=NF}END{print n, NR}' F",
  "sed -n '2,4p' F", "grep -i error F | head -2", "cut -d' ' -f1-2 F | head -3", "awk '{print $NF}' F | sort | uniq -c | sort -rn | head -3", "grep -E 'a|b' F | wc -l",
  "awk -F';' '{print $1\":\"$NF}' F | head -3", "sed -E 's/([0-9]+)/<\\1>/' F | head -2", "grep -w -c the F", "tr -s ' ' < F | head -2", "awk 'NR%2==0' F | head -2", "paste -sd, F | wc -l",
  "sort -u F | wc -l", "awk '{a[$1]=a[$1]+1}END{n=0;for(k in a)n++;print n}' F", "grep -n . F | head -2", "sed '/^$/d' F | wc -l", "awk 'BEGIN{FS=\";\"}{s+=$2}END{print s+0}' F",
  "awk '{printf \"%-10s|%5.1f\\n\", $1, NR/3}' F | head -2", "sort -n F | tail -2", "sort -f F | head -2", "grep -F -x -c a F", "awk '$1 ~ /^[0-9]/' F | wc -l", "awk 'tolower($0) ~ /get|post/' F | wc -l",
  "cat > t.out <<'X'\n$HOME et $(echo 1)\nX\ncat t.out", "v=7; cat <<X | tr a-z A-Z\nval=$v $(echo sub) \\$lit\nX", "cat <<-X\n\tindente\n\tX", "wc -l <<X\na\nb\nX", "sed '\\#e#d' F | head -3",
];
let bad = 0, n = 0; const shown = new Set();
for (const id of ['02', '03', '04', '05', '06', '07', '10', '11', '12', '14', '15', '16', '17']) {
  const def = JSON.parse(fs.readFileSync(path.join(ROOT, 'site/data', id + '.json')));
  for (const v of def.variants.slice(0, 2)) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-')); const fsv = new VFS(); fsv.mkdirp('/w');
    for (const [k, c] of Object.entries(v.files)) { fs.mkdirSync(path.dirname(path.join(dir, k)), { recursive: true }); fs.writeFileSync(path.join(dir, k), c); fsv.mkdirp('/w/' + path.dirname(k)); fsv.write('/w/' + k, c); }
    for (const f of Object.keys(v.files).filter(f => !f.includes('/') && !/reponses|synthese/.test(f))) for (const t of T) {
      const cmd = t.replaceAll(' F', ' ' + f).replaceAll('<F', '<' + f).replaceAll('< F', '< ' + f); n++;
      let real; try { real = execFileSync('bash', ['-c', cmd], { cwd: dir, env: { LC_ALL: 'C.UTF-8', PATH: process.env.PATH }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { real = e.stdout || ''; }
      const sh = new Shell(fsv, { cwd: '/w' }); const o = new Stream(); await sh.run(cmd, { in: new Stream(), out: o, err: o });
      if (o.s !== real) { bad++; const key = t; if (!shown.has(key)) { shown.add(key); console.log(`DIFF ${id}/${f} : ${cmd}\n--- bash\n${real.slice(0, 200)}\n--- émul\n${o.s.slice(0, 200)}`); } }
    }
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
console.log(bad ? `${bad} différences sur ${n} commandes` : `OK : ${n} commandes identiques à bash`); process.exit(bad ? 1 : 0);
