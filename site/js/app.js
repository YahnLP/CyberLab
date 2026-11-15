import { VFS } from './vfs.js'; import { Shell, Stream } from './shell.js'; import { Term, editor } from './term.js'; import { runChecks } from './lib.js'; import { md } from './md.js';
const $ = s => document.querySelector(s); const KEY = 'cyberlab.v1';
const store = { load() { try { return JSON.parse(localStorage.getItem(KEY)) || { prog: {}, cur: null, work: {} }; } catch { return { prog: {}, cur: null, work: {} }; } }, save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { } } };
let S = store.load(); const cache = {}; let index = [], lessons = [];
const get = async u => { if (cache[u]) return cache[u]; const r = await fetch(u); if (!r.ok) throw new Error(u); return cache[u] = u.endsWith('.json') ? await r.json() : await r.text(); };
const B = '\x1b[1m', R = '\x1b[0m', DIM = '\x1b[2m', GRN = '\x1b[32m', RED = '\x1b[31m', YEL = '\x1b[33m', CYA = '\x1b[36m';
const stars = n => '★'.repeat(Math.min(n, 3)) + '☆'.repeat(Math.max(0, 3 - n)) + (n > 3 ? '+' : '');
const HOME = '/home/stagiaire'; const wd = def => `${HOME}/atelier/${def.name}`;
let term = null, shell = null, fsv = null, curDef = null;

function snapshot() { if (!curDef || !fsv) return; S.work[curDef.id] = { variant: S.work[curDef.id].variant, files: fsv.snapshot(wd(curDef)) }; store.save(S); }
function mount(def, variant, files) { fsv = new VFS(); fsv.mkdirp(wd(def)); fsv.mkdirp(HOME + '/.bashlab'); for (const [k, c] of Object.entries(files)) { const p = wd(def) + '/' + k; fsv.mkdirp(p.slice(0, p.lastIndexOf('/'))); fsv.write(p, c); } shell = new Shell(fsv, { home: HOME, cwd: wd(def), edit: editor, defi: defiCmd }); }
const header = t => `\n${CYA}${B}╔══════════════════════════════════════════════════════════╗${R}\n${CYA}${B}║${R}  ${B}${t}${R}\n${CYA}${B}╚══════════════════════════════════════════════════════════╝${R}\n`;
const indent = s => s.split('\n').map(l => '  ' + l).join('\n');

