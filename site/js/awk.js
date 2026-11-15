// Interpréteur awk minimal (sous-ensemble POSIX/gawk suffisant pour les exercices).
import { toJS } from './regex.js';
class SN { constructor(s) { this.s = s; } } // chaîne issue de l'entrée (comparaison numérique si elle ressemble à un nombre)
const NUMRE = /^\s*[-+]?(\d+\.?\d*([eE][-+]?\d+)?|\.\d+([eE][-+]?\d+)?)\s*$/;
const fmtNum = x => Number.isInteger(x) ? String(x) : (isFinite(x) ? String(+x.toPrecision(6)) : (isNaN(x) ? 'nan' : (x > 0 ? 'inf' : '-inf')));
const S = v => v instanceof SN ? v.s : typeof v === 'number' ? fmtNum(v) : v === undefined ? '' : String(v);
const N = v => { if (typeof v === 'number') return v; const m = /^\s*[-+]?(\d+\.?\d*([eE][-+]?\d+)?|\.\d+([eE][-+]?\d+)?)/.exec(S(v)); return m ? parseFloat(m[0]) : 0; };
const isNumLike = v => typeof v === 'number' || v === undefined || (v instanceof SN && NUMRE.test(v.s));
const B = v => typeof v === 'number' ? v !== 0 : v instanceof SN ? (NUMRE.test(v.s) ? parseFloat(v.s) !== 0 : v.s !== '') : S(v) !== '';

const KW = new Set(['BEGIN', 'END', 'function', 'if', 'else', 'while', 'for', 'do', 'break', 'continue', 'next', 'exit', 'return', 'delete', 'in', 'print', 'printf', 'getline']);
function lex(src) {
  const t = []; let i = 0; const n = src.length; let prevRegexOk = true;
  const push = (type, v) => { t.push({ type, v }); prevRegexOk = !(type === 'num' || type === 'str' || type === 'name' || type === 'regex' || v === ')' || v === ']' || v === '$' || v === '++' && false); if (type === 'name' && KW.has(v)) prevRegexOk = true; if (type === 'name' && ['getline'].includes(v)) prevRegexOk = false; };
  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '\\' && src[i + 1] === '\n') { i += 2; continue; }
    if (c === '#') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '\n') { push('nl', '\n'); prevRegexOk = true; i++; continue; }
    if (/[0-9.]/.test(c) && (c !== '.' || /[0-9]/.test(src[i + 1] || ''))) { const m = /^(0[xX][0-9a-fA-F]+|\d*\.?\d+([eE][-+]?\d+)?|\d+\.)/.exec(src.slice(i)); push('num', parseFloat(m[0])); i += m[0].length; continue; }
    if (/[A-Za-z_]/.test(c)) { const m = /^[A-Za-z_][A-Za-z_0-9]*/.exec(src.slice(i)); i += m[0].length; push('name', m[0]); continue; }
    if (c === '"') { let s = ''; i++; while (i < n && src[i] !== '"') { if (src[i] === '\\') { i++; const e = src[i]; s += e === 'n' ? '\n' : e === 't' ? '\t' : e === 'r' ? '\r' : e === '\\' ? '\\' : e === '"' ? '"' : e === '/' ? '/' : '\\' + e; } else s += src[i]; i++; } i++; push('str', s); continue; }
    if (c === '/' && prevRegexOk) { let s = ''; i++; while (i < n && src[i] !== '/') { if (src[i] === '\\' && src[i + 1] === '/') { s += '/'; i += 2; continue; } if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; continue; } if (src[i] === '[') { const e = src.indexOf(']', i + 2); s += src.slice(i, e + 1); i = e + 1; continue; } s += src[i++]; } i++; push('regex', s); continue; }
    const three = src.slice(i, i + 3), two = src.slice(i, i + 2);
    if (['**='].includes(three)) { push('op', '^='); i += 3; continue; }
    if (['&&', '||', '==', '!=', '<=', '>=', '++', '--', '+=', '-=', '*=', '/=', '%=', '^=', '!~', '>>', '**'].includes(two)) { push('op', two === '**' ? '^' : two); i += 2; continue; }
    push('op', c); i++;
  }
  return t;
}

