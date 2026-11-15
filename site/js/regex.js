// Conversion des expressions régulières POSIX (BRE/ERE) vers RegExp JavaScript.
const CLASSES = { alpha: 'a-zA-Z', digit: '0-9', alnum: 'a-zA-Z0-9', upper: 'A-Z', lower: 'a-z', space: ' \\t\\n\\r\\f\\v', blank: ' \\t', punct: '!-\\/:-@\\[-`{-~', xdigit: '0-9A-Fa-f', word: '\\w' };
export function toJS(pat, { ere = false, icase = false, global = false } = {}) {
  let out = '', i = 0; const n = pat.length;
  const esc = c => '\\^$.*+?()[]{}|/'.includes(c) ? '\\' + c : c;
  while (i < n) {
    const c = pat[i];
    if (c === '[') { // expression entre crochets
      let j = i + 1, neg = false, body = '';
      if (pat[j] === '^') { neg = true; j++; }
      if (pat[j] === ']') { body += '\\]'; j++; }
      while (j < n && pat[j] !== ']') {
        if (pat[j] === '[' && pat[j + 1] === ':') { const e = pat.indexOf(':]', j + 2); if (e > 0) { body += CLASSES[pat.slice(j + 2, e)] ?? ''; j = e + 2; continue; } }
        if (pat[j] === '\\') { body += '\\\\'; j++; continue; }
        if (pat[j] === '[' || pat[j] === ']') { body += '\\' + pat[j]; j++; continue; }
        body += pat[j]; j++;
      }
      out += '[' + (neg ? '^' : '') + body + ']'; i = j + 1; continue;
    }
    if (c === '\\' && i + 1 < n) {
      const d = pat[i + 1]; i += 2;
      if (!ere && '(){}|+?'.includes(d)) { out += d; continue; }
      if (d === '<' || d === '>') { out += '\\b'; continue; }
      if ('wWsSdDbB'.includes(d)) { out += '\\' + d; continue; }
      if (d === 'n') { out += '\\n'; continue; } if (d === 't') { out += '\\t'; continue; }
      out += esc(d); continue;
    }
    if (!ere && '(){}|+?'.includes(c)) { out += '\\' + c; i++; continue; }
    if (ere && c === '{' && !/^\{\d*,?\d*\}/.test(pat.slice(i))) { out += '\\{'; i++; continue; }
    if (c === '/') { out += '\\/'; i++; continue; }
    out += c; i++;
  }
  try { return new RegExp(out, (icase ? 'i' : '') + (global ? 'g' : '')); } catch (e) { throw new Error('expression régulière invalide : ' + pat); }
}