async function startDef(id, io, fresh = true) {
  const def = await get(`data/${id}.json`); const had = S.work[id];
  let vi, files; if (!fresh && had) { vi = had.variant; files = had.files; } else { vi = Math.floor(Math.random() * def.variants.length); files = def.variants[vi].files; S.work[id] = { variant: vi, files }; S.prog[id] = { st: 'en_cours', pts: 0, hints: 0 }; }
  S.cur = id; curDef = def; mount(def, def.variants[vi], files); store.save(S); updateScore();
  if (io) { io.out.write(header(`Défi ${id} — ${def.title}   [${stars(def.difficulty)} · ${def.points} pts]`) + '\n' + indent(def.enonce) + `\n  ${B}Atelier :${R} ${CYA}${wd(def)}${R}\n  ${DIM}defi enonce · defi indice · defi valider${R}\n\n`); }
  return def;
}
const normId = x => /^\d$/.test(x) ? '0' + x : x;
async function defiCmd(args, io) {
  const out = io.out; const sub = args[0] || 'aide'; const rest = args.slice(1);
  if (['aide', 'help', '--help', '-h'].includes(sub)) { out.write(`\n  ${B}CyberLab — commandes${R}\n  ${B}defi liste${R}              Tous les défis\n  ${B}defi start <n>${R}          Commencer un défi\n  ${B}defi enonce${R}             Revoir l'énoncé\n  ${B}defi indice${R}             Obtenir un indice (-2 pts)\n  ${B}defi valider${R}            Vérifier la solution\n  ${B}defi suivant${R}            Prochain défi non réussi\n  ${B}defi score${R}              Progression et points\n  ${B}defi reset <n>${R}          Recommencer un défi\n\n`); return 0; }
  if (['liste', 'list', 'ls'].includes(sub)) { let last = ''; out.write(`\n  ${B}DÉFIS DISPONIBLES${R}\n`); for (const d of index) { if (d.module !== last) { out.write(`\n  ${CYA}${B}── ${d.module} ──${R}\n`); last = d.module; } const st = S.prog[d.id]?.st; const mark = st === 'reussi' ? `${GRN}✔ réussi ${R}` : st === 'en_cours' ? `${YEL}▶ en cours${R}` : `${DIM}· à faire ${R}`; out.write(`   ${mark}  ${B}${d.id}${R}  ${d.title.padEnd(40)} ${stars(d.difficulty)}  ${DIM}${String(d.points).padStart(2)} pts${R}\n`); } out.write(`\n  ${DIM}Pour commencer : ${R}${B}defi start <numéro>${R}\n\n`); return 0; }
  if (['start', 'go', 'reset'].includes(sub)) { const id = normId(rest[0] || ''); if (!index.find(d => d.id === id)) { out.write(`${RED}${B}Erreur :${R} défi '${rest[0] ?? ''}' inexistant.\n`); return 1; } await startDef(id, io); if (location.hash !== '#/defi/' + id) history.replaceState(null, '', '#/defi/' + id); renderDefHeader(); return 0; }
  if (sub === 'suivant' || sub === 'next') { const n = index.find(d => S.prog[d.id]?.st !== 'reussi'); if (!n) { out.write(`\n  ${GRN}${B}Tous les défis sont réussis !${R}\n\n`); return 0; } return defiCmd(['start', n.id], io); }
  if (sub === 'score' || sub === 'points') { let tot = 0, max = 0, dn = 0; out.write(`\n  ${B}PROGRESSION${R}\n\n`); for (const d of index) { max += d.points; const p = S.prog[d.id]; if (p?.st === 'reussi') { tot += p.pts; dn++; out.write(`   ${GRN}✔${R} ${d.id} ${d.title.padEnd(40)} ${B}${String(p.pts).padStart(2)}${R}${DIM}/${d.points} pts${R}\n`); } } if (!dn) out.write(`   ${DIM}Aucun défi réussi. Lancez : defi start 02${R}\n`); const w = 30, f = Math.floor(dn * w / index.length); out.write(`\n   [${'█'.repeat(f)}${'░'.repeat(w - f)}]  ${dn}/${index.length} défis\n   ${B}Score : ${tot}/${max} points${R}\n\n`); return 0; }
  if (!curDef) { out.write(`${RED}${B}Erreur :${R} aucun défi en cours. Essayez : defi start 02\n`); return 1; }
  if (sub === 'enonce' || sub === 'énoncé') { out.write(header(`Défi ${curDef.id} — ${curDef.title}`) + '\n' + indent(curDef.enonce) + '\n'); return 0; }
  if (sub === 'indice' || sub === 'hint') { const p = S.prog[curDef.id] ||= { st: 'en_cours', pts: 0, hints: 0 }; const tot = curDef.indices.length; if (p.hints >= tot) { out.write(`\n  ${YEL}Tous les indices révélés :${R}\n\n` + curDef.indices.map((h, i) => `  ${String(i + 1).padStart(2)}. ${h}`).join('\n') + '\n\n'); return 0; } p.hints++; store.save(S); out.write(`\n  ${YEL}${B}Indice ${p.hints}/${tot}${R}\n\n  > ${curDef.indices[p.hints - 1]}\n\n`); return 0; }
  if (sub === 'valider' || sub === 'check') {
    const work = S.work[curDef.id]; const files = fsv.snapshot(wd(curDef)); const res = runChecks(curDef, curDef.variants[work.variant], files);
    for (const l of res.lines) { if (l.k === 'phase') out.write(`\n  ${B}${l.t}${R}\n`); else out.write(l.k === 'ok' ? `    ✔ ${l.t}\n` : `    ✘ ${l.t}\n`); }
    if (res.ok) { out.write(`\n  ✔ ${curDef.finish}\n`); const p = S.prog[curDef.id] ||= { st: 'en_cours', pts: 0, hints: 0 }; if (p.st === 'reussi') out.write(`\n  ${GRN}${B}✔ Toujours juste !${R}\n\n`); else { let earned = curDef.points - 2 * p.hints; const min = Math.floor(curDef.points / 2); if (earned < min) earned = min; p.st = 'reussi'; p.pts = earned; store.save(S); updateScore(); out.write(`\n  ${GRN}${B}╔═══════════════════════════════════╗\n  ║   ✔  DÉFI RÉUSSI ! Bravo !        ║\n  ╚═══════════════════════════════════╝${R}\n    Points : ${B}${earned}/${curDef.points}${R}  ${DIM}(indices: ${p.hints})${R}\n\n`); } return 0; }
    out.write(`\n  ${RED}${B}✘ Pas encore...${R} ${DIM}defi enonce · defi indice${R}\n\n`); return 1;
  }
  out.write(`${RED}${B}Erreur :${R} commande inconnue '${sub}'. Voir : defi aide\n`); return 1;
}

function updateScore() { let t = 0, d = 0; for (const x of index) { const p = S.prog[x.id]; if (p?.st === 'reussi') { t += p.pts; d++; } } const e = $('#score'); if (e) e.textContent = `${d}/${index.length} défis · ${t} pts`; }
function renderDefHeader() { if (!curDef) return; $('#enonce-body').textContent = curDef.enonce; $('#def-title').textContent = `Défi ${curDef.id} — ${curDef.title}`; $('#def-meta').textContent = `${curDef.module} · ${stars(curDef.difficulty)} · ${curDef.points} pts`; }