export function parseAwk(src) {
  const toks = lex(src); let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  const isOp = v => peek() && peek().type === 'op' && peek().v === v;
  const isName = v => peek() && peek().type === 'name' && peek().v === v;
  const expectOp = v => { if (!isOp(v)) throw new Error(`awk : syntaxe, « ${v} » attendu`); p++; };
  const skipNl = () => { while (peek() && (peek().type === 'nl' || isOp(';'))) p++; };
  const skipNlOnly = () => { while (peek() && peek().type === 'nl') p++; };
  const prog = { begin: [], end: [], rules: [], funcs: {} };
  function parseProgram() {
    skipNl();
    while (p < toks.length) {
      if (isName('function')) { p++; const name = next().v; expectOp('('); const params = []; while (!isOp(')')) { params.push(next().v); if (isOp(',')) p++; } p++; skipNlOnly(); prog.funcs[name] = { params, body: parseBlock() }; }
      else if (isName('BEGIN')) { p++; skipNlOnly(); prog.begin.push(parseBlock()); }
      else if (isName('END')) { p++; skipNlOnly(); prog.end.push(parseBlock()); }
      else {
        let pat = null, pat2 = null;
        if (!isOp('{')) { pat = parseExpr(); if (isOp(',')) { p++; skipNlOnly(); pat2 = parseExpr(); } }
        const body = isOp('{') ? parseBlock() : null;
        prog.rules.push({ pat, pat2, body, inRange: false });
      }
      skipNl();
    }
    return prog;
  }
  function parseBlock() { expectOp('{'); const st = []; skipNl(); while (!isOp('}')) { st.push(parseStmt()); skipNl(); } p++; return { t: 'block', st }; }
  function endStmt() { if (isOp(';') || (peek() && peek().type === 'nl')) { p++; } else if (!isOp('}') && peek()) throw new Error('awk : syntaxe, fin d\'instruction attendue'); }
  function parseSimple() {
    if (isName('print') || isName('printf')) {
      const kind = next().v; const args = [];
      if (!(isOp(';') || isOp('}') || peek()?.type === 'nl' || isOp('>') || isOp('>>') || isOp('|'))) {
        const paren = isOp('(');
        args.push(parseExpr(true)); while (isOp(',')) { p++; skipNlOnly(); args.push(parseExpr(true)); }
        if (paren && args.length === 1 && args[0].t === 'group' ) { /* print (a,b) */ }
      }
      let redir = null; if (isOp('>') || isOp('>>') || isOp('|')) { const o = next().v; redir = { o, e: parseConcat() }; }
      return { t: kind, args, redir };
    }
    if (isName('delete')) { p++; const name = next().v; if (isOp('[')) { p++; const idx = parseExprList(); expectOp(']'); return { t: 'delete', name, idx }; } return { t: 'delete', name }; }
    if (isName('next')) { p++; return { t: 'next' }; }
    if (isName('exit')) { p++; let e = null; if (!(isOp(';') || isOp('}') || peek()?.type === 'nl')) e = parseExpr(); return { t: 'exit', e }; }
    if (isName('return')) { p++; let e = null; if (!(isOp(';') || isOp('}') || peek()?.type === 'nl')) e = parseExpr(); return { t: 'return', e }; }
    if (isName('break')) { p++; return { t: 'break' }; }
    if (isName('continue')) { p++; return { t: 'continue' }; }
    return { t: 'expr', e: parseExpr() };
  }
  function parseStmt() {
    if (isOp('{')) return parseBlock();
    if (isName('if')) { p++; expectOp('('); const c = parseExpr(); expectOp(')'); skipNlOnly(); const th = parseStmt(); skipNl2(); let el = null; if (isName('else')) { p++; skipNlOnly(); el = parseStmt(); } return { t: 'if', c, th, el }; }
    if (isName('while')) { p++; expectOp('('); const c = parseExpr(); expectOp(')'); skipNlOnly(); return { t: 'while', c, body: isOp(';') ? (p++, { t: 'block', st: [] }) : parseStmt() }; }
    if (isName('do')) { p++; skipNlOnly(); const body = parseStmt(); skipNl(); p++; expectOp('('); const c = parseExpr(); expectOp(')'); endStmt(); return { t: 'dowhile', c, body }; }
    if (isName('for')) {
      p++; expectOp('(');
      if (peek().type === 'name' && toks[p + 1]?.v === 'in' && toks[p + 2]?.type === 'name' && toks[p + 3]?.v === ')') { const v = next().v; p++; const arr = next().v; p++; skipNlOnly(); return { t: 'forin', v, arr, body: parseStmt() }; }
      let init = null, c = null, inc = null; if (!isOp(';')) init = parseSimple(); expectOp(';'); if (!isOp(';')) c = parseExpr(); expectOp(';'); if (!isOp(')')) inc = parseSimple(); expectOp(')'); skipNlOnly();
      return { t: 'for', init, c, inc, body: isOp(';') ? (p++, { t: 'block', st: [] }) : parseStmt() };
    }
    const s = parseSimple(); endStmt(); return s;
  }
  function skipNl2() { const save = p; while (peek() && (peek().type === 'nl' || isOp(';'))) p++; if (!isName('else')) p = save; }
  function parseExprList() { const a = [parseExpr()]; while (isOp(',')) { p++; a.push(parseExpr()); } return a; }
  let noIn = false, noGt = false;
  function parseExpr(printCtx = false) { const o = noGt; noGt = printCtx; try { return parseTernary(); } finally { noGt = o; } }
  function parseTernary() {
    const c = parseOr();
    if (isOp('?')) { p++; skipNlOnly(); const a = parseTernary(); skipNlOnly(); expectOp(':'); skipNlOnly(); const b = parseTernary(); return { t: 'cond', c, a, b }; }
    if (isOp('=') || ['+=', '-=', '*=', '/=', '%=', '^='].some(isOp)) {
      if (c.t !== 'var' && c.t !== 'idx' && c.t !== 'field') return c;
      const op = next().v; skipNlOnly(); const r = parseTernary(); return { t: 'assign', op, l: c, r };
    }
    return c;
  }
  function parseOr() { let l = parseAnd(); while (isOp('||')) { p++; skipNlOnly(); l = { t: 'or', l, r: parseAnd() }; } return l; }
  function parseAnd() { let l = parseIn(); while (isOp('&&')) { p++; skipNlOnly(); l = { t: 'and', l, r: parseIn() }; } return l; }
  function parseIn() { let l = parseMatch(); while (isName('in')) { p++; const a = next().v; l = { t: 'in', k: l, a }; } return l; }
  function parseMatch() { let l = parseCmp(); while (isOp('~') || isOp('!~')) { const o = next().v; l = { t: 'match', neg: o === '!~', l, r: parseCmp() }; } return l; }
  function parseCmp() {
    let l = parseConcat();
    while (['<', '<=', '==', '!=', '>=', '>'].some(isOp)) { if (isOp('>') && noGt) break; const o = next().v; l = { t: 'cmp', o, l, r: parseConcat() }; }
    return l;
  }
  function startsOperand() { const k = peek(); if (!k) return false; if (k.type === 'num' || k.type === 'str' || k.type === 'regex') return true; if (k.type === 'name') return !KW.has(k.v) || k.v === 'getline' ? !['in'].includes(k.v) : false; if (k.type === 'op') return ['$', '!', '(', '-', '+', '++', '--'].includes(k.v) && !(['-', '+'].includes(k.v)); return false; }
  function parseConcat() { let l = parseAdd(); while (startsOperand() && !(isOp('-') || isOp('+'))) { l = { t: 'cat', l, r: parseAdd() }; } return l; }
  function parseAdd() { let l = parseMul(); while (isOp('+') || isOp('-')) { const o = next().v; l = { t: 'bin', o, l, r: parseMul() }; } return l; }
  function parseMul() { let l = parseUnary(); while (isOp('*') || isOp('/') || isOp('%')) { const o = next().v; l = { t: 'bin', o, l, r: parseUnary() }; } return l; }
  function parseUnary() { if (isOp('!')) { p++; return { t: 'not', e: parseUnary() }; } if (isOp('-')) { p++; return { t: 'neg', e: parseUnary() }; } if (isOp('+')) { p++; return { t: 'pos', e: parseUnary() }; } return parsePow(); }
  function parsePow() { const b = parsePost(); if (isOp('^')) { p++; return { t: 'bin', o: '^', l: b, r: parseUnary() }; } return b; }
  function parsePost() {
    const e = parsePrimary();
    if ((e.t === 'var' || e.t === 'idx' || e.t === 'field') && (isOp('++') || isOp('--'))) { const o = next().v; return { t: 'post', o, e }; }
    return e;
  }
  function parsePrimary() {
    const k = next(); if (!k) throw new Error('awk : expression incomplète');
    if (k.type === 'num') return { t: 'num', v: k.v };
    if (k.type === 'str') return { t: 'str', v: k.v };
    if (k.type === 'regex') return { t: 'regex', v: k.v };
    if (k.type === 'op') {
      if (k.v === '(') { const e = parseExpr(); if (isOp(',')) { const l = [e]; while (isOp(',')) { p++; l.push(parseExpr()); } expectOp(')'); return { t: 'multi', l }; } expectOp(')'); return { t: 'group', e }; }
      if (k.v === '$') { return { t: 'field', e: parseIncDec() }; }
      if (k.v === '++' || k.v === '--') { const e = parsePrimary(); return { t: 'pre', o: k.v, e }; }
      if (k.v === '-') return { t: 'neg', e: parsePrimary() };
      if (k.v === '!') return { t: 'not', e: parsePrimary() };
      throw new Error(`awk : syntaxe, « ${k.v} » inattendu`);
    }
    if (k.type === 'name') {
      if (k.v === 'getline') { return { t: 'getline' }; }
      if (isOp('(') && toks[p - 1] === k && !(KW.has(k.v))) { p++; const args = []; if (!isOp(')')) { args.push(parseExpr()); while (isOp(',')) { p++; skipNlOnly(); args.push(parseExpr()); } } expectOp(')'); return { t: 'call', name: k.v, args }; }
      if (isOp('[')) { p++; const idx = parseExprList(); expectOp(']'); return { t: 'idx', name: k.v, idx }; }
      if (k.v === 'length') return { t: 'call', name: 'length', args: [] };
      return { t: 'var', name: k.v };
    }
    throw new Error('awk : syntaxe');
  }
  function parseIncDec() { if (isOp('++') || isOp('--')) { const o = next().v; return { t: 'pre', o, e: parsePrimary() }; } return parsePrimary(); }
  return parseProgram();
}

