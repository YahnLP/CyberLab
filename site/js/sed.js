// sed minimal : s, d, p, y, adresses numériques, $, /re/, plages ; options -n -E -r -e -i
import { toJS } from './regex.js';
function parseScript(script, ere) {
  const cmds = []; let i = 0; const n = script.length;
  const readDelim = d => { let s = ''; while (i < n && script[i] !== d) { if (script[i] === '\\' && i + 1 < n) { if (script[i + 1] === d) { s += d; i += 2; continue; } s += script[i] + script[i + 1]; i += 2; continue; } s += script[i++]; } i++; return s; };
  const addr = () => {
    if (script[i] === '$') { i++; return { k: 'last' }; }
    if (/\d/.test(script[i])) { let s = ''; while (/\d/.test(script[i] || '')) s += script[i++]; return { k: 'n', v: +s }; }
    if (script[i] === '/') { i++; const re = readDelim('/'); return { k: 're', re: toJS(re, { ere }) }; }
    if (script[i] === '\\' && script[i + 1] && !/[\s\\]/.test(script[i + 1])) { const d = script[i + 1]; i += 2; const re = readDelim(d); return { k: 're', re: toJS(re, { ere }) }; }
    return null;
  };
  while (i < n) {
    while (i < n && /[\s;]/.test(script[i])) i++;
    if (i >= n) break;
    let a1 = addr(), a2 = null; if (a1 && script[i] === ',') { i++; a2 = addr(); }
    while (script[i] === ' ') i++;
    let neg = false; if (script[i] === '!') { neg = true; i++; }
    const c = script[i++];
    if (c === 's') { const d = script[i++]; const re = readDelim(d); const rep = readDelim(d); let fl = ''; while (i < n && /[gpiI0-9]/.test(script[i])) fl += script[i++]; cmds.push({ c, a1, a2, neg, re: toJS(re, { ere, icase: /[iI]/.test(fl), global: fl.includes('g') }), rep, p: fl.includes('p'), nth: +(fl.match(/\d+/)?.[0] || 0) }); }
    else if (c === 'y') { const d = script[i++]; const a = readDelim(d), b = readDelim(d); cmds.push({ c, a1, a2, neg, a, b }); }
    else if (c === 'd' || c === 'p' || c === 'q') cmds.push({ c, a1, a2, neg });
    else throw new Error(`sed : commande « ${c} » non gérée dans le simulateur`);
  }
  return cmds;
}
export function runSed(script, text, { n = false, ere = false } = {}) {
  const cmds = parseScript(script, ere); let lines = text.split('\n'); const trailing = text.endsWith('\n'); if (trailing) lines.pop();
  const out = []; const ranges = cmds.map(() => false);
  for (let ln = 0; ln < lines.length; ln++) {
    let pat = lines[ln]; let del = false, quit = false; const last = ln === lines.length - 1; const num = ln + 1;
    const match = a => a.k === 'n' ? num === a.v : a.k === 'last' ? last : a.re.test(pat);
    for (let k = 0; k < cmds.length && !del; k++) {
      const m = cmds[k]; let sel;
      if (!m.a1) sel = true; else if (!m.a2) sel = match(m.a1);
      else if (ranges[k]) { sel = true; if (m.a2.k === 'n' ? num >= m.a2.v : match(m.a2)) ranges[k] = false; }
      else if (match(m.a1)) { sel = true; if (!(m.a2.k === 'n' && num >= m.a2.v) && !(m.a2.k !== 'n' && m.a2.k !== 're' && last)) ranges[k] = true; } else sel = false;
      if (m.neg) sel = !sel; if (!sel) continue;
      if (m.c === 'd') del = true;
      else if (m.c === 'p') out.push(pat);
      else if (m.c === 'q') { quit = true; }
      else if (m.c === 'y') { pat = [...pat].map(ch => { const x = m.a.indexOf(ch); return x >= 0 ? m.b[x] : ch; }).join(''); }
      else if (m.c === 's') {
        let cnt = 0; m.re.lastIndex = 0;
        const r = pat.replace(m.re, (...a) => { cnt++; if (m.nth && cnt !== m.nth) return a[0]; const groups = a.slice(0, -2).filter(x => typeof x === 'string' || x === undefined); return m.rep.replace(/\\([0-9&nt\\\/])|&/g, (x, d) => x === '&' ? a[0] : d === undefined ? x : /[0-9]/.test(d) ? (groups[+d] ?? '') : d === 'n' ? '\n' : d === 't' ? '\t' : d); });
        if (r !== pat || cnt) { pat = r; if (m.p) out.push(pat); }
      }
    }
    if (!del && !n) out.push(pat);
    if (quit) break;
  }
  return out.length ? out.join('\n') + (trailing || true ? '\n' : '') : '';
}
