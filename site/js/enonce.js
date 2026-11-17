// Met en forme le texte d'un énoncé (écrit en colonnes de 78 caractères) pour l'affichage dans le panneau latéral.
// Le texte d'origine n'est pas modifié : il reste celui qu'affichent « defi enonce » et le terminal.
const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CODE = /(?<![\w/])(?:[\w.<>~*-]+\/)+[\w.<>~*-]*|\b[\w-]+\.(?:txt|csv|sh|md|log|conf|json|yml|yaml|pcap|html|py|sql)\b|\bdefi \w+\b|\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g;
const inline = t => { let o = '', k = 0; for (const m of String(t).matchAll(CODE)) { o += esc(t.slice(k, m.index)) + `<code>${esc(m[0])}</code>`; k = m.index + m[0].length; } return (o + esc(String(t).slice(k))).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); };
const HEAD = /^([A-ZÀ-ÝÉ][^a-zà-ÿ]{2,}?)(\s*\([^)]*\))?\s*:?\s*$/;
const HEAD_INLINE = /^(MISSION|CONTEXTE|OBJECTIF|CONSIGNES?|RÈGLES?|À FAIRE|À PRODUIRE)\s*:\s*(\S.*)$/;
const HEAD2 = /^([A-ZÀ-Ý][A-ZÀ-Ý' ]{3,}(?: \([^)]*\))?)\s+[—:]\s+(\S.*)$/;
const SHORT_HEAD = /^(À [A-Za-zéèêàù ]{3,30}|Pour [a-zéè ]{3,30}|Règles?|Consignes?|Contexte|Objectif)\s*:\s*$/;
const ITEM = /^(\s{1,})(\d+\s+)?(\S.{0,38}?)\s{2,}(\S.*)$/;
const DRAW = /[│┃┌└├┐┘┬┴┼─]|^\s*[|+][-=+]{3,}|\|.*\|.*\|/;

export function enonceHtml(text) {
  const lines = String(text || '').replace(/\t/g, '  ').split('\n');
  const out = []; let i = 0;
  // Titre : « TITRE — sous-titre »
  while (i < lines.length && !lines[i].trim()) i++;
  if (i < lines.length) {
    const first = []; while (i < lines.length && lines[i].trim()) first.push(lines[i++]);
    const t = first.join(' ').replace(/\s+/g, ' ').trim(); const m = /^(.*?)\s+—\s+(.+)$/.exec(t);
    const letters = m ? m[1].replace(/[^A-Za-zÀ-ÿ]/g, '') : ''; const up = letters.replace(/[^A-ZÀ-Ý]/g, '').length;
    if (m && letters.length >= 4 && up / letters.length >= 0.6) out.push(`<p class="eyebrow">${inline(m[1])}</p><p${m[2].length > 140 ? '' : ' class="lead"'}>${inline(m[2])}</p>`);
    else out.push(`<p class="lead">${inline(t)}</p>`);
  }
  let par = [], items = [], numbered = false;
  const flushPar = () => { if (par.length) { out.push(`<p>${inline(par.join(' ').replace(/\s+/g, ' '))}</p>`); par = []; } };
  const flushItems = () => {
    if (!items.length) return;
    for (const it of items) if (it.k.length > 70) { it.d = (it.k + ' ' + (it.d || '')).trim(); it.k = ''; }
    out.push(`<div class="items${numbered ? ' num' : ''}">` + items.map(it => `<div class="it${it.d ? '' : ' nd'}${it.letter ? ' ltr' : ''}"><span class="n">${it.n ? esc(it.n.trim()) : '•'}</span>${it.k ? `<span class="k">${inline(it.k)}</span>` : ''}${it.d ? `<span class="d">${inline(it.d.replace(/\s+/g, ' ').trim())}</span>` : ''}</div>`).join('') + '</div>');
    items = []; numbered = false;
  };
  const raw = [];
  const flushRaw = () => { if (raw.length) { out.push(`<pre class="raw">${esc(raw.join('\n'))}</pre>`); raw.length = 0; } };
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (DRAW.test(l)) { flushPar(); flushItems(); raw.push(l); continue; } else flushRaw();
    if (!l.trim()) { flushPar(); flushItems(); continue; }
    const t = l.trim(); const ind = l.length - l.trimStart().length;
    let h;
    if (ind <= 1 && (h = HEAD.exec(t)) && t.length <= 70) { flushPar(); flushItems(); out.push(`<h3>${inline(t.replace(/\s*:$/, ''))}</h3>`); continue; }
    if (ind <= 1 && SHORT_HEAD.test(t)) { flushPar(); flushItems(); out.push(`<h3>${inline(t.replace(/\s*:$/, ''))}</h3>`); continue; }
    if (ind <= 1 && (h = HEAD_INLINE.exec(t))) { flushPar(); flushItems(); out.push(`<h3>${inline(h[1][0] + h[1].slice(1).toLowerCase())}</h3>`); par.push(h[2]); continue; }
    if (ind <= 1 && (h = HEAD2.exec(t))) { flushPar(); flushItems(); out.push(`<h3>${inline(h[1][0] + h[1].slice(1).toLowerCase())}</h3>`); par.push(h[2]); continue; }
    const last0 = items[items.length - 1];
    const sub = ITEM.exec(l); if (last0 && last0.col && ind >= last0.col - 1 && !(sub && /^[\w.-]+$/.test(sub[3]))) { last0.d = (last0.d ? last0.d + ' ' : '') + t; continue; }
    const ch = /^\s{2,}([a-e])\)\s+(\S.*)$/.exec(l);
    if (ch) { flushPar(); items.push({ n: ch[1], k: ch[2], d: '', ind, letter: true }); continue; }
    const m = ITEM.exec(l);
    if (m) { flushPar(); const it = { n: m[2] || '', k: m[3], d: m[4], ind: m[1].length, col: l.indexOf(m[4], m[1].length + (m[2] || '').length + m[3].length) }; if (it.n && !it.letter) numbered = true; items.push(it); continue; }
    const nl = ind <= 1 ? /^(\d+)[.)]?\s+(\S.*)$/.exec(t) : null;
    if (nl) { flushPar(); numbered = true; items.push({ n: nl[1], k: nl[2], d: '', ind, col: ind + 3 }); continue; }
    if (ind >= 2) {
      if (items.length && ind > items[items.length - 1].ind + 3) { const last = items[items.length - 1]; if (/^-\s/.test(t) && !last.d) last.d = t; else last.d = (last.d ? last.d + ' ' : '') + t; continue; }
      if (/^[-•]\s/.test(t)) { flushPar(); items.push({ n: '', k: t.replace(/^[-•]\s+/, ''), d: '', ind }); continue; }
      flushPar(); items.push({ n: '', k: t, d: '', ind }); continue;
    }
    if (items.length) flushItems();
    if (/^[-•]\s/.test(t)) { flushPar(); items.push({ n: '', k: t.replace(/^[-•]\s+/, ''), d: '' }); continue; }
    par.push(t);
  }
  flushPar(); flushItems(); flushRaw();
  return out.join('');
}
