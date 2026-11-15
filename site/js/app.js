import * as bil from './bilan.js'; import { VFS } from './vfs.js'; import { Shell, Stream } from './shell.js'; import { Term, editor } from './term.js'; import { runChecks } from './lib.js'; import { md } from './md.js'; import { explain, fmtTime } from './panel.js'; import * as inst from './install.js'; import * as cb from './casebook.js'; import { detectOutputs } from './ssh01.js'; import { TW, MISSIONS, GROUP, build } from './missions.js';
const $ = s => document.querySelector(s); const KEY = 'cyberlab.v1';
const store = { load() { try { return JSON.parse(localStorage.getItem(KEY)) || { prog: {}, cur: null, work: {} }; } catch { return { prog: {}, cur: null, work: {} }; } }, save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { } } };
let S = store.load(); const cache = {}; let index = [], lessons = [], parcours = [];
const get = async u => { if (cache[u]) return cache[u]; const r = await fetch(u); if (!r.ok) throw new Error(u); return cache[u] = u.endsWith('.json') ? await r.json() : await r.text(); };
const B = '\x1b[1m', R = '\x1b[0m', DIM = '\x1b[2m', GRN = '\x1b[32m', RED = '\x1b[31m', YEL = '\x1b[33m', CYA = '\x1b[36m';
const stars = n => '★'.repeat(Math.min(n, 3)) + '☆'.repeat(Math.max(0, 3 - n)) + (n > 3 ? '+' : '');
const HOME = '/home/stagiaire'; const wd = def => `${HOME}/atelier/${def.name}`;
let term = null, shell = null, fsv = null, curDef = null, curTwin = null, curTools = null;

function snapshot() { if (!curDef || !fsv) return; S.work[curDef.id] = { ...S.work[curDef.id], files: fsv.snapshot(wd(curDef)), x: [...fsv.f].filter(([k, v]) => v.x && k.startsWith(wd(curDef) + '/')).map(([k]) => k.slice(wd(curDef).length + 1)) }; store.save(S); }
function mount(def, variant, files, tools = null) { fsv = new VFS(); fsv.mkdirp(wd(def)); fsv.mkdirp(HOME + '/.bashlab'); for (const [k, c] of Object.entries(files)) { const p = wd(def) + '/' + k; fsv.mkdirp(p.slice(0, p.lastIndexOf('/'))); fsv.write(p, c); } for (const k of new Set([...(variant.exec || []), ...(S.work[def.id]?.x || [])])) { const f = fsv.f.get(wd(def) + '/' + k); if (f) f.x = true; } shell = new Shell(fsv, { home: HOME, cwd: wd(def), tools, edit: editor, defi: defiCmd }); }
const header = t => `\n${CYA}${B}╔══════════════════════════════════════════════════════════╗${R}\n${CYA}${B}║${R}  ${B}${t}${R}\n${CYA}${B}╚══════════════════════════════════════════════════════════╝${R}\n`;
const indent = s => s.split('\n').map(l => '  ' + l).join('\n');

