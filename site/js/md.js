// Rendu Markdown minimal pour les leçons (titres, listes, tableaux, code, <details>).
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\s][^*]*)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => `<a href="${u.endsWith('.md') ? '#/cours/' + u.replace(/\.md$/, '') : u}">${t}</a>`);
export function md(src) {
  const L = src.split('\n'); let out = '', i = 0;
  while (i < L.length) {
    const l = L[i];
    if (/^```/.test(l)) { let b = ''; i++; while (i < L.length && !/^```/.test(L[i])) b += L[i++] + '\n'; i++; out += `<pre><code>${esc(b)}</code></pre>`; continue; }
    if (/^<details>/.test(l)) { out += '<details>'; i++; continue; } if (/^<\/details>/.test(l)) { out += '</details>'; i++; continue; }
    let m = /^<summary>(.*)<\/summary>/.exec(l); if (m) { out += `<summary>${inline(m[1])}</summary>`; i++; continue; }
    if ((m = /^(#{1,4}) (.*)/.exec(l))) { out += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`; i++; continue; }
    if (/^\|/.test(l) && /^\|[-| :]+\|?$/.test(L[i + 1] || '')) { const row = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim()); let t = '<table><thead><tr>' + row(l).map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>'; i += 2; while (i < L.length && /^\|/.test(L[i])) { t += '<tr>' + row(L[i]).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>'; i++; } out += t + '</tbody></table>'; continue; }
    if (/^\s*[-*] /.test(l)) { out += '<ul>'; while (i < L.length && /^\s*[-*] /.test(L[i])) out += `<li>${inline(L[i++].replace(/^\s*[-*] /, ''))}</li>`; out += '</ul>'; continue; }
    if (/^\d+\. /.test(l)) { out += '<ol>'; while (i < L.length && /^\d+\. /.test(L[i])) { out += `<li>${inline(L[i++].replace(/^\d+\. /, ''))}</li>`; } out += '</ol>'; continue; }
    if (l.trim() === '') { i++; continue; }
    let p = l; i++; while (i < L.length && L[i].trim() !== '' && !/^(#|```|\||\s*[-*] |\d+\. |<)/.test(L[i])) p += ' ' + L[i++]; out += `<p>${inline(p)}</p>`;
  }
  return out;
}
