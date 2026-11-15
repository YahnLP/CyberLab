// Mini-shell : analyse, expansion et exécution (sous-ensemble de bash) + commandes usuelles.
import { VFS } from './vfs.js';
import { runAwk } from './awk.js';
import { runSed } from './sed.js';
import { toJS } from './regex.js';
import { sha256 } from './sha256.js';
import { sshdT, keygenLf, controls } from './ssh01.js';

class Stream { constructor(s = '') { this.s = s; this.p = 0; } write(x) { this.s += x; } readLine() { if (this.p >= this.s.length) return null; let e = this.s.indexOf('\n', this.p); if (e < 0) e = this.s.length; const l = this.s.slice(this.p, e); this.p = e + 1; return l; } rest() { const r = this.s.slice(this.p); this.p = this.s.length; return r; } }
const lines = s => { if (s === '') return []; const a = s.split('\n'); if (a[a.length - 1] === '') a.pop(); return a; };
const joinL = a => a.length ? a.join('\n') + '\n' : '';

// ---------- analyse lexicale ----------
function tokenize(src) {
  const t = []; let i = 0; let n = src.length;
  const isOpCh = c => '|&;<>()'.includes(c);
  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    if (c === '\\' && src[i + 1] === '\n') { i += 2; continue; }
    if (c === '#' && (i === 0 || /\s/.test(src[i - 1]))) { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '\n') { t.push({ op: '\n' }); i++; continue; }
    if (isOpCh(c)) {
      const two = src.slice(i, i + 2), three = src.slice(i, i + 3);
      if (three === '<<<') { t.push({ op: '<<<' }); i += 3; continue; }
      if (two === '<<') { // document en ligne (heredoc)
        let j = i + 2; const strip = src[j] === '-'; if (strip) j++; while (src[j] === ' ' || src[j] === '\t') j++;
        let delim = '', quoted = false; while (j < n && !/[ \t\n;&|<>()]/.test(src[j])) { const ch = src[j]; if (ch === "'" || ch === '"') { quoted = true; const q = ch; j++; while (j < n && src[j] !== q) delim += src[j++]; j++; } else if (ch === '\\') { quoted = true; delim += src[j + 1] ?? ''; j += 2; } else { delim += ch; j++; } }
        if (!delim) { t.push({ op: '<<' }); i += 2; continue; }
        let nlp = src.indexOf('\n', j); const lines = []; let end = src.length;
        if (nlp >= 0) { let k = nlp + 1; end = src.length; while (k <= src.length) { let e = src.indexOf('\n', k); if (e < 0) e = src.length; let ln = src.slice(k, e); if (strip) ln = ln.replace(/^\t+/, ''); if (ln === delim) { end = Math.min(e + 1, src.length); break; } lines.push(strip ? ln : src.slice(k, e)); if (e >= src.length) { end = src.length; break; } k = e + 1; } src = src.slice(0, nlp + 1) + src.slice(end); n = src.length; }
        const body = lines.join('\n'); let part;
        if (quoted) part = { q: 's', t: body };
        else { let s = ''; for (let k = 0; k < body.length; k++) { const ch = body[k]; if (ch === '\\' && body[k + 1] === '\n') { k++; continue; } if (ch === '\\' && '\\$`'.includes(body[k + 1])) { s += '\\' + body[k + 1]; k++; continue; } if (ch === '$' && body[k + 1] === '(') { const e = matchParen(body, k + 1); s += body.slice(k, e + 1); k = e; continue; } s += ch; } part = { q: 'd', t: s }; }
        t.push({ op: '<<<' }); t.push({ w: [part] }); i = j; continue;
      }
      if (['&&', '||', '>>', ';;'].includes(two)) { t.push({ op: two }); i += 2; continue; }
      if (c === '>' && src[i + 1] === '&') { t.push({ op: '>&' }); i += 2; continue; }
      t.push({ op: c }); i++; continue;
    }
    const parts = []; let cur = ''; let started = false;
    const flush = (q) => { if (cur !== '' || q) parts.push({ q, t: cur }); cur = ''; };
    while (i < n && !/[ \t\n]/.test(src[i]) && !isOpCh(src[i])) {
      const ch = src[i];
      if (ch === "'") { flush('n'); i++; let s = ''; while (i < n && src[i] !== "'") s += src[i++]; i++; parts.push({ q: 's', t: s }); started = true; continue; }
      if (ch === '"') { flush('n'); i++; let s = ''; while (i < n && src[i] !== '"') { if (src[i] === '\\' && '"\\$`'.includes(src[i + 1])) { s += '\\' + src[i + 1]; i += 2; continue; } if (src[i] === '$' && src[i + 1] === '(') { const e = matchParen(src, i + 1); s += src.slice(i, e + 1); i = e + 1; continue; } s += src[i++]; } i++; parts.push({ q: 'd', t: s }); started = true; continue; }
      if (ch === '\\') { cur += '\x00' + src[i + 1]; i += 2; continue; }
      if (ch === '$' && src[i + 1] === '(') { const e = matchParen(src, i + 1); cur += src.slice(i, e + 1); i = e + 1; continue; }
      if (ch === '<' && src[i + 1] === '(') { break; }
      cur += ch; i++;
    }
    flush('n'); if (parts.length) t.push({ w: parts });
  }
  return t;
}
function matchParen(s, i) { let d = 0; for (let k = i; k < s.length; k++) { if (s[k] === '(') d++; else if (s[k] === ')') { d--; if (d === 0) return k; } } return s.length - 1; }