async function startDef(id, io, fresh = true) {
  const mdef = TW[id]; const had = S.work[id]; let def, vi = 0, files; curTools = null; curTwin = null;
  if (mdef) {
    const seed = (!fresh && had?.seed) || (1 + Math.floor(Math.random() * 2147483000)); const b = build(mdef, seed); def = b.def; curTools = b.tools; curTwin = b.tw;
    if (!fresh && had) files = had.files; else { files = b.files; S.work[id] = { variant: 0, seed, files, mode: S.mode || 'guide', elapsed: 0, log: [] }; S.prog[id] = { st: 'en_cours', pts: 0, hints: 0 }; }
  } else {
    def = await get(`data/${id}.json`);
    if (!fresh && had) { vi = had.variant; files = had.files; } else { vi = Math.floor(Math.random() * def.variants.length); files = def.variants[vi].files; S.work[id] = { variant: vi, files, mode: S.mode || 'guide', elapsed: 0, log: [] }; S.prog[id] = { st: 'en_cours', pts: 0, hints: 0 }; }
  }
  S.cur = id; curDef = def; mount(def, mdef ? { exec: [] } : def.variants[vi], files, curTools); store.save(S); updateScore();
  if (io) { io.out.write(header(`Défi ${id} — ${def.title}   [${stars(def.difficulty)} · ${def.points} pts]`) + '\n' + indent(def.enonce) + `\n  ${B}Atelier :${R} ${CYA}${wd(def)}${R}\n  ${DIM}defi enonce · defi indice · defi valider${R}\n\n`); }
  return def;
}
const stepsAll = () => parcours.flatMap(g => g.steps.map(st => ({ ...st, group: g.name })));
const pcOf = id => stepsAll().find(st => st.defi === id);
const orderedIds = () => { const seen = new Set(); const o = []; for (const st of stepsAll()) if (st.defi && st.onWeb && !seen.has(st.defi)) { seen.add(st.defi); o.push(st.defi); } for (const d of index) if (!seen.has(d.id)) o.push(d.id); return o; };
const byId = id => index.find(d => d.id === id);
const normId = x => /^\d$/.test(x) ? '0' + x : x;
async function defiCmd(args, io) {
  const out = io.out; const sub = args[0] || 'aide'; const rest = args.slice(1);
  if (['aide', 'help', '--help', '-h'].includes(sub)) { out.write(`\n  ${B}CyberLab — commandes${R}\n  ${B}defi liste${R}              Tous les défis\n  ${B}defi start <n>${R}          Commencer un défi\n  ${B}defi enonce${R}             Revoir l'énoncé\n  ${B}defi indice${R}             Obtenir un indice (-2 pts)\n  ${B}defi valider${R}            Vérifier la solution\n  ${B}defi suivant${R}            Prochain défi non réussi\n  ${B}defi score${R}              Progression et points\n  ${B}defi reset <n>${R}          Recommencer un défi\n\n`); return 0; }
  if (['liste', 'list', 'ls'].includes(sub)) { let last = ''; out.write(`\n  ${B}DÉFIS DISPONIBLES${R}\n`); for (const id of orderedIds()) { const d = byId(id); const g = pcOf(id)?.group || 'Autres'; if (g !== last) { out.write(`\n  ${CYA}${B}── ${g} ──${R}\n`); last = g; } const st = S.prog[d.id]?.st; const mark = st === 'reussi' ? `${GRN}✔ réussi ${R}` : st === 'en_cours' ? `${YEL}▶ en cours${R}` : `${DIM}· à faire ${R}`; out.write(`   ${mark}  ${B}${d.id}${R}  ${d.title.padEnd(48)} ${stars(d.difficulty)}  ${DIM}${String(d.points).padStart(2)} pts${R}\n`); } out.write(`\n  ${DIM}Pour commencer : ${R}${B}defi start <numéro>${R}\n\n`); return 0; }
  if (['start', 'go', 'reset'].includes(sub)) { const id = normId(rest[0] || ''); if (!index.find(d => d.id === id)) { out.write(`${RED}${B}Erreur :${R} défi '${rest[0] ?? ''}' inexistant.\n`); return 1; } await startDef(id, io); if (location.hash !== '#/defi/' + id) history.replaceState(null, '', '#/defi/' + id); renderDefHeader(); return 0; }
  if (sub === 'suivant' || sub === 'next') { const nid = orderedIds().find(i => S.prog[i]?.st !== 'reussi'); const n = nid && byId(nid); if (!n) { out.write(`\n  ${GRN}${B}Tous les défis sont réussis !${R}\n\n`); return 0; } return defiCmd(['start', n.id], io); }
  if (sub === 'score' || sub === 'points') { let tot = 0, max = 0, dn = 0; out.write(`\n  ${B}PROGRESSION${R}\n\n`); for (const d of index) { max += d.points; const p = S.prog[d.id]; if (p?.st === 'reussi') { tot += p.pts; dn++; out.write(`   ${GRN}✔${R} ${d.id} ${d.title.padEnd(40)} ${B}${String(p.pts).padStart(2)}${R}${DIM}/${d.points} pts${R}\n`); } } if (!dn) out.write(`   ${DIM}Aucun défi réussi. Lancez : defi start 02${R}\n`); const w = 30, f = Math.floor(dn * w / index.length); out.write(`\n   [${'█'.repeat(f)}${'░'.repeat(w - f)}]  ${dn}/${index.length} défis\n   ${B}Score : ${tot}/${max} points${R}\n\n`); return 0; }
  if (!curDef) { out.write(`${RED}${B}Erreur :${R} aucun défi en cours. Essayez : defi start 02\n`); return 1; }
  if (sub === 'enonce' || sub === 'énoncé') { out.write(header(`Défi ${curDef.id} — ${curDef.title}`) + '\n' + indent(curDef.enonce) + '\n'); return 0; }
  if (sub === 'indice' || sub === 'hint') { if (S.work[curDef.id]?.mode === 'expert') { out.write(`\n  ${YEL}Mode Expert : les indices sont désactivés.${R}\n  ${DIM}Repassez en mode Guidé (bouton Mode) : le défi ne comptera plus comme réussi en Expert.${R}\n\n`); return 0; } const p = S.prog[curDef.id] ||= { st: 'en_cours', pts: 0, hints: 0 }; const tot = curDef.indices.length; if (p.hints >= tot) { out.write(`\n  ${YEL}Tous les indices révélés :${R}\n\n` + curDef.indices.map((h, i) => `  ${String(i + 1).padStart(2)}. ${h}`).join('\n') + '\n\n'); return 0; } p.hints++; store.save(S); out.write(`\n  ${YEL}${B}Indice ${p.hints}/${tot}${R}\n\n  > ${curDef.indices[p.hints - 1]}\n\n`); return 0; }
  if (sub === 'valider' || sub === 'check') {
    const work = S.work[curDef.id]; const files = fsv.snapshot(wd(curDef)); let extra; if (curDef.special === 'ssh') { const v = curDef.variants[work.variant]; const base = wd(curDef); const Rm = fsv.f.get(base + '/preuves/retest.txt')?.m; const watched = Object.keys(files).filter(k => /^srv01\/(etc\/ssh\/sshd_config|etc\/nftables\.conf|home\/[^/]+\/\.ssh\/authorized_keys|var\/spool\/cron\/crontabs\/[^/]+)$/.test(k)); extra = { detect: await detectOutputs(v, files, { Shell, VFS, Stream }), fresh: Rm !== undefined && watched.every(k => !(fsv.f.get(base + "/" + k).m > Rm)) }; }
    const res = curDef.twin ? curDef.check(files) : runChecks(curDef, curDef.variants[work.variant], files, extra);
    for (const l of res.lines) { if (l.k === 'phase') out.write(`\n  ${B}${l.t}${R}\n`); else if (l.k === 'raw') out.write(`${l.t}\n`); else out.write(l.k === 'ok' ? `    ✔ ${l.t}\n` : `    ✘ ${l.t}\n`); }
    if (res.ok) { out.write(`\n  ✔ ${curDef.finish}\n`); const p = S.prog[curDef.id] ||= { st: 'en_cours', pts: 0, hints: 0 }; if (p.st === 'reussi') out.write(`\n  ${GRN}${B}✔ Toujours juste !${R}\n\n`); else { let earned = curDef.points - 2 * p.hints; const min = Math.floor(curDef.points / 2); if (earned < min) earned = min; p.st = 'reussi'; p.pts = earned; const wk = S.work[curDef.id]; p.expert = wk.mode === 'expert' && p.hints === 0; p.time = wk.elapsed || 0; store.save(S); updateScore(); out.write(`\n  ${GRN}${B}╔═══════════════════════════════════╗\n  ║   ✔  DÉFI RÉUSSI ! Bravo !        ║\n  ╚═══════════════════════════════════╝${R}\n    Points : ${B}${earned}/${curDef.points}${R}  ${DIM}(indices: ${p.hints})${R}${p.expert ? `  ${YEL}${B}★ Expert${R} ${DIM}en ${fmtTime(p.time)}${R}` : ''}\n\n`); } return 0; }
    out.write(`\n  ${RED}${B}✘ Pas encore...${R} ${DIM}defi enonce · defi indice${R}\n\n`); return 1;
  }
  out.write(`${RED}${B}Erreur :${R} commande inconnue '${sub}'. Voir : defi aide\n`); return 1;
}