const views = {
  async home() {
    let last = ''; let h = `<section class="intro"><h1>CyberLab</h1><p>Simulateur de laboratoire de cybersécurité, <strong>100 % dans le navigateur</strong> : aucune installation, aucun serveur. Chaque défi vous donne des données fictives réalistes, un terminal et un correcteur automatique. Votre progression reste sur cet appareil.</p><p class="note">Terminal simulé : commandes usuelles (grep, awk, sed, sort, cut…) réimplémentées en JavaScript. Pour le laboratoire complet avec un vrai Linux, utilisez l'image Docker du dépôt.</p></section><h2>Défis</h2><div class="cards">`;
    for (const d of index) { if (d.module !== last) { h += `</div><h3>${d.module}</h3><div class="cards">`; last = d.module; } const p = S.prog[d.id]; const st = p?.st === 'reussi' ? `<span class="tag ok">réussi ${p.pts}/${d.points}</span>` : p?.st === 'en_cours' ? '<span class="tag wip">en cours</span>' : '<span class="tag">à faire</span>'; h += `<a class="card" href="#/defi/${d.id}"><div class="num">${d.id}</div><div><strong>${d.title}</strong><br><small>${stars(d.difficulty)} · ${d.points} pts</small></div>${st}</a>`; }
    h += `</div><h2>Leçons</h2><ul class="lessons">${lessons.map(l => `<li><a href="#/cours/${l.replace('.md', '')}">${l.replace('.md', '').replace(/-/g, ' ')}</a></li>`).join('')}</ul>`;
    $('#main').innerHTML = h;
  },
  async defi(id) {
    id = normId(id); if (!index.find(d => d.id === id)) { $('#main').innerHTML = '<p>Défi introuvable. <a href="#/">Retour</a></p>'; return; }
    $('#main').innerHTML = `<div class="defi"><aside><button class="btn ghost small" id="toggle" aria-expanded="true">Énoncé</button><h2 id="def-title"></h2><p id="def-meta" class="muted"></p><pre id="enonce-body"></pre></aside><section><div id="term" class="term" aria-label="Terminal"></div></section></div>`;
    if (innerWidth <= 820) { $('aside').classList.add('collapsed'); $('#toggle').setAttribute('aria-expanded', 'false'); }
    $('#toggle').onclick = () => { const a = $('aside'); a.classList.toggle('collapsed'); $('#toggle').setAttribute('aria-expanded', !a.classList.contains('collapsed')); };
    const resume = S.work[id] && S.cur !== null; const def = await startDef(id, null, !S.work[id]); renderDefHeader();
    term = new Term($('#term'), { prompt: () => `stagiaire@cyberlab:${shell.cwd.replace(HOME, '~')}$ `, complete: (w, first) => { const dir = w.includes('/') ? w.slice(0, w.lastIndexOf('/') + 1) : ''; const base = w.slice(dir.length); const p = shell.path(dir || '.'); return fsv.isDir(p) ? fsv.list(p).filter(n => n.startsWith(base)).map(n => dir + n + (fsv.isDir(p + '/' + n) ? '/' : '')) : []; },
      onLine: async line => { if (!line.trim()) return; shell.history.push(line); const o = new Stream(); const mark = term; const io = { in: new Stream(''), out: o, err: o }; o.write = function (x) { this.s += x; term.print(x); }; let rc; try { rc = await shell.run(line, io); } catch (e) { term.print(`bash: ${e.message}\n`); } snapshot(); if (shell.exitNow) { shell.exitNow = false; } } });
    const w = (s) => term.print(s);
    w(`${CYA}${B}   CyberLab — simulateur web${R}\n   ${DIM}Terminal simulé · tapez ${R}${B}help${R}${DIM} pour les commandes, ${R}${B}defi aide${R}${DIM} pour le défi.${R}\n`);
    if (!S.work[id]?.seen) { const io = { out: { write: w } }; w(header(`Défi ${id} — ${def.title}   [${stars(def.difficulty)} · ${def.points} pts]`) + '\n' + indent(def.enonce) + `\n  ${B}Atelier :${R} ${CYA}${wd(def)}${R}\n  ${DIM}Commencez par : ls puis cat <fichier> · defi indice · defi valider${R}\n\n`); S.work[id].seen = true; store.save(S); } else w(`\n  ${DIM}Atelier restauré : ${wd(def)}${R}\n\n`);
    term.inp.focus();
  },
  async cours(name) { const t = await get(`cours/${name}.md`); $('#main').innerHTML = `<article class="lesson">${md(t)}<p><a href="#/">&larr; Retour</a></p></article>`; },
};
async function route() {
  const [, k, a] = location.hash.split('/'); document.querySelectorAll('nav a').forEach(x => x.classList.toggle('on', x.getAttribute('href') === '#/' + (k || ''))); term = null;
  try { if (k === 'defi') await views.defi(a); else if (k === 'cours' && a) await views.cours(a); else await views.home(); } catch (e) { $('#main').innerHTML = `<p class="err">Erreur de chargement : ${e.message}</p>`; }
  window.scrollTo(0, 0);
}
(async function init() { try { index = await get('data/index.json'); lessons = await get('data/cours.json'); } catch (e) { $('#main').innerHTML = '<p class="err">Données introuvables : lancez <code>node tools/build-site-data.mjs</code> (voir README).</p>'; return; } updateScore(); window.addEventListener('hashchange', route); route(); })();