const cache = new Map();
export function runAwk(src, { files, vars = {}, FS = ' ', readFile, stdin }) {
  let prog = cache.get(src); if (!prog) { prog = parseAwk(src); cache.set(src, prog); }
  const G = { FS, OFS: ' ', ORS: '\n', RS: '\n', NR: 0, NF: 0, FNR: 0, SUBSEP: '\x1c', FILENAME: '', CONVFMT: '%.6g', RSTART: 0, RLENGTH: -1 };
  for (const [k, v] of Object.entries(vars)) G[k] = new SN(v);
  const arrays = {}; let fields = [], rec = '', out = '';
  const rxCache = new Map();
  const rx = (s, g = false) => { const key = s + (g ? 'g' : ''); let r = rxCache.get(key); if (!r) { r = toJS(s, { ere: true, global: g }); rxCache.set(key, r); } r.lastIndex = 0; return r; };
  const arr = nm => arrays[nm] ?? (arrays[nm] = new Map());
  const setRec = s => { rec = s; splitRec(); };
  function splitRec() {
    const fs = S(G.FS); let f;
    if (fs === ' ') f = rec.split(/[ \t\n]+/).filter(x => x !== '');
    else if (fs === '\t') f = rec === '' ? [] : rec.split('\t');
    else if (fs.length === 1 && !/[\\^$.*+?()[\]{}|]/.test(fs)) f = rec === '' ? [] : rec.split(fs);
    else f = rec === '' ? [] : rec.split(rx(fs));
    fields = f.map(x => new SN(x)); G.NF = fields.length;
  }
  const rebuild = () => { rec = fields.map(S).join(S(G.OFS)); };
  const getField = i => { i = Math.trunc(i); if (i === 0) return new SN(rec); return fields[i - 1] ?? new SN(''); };
  const setField = (i, v) => { i = Math.trunc(i); if (i === 0) { setRec(S(v)); return; } while (fields.length < i) fields.push(new SN('')); fields[i - 1] = new SN(S(v)); G.NF = fields.length; rebuild(); };
  const locals = []; const getVar = nm => { const l = locals[locals.length - 1]; if (l && nm in l) return l[nm]; return nm === 'NF' ? G.NF : G[nm]; };
  const setVar = (nm, v) => { const l = locals[locals.length - 1]; if (l && nm in l) { l[nm] = v; return; } if (nm === 'NF') { const n = N(v); fields = fields.slice(0, n); while (fields.length < n) fields.push(new SN('')); G.NF = n; rebuild(); return; } G[nm] = v; };
  const getArr = nm => { const l = locals[locals.length - 1]; if (l && nm in l) { if (!(l[nm] instanceof Map)) l[nm] = new Map(); return l[nm]; } return arr(nm); };
  const key = idx => idx.map(i => S(ev(i))).join(S(G.SUBSEP));
  class Next { } class Exit { constructor(c) { this.c = c; } } class Brk { } class Cnt { } class Ret { constructor(v) { this.v = v; } }
  function sprintf(fmt, args) {
    let ai = 0; return fmt.replace(/%([-+ #0]*)(\*|\d+)?(?:\.(\*|\d+))?([diouxXeEfgGcs%])/g, (m, fl, w, pr, c) => {
      if (c === '%') return '%'; if (w === '*') w = N(args[ai++]); if (pr === '*') pr = N(args[ai++]);
      const a = args[ai++]; let s;
      switch (c) {
        case 'd': case 'i': s = String(Math.trunc(N(a))); if (fl.includes('+') && N(a) >= 0) s = '+' + s; break;
        case 'o': s = Math.trunc(N(a)).toString(8); break; case 'u': s = String(Math.trunc(N(a)));break;
        case 'x': s = Math.trunc(N(a)).toString(16); break; case 'X': s = Math.trunc(N(a)).toString(16).toUpperCase(); break;
        case 'e': case 'E': s = N(a).toExponential(pr === undefined ? 6 : +pr).replace(/e([-+])(\d)$/, 'e$10$2'); if (c === 'E') s = s.toUpperCase(); break;
        case 'f': s = N(a).toFixed(pr === undefined ? 6 : +pr); if (fl.includes('+') && N(a) >= 0) s = '+' + s; break;
        case 'g': case 'G': s = fmtG(N(a), pr === undefined ? 6 : +pr || 1); break;
        case 'c': s = typeof a === 'number' ? String.fromCharCode(a) : S(a)[0] ?? ''; break;
        default: s = S(a); if (pr !== undefined) s = s.slice(0, +pr);
      }
      if (w) { const W = +w; if (fl.includes('-')) s = s.padEnd(W); else if (fl.includes('0') && c !== 's') { const neg = /^[-+]/.test(s) ? s[0] : ''; s = neg + s.slice(neg.length).padStart(W - neg.length, '0'); } else s = s.padStart(W); }
      return s;
    });
  }
  function fmtG(x, p) { if (x === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(x))); if (e < -4 || e >= p) { return x.toExponential(p - 1).replace(/\.?0+e/, 'e').replace(/e([-+])(\d)$/, 'e$10$2'); } return String(+x.toFixed(Math.max(0, p - 1 - e))); }
  const toRx = e => e.t === 'regex' ? rx(e.v) : rx(S(ev(e)));
  function ev(e) {
    switch (e.t) {
      case 'num': return e.v; case 'str': return e.v;
      case 'regex': return rx(e.v).test(rec) ? 1 : 0;
      case 'group': return ev(e.e);
      case 'multi': return e.l.map(x => S(ev(x))).join(S(G.SUBSEP));
      case 'var': { if (e.name === 'NR' || e.name === 'FNR' || e.name === 'NF') return G[e.name]; return getVar(e.name); }
      case 'idx': return getArr(e.name).get(key(e.idx));
      case 'field': return getField(N(ev(e.e)));
      case 'assign': {
        let v = ev(e.r);
        if (e.op !== '=') { const a = N(ev(e.l)), b = N(v); v = e.op === '+=' ? a + b : e.op === '-=' ? a - b : e.op === '*=' ? a * b : e.op === '/=' ? a / b : e.op === '%=' ? a % b : a ** b; }
        else if (v instanceof SN) { /* conserve le type strnum */ }
        assign(e.l, v); return v;
      }
      case 'cond': return B(ev(e.c)) ? ev(e.a) : ev(e.b);
      case 'or': return B(ev(e.l)) || B(ev(e.r)) ? 1 : 0;
      case 'and': return B(ev(e.l)) && B(ev(e.r)) ? 1 : 0;
      case 'in': return getArr(e.a).has(S(ev(e.k))) ? 1 : 0;
      case 'match': { const r = toRx(e.r); const m = r.test(S(ev(e.l))); return (e.neg ? !m : m) ? 1 : 0; }
      case 'cmp': { const a = ev(e.l), b = ev(e.r); let c; if (isNumLike(a) && isNumLike(b)) { const x = N(a), y = N(b); c = x < y ? -1 : x > y ? 1 : 0; } else { const x = S(a), y = S(b); c = x < y ? -1 : x > y ? 1 : 0; } return { '<': c < 0, '<=': c <= 0, '==': c === 0, '!=': c !== 0, '>=': c >= 0, '>': c > 0 }[e.o] ? 1 : 0; }
      case 'cat': return S(ev(e.l)) + S(ev(e.r));
      case 'bin': { const a = N(ev(e.l)), b = N(ev(e.r)); switch (e.o) { case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': if (b === 0) throw new Error('awk : division par zéro'); return a / b; case '%': return a % b; default: return a ** b; } }
      case 'not': return B(ev(e.e)) ? 0 : 1;
      case 'neg': return -N(ev(e.e)); case 'pos': return N(ev(e.e));
      case 'pre': { const v = N(ev(e.e)) + (e.o === '++' ? 1 : -1); assign(e.e, v); return v; }
      case 'post': { const old = N(ev(e.e)); assign(e.e, old + (e.o === '++' ? 1 : -1)); return old; }
      case 'getline': return 0;
      case 'call': return call(e);
    }
    throw new Error('awk : expression inconnue ' + e.t);
  }
  function assign(l, v) { if (l.t === 'var') setVar(l.name, v); else if (l.t === 'idx') getArr(l.name).set(key(l.idx), v); else if (l.t === 'field') setField(N(ev(l.e)), v); }
  function call(e) {
    const a = e.args; const f = prog.funcs[e.name];
    if (f) { const loc = {}; f.params.forEach((pn, i) => { loc[pn] = a[i] === undefined ? undefined : (a[i].t === 'var' && getVar(a[i].name) === undefined && arrays[a[i].name] ? arrays[a[i].name] : ev(a[i])); }); locals.push(loc); try { execBlock(f.body); } catch (x) { if (x instanceof Ret) { locals.pop(); return x.v; } locals.pop(); throw x; } locals.pop(); return undefined; }
    switch (e.name) {
      case 'length': { if (!a.length) return rec.length; if (a[0].t === 'var' && (arrays[a[0].name] instanceof Map)) return arrays[a[0].name].size; return S(ev(a[0])).length; }
      case 'substr': { const s = S(ev(a[0])); let m = Math.round(N(ev(a[1]))); let n = a[2] ? Math.round(N(ev(a[2]))) : Infinity; let st = Math.max(m, 1); let en = m + n; if (n === Infinity) en = Infinity; return s.slice(st - 1, Math.max(en - 1, 0) === Infinity ? undefined : Math.max(en - 1, 0)); }
      case 'index': return S(ev(a[0])).indexOf(S(ev(a[1]))) + 1;
      case 'split': { const s = S(ev(a[0])); const m = getArr(a[1].name); m.clear(); const sep = a[2] ? (a[2].t === 'regex' ? a[2].v : S(ev(a[2]))) : S(G.FS); let parts; if (s === '') parts = []; else if (sep === ' ') parts = s.split(/[ \t\n]+/).filter(x => x !== ''); else if (sep.length === 1 && !/[\\^$.*+?()[\]{}|]/.test(sep)) parts = s.split(sep); else parts = s.split(rx(sep)); parts.forEach((x, i) => m.set(String(i + 1), new SN(x))); return parts.length; }
      case 'sub': case 'gsub': { const r = toRx(a[0]); const rg = new RegExp(r.source, r.flags.replace('g', '') + (e.name === 'gsub' ? 'g' : '')); const tgt = a[2] || { t: 'field', e: { t: 'num', v: 0 } }; const s = S(ev(tgt)); let cnt = 0; const rep = S(ev(a[1])); const res = s.replace(rg, (m, ...rest) => { cnt++; return rep.replace(/\\\\|\\&|&/g, x => x === '&' ? m : x === '\\&' ? '&' : '\\'); }); if (cnt) assign(tgt, res); return cnt; }
      case 'match': { const r = toRx(a[1]); const m = r.exec(S(ev(a[0]))); if (m) { G.RSTART = m.index + 1; G.RLENGTH = m[0].length; return m.index + 1; } G.RSTART = 0; G.RLENGTH = -1; return 0; }
      case 'sprintf': return sprintf(S(ev(a[0])), a.slice(1).map(ev));
      case 'tolower': return S(ev(a[0])).toLowerCase(); case 'toupper': return S(ev(a[0])).toUpperCase();
      case 'int': return Math.trunc(N(ev(a[0]))); case 'sqrt': return Math.sqrt(N(ev(a[0]))); case 'exp': return Math.exp(N(ev(a[0]))); case 'log': return Math.log(N(ev(a[0])));
      case 'sin': return Math.sin(N(ev(a[0]))); case 'cos': return Math.cos(N(ev(a[0]))); case 'atan2': return Math.atan2(N(ev(a[0])), N(ev(a[1])));
      case 'rand': return Math.random(); case 'srand': return 0; case 'systime': return Math.floor(Date.now() / 1000);
      case 'strftime': { const t = a[1] ? N(ev(a[1])) : Math.floor(Date.now() / 1000); const d = new Date(t * 1000); const p2 = x => String(x).padStart(2, '0'); return S(ev(a[0])).replace(/%([YmdHMSTF])/g, (_, c) => ({ Y: d.getUTCFullYear(), m: p2(d.getUTCMonth() + 1), d: p2(d.getUTCDate()), H: p2(d.getUTCHours()), M: p2(d.getUTCMinutes()), S: p2(d.getUTCSeconds()), T: `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`, F: `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}` })[c]); }
    }
    throw new Error(`awk : fonction inconnue ${e.name}`);
  }
  function exec(s) {
    switch (s.t) {
      case 'block': execBlock(s); break;
      case 'expr': ev(s.e); break;
      case 'print': { const txt = s.args.length ? s.args.map(x => x.t === 'multi' ? x.l.map(y => S(ev(y))).join(S(G.OFS)) : S(ev(x))).join(S(G.OFS)) : rec; emit(txt + S(G.ORS), s.redir); break; }
      case 'printf': { let args = s.args; if (args.length === 1 && args[0].t === 'multi') args = args[0].l; else if (args.length === 1 && args[0].t === 'group') args = [args[0].e]; emit(sprintf(S(ev(args[0])), args.slice(1).map(ev)), s.redir); break; }
      case 'if': if (B(ev(s.c))) exec(s.th); else if (s.el) exec(s.el); break;
      case 'while': while (B(ev(s.c))) { try { exec(s.body); } catch (x) { if (x instanceof Brk) break; if (x instanceof Cnt) continue; throw x; } } break;
      case 'dowhile': do { try { exec(s.body); } catch (x) { if (x instanceof Brk) break; if (x instanceof Cnt) continue; throw x; } } while (B(ev(s.c))); break;
      case 'for': if (s.init) exec(s.init); while (!s.c || B(ev(s.c))) { try { exec(s.body); } catch (x) { if (x instanceof Brk) break; if (!(x instanceof Cnt)) throw x; } if (s.inc) exec(s.inc); } break;
      case 'forin': { const m = getArr(s.arr); const ks = [...m.keys()]; for (const k of ks) { setVar(s.v, new SN(k)); try { exec(s.body); } catch (x) { if (x instanceof Brk) break; if (!(x instanceof Cnt)) throw x; } } break; }
      case 'delete': if (s.idx) getArr(s.name).delete(key(s.idx)); else getArr(s.name).clear(); break;
      case 'next': throw new Next(); case 'exit': throw new Exit(s.e ? N(ev(s.e)) : 0);
      case 'return': throw new Ret(s.e ? ev(s.e) : undefined);
      case 'break': throw new Brk(); case 'continue': throw new Cnt();
    }
  }
  const execBlock = b => { for (const s of b.st) exec(s); };
  const emit = (txt, redir) => { if (redir && S(ev(redir.e)) === '/dev/stderr') return; out += txt; };
  let exitCode = 0;
  const lines = [];
  try {
    for (const b of prog.begin) execBlock(b);
    if (prog.rules.length || prog.end.length) {
      const srcs = files.length ? files : [{ name: '', text: stdin ?? '' }];
      outer: for (const f of srcs) {
        G.FILENAME = f.name; G.FNR = 0; let data = f.text; if (data.endsWith('\n')) data = data.slice(0, -1); const recs = data === '' && !f.text ? [] : data.split('\n');
        for (const r of recs) {
          G.NR++; G.FNR++; setRec(r);
          try { for (const rule of prog.rules) {
            let hit;
            if (rule.pat2) { if (!rule.inRange) { if (B(ev(rule.pat))) { rule.inRange = true; hit = true; if (B(ev(rule.pat2))) rule.inRange = false; } } else { hit = true; if (B(ev(rule.pat2))) rule.inRange = false; } }
            else hit = rule.pat ? B(ev(rule.pat)) : true;
            if (hit) { if (rule.body) execBlock(rule.body); else out += rec + S(G.ORS); }
          } } catch (x) { if (x instanceof Next) continue; throw x; }
        }
      }
    }
  } catch (x) { if (x instanceof Exit) exitCode = x.c; else throw x; }
  try { for (const b of prog.end) execBlock(b); } catch (x) { if (x instanceof Exit) exitCode = x.c; else throw x; }
  for (const r of prog.rules) r.inRange = false;
  return { out, code: exitCode };
}