// ---------- analyse syntaxique ----------
const RESERVED = new Set(['for', 'while', 'until', 'if', 'then', 'else', 'elif', 'fi', 'do', 'done', 'in']);
const wordText = tk => tk.w && tk.w.length === 1 && tk.w[0].q === 'n' ? tk.w[0].t : null;
function parse(tokens) {
  let p = 0; const peek = () => tokens[p]; const isOp = o => peek() && peek().op === o; const isKw = k => peek() && wordText(peek()) === k;
  const skipNl = () => { while (isOp('\n') || isOp(';')) p++; };
  function parseList(stop = []) {
    const items = []; skipNl();
    while (p < tokens.length && !(peek().w && stop.includes(wordText(peek()))) && !isOp(')') && !isOp(';;')) { items.push(parseAndOr()); if (isOp(';') || isOp('\n')) skipNl(); else if (isOp('&')) { p++; skipNl(); } else break; }
    return items;
  }
  function parseAndOr() { let l = parsePipe(); const ops = []; while (isOp('&&') || isOp('||')) { const o = tokens[p++].op; while (isOp('\n')) p++; ops.push([o, parsePipe()]); } return { t: 'andor', first: l, rest: ops }; }
  function parsePipe() { const cmds = [parseCommand()]; while (isOp('|')) { p++; while (isOp('\n')) p++; cmds.push(parseCommand()); } return { t: 'pipe', cmds }; }
  function parseRedirs(node) {
    node.redirs = node.redirs || [];
    while (peek() && (['>', '>>', '<', '<<<', '>&'].includes(peek().op) || (peek().w && /^[0-9]$/.test(wordText(peek()) || '') && tokens[p + 1] && ['>', '>>', '>&'].includes(tokens[p + 1].op)))) {
      let fd = null; if (peek().w) { fd = +wordText(peek()); p++; }
      const op = tokens[p++].op; const target = tokens[p++]; if (!target || !target.w) throw new Error('erreur de syntaxe près de la redirection');
      node.redirs.push({ fd, op, w: target.w });
    }
    return node;
  }
  function parseCommand() {
    if (isKw('for')) { p++; const v = wordText(tokens[p++]); let words = null; if (isKw('in')) { p++; words = []; while (peek() && !isOp(';') && !isOp('\n')) words.push(tokens[p++].w); } skipNl(); if (!isKw('do')) throw new Error('erreur de syntaxe : « do » attendu'); p++; const body = parseList(['done']); if (!isKw('done')) throw new Error('erreur de syntaxe : « done » attendu'); p++; return parseRedirs({ t: 'for', v, words, body }); }
    if (isKw('while') || isKw('until')) { const until = wordText(tokens[p++]) === 'until'; const cond = parseList(['do']); if (!isKw('do')) throw new Error('erreur de syntaxe : « do » attendu'); p++; const body = parseList(['done']); if (!isKw('done')) throw new Error('erreur de syntaxe : « done » attendu'); p++; return parseRedirs({ t: 'while', until, cond, body }); }
    if (isKw('if')) { p++; const branches = []; let cond = parseList(['then']); if (!isKw('then')) throw new Error('erreur de syntaxe : « then » attendu'); p++; let body = parseList(['elif', 'else', 'fi']); branches.push({ cond, body }); let els = null;
      while (isKw('elif')) { p++; cond = parseList(['then']); p++; body = parseList(['elif', 'else', 'fi']); branches.push({ cond, body }); }
      if (isKw('else')) { p++; els = parseList(['fi']); } if (!isKw('fi')) throw new Error('erreur de syntaxe : « fi » attendu'); p++; return parseRedirs({ t: 'if', branches, els }); }
    if (isOp('(')) { p++; const body = parseList(); if (!isOp(')')) throw new Error('erreur de syntaxe : « ) » attendu'); p++; return parseRedirs({ t: 'sub', body }); }
    if (isKw('{')) { p++; const body = parseList(['}']); p++; return parseRedirs({ t: 'group', body }); }
    const node = { t: 'simple', assigns: [], words: [], redirs: [] };
    while (peek() && !(peek().op && !['>', '>>', '<', '<<<', '>&'].includes(peek().op))) {
      const tk = peek();
      if (tk.op) { parseRedirs(node); continue; }
      if (tk.w && /^[0-9]$/.test(wordText(tk) || '') && tokens[p + 1] && ['>', '>>', '>&'].includes(tokens[p + 1].op)) { parseRedirs(node); continue; }
      const txt = wordText(tk);
      if (!node.words.length && tk.w[0].q === 'n' && /^[A-Za-z_][A-Za-z_0-9]*=/.test(tk.w[0].t)) { node.assigns.push(tk.w); p++; continue; }
      if (!node.words.length && txt !== null && RESERVED.has(txt) && !['in'].includes(txt)) break;
      node.words.push(tk.w); p++;
    }
    if (!node.words.length && !node.assigns.length && !node.redirs.length) throw new Error(`erreur de syntaxe près de « ${peek()?.op ?? wordText(peek() || {}) ?? ''} »`);
    return node;
  }
  const list = parseList(); if (p < tokens.length) throw new Error(`erreur de syntaxe près de « ${peek().op ?? wordText(peek())} »`);
  return list;
}