function updateScore() {
  let t = 0, d = 0; for (const x of index) { const p = S.prog[x.id]; if (p?.st === 'reussi') { t += p.pts; d++; } }
  const e = $('#score'); if (e) e.innerHTML = `<span class="pill-ring" style="--p:${index.length ? Math.round(d * 100 / index.length) : 0}"></span><span>${d}/${index.length} défis · <strong>${t} pts</strong></span>`;
}
const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function renderDefHeader() {
  if (!curDef) return; const pc = pcOf(curDef.id);
  $('#enonce-body').textContent = curDef.enonce; $('#def-title').textContent = `Défi ${curDef.id} — ${curDef.title}`;
  $('#crumbs').innerHTML = `<a href="#/">Parcours</a><span aria-hidden="true">›</span><span>${pc ? esc(pc.group) : 'Défi'}</span><span aria-hidden="true">›</span><span aria-current="page">Défi ${curDef.id}</span>`;
  $('#def-meta').innerHTML = `<span class="chip">${stars(curDef.difficulty)}</span><span class="chip">${curDef.points} pts</span>` + (pc ? `<a class="chip link" href="#/cours/${pc.file}">Leçon ${pc.code}</a>` : '');
  refreshFiles(); renderBanner(); applyMode(); renderJournal(); renderCase();
}
function listFiles() { if (!curDef || !fsv) return []; const base = wd(curDef); return Object.keys(fsv.snapshot(base)).sort(); }
function refreshFiles() { const box = $('#files'); if (!box || !curDef) return; const fl = listFiles(); box.innerHTML = fl.length ? fl.map(f => `<button class="file" data-f="${esc(f)}" title="Afficher ${esc(f)}"><span class="ico">${/\/$/.test(f) ? '' : '▤'}</span>${esc(f)}</button>`).join('') : '<p class="muted">Aucun fichier.</p>'; box.querySelectorAll('.file').forEach(b => b.onclick = () => runLine(`cat '${b.dataset.f}'`)); }
function record(line, rc, out) {
  const w = S.work[curDef.id]; (w.log ||= []).push({ t: w.elapsed || 0, line, rc }); if (w.log.length > 200) w.log.shift(); store.save(S);
  lastRun = { id: curDef.id, line, out }; renderJournal(); renderComprendre(explain(line, rc, out), line); const ad = document.querySelector('[data-cb=add]'); if (ad) ad.disabled = false;
}
function renderComprendre(x, line) {
  const el = document.querySelector('[data-ppane=comprendre]'); if (!el) return;
  el.innerHTML = `<p class="pcmd"><code>${esc(line)}</code></p>` + (x.synth ? `<p>${esc(x.synth)}</p>` : '') + `<ul class="pl">${x.items.map(i => `<li><strong>${esc(i.cmd)}</strong> — ${esc(i.what)} <span class="muted">${esc(i.tip)}</span></li>`).join('')}</ul><p class="res ${x.rc === 0 ? 'ok' : 'ko'}">${esc(x.res)}</p><p class="muted small">Distinguez ce que vous avez observé de ce que vous supposez, puis recoupez avec une seconde observation.</p>`;
}
function renderJournal() {
  const el = document.querySelector('[data-ppane=journal]'); const c = $('#jcount'); const lg = (S.work[curDef.id]?.log) || []; if (c) c.textContent = lg.length; if (!el) return;
  el.innerHTML = lg.length ? `<ol class="jl">${lg.slice().reverse().map(e => `<li><span class="muted">${fmtTime(e.t)}</span> <code>${esc(e.line)}</code> <span class="rc ${e.rc === 0 ? 'ok' : 'ko'}">${e.rc === 0 ? 'ok' : 'code ' + e.rc}</span></li>`).join('')}</ol>` : '<p class="muted small">Votre journal commence ici. Les commandes de ce défi y sont enregistrées.</p>';
}
function bindPTabs() { document.querySelectorAll('[data-ptab]').forEach(b => b.onclick = () => { document.querySelectorAll('[data-ptab]').forEach(x => x.setAttribute('aria-selected', x === b)); document.querySelectorAll('.ppane').forEach(p => p.hidden = p.dataset.ppane !== b.dataset.ptab); if (b.dataset.ptab === 'lab') renderLab(); }); }
function installLab() {
  if (!curDef?.twin) return; const panel = document.querySelector('.panel'); if (!panel || panel.querySelector('[data-ptab=lab]')) return;
  panel.querySelector('.tabs').insertAdjacentHTML('beforeend', '<button role="tab" aria-selected="false" data-ptab="lab">Vue du lab <span id="lcount" class="count">0</span></button><button role="tab" aria-selected="false" data-ptab="web">Web</button>');
  panel.insertAdjacentHTML('beforeend', `<div class="ppane" data-ppane="lab" hidden></div><div class="ppane" data-ppane="web" hidden><form class="webbar" id="webform"><input id="weburl" aria-label="Adresse" value="http://www.${esc(curTwin.domain)}/" spellcheck="false"><button class="btn small" type="submit">Ouvrir</button></form><pre class="exc" id="webout">Saisissez une adresse du domaine puis Ouvrir. Même réponse que curl -i.</pre></div>`);
  $('#webform').onsubmit = async e => { e.preventDefault(); const o = new Stream(); await curTools.curl.call(shell, ['-i', $('#weburl').value.trim()], { in: new Stream(''), out: o, err: o }); $('#webout').textContent = o.s || '(aucune réponse)'; renderLab(); };
  bindPTabs(); renderLab();
}
function renderLab() {
  const el = document.querySelector('[data-ppane=lab]'); if (!el || !curTwin) return; const ev = curTwin.events; const al = ev.filter(e => e.sev === 'alerte').length; const c = $('#lcount'); if (c) c.textContent = al;
  el.innerHTML = `<p class="small"><strong>Périmètre</strong> : domaine ${esc(curTwin.domain)}, plage ${esc(curTwin.net)}.0/24. Cible : ${esc(curTwin.orgName)}.</p><p class="small"><strong>Ce que voit la défense</strong> (pare-feu, DNS, serveur web) :</p>` + (ev.length ? `<ol class="jl">${ev.slice().reverse().slice(0, 40).map(e => `<li><span class="rc ${e.sev === 'alerte' ? 'ko' : ''}">${e.sev === 'alerte' ? 'ALERTE' : 'info'}</span> ${esc(e.msg)}</li>`).join('')}</ol>` : '<p class="muted small">Rien à signaler pour le moment : vous n\'avez encore rien sondé.</p>');
}
let lastRun = null;
function renderCase() {
  const el = document.querySelector('[data-ppane=casebook]'); if (!el || !curDef) return; const w = S.work[curDef.id]; el.innerHTML = cb.view(w); const c = $('#ccount'); if (c) c.textContent = cb.ensure(w).ev.length;
  const add = el.querySelector('[data-cb=add]'); if (add) add.disabled = !lastRun || lastRun.id !== curDef.id;
  const ta = $('#cb-concl'); ta.oninput = () => { cb.ensure(S.work[curDef.id]).concl = ta.value; store.save(S); };
  el.querySelectorAll('[data-cb]').forEach(b => b.onclick = () => { const k = b.dataset.cb; const w2 = S.work[curDef.id];
    if (k === 'add') { if (lastRun && cb.addEvidence(w2, lastRun.line, lastRun.out)) { store.save(S); renderCase(); } }
    else if (k === 'del') { cb.removeEvidence(w2, +b.dataset.n); store.save(S); renderCase(); }
    else { const r = cb.reportData(curDef, w2, S.prog[curDef.id]); const base = `rapport-defi-${curDef.id}`; if (k === 'md') cb.download(base + '.md', cb.toMarkdown(r), 'text/markdown'); else cb.download(base + '.html', cb.toHtml(r), 'text/html'); } });
}
let tick = null;
function applyMode() {
  const w = curDef && S.work[curDef.id]; if (!w) return; const ex = w.mode === 'expert'; const pr = S.prog[curDef.id];
  const b = document.querySelector('[data-act=mode]'); if (b) { b.textContent = `Mode : ${ex ? 'Expert' : 'Guidé'}`; b.setAttribute('aria-pressed', ex); }
  const ib = document.querySelector('[data-act=indice]'); if (ib) { ib.disabled = ex; ib.title = ex ? 'Indices désactivés en mode Expert' : 'Révèle un indice (-2 points)'; }
  const t = $('#timer'); if (t) { t.hidden = !ex; t.textContent = fmtTime(w.elapsed || 0); }
  clearInterval(tick); if (ex && pr?.st !== 'reussi') tick = setInterval(() => { if (document.hidden || !$('#timer')) { if (!$('#timer')) clearInterval(tick); return; } const cw = S.work[curDef?.id]; if (!cw) return; cw.elapsed = (cw.elapsed || 0) + 1; $('#timer').textContent = fmtTime(cw.elapsed); if (cw.elapsed % 10 === 0) store.save(S); }, 1000);
}
function toggleMode() {
  const w = S.work[curDef.id]; const pr = S.prog[curDef.id];
  if (w.mode === 'expert') { w.mode = 'guide'; S.mode = 'guide'; }
  else { if ((pr?.hints || 0) > 0) { term.print(`\n  ${YEL}Des indices ont déjà été utilisés : recommencez le défi pour tenter l'Expert.${R}\n\n`); return; } w.mode = 'expert'; S.mode = 'expert'; }
  store.save(S); applyMode();
}
function renderBanner() {
  const b = $('#banner'); if (!b || !curDef) return; const p = S.prog[curDef.id];
  if (p?.st !== 'reussi') { b.hidden = true; b.innerHTML = ''; return; }
  const ids = orderedIds(); const nx = ids.slice(ids.indexOf(curDef.id) + 1).find(i => S.prog[i]?.st !== 'reussi') || ids.find(i => S.prog[i]?.st !== 'reussi');
  b.hidden = false; b.innerHTML = `<div><strong>Défi réussi</strong> <span class="muted">${p.pts}/${curDef.points} pts · ${p.hints} indice(s)${p.expert ? ` · Expert en ${fmtTime(p.time)}` : ''}</span></div><div class="acts">${nx ? `<a class="btn" href="#/defi/${nx}">Défi suivant : ${nx}</a>` : '<span class="muted">Tous les défis sont réussis.</span>'}<a class="btn ghost" href="#/">Retour au parcours</a></div>`;
}
let runLine = () => { };
const views = {
  async home() {
    const tot = index.length, done = index.filter(d => S.prog[d.id]?.st === 'reussi').length, pts = index.reduce((a, d) => a + (S.prog[d.id]?.st === 'reussi' ? S.prog[d.id].pts : 0), 0), max = index.reduce((a, d) => a + d.points, 0);
    const cur = S.cur && byId(S.cur) && S.prog[S.cur]?.st !== 'reussi' ? S.cur : null; const nextId = orderedIds().find(i => S.prog[i]?.st !== 'reussi'); const pct = Math.round(done * 100 / tot);
    let h = `<section class="hero"><div><p class="eyebrow">Laboratoire de cybersécurité</p><h1>Comprendre. Pratiquer. Passer à l'action.</h1><p class="lead">Un laboratoire <strong>100 % dans le navigateur</strong> : chaque étape propose une <strong>leçon</strong> puis un <strong>défi</strong>, avec des données fictives réalistes, un terminal et une correction automatique. Rien à installer, votre progression reste sur cet appareil.</p><p class="cta">`;
    h += !done && !cur ? `<a class="btn" href="#/cours/00-prise-en-main">Commencer par la prise en main</a><a class="btn ghost" href="#parcours" data-scroll>Voir le parcours</a>` : (cur ? `<a class="btn" href="#/defi/${cur}">Reprendre le défi ${cur}</a>` : (nextId ? `<a class="btn" href="#/defi/${nextId}">Défi suivant : ${nextId}</a>` : '')) + '<a class="btn ghost" href="#parcours" data-scroll>Voir le parcours</a>';
    h += `</p></div><aside class="progress-card" aria-label="Progression"><div class="ring" style="--p:${pct}"><span>${pct}<small>%</small></span></div><p><strong>${done}/${tot}</strong> défis réussis<br><span class="muted">${pts}/${max} points</span></p></aside></section>`;
    h += `<p class="note">Terminal simulé : commandes usuelles (grep, awk, sed, sort, cut…) réimplémentées en JavaScript. Pour le laboratoire complet avec un vrai Linux, utilisez l'image Docker du dépôt.</p><p class="cta-real"><a class="btn ghost" href="#/installer">Installer le lab complet sur une vraie machine</a></p><div id="parcours">`;
    parcours.forEach((g, gi) => {
      const ids = g.steps.map(x => x.defi).filter((x, i, a) => x && a.indexOf(x) === i && byId(x)); const dn = ids.filter(i => S.prog[i]?.st === 'reussi').length;
      h += `<section class="group"><header><h2><span class="gnum">${gi + 1}</span>${esc(g.name)}</h2><span class="muted">${dn}/${ids.length} défis</span></header><ol class="steps">`;
      for (const st of g.steps) {
        const d = st.defi && st.onWeb ? byId(st.defi) : null; const p = d && S.prog[d.id]; const ok = p?.st === 'reussi';
        h += `<li class="step ${ok ? 'done' : ''}"><a class="code" href="#/cours/${st.file}" aria-label="Leçon ${esc(st.code)}">${ok ? '✓' : esc(st.code)}</a><div class="sb"><strong>${esc(st.title)}</strong><small>${esc(st.duree)}${d ? ` · ${stars(d.difficulty)} · ${d.points} pts` : ''}</small></div><div class="acts"><a class="btn ghost small" href="#/cours/${st.file}">Leçon</a>` + (d ? `<a class="btn small" href="#/defi/${d.id}">${p?.st === 'en_cours' ? 'Reprendre' : ok ? 'Refaire' : 'Défi'} ${d.id}</a>${ok ? `<span class="tag ok">${p.pts}/${d.points}</span>` : ''}` : st.defi ? `<span class="muted small" title="Ce défi utilise des outils réels (sshd, ssh-keygen) : image Docker">Défi ${st.defi} : Docker</span>` : '') + `</div></li>`;
      }
      h += '</ol></section>';
    });
    h += '</div>'; $('#main').innerHTML = h;
    document.querySelectorAll('[data-scroll]').forEach(a => a.onclick = e => { e.preventDefault(); $('#parcours').scrollIntoView({ behavior: 'smooth' }); });
  },
  async defi(id) {
    id = normId(id); if (!index.find(d => d.id === id)) { $('#main').innerHTML = '<p>Défi introuvable. <a href="#/">Retour</a></p>'; return; }
    $('#main').innerHTML = `<nav id="crumbs" class="crumbs" aria-label="Fil d'Ariane"></nav><div class="defi-head"><h1 id="def-title"></h1><div id="def-meta" class="meta"></div></div><div id="banner" class="banner" hidden></div>
    <div class="defi"><aside class="side" aria-label="Énoncé et fichiers"><div class="tabs" role="tablist"><button role="tab" aria-selected="true" data-tab="enonce">Énoncé</button><button role="tab" aria-selected="false" data-tab="files">Fichiers</button></div><div class="tabpane" data-pane="enonce"><pre id="enonce-body"></pre></div><div class="tabpane" data-pane="files" hidden><p class="muted small">Cliquez un fichier pour l'afficher dans le terminal.</p><div id="files" class="files"></div></div></aside>
    <section class="work"><div class="toolbar" role="toolbar" aria-label="Actions du défi"><button class="btn small" data-act="valider" title="Vérifier votre travail">Valider</button><button class="btn ghost small" data-act="indice" title="Révèle un indice (-2 points)">Indice</button><button class="btn ghost small" data-act="mode" aria-pressed="false" title="Basculer entre Guidé (indices) et Expert (sans indices, chronomètre)">Mode : Guidé</button><span id="timer" class="chip" hidden aria-live="off">00:00</span><button class="btn ghost small" data-act="edit" title="Ouvrir reponses.txt dans l'éditeur">Éditer reponses.txt</button><button class="btn ghost small" data-act="enonce">Énoncé</button><span class="grow"></span><button class="btn ghost small" data-act="font" title="Taille du texte" aria-label="Agrandir le texte">A+</button><button class="btn ghost small danger" data-act="reset" title="Recommencer ce défi avec de nouvelles données">Recommencer</button></div>
    <div id="term" class="term" aria-label="Terminal"></div><section class="panel" aria-label="Journal et interprétation"><div class="tabs" role="tablist"><button role="tab" aria-selected="true" data-ptab="comprendre">Comprendre</button><button role="tab" aria-selected="false" data-ptab="journal">Journal <span id="jcount" class="count">0</span></button><button role="tab" aria-selected="false" data-ptab="casebook">Casebook <span id="ccount" class="count">0</span></button></div><div class="ppane" data-ppane="comprendre"><p class="muted small">Exécutez une commande pour en lire l'interprétation.</p></div><div class="ppane" data-ppane="casebook" hidden></div><div class="ppane" data-ppane="journal" hidden><p class="muted small">Votre journal commence ici. Les commandes de ce défi y sont enregistrées.</p></div></section><p class="hint">Astuce : Tab complète les noms de fichiers, ↑ rappelle la commande précédente.</p></section></div>`;
    document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-selected', x === b)); document.querySelectorAll('.tabpane').forEach(p => p.hidden = p.dataset.pane !== b.dataset.tab); });
    const def = await startDef(id, null, !S.work[id]); S.work[id].mode ||= 'guide'; S.work[id].elapsed ||= 0; S.work[id].log ||= []; renderDefHeader(); applyMode(); renderJournal();
    bindPTabs(); installLab();
    term = new Term($('#term'), { prompt: () => `stagiaire@cyberlab:${shell.cwd.replace(HOME, '~')}$ `, complete: (w) => { const dir = w.includes('/') ? w.slice(0, w.lastIndexOf('/') + 1) : ''; const base = w.slice(dir.length); const p = shell.path(dir || '.'); return fsv.isDir(p) ? fsv.list(p).filter(n => n.startsWith(base)).map(n => dir + n + (fsv.isDir(p + '/' + n) ? '/' : '')) : []; },
      onLine: async line => { if (!line.trim()) return; shell.history.push(line); const o = new Stream(); const io = { in: new Stream(''), out: o, err: o }; o.write = function (x) { this.s += x; term.print(x); }; let rc = 0; try { rc = await shell.run(line, io); } catch (e) { rc = 2; term.print(`bash: ${e.message}\n`); } if (!/^\s*defi\b/.test(line)) record(line, rc, o.s); renderLab(); snapshot(); refreshFiles(); renderBanner(); if (shell.exitNow) shell.exitNow = false; } });
    runLine = line => { if (term && !term.busy) { term.inp.value = line; term.form.requestSubmit(); } };
    document.querySelectorAll('.toolbar [data-act]').forEach(b => b.onclick = () => { const a = b.dataset.act; if (a === 'valider') runLine('defi valider'); else if (a === 'indice') runLine('defi indice'); else if (a === 'enonce') runLine('defi enonce'); else if (a === 'mode') toggleMode(); else if (a === 'edit') runLine('nano reponses.txt'); else if (a === 'font') { const t = $('#term'); const on = t.classList.toggle('big'); b.setAttribute('aria-pressed', on); } else if (a === 'reset') { if (confirm('Recommencer ce défi avec de nouvelles données ? Votre travail actuel sera perdu.')) runLine(`defi reset ${id}`); } });
    const w = s => term.print(s);
    w(`${CYA}${B}   CyberLab — simulateur web${R}\n   ${DIM}Terminal simulé · ${R}${B}help${R}${DIM} liste les commandes, ${R}${B}defi aide${R}${DIM} le défi.${R}\n`);
    if (!S.work[id]?.seen) { w(header(`Défi ${id} — ${def.title}   [${stars(def.difficulty)} · ${def.points} pts]`) + '\n' + indent(def.enonce) + `\n  ${B}Atelier :${R} ${CYA}${wd(def)}${R}\n  ${DIM}Commencez par : ls puis cat <fichier>${R}\n\n`); S.work[id].seen = true; store.save(S); } else w(`\n  ${DIM}Atelier restauré : ${wd(def)}${R}\n\n`);
    if (innerWidth > 820) term.inp.focus();
  },
  async cours(name) {
    const t = await get(`cours/${name}.md`); const all = stepsAll(); const i = all.findIndex(x => x.file === name); const st = all[i]; const same = all.filter(x => x.file === name); const nx = all.slice(i + 1).find(x => x.file !== name); const pv = all.slice(0, i).reverse().find(x => x.file !== name); const ds = same.filter(x => x.defi && x.onWeb && byId(x.defi)).map(x => byId(x.defi));
    $('#main').innerHTML = `<nav class="crumbs" aria-label="Fil d'Ariane"><a href="#/">Parcours</a><span aria-hidden="true">›</span><span>${st ? esc(st.group) : 'Leçon'}</span><span aria-hidden="true">›</span><span aria-current="page">${st ? esc(st.code) : ''}</span></nav><article class="lesson">${md(t)}<div class="nav2">${ds.map((d, k) => `<a class="btn${k ? ' ghost' : ''}" href="#/defi/${d.id}">${ds.length > 1 ? 'Mission' : 'Passer au défi'} ${d.id}</a>`).join('')}${nx ? `<a class="btn ghost" href="#/cours/${nx.file}">Leçon suivante : ${esc(nx.code)}</a>` : ''}${pv ? `<a class="btn ghost" href="#/cours/${pv.file}">Précédente : ${esc(pv.code)}</a>` : ''}</div></article>`;
  },
};
async function route() {
  const [, k, a] = location.hash.split('/'); document.querySelectorAll('.top nav a').forEach(x => x.classList.toggle('on', x.getAttribute('href') === '#/' + (k || ''))); term = null; runLine = () => { };
  if (location.hash.startsWith('#parcours')) return;
  try { if (k === 'defi') await views.defi(a); else if (k === 'cours' && a) await views.cours(a); else if (k === 'bilan') { let nom = ''; try { nom = localStorage.getItem('cyberlab.nom') || ''; } catch { } const draw = n => { const bb = bil.compute(S.prog, index, parcours, n); $('#main').innerHTML = bil.render(bb); bil.wire($('#main'), () => bil.compute(S.prog, index, parcours, $('#bilan-nom').value), v => { const el = $('#bilan-nom'); const pos = el.selectionStart; const keep = v; draw(keep); const e2 = $('#bilan-nom'); e2.focus(); e2.setSelectionRange(pos, pos); }); }; draw(nom); } else if (k === 'installer') { $('#main').innerHTML = inst.render(); inst.wire($('#main')); } else await views.home(); } catch (e) { $('#main').innerHTML = `<p class="err">Erreur de chargement : ${esc(e.message)}</p>`; }
  window.scrollTo(0, 0); $('#main').focus({ preventScroll: true });
}
(async function init() { try { index = await get('data/index.json'); lessons = await get('data/cours.json'); parcours = await get('data/parcours.json'); if (!index.some(d => d.id === 'SIM02-1')) { index.push(...MISSIONS.map(m => ({ id: m.id, name: m.id.toLowerCase(), title: m.title, module: m.module, points: m.points, difficulty: m.difficulty }))); parcours.push(GROUP); } } catch (e) { $('#main').innerHTML = '<p class="err">Données introuvables : lancez <code>node tools/build-site-data.mjs</code> (voir README).</p>'; return; } updateScore(); window.addEventListener('hashchange', route); route(); })();