// ---------- environnement d'exécution ----------
export class Shell {
  constructor(vfs, { home = '/home/stagiaire', cwd, edit, defi, onOut, tools } = {}) {
    this.tools = tools || null;
    this.fs = vfs; this.home = home; this.cwd = cwd || home; this.env = { HOME: home, USER: 'stagiaire', PATH: '/usr/bin:/bin', PWD: this.cwd, SHELL: '/bin/bash', LANG: 'fr_FR.UTF-8' };
    this.last = 0; this.hooks = { edit, defi }; this.args = []; this.history = []; this.depth = 0; this.steps = 0;
  }
  vget(n) { if (n === '$') return '4242'; if (n === '?') return String(this.last); if (n === 'RANDOM') return String(Math.floor(Math.random() * 32768)); if (n === '#') return String(this.args.length); if (/^[0-9]+$/.test(n)) return n === '0' ? 'bash' : (this.args[+n - 1] ?? ''); if (n === '@' || n === '*') return this.args.join(' '); if (n === 'PWD') return this.cwd; return this.env[n] ?? ''; }
  path(p) { if (p === '~') p = this.home; else if (p.startsWith('~/')) p = this.home + p.slice(1); return this.fs.resolve(p, this.cwd); }
  async run(line, io) {
    io = io || { in: new Stream(''), out: new Stream(), err: null };
    this.steps = 0;
    let ast; try { ast = parse(tokenize(line)); } catch (e) { (io.err || io.out).write(`bash: ${e.message}\n`); this.last = 2; return this.last; }
    return this.execList(ast, io);
  }
  async execList(items, io) { let rc = 0; for (const it of items) { rc = await this.execAndOr(it, io); if (this.exitNow) break; } return rc; }
  async execAndOr(n, io) {
    let rc = await this.execPipe(n.first, io);
    for (const [op, p] of n.rest) { if ((op === '&&' && rc === 0) || (op === '||' && rc !== 0)) rc = await this.execPipe(p, io); }
    this.last = rc; return rc;
  }
  async execPipe(n, io) {
    if (n.cmds.length === 1) return this.execCmd(n.cmds[0], io);
    let input = io.in, rc = 0;
    for (let i = 0; i < n.cmds.length; i++) {
      const last = i === n.cmds.length - 1; const out = last ? io.out : new Stream();
      rc = await this.execCmd(n.cmds[i], { in: input, out, err: io.err || io.out }); input = new Stream(out.s);
    }
    return rc;
  }
  async execCmd(n, io) {
    if (++this.steps > 200000) throw new Error('exécution trop longue (boucle infinie ?)');
    // redirections
    let cin = io.in, cout = io.out, cerr = io.err || io.out; const fileOuts = []; 
    for (const r of n.redirs || []) {
      const t = (await this.expandWord(r.w)).join('');
      if (r.op === '<') { try { cin = new Stream(this.fs.read(this.path(t))); } catch (e) { cerr.write(`bash: ${t} : Aucun fichier ou dossier de ce type\n`); return 1; } }
      else if (r.op === '<<<') cin = new Stream(t + '\n');
      else if (r.op === '>&') { if (r.fd === 2 || r.fd === null) { cerr = cout; } }
      else if ((r.op === '>' || r.op === '>>') && (r.fd === null || r.fd === 1 || r.fd === 2)) {
        if (t === '/dev/null') { if (r.fd === 2) cerr = new Stream(); else cout = new Stream(); continue; }
        const s = new Stream(); fileOuts.push({ path: this.path(t), s, append: r.op === '>>' }); if (r.fd === 2) cerr = s; else cout = s;
        try { if (r.op === '>') this.fs.write(this.path(t), ''); } catch (e) { cerr.write(`bash: ${e.message}\n`); return 1; }
      }
    }
    let rc;
    try {
      const io2 = { in: cin, out: cout, err: cerr };
      switch (n.t) {
        case 'simple': rc = await this.execSimple(n, io2); break;
        case 'for': { const items = n.words ? (await Promise.all(n.words.map(w => this.expandWord(w, true)))).flat() : this.args; rc = 0; for (const it of items) { this.env[n.v] = it; rc = await this.execList(n.body, io2); if (this.exitNow) break; } break; }
        case 'while': { rc = 0; let guard = 0; while (true) { if (++guard > 100000) throw new Error('boucle trop longue'); const c = await this.execList(n.cond, io2); if (n.until ? c === 0 : c !== 0) break; rc = await this.execList(n.body, io2); if (this.exitNow) break; } break; }
        case 'if': { rc = 0; let done = false; for (const b of n.branches) { if (await this.execList(b.cond, io2) === 0) { rc = await this.execList(b.body, io2); done = true; break; } } if (!done && n.els) rc = await this.execList(n.els, io2); break; }
        case 'sub': { const save = { ...this.env }, cwd = this.cwd; rc = await this.execList(n.body, io2); this.env = save; this.cwd = cwd; break; }
        case 'group': rc = await this.execList(n.body, io2); break;
      }
    } catch (e) { cerr.write(`bash: ${e.message}\n`); rc = 1; }
    for (const f of fileOuts) { try { this.fs.write(f.path, f.s.s, true); } catch (e) { cerr.write(`bash: ${e.message}\n`); } }
    return rc;
  }
  // ----- expansion -----
  async expandWord(parts, split = false) {
    // retourne la liste des mots résultants
    let fields = [{ s: '', quoted: false, glob: false }]; let cur = fields[0]; let any = false;
    const addText = (txt, q, canSplit) => {
      if (canSplit) { const segs = txt.split(/[ \t\n]+/); segs.forEach((sg, k) => { if (k > 0) { cur = { s: '', quoted: false, glob: false }; fields.push(cur); } cur.s += sg; if (/[*?[]/.test(sg)) cur.glob = true; }); }
      else { cur.s += txt; if (q) cur.quoted = true; }
    };
    for (const part of parts) {
      if (part.q === 's') { cur.s += part.t; cur.quoted = true; any = true; continue; }
      const raw = part.t;
      const res = await this.expandDollar(raw, part.q === 'd');
      if (part.q === 'd') { cur.s += res.replace(/\x00(.)/g, '$1'); cur.quoted = true; any = true; continue; }
      const noEsc = res; let buf = '';
      // échappements \x (marqués \x00)
      const segs = noEsc.split('\x00'); 
      segs.forEach((sg, k) => { if (k === 0) { addText(sg, false, res !== raw && sg !== raw ? true : false); } else { cur.s += sg[0]; cur.quoted = true; if (sg.length > 1) addText(sg.slice(1), false, res !== raw); } });
      if (raw.includes('*') || raw.includes('?') || raw.includes('[')) cur.glob = true;
    }
    fields = fields.filter((f, i) => f.s !== '' || f.quoted || any && fields.length === 1);
    const out = [];
    for (const f of fields) {
      if (f.glob && !f.quoted) { const m = this.glob(f.s); if (m.length) { out.push(...m); continue; } }
      if (/[{]/.test(f.s) && !f.quoted) { out.push(...braces(f.s)); continue; }
      out.push(f.s);
    }
    return out;
  }
  glob(pat) {
    const abs = pat.startsWith('/'); const segs = pat.split('/').filter(Boolean); let cands = [abs ? '/' : this.cwd];
    const rel = [''];
    let paths = [{ real: abs ? '/' : this.cwd, shown: abs ? '/' : '' }];
    for (const sg of segs) {
      const next = [];
      for (const pth of paths) {
        if (!/[*?[]/.test(sg)) { const r = VFS.norm(pth.real + '/' + sg); if (this.fs.exists(r)) next.push({ real: r, shown: pth.shown + (pth.shown && !pth.shown.endsWith('/') ? '/' : '') + sg }); continue; }
        const re = new RegExp('^' + sg.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
        for (const nm of this.fs.list(pth.real)) if (re.test(nm) && (!nm.startsWith('.') || sg.startsWith('.'))) next.push({ real: VFS.norm(pth.real + '/' + nm), shown: pth.shown + (pth.shown && !pth.shown.endsWith('/') ? '/' : '') + nm });
      }
      paths = next;
    }
    return paths.map(x => x.shown).sort();
  }
  async expandDollar(s, dq) {
    let out = '', i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === '\\' && dq && '"\\$`'.includes(s[i + 1])) { out += '\x00' + s[i + 1]; i += 2; continue; }
      if (c === '~' && !dq && i === 0 && (s.length === 1 || s[1] === '/')) { out += this.home; i++; continue; }
      if (c === '`') { const e = s.indexOf('`', i + 1); out += await this.subst(s.slice(i + 1, e)); i = e + 1; continue; }
      if (c !== '$') { out += c; i++; continue; }
      const d = s[i + 1];
      if (d === '(' && s[i + 2] === '(') { const e = matchParen(s, i + 1); const expr = s.slice(i + 3, e - 1); out += String(await this.arith(expr)); i = e + 1; continue; }
      if (d === '(') { const e = matchParen(s, i + 1); out += await this.subst(s.slice(i + 2, e)); i = e + 1; continue; }
      if (d === '{') { const e = s.indexOf('}', i); const inner = s.slice(i + 2, e); out += this.paramExp(inner); i = e + 1; continue; }
      const m = /^([A-Za-z_][A-Za-z_0-9]*|[0-9?#@*$])/.exec(s.slice(i + 1));
      if (m) { out += this.vget(m[1]); i += 1 + m[1].length; continue; }
      out += '$'; i++;
    }
    return out;
  }
  paramExp(inner) {
    if (inner.startsWith('#')) return String(this.vget(inner.slice(1)).length);
    let m = /^([A-Za-z_0-9]+):?-(.*)$/.exec(inner); if (m) { const v = this.vget(m[1]); return v !== '' ? v : m[2]; }
    m = /^([A-Za-z_0-9]+)%%?(.*)$/.exec(inner); if (m) { const v = this.vget(m[1]); const re = new RegExp(m[2].replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*') + '$'); return v.replace(re, ''); }
    m = /^([A-Za-z_0-9]+)##?(.*)$/.exec(inner); if (m) { const v = this.vget(m[1]); const re = new RegExp('^' + m[2].replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*?')); return v.replace(re, ''); }
    return this.vget(inner);
  }
  async arith(expr) { const e = expr.replace(/\$?([A-Za-z_][A-Za-z_0-9]*)/g, (m, v) => String(parseInt(this.vget(v)) || 0)).replace(/\$\{?([0-9?#])\}?/g, (m, v) => String(parseInt(this.vget(v)) || 0)); if (!/^[-+*/%()0-9\s<>=!&|^~]*$/.test(e)) throw new Error('expression arithmétique invalide'); return Math.trunc(Function(`"use strict";return (${e})`)()); }
  async subst(cmd) { const out = new Stream(); const sh = this; const save = { cwd: this.cwd, env: { ...this.env } }; await this.run2(cmd, { in: new Stream(''), out, err: null }); return out.s.replace(/\n+$/, ''); }
  async run2(line, io) { let ast; try { ast = parse(tokenize(line)); } catch (e) { (io.err || io.out).write(`bash: ${e.message}\n`); return 2; } return this.execList(ast, io); }
  async execSimple(n, io) {
    const saved = {};
    for (const a of n.assigns) { const txt = a[0].t; const k = txt.slice(0, txt.indexOf('=')); const rest = [{ q: a[0].q, t: txt.slice(txt.indexOf('=') + 1) }, ...a.slice(1)]; const val = (await this.expandWord(rest)).join(''); if (n.words.length) { saved[k] = this.env[k]; } this.env[k] = val; }
    const words = (await Promise.all(n.words.map(w => this.expandWord(w, true)))).flat();
    if (!words.length) return 0;
    const [name, ...args] = words; let rc;
    try { rc = await this.command(name, args, io); }
    catch (e) { (io.err || io.out).write(`${name} : ${e.message}\n`); rc = 1; }
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete this.env[k]; else this.env[k] = v; }
    return rc ?? 0;
  }
  async command(name, args, io) {
    const out = io.out, err = io.err || io.out;
    if (name.includes('/') || name.startsWith('.')) { const p = this.path(name); if (!this.fs.isFile(p)) { err.write(`bash: ${name} : Aucun fichier ou dossier de ce type\n`); return 127; } if (!this.fs.f.get(p).x) { err.write(`bash: ${name} : Permission non accordée\n`); return 126; } return this.runScript(this.fs.read(p), args, io); }
    const tf = this.tools && Object.prototype.hasOwnProperty.call(this.tools, name) ? this.tools[name] : null; if (tf) return tf.call(this, args, io);
    const fn = CMDS[name]; if (fn) return fn.call(this, args, io);
    err.write(`bash: ${name} : commande introuvable\n`); return 127;
  }
  async runScript(text, args, io) { const sa = this.args; this.args = args; const code = text.replace(/^#!.*\n/, ''); const rc = await this.run2(code, io); this.args = sa; return rc; }
}
function braces(s) {
  const m = /^(.*?)\{([^{}]*)\}(.*)$/.exec(s); if (!m) return [s];
  let items; const r = /^(-?\d+)\.\.(-?\d+)$/.exec(m[2]);
  if (r) { const a = +r[1], b = +r[2]; items = []; for (let k = a; a <= b ? k <= b : k >= b; a <= b ? k++ : k--) items.push(String(k)); } else if (m[2].includes(',')) items = m[2].split(','); else return [s];
  return items.flatMap(it => braces(m[1] + it + m[3]));
}

// ---------- utilitaires de commandes ----------
function parseOpts(args, spec) { // spec : { flags:'nrE', withArg:'dfkt' }
  const o = {}, rest = []; let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === '--') { rest.push(...args.slice(i + 1)); break; }
    if (a.startsWith('--') && a.length > 2) { const [k, v] = a.slice(2).split('='); o[k] = v ?? true; i++; continue; }
    if (a.length > 1 && a[0] === '-' && !/^-\d+$/.test(a) || (spec.numArg && /^-\d+$/.test(a))) {
      if (/^-\d+$/.test(a)) { o[spec.numArg] = a.slice(1); i++; continue; }
      let k = 1; while (k < a.length) { const ch = a[k]; if (spec.withArg?.includes(ch)) { const val = a.slice(k + 1) || args[++i]; (o[ch] = o[ch] === undefined ? val : [].concat(o[ch], val)); break; } o[ch] = true; k++; }
      i++; continue;
    }
    rest.push(a); i++;
  }
  return { o, rest };
}
async function inputs(sh, files, io, err) { // lit stdin ou fichiers
  if (!files.length) return [{ name: '-', text: io.in.rest() }];
  const r = []; for (const f of files) { if (f === '-') { r.push({ name: '-', text: io.in.rest() }); continue; } try { r.push({ name: f, text: sh.fs.read(sh.path(f)) }); } catch (e) { err.write(`${f} : Aucun fichier ou dossier de ce type\n`); r.push(null); } }
  return r;
}
const dateFmt = (t, f, utc = true) => { const d = new Date(t * 1000); const p = (x, n = 2) => String(x).padStart(n, '0'); const g = { Y: d.getUTCFullYear(), m: p(d.getUTCMonth() + 1), d: p(d.getUTCDate()), H: p(d.getUTCHours()), M: p(d.getUTCMinutes()), S: p(d.getUTCSeconds()), s: t }; return f.replace(/%([YmdHMSsTFDa%])/g, (_, c) => c === 'T' ? `${g.H}:${g.M}:${g.S}` : c === 'F' ? `${g.Y}-${g.m}-${g.d}` : c === 'D' ? `${g.m}/${g.d}/${String(g.Y).slice(2)}` : c === 'a' ? ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'][d.getUTCDay()] : c === '%' ? '%' : g[c]); };
function cmpFor(spec) { // spec : tableau de clés {f,e,n,r,fold}
  return (a, b) => { for (const k of spec.keys) { let x = k.get(a), y = k.get(b); if (k.fold) { x = x.toLowerCase(); y = y.toLowerCase(); } let c; if (k.n) { const nx = parseFloat(x) || 0, ny = parseFloat(y) || 0; c = nx - ny; } else if (k.V) { c = x.localeCompare(y, 'en', { numeric: true }); } else c = x < y ? -1 : x > y ? 1 : 0; if (c) return k.r ? -c : c; } if (spec.last) return spec.r ? (a < b ? 1 : a > b ? -1 : 0) : (a < b ? -1 : a > b ? 1 : 0); return 0; };
}
const testExpr = (sh, a) => {
  a = [...a]; if (a[a.length - 1] === ']') a.pop();
  const ev = (t) => {
    if (t.length === 0) return false; if (t[0] === '!') return !ev(t.slice(1));
    const ao = t.indexOf('-a'), oo = t.indexOf('-o'); if (oo > 0) return ev(t.slice(0, oo)) || ev(t.slice(oo + 1)); if (ao > 0) return ev(t.slice(0, ao)) && ev(t.slice(ao + 1));
    if (t.length === 1) return t[0] !== '';
    if (t.length === 2) { const [o, x] = t; switch (o) { case '-z': return x === ''; case '-n': return x !== ''; case '-f': return sh.fs.isFile(sh.path(x)); case '-d': return sh.fs.isDir(sh.path(x)); case '-e': return sh.fs.exists(sh.path(x)); case '-s': return sh.fs.isFile(sh.path(x)) && sh.fs.read(sh.path(x)) !== ''; case '-x': return !!sh.fs.f.get(sh.path(x))?.x; case '-r': case '-w': return sh.fs.exists(sh.path(x)); } }
    if (t.length === 3) { const [x, o, y] = t; switch (o) { case '=': case '==': return x === y; case '!=': return x !== y; case '-eq': return +x === +y; case '-ne': return +x !== +y; case '-lt': return +x < +y; case '-le': return +x <= +y; case '-gt': return +x > +y; case '-ge': return +x >= +y; } }
    throw new Error('test : expression non gérée');
  };
  return ev(a);
};

// ---------- commandes ----------
export const CMDS = {
  async echo(args, io) { let nl = true, esc = false; while (args[0] && /^-[neE]+$/.test(args[0])) { if (args[0].includes('n')) nl = false; if (args[0].includes('e')) esc = true; args = args.slice(1); } let s = args.join(' '); if (esc) s = s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\'); io.out.write(s + (nl ? '\n' : '')); return 0; },
  async printf(args, io) { const fmt = args[0] ?? ''; const vals = args.slice(1); let vi = 0; const run = () => fmt.replace(/%([-+ 0]*)(\d+)?(?:\.(\d+))?([sdfxXc%])|\\([nt\\])/g, (m, fl, w, pr, c, e) => { if (e) return e === 'n' ? '\n' : e === 't' ? '\t' : '\\'; if (c === '%') return '%'; const v = vals[vi++] ?? ''; let s = c === 'd' ? String(parseInt(v) || 0) : c === 'f' ? (parseFloat(v) || 0).toFixed(pr === undefined ? 6 : +pr) : c === 'x' ? (parseInt(v) || 0).toString(16) : c === 'X' ? (parseInt(v) || 0).toString(16).toUpperCase() : (pr !== undefined && c === 's' ? v.slice(0, +pr) : v); if (w) s = fl.includes('-') ? s.padEnd(+w) : (fl.includes('0') && c !== 's' ? s.padStart(+w, '0') : s.padStart(+w)); return s; });
    let guard = 0; do { io.out.write(run()); } while (vi < vals.length && vi > 0 && ++guard < 1000); return 0; },
  async pwd(a, io) { io.out.write(this.cwd + '\n'); return 0; },
  async cd(a, io) { const p = this.path(a[0] ?? '~'); if (!this.fs.isDir(p)) { (io.err || io.out).write(`bash: cd: ${a[0]} : Aucun fichier ou dossier de ce type\n`); return 1; } this.cwd = p; this.env.PWD = p; return 0; },
  async ls(args, io) {
    const { o, rest } = parseOpts(args, {}); const targets = rest.length ? rest : ['.']; const err = io.err || io.out; let rc = 0;
    const show = (nm, full) => { if (!o.l) return nm; const f = this.fs.f.get(full); const dir = this.fs.isDir(full); const d = new Date((f?.m ?? this.fs.now) * 1000); return `${dir ? 'drwxr-xr-x' : f?.x ? '-rwxr-xr-x' : '-rw-r--r--'} 1 stagiaire stagiaire ${String(f ? f.c.length : 4096).padStart(6)} ${dateFmt(f?.m ?? this.fs.now, '%F %H:%M')} ${nm}`; };
    const files = [], dirs = [];
    for (const t of targets) { const p = this.path(t); if (this.fs.isFile(p)) files.push([t, p]); else if (this.fs.isDir(p)) dirs.push([t, p]); else { err.write(`ls : impossible d'accéder à '${t}' : Aucun fichier ou dossier de ce type\n`); rc = 2; } }
    const rows = files.map(([t, p]) => show(t, p));
    dirs.forEach(([t, p], k) => { let names = this.fs.list(p); if (!o.a) names = names.filter(n => !n.startsWith('.')); if (dirs.length + files.length > 1) rows.push((k || files.length ? '\n' : '') + t + ':'); for (const nm of names) rows.push(show(nm, VFS.norm(p + '/' + nm))); });
    if (rows.length) io.out.write((o.l || o['1'] || !io.out.tty ? rows.join('\n') : rows.join('  ')) + '\n'); return rc;
  },
  async cat(args, io) { const { o, rest } = parseOpts(args, {}); const ins = await inputs(this, rest, io, io.err || io.out); let n = 0; let rc = 0; for (const f of ins) { if (!f) { rc = 1; continue; } if (o.n) io.out.write(lines(f.text).map(l => `${String(++n).padStart(6)}\t${l}`).join('\n') + '\n'); else io.out.write(f.text); } return rc; },
  async tac(args, io) { const ins = await inputs(this, args, io, io.err || io.out); for (const f of ins) if (f) io.out.write(joinL(lines(f.text).reverse())); return 0; },
  async head(args, io) { const { o, rest } = parseOpts(args, { withArg: 'nc', numArg: 'n' }); const n = o.n === undefined ? 10 : parseInt(o.n); const ins = await inputs(this, rest, io, io.err || io.out); ins.forEach((f, k) => { if (!f) return; if (ins.length > 1) io.out.write(`${k ? '\n' : ''}==> ${f.name} <==\n`); if (o.c !== undefined) io.out.write(new TextDecoder().decode(new TextEncoder().encode(f.text).slice(0, parseInt(o.c)))); else io.out.write(joinL(lines(f.text).slice(0, n))); }); return 0; },
  async tail(args, io) { const { o, rest } = parseOpts(args, { withArg: 'nc', numArg: 'n' }); let nv = o.n === undefined ? '10' : String(o.n); const ins = await inputs(this, rest, io, io.err || io.out); ins.forEach((f, k) => { if (!f) return; if (ins.length > 1) io.out.write(`${k ? '\n' : ''}==> ${f.name} <==\n`); const L = lines(f.text); io.out.write(joinL(nv.startsWith('+') ? L.slice(parseInt(nv) - 1) : L.slice(Math.max(0, L.length - parseInt(nv))))); }); return 0; },
  async wc(args, io) { const { o, rest } = parseOpts(args, {}); const ins = await inputs(this, rest, io, io.err || io.out); const all = !o.l && !o.w && !o.c && !o.m; const tot = [0, 0, 0]; for (const f of ins) { if (!f) continue; const v = [f.text.split('\n').length - 1, (f.text.match(/\S+/g) || []).length, new TextEncoder().encode(f.text).length]; v.forEach((x, i) => tot[i] += x); const cols = []; if (all || o.l) cols.push(v[0]); if (all || o.w) cols.push(v[1]); if (all || o.c || o.m) cols.push(v[2]); io.out.write((rest.length ? cols.map(String).join(' ') + ' ' + f.name : cols.length === 1 ? String(cols[0]) : cols.map(x => String(x).padStart(7)).join(' ')) + '\n'); } if (ins.length > 1) io.out.write(tot.join(' ') + ' total\n'); return 0; },
  async sort(args, io) {
    const { o, rest } = parseOpts(args, { withArg: 'tko' }); const ins = await inputs(this, rest, io, io.err || io.out); let L = ins.filter(Boolean).flatMap(f => lines(f.text));
    const sep = o.t; const keysArg = o.k === undefined ? [] : [].concat(o.k); const G = { n: !!o.n, r: !!o.r, f: !!o.f, V: !!(o.V || o.h) };
    const field = (l, a, b) => { if (sep) return l.split(sep).slice(a - 1, b).join(sep); const toks = []; const re = /\s*\S+/g; let mm; while ((mm = re.exec(l))) toks.push(mm[0]); return toks.slice(a - 1, b).join(''); };
    const keys = keysArg.length ? keysArg.map(ks => { const m = /^(\d+)(?:\.\d+)?(?:,(\d+))?([a-zA-Z]*)$/.exec(ks); const a = +m[1], b = m[2] ? +m[2] : Infinity; const fl = m[3]; const own = fl !== ''; return { n: own ? fl.includes('n') : G.n, r: own ? fl.includes('r') : G.r, f: own ? fl.includes('f') : G.f, V: own ? fl.includes('V') : G.V, get: l => field(l, a, b) }; }) : [{ n: G.n, r: G.r, f: G.f, V: G.V, get: l => l }];
    const cmp = (x, y) => { for (const k of keys) { let a = k.get(x), b = k.get(y); if (k.f) { a = a.toLowerCase(); b = b.toLowerCase(); } let c; if (k.n) { const nv = x => parseFloat((/^\s*[-+]?(\d+\.?\d*|\.\d+)/.exec(x) || ['0'])[0]) || 0; c = nv(a) - nv(b); } else if (k.V) c = a.localeCompare(b, 'en', { numeric: true }); else c = a < b ? -1 : a > b ? 1 : 0; if (c) return k.r ? -c : c; } return 0; };
    const full = (x, y) => cmp(x, y) || (o.u ? 0 : (x < y ? -1 : x > y ? 1 : 0) * (G.r ? -1 : 1));
    L.sort(full);
    if (o.u) { const kept = []; for (const l of L) if (!kept.length || cmp(kept[kept.length - 1], l) !== 0) kept.push(l); L = kept; }
    io.out.write(joinL(L)); return 0;
  },
  async uniq(args, io) { const { o, rest } = parseOpts(args, {}); const ins = await inputs(this, rest.slice(0, 1), io, io.err || io.out); const L = lines(ins[0]?.text ?? ''); const groups = []; for (const l of L) { const key = o.i ? l.toLowerCase() : l; if (groups.length && groups[groups.length - 1].k === key) groups[groups.length - 1].n++; else groups.push({ k: key, l, n: 1 }); } for (const g of groups) { if (o.d && g.n < 2) continue; if (o.u && g.n > 1) continue; io.out.write(o.c ? `${String(g.n).padStart(7)} ${g.l}\n` : g.l + '\n'); } return 0; },
  async cut(args, io) { const { o, rest } = parseOpts(args, { withArg: 'dfc' }); const ins = await inputs(this, rest, io, io.err || io.out); const spec = (o.f ?? o.c ?? '').split(',').map(r => { const m = /^(\d*)-?(\d*)$/.exec(r); const hasDash = r.includes('-'); return [m[1] ? +m[1] : 1, hasDash ? (m[2] ? +m[2] : Infinity) : (m[1] ? +m[1] : 1)]; }); const d = o.d ?? '\t';
    for (const f of ins) { if (!f) continue; for (const l of lines(f.text)) { if (o.c) { const by = [...new TextEncoder().encode(l)]; io.out.write(new TextDecoder().decode(Uint8Array.from(by.filter((_, i) => spec.some(([a, b]) => i + 1 >= a && i + 1 <= b)))) + '\n'); } else { if (!l.includes(d)) { if (!o.s) io.out.write(l + '\n'); continue; } const p = l.split(d); io.out.write(p.filter((_, i) => spec.some(([a, b]) => i + 1 >= a && i + 1 <= b)).join(o['output-delimiter'] ?? d) + '\n'); } } } return 0; },
  async tr(args, io) { const { o, rest } = parseOpts(args, {}); const exp = s => { s = s.replace(/\[:upper:\]/g, 'A-Z').replace(/\[:lower:\]/g, 'a-z').replace(/\[:digit:\]/g, '0-9').replace(/\[:space:\]/g, ' \t\n').replace(/\[:alpha:\]/g, 'A-Za-z').replace(/\[:alnum:\]/g, 'A-Za-z0-9').replace(/\[:punct:\]/g, '!-/:-@[-`{-~').replace(/\\n/g, '\n').replace(/\\t/g, '\t'); let r = ''; for (let i = 0; i < s.length; i++) { if (s[i + 1] === '-' && i + 2 < s.length) { for (let c = s.charCodeAt(i); c <= s.charCodeAt(i + 2); c++) r += String.fromCharCode(c); i += 2; } else r += s[i]; } return r; };
    let text = io.in.rest(); const a = exp(rest[0] ?? ''), b = rest[1] !== undefined ? exp(rest[1]) : '';
    if (o.d) { const set = o.c ? null : new Set(a); text = [...text].filter(ch => o.c ? a.includes(ch) : !set.has(ch)).join(''); }
    else { const bb = b.length ? b : a; text = [...text].map(ch => { const i = a.indexOf(ch); return o.c ? (i < 0 ? bb[bb.length - 1] : ch) : i < 0 ? ch : (bb[Math.min(i, bb.length - 1)]); }).join(''); }
    if (o.s) { const set = new Set(b.length ? b : a); text = text.replace(/(.)\1+/gs, (m, c) => set.has(c) ? c : m); }
    io.out.write(text); return 0; },
  async grep(args, io) {
    const { o, rest } = parseOpts(args, { withArg: 'efm' }); const err = io.err || io.out; let pats = [];
    if (o.e !== undefined) pats = [].concat(o.e); if (o.f !== undefined) { for (const pf of [].concat(o.f)) pats.push(...lines(this.fs.read(this.path(pf)))); }
    const files = [...rest]; if (o.e === undefined && o.f === undefined) pats = [files.shift() ?? ''];
    pats = pats.flatMap(p => p.includes('\n') ? p.split('\n') : [p]);
    const wrapX = p => o.x ? `^(?:${p})$` : p;
    const res = pats.map(p => o.F ? new RegExp((o.x ? '^' : o.w ? '\\b' : '') + p.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + (o.x ? '$' : o.w ? '\\b' : ''), o.i ? 'i' : '') : toJS(o.x ? `^(${p})$` : o.w ? `\\<${p}\\>` : p, { ere: !!(o.E || o.P) || !!o.x, icase: !!o.i }));
    const emptyPat = pats.some(p => p === '');
    const ins = files.length ? await inputs(this, o.r ? files : files, io, err) : [{ name: '(entrée standard)', text: io.in.rest() }]; const multi = files.length > 1 && !o.h; let any = false; const names = files.length ? files : [];
    for (const f of ins) { if (!f) continue; let count = 0; const L = lines(f.text); L.forEach((l, i) => { const hit = emptyPat || res.some(r => r.test(l)); if (hit !== !!o.v) { count++; any = true; if (o.q) return; if (o.l || o.c) return; const pre = (multi ? f.name + ':' : '') + (o.n ? (i + 1) + ':' : ''); if (o.o) { for (const r of res) { const g = new RegExp(r.source, r.flags + 'g'); let m; while ((m = g.exec(l))) { if (m[0] === '') break; io.out.write(pre + m[0] + '\n'); } } } else io.out.write(pre + l + '\n'); } });
      if (o.c) io.out.write((multi ? f.name + ':' : '') + count + '\n'); if (o.l && count) io.out.write(f.name + '\n'); }
    return any ? 0 : 1;
  },
  async awk(args, io) {
    const { o, rest } = parseOpts(args, { withArg: 'Fvf' }); const vars = {}; for (const v of [].concat(o.v ?? [])) { const k = v.indexOf('='); vars[v.slice(0, k)] = v.slice(k + 1); }
    let prog = rest[0]; let fl = rest.slice(1); if (o.f) { prog = this.fs.read(this.path(o.f)); fl = rest; }
    const ins = fl.length ? await inputs(this, fl, io, io.err || io.out) : [{ name: '', text: io.in.rest() }];
    let FS = o.F === undefined ? ' ' : String(o.F).replace(/^t$/, '\t').replace(/\\t/g, '\t'); 
    try { const r = runAwk(prog, { files: ins.filter(Boolean), vars, FS }); io.out.write(r.out); return r.code; } catch (e) { (io.err || io.out).write(String(e.message || e) + '\n'); return 2; }
  },
  async sed(args, io) {
    const { o, rest } = parseOpts(args, { withArg: 'e' }); let script = o.e !== undefined ? [].concat(o.e).join('\n') : rest.shift(); const files = rest; const opt = { n: !!o.n, ere: !!(o.E || o.r) };
    if (o.i) { for (const f of files) { const p = this.path(f); this.fs.write(p, runSed(script, this.fs.read(p), opt)); } return 0; }
    const ins = files.length ? await inputs(this, files, io, io.err || io.out) : [{ text: io.in.rest() }]; for (const f of ins) if (f) io.out.write(runSed(script, f.text, opt)); return 0;
  },
  async tee(args, io) { const { o, rest } = parseOpts(args, {}); const t = io.in.rest(); for (const f of rest) this.fs.write(this.path(f), t, !!o.a); io.out.write(t); return 0; },
  async paste(args, io) { const { o, rest } = parseOpts(args, { withArg: 'd' }); const d = o.d ?? '\t'; const ins = await inputs(this, rest, io, io.err || io.out); if (o.s) { for (const f of ins) io.out.write(lines(f.text).join(d) + '\n'); } else { const cols = ins.map(f => lines(f.text)); const n = Math.max(...cols.map(c => c.length)); for (let i = 0; i < n; i++) io.out.write(cols.map(c => c[i] ?? '').join(d) + '\n'); } return 0; },
  async comm(args, io) { const { o, rest } = parseOpts(args, {}); const a = lines(this.fs.read(this.path(rest[0]))), b = lines(this.fs.read(this.path(rest[1]))); const sa = new Set(a), sb = new Set(b); const all = [...new Set([...a, ...b])].sort(); for (const l of all) { const inA = sa.has(l), inB = sb.has(l); if (inA && !inB && !o[1]) io.out.write((o[1] ? '' : '') + l + '\n'.replace('\n', '\n')); else if (!inA && inB && !o[2]) io.out.write((o[1] ? '' : '\t') + l + '\n'); else if (inA && inB && !o[3]) io.out.write((o[1] ? '' : '\t') + (o[2] ? '' : '\t') + l + '\n'); } return 0; },
  async nl(args, io) { const ins = await inputs(this, args, io, io.err || io.out); let n = 0; for (const f of ins) if (f) for (const l of lines(f.text)) io.out.write(l === '' ? '       \n' : `${String(++n).padStart(6)}\t${l}\n`); return 0; },
  async rev(args, io) { const ins = await inputs(this, args, io, io.err || io.out); for (const f of ins) for (const l of lines(f.text)) io.out.write([...l].reverse().join('') + '\n'); return 0; },
  async seq(args, io) { const n = args.map(Number); const [a, s, b] = n.length === 1 ? [1, 1, n[0]] : n.length === 2 ? [n[0], 1, n[1]] : n; for (let x = a; s > 0 ? x <= b : x >= b; x += s) io.out.write(x + '\n'); return 0; },
  async basename(a, io) { let b = a[0].replace(/\/+$/, '').split('/').pop(); if (a[1] && b.endsWith(a[1])) b = b.slice(0, -a[1].length); io.out.write(b + '\n'); return 0; },
  async dirname(a, io) { const p = a[0].replace(/\/+$/, ''); const i = p.lastIndexOf('/'); io.out.write((i < 0 ? '.' : i === 0 ? '/' : p.slice(0, i)) + '\n'); return 0; },
  async date(args, io) { const { o, rest } = parseOpts(args, { withArg: 'd' }); let t = this.fs.now; if (o.d) { const m = /^@(\d+)$/.exec(o.d); if (m) t = +m[1]; else { const ms = Date.parse(String(o.d).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(o.d) ? '' : 'Z')); if (isNaN(ms)) throw new Error(`date : date « ${o.d} » invalide`); t = Math.floor(ms / 1000); } } else t = Math.floor(Date.now() / 1000); const f = rest.find(x => x.startsWith('+')); io.out.write(dateFmt(t, f ? f.slice(1) : '%a %F %T UTC') + '\n'); return 0; },
  async base64(args, io) { const { o, rest } = parseOpts(args, {}); const ins = await inputs(this, rest, io, io.err || io.out); for (const f of ins) { if (o.d) { try { io.out.write(new TextDecoder().decode(Uint8Array.from(atob(f.text.replace(/\s+/g, '')), c => c.charCodeAt(0)))); } catch { (io.err || io.out).write('base64 : entrée invalide\n'); return 1; } } else io.out.write(btoa(String.fromCharCode(...new TextEncoder().encode(f.text))).replace(/(.{76})/g, '$1\n') + '\n'); } return 0; },
  async sha256sum(args, io) { const { o, rest } = parseOpts(args, {}); if (o.c) { const L = lines(this.fs.read(this.path(rest[0]))); let bad = 0; for (const l of L) { const m = /^([0-9a-f]{64}) [ *](.+)$/.exec(l); if (!m) continue; let ok = false; try { ok = sha256(this.fs.read(this.path(m[2]))) === m[1]; } catch { } if (!o.status && !o.q) io.out.write(`${m[2]}: ${ok ? 'OK' : 'ÉCHEC'}\n`); if (!ok) bad++; } return bad ? 1 : 0; } const ins = await inputs(this, rest, io, io.err || io.out); for (const f of ins) if (f) io.out.write(`${sha256(f.text)}  ${f.name}\n`); return 0; },
  async mkdir(args, io) { const { o, rest } = parseOpts(args, {}); for (const d of rest) { const p = this.path(d); if (o.p) this.fs.mkdirp(p); else { const par = p.slice(0, p.lastIndexOf('/')) || '/'; if (this.fs.exists(p)) { (io.err || io.out).write(`mkdir : impossible de créer « ${d} » : Le fichier existe\n`); return 1; } if (!this.fs.isDir(par)) { (io.err || io.out).write(`mkdir : impossible de créer « ${d} » : Aucun fichier ou dossier de ce type\n`); return 1; } this.fs.d.add(p); } } return 0; },
  async touch(args, io) { for (const f of args) { const p = this.path(f); if (this.fs.isFile(p)) this.fs.f.get(p).m = this.fs.now++; else this.fs.write(p, ''); } return 0; },
  async cp(args, io) { const { o, rest } = parseOpts(args, {}); const dst = rest.pop(); const dp = this.path(dst); for (const s of rest) { const sp = this.path(s); if (this.fs.isDir(sp)) { if (!o.r && !o.R) { (io.err || io.out).write(`cp : -r non spécifié ; omission du dossier « ${s} »\n`); return 1; } const base = this.fs.isDir(dp) ? dp + '/' + sp.split('/').pop() : dp; this.fs.mkdirp(base); for (const k of [...this.fs.f.keys()]) if (k.startsWith(sp + '/')) { const t = base + k.slice(sp.length); this.fs.mkdirp(t.slice(0, t.lastIndexOf('/'))); this.fs.write(t, this.fs.f.get(k).c); } continue; } const t = this.fs.isDir(dp) ? dp + '/' + sp.split('/').pop() : dp; this.fs.write(t, this.fs.read(sp)); } return 0; },
  async mv(args, io) { const dst = args[args.length - 1]; const dp = this.path(dst); for (const s of args.slice(0, -1)) { const sp = this.path(s); const t = this.fs.isDir(dp) ? dp + '/' + sp.split('/').pop() : dp; if (this.fs.isFile(sp)) { const x = this.fs.f.get(sp); this.fs.write(t, x.c); this.fs.f.delete(sp); } else throw new Error(`impossible d'évaluer « ${s} »`); } return 0; },
  async rm(args, io) { const { o, rest } = parseOpts(args, {}); let rc = 0; for (const f of rest) { try { this.fs.rm(this.path(f), !!(o.r || o.R)); } catch (e) { if (!o.f) { (io.err || io.out).write(`rm : impossible de supprimer « ${f} » : ${e.message.split(' : ').pop()}\n`); rc = 1; } } } return rc; },
  async chmod(args, io) { const mode = args[0]; for (const f of args.slice(1)) { const x = this.fs.f.get(this.path(f)); if (x) { if (/^\d+$/.test(mode)) x.x = (parseInt(mode[0]) & 1) === 1; else if (/\+x/.test(mode)) x.x = true; else if (/-x/.test(mode)) x.x = false; } } return 0; },
  async true() { return 0; }, async false() { return 1; }, async ':'() { return 0; },
  async test(args) { return testExpr(this, args) ? 0 : 1; }, async '['(args) { return testExpr(this, args) ? 0 : 1; },
  async export(args) { for (const a of args) { const i = a.indexOf('='); if (i > 0) this.env[a.slice(0, i)] = a.slice(i + 1); } return 0; },
  async read(args, io) { const { o, rest } = parseOpts(args, { withArg: 'p' }); const l = io.in.readLine(); if (l === null) return 1; const names = rest.length ? rest : ['REPLY']; const w = o.r ? l : l.replace(/\\(.)/g, '$1'); if (names.length === 1) { this.env[names[0]] = w.replace(/^\s+|\s+$/g, ''); return 0; } const parts = w.trim().split(/\s+/); names.forEach((n, i) => { this.env[n] = i === names.length - 1 ? parts.slice(i).join(' ') : (parts[i] ?? ''); }); return 0; },
  async exit() { this.exitNow = true; return 0; },
  async sleep() { return 0; }, async clear(a, io) { io.out.write('\x1b[clear]'); return 0; },
  async whoami(a, io) { io.out.write('stagiaire\n'); return 0; }, async id(a, io) { io.out.write('uid=1000(stagiaire) gid=1000(stagiaire) groupes=1000(stagiaire)\n'); return 0; }, async hostname(a, io) { io.out.write('cyberlab\n'); return 0; },
  async history(a, io) { this.history.forEach((h, i) => io.out.write(`${String(i + 1).padStart(5)}  ${h}\n`)); return 0; },
  async less(a, io) { return CMDS.cat.call(this, a, io); }, async more(a, io) { return CMDS.cat.call(this, a, io); },
  async bash(args, io) { const f = args.find(a => !a.startsWith('-')); if (!f) return 0; return this.runScript(this.fs.read(this.path(f)), args.slice(args.indexOf(f) + 1), io); },
  async sh(args, io) { return CMDS.bash.call(this, args, io); },
  async source(args, io) { const code = this.fs.read(this.path(args[0])); return this.run2(code, io); },
  async xargs(args, io) { const items = io.in.rest().split(/\s+/).filter(Boolean); const cmd = args.length ? args : ['echo']; return this.command(cmd[0], [...cmd.slice(1), ...items], io); },
  async tree(args, io) { const root = this.path(args[0] ?? '.'); const walk = (d, pre) => { const names = this.fs.list(d).filter(n => !n.startsWith('.')); names.forEach((n, i) => { const last = i === names.length - 1; io.out.write(pre + (last ? '└── ' : '├── ') + n + '\n'); const p = VFS.norm(d + '/' + n); if (this.fs.isDir(p)) walk(p, pre + (last ? '    ' : '│   ')); }); }; io.out.write(args[0] ?? '.' + '\n'.replace('\n', '') ); io.out.write('\n'); walk(root, ''); return 0; },
  async sshd(args, io) { const err = io.err || io.out; let f = '/etc/ssh/sshd_config', T = false, t = false; for (let i = 0; i < args.length; i++) { if (args[i] === '-f') f = args[++i]; else if (args[i] === '-T') T = true; else if (args[i] === '-t') t = true; else if (args[i] === '-h') i++; }
    if (!T && !t) { err.write('usage: sshd [-46DdeGiqTtV] [-C connection_spec] [-c host_cert_file]\n            [-E log_file] [-f config_file] [-g login_grace_time]\n            [-h host_key_file] [-o option] [-p port] [-u len]\n'); return 1; }
    const p = this.path(f); if (!this.fs.isFile(p)) { err.write(`Could not load host key: ${f}\n/usr/sbin/sshd: no hostkeys available -- exiting.\n`); return 255; }
    const r = sshdT(this.fs.read(p)); if (!r.ok) { err.write(`${f}: ${r.err}\n${f}: terminating, 1 bad configuration options\n`); return 255; }
    if (T) io.out.write(r.out.join('\n') + '\n'); return 0; },
  async 'ssh-keygen'(args, io) { const err = io.err || io.out; const i = args.findIndex(a => a === '-lf' || a === '-l'); const f = i >= 0 ? (args[i] === '-lf' ? args[i + 1] : args[args.indexOf('-f') + 1]) : null;
    if (!f) { err.write('ssh-keygen : seule la lecture d\'empreinte est disponible dans ce simulateur : ssh-keygen -lf FICHIER\n'); return 1; }
    const p = this.path(f); if (!this.fs.isFile(p)) { err.write(`${f}: No such file or directory\n`); return 1; }
    const lines = keygenLf(this.fs.read(p)); if (!lines.length) { err.write(`${f} is not a public key file.\n`); return 1; } io.out.write(lines.join('\n') + '\n'); return 0; },
  async 'lab-controls'(args, io) { const files = this.fs.snapshot(this.cwd); const r = controls(files); io.out.write(`RETEST srv01 - ${dateFmt(this.fs.now, '%Y-%m-%d %H:%M:%S')}\n` + r.lines.join('\n') + '\n'); return 0; },
  async set() { return 0; },
  async stat(args, io) { const p = this.path(args[0]); const f = this.fs.f.get(p); if (!f) { (io.err || io.out).write(`stat : impossible d'évaluer « ${args[0]} »\n`); return 1; } io.out.write(`  Fichier : ${args[0]}\n  Taille : ${f.c.length}\nModification : ${dateFmt(f.m, '%F %T')}\n`); return 0; },
  async file(args, io) { for (const a of args) io.out.write(`${a}: ${this.fs.isDir(this.path(a)) ? 'directory' : 'ASCII text'}\n`); return 0; },
  async diff(args, io) { const a = lines(this.fs.read(this.path(args[0]))), b = lines(this.fs.read(this.path(args[1]))); const sa = new Set(a), sb = new Set(b); let d = 0; for (const l of a) if (!sb.has(l)) { io.out.write(`< ${l}\n`); d = 1; } for (const l of b) if (!sa.has(l)) { io.out.write(`> ${l}\n`); d = 1; } return d; },
  async expr(args, io) { const e = args.join(' '); io.out.write(String(await this.arith(e.replace(/\\/g, ''))) + '\n'); return 0; },
  async nano(args, io) { return edit.call(this, args, io); }, async vi(args, io) { return edit.call(this, args, io); }, async vim(args, io) { return edit.call(this, args, io); },
  async defi(args, io) { if (!this.hooks.defi) { io.out.write('defi : indisponible\n'); return 1; } return this.hooks.defi(args, io); },
  async man(args, io) { io.out.write(`Pas de page de manuel dans le simulateur. Essayez « ${args[0] ?? 'commande'} --help » dans un vrai terminal, ou consultez les leçons.\n`); return 0; },
  async help(args, io) { io.out.write('Commandes disponibles : ' + Object.keys(CMDS).filter(k => /^[a-z0-9]/.test(k) && k !== 'help').sort().join(' ') + '\n'); return 0; },
};
async function edit(args, io) { const f = args.find(a => !a.startsWith('-')); if (!f) return 0; const p = this.path(f); let cur = ''; try { cur = this.fs.read(p); } catch { } if (!this.hooks.edit) { (io.err || io.out).write('éditeur indisponible\n'); return 1; } const res = await this.hooks.edit(f, cur); if (res !== null) this.fs.write(p, res); return 0; }
for (const n of ['curl', 'nmap', 'dig', 'ssh', 'nc', 'tcpdump', 'ping', 'wget', 'sudo']) CMDS[n] = async function (a, io) { (io.err || io.out).write(`${n} : non disponible dans le simulateur web (les données à analyser sont déjà fournies dans les fichiers).\n`); return 127; };
export { Stream };
