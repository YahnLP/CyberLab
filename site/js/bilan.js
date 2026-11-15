// Bilan de l'élève : synthèse imprimable et exportable (texte, JSON) de la progression locale.
const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = s => s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`;
// Calcule le bilan à partir de la progression (S.prog), de l'index des défis et des parcours.
export function compute(prog, index, parcours, nom = '', date = new Date()) {
  const byId = Object.fromEntries(index.map(d => [d.id, d])); const seen = new Set(); const groupes = [];
  for (const g of parcours) {
    const ids = g.steps.map(s => s.defi).filter((x, i, a) => x && a.indexOf(x) === i && byId[x] && !seen.has(x)); ids.forEach(i => seen.add(i));
    if (!ids.length) continue;
    const defis = ids.map(id => { const p = prog[id] || {}; const ok = p.st === 'reussi'; return { id, titre: byId[id].title || byId[id].name || id, points_max: byId[id].points, statut: ok ? 'reussi' : (p.st || 'non commence'), points: ok ? p.pts : 0, indices: p.hints || 0, expert: !!p.expert, temps_s: p.expert ? p.time : null }; });
    groupes.push({ nom: g.name, reussis: defis.filter(d => d.statut === 'reussi').length, total: defis.length, points: defis.reduce((a, d) => a + d.points, 0), points_max: defis.reduce((a, d) => a + d.points_max, 0), defis });
  }
  const reussis = groupes.reduce((a, g) => a + g.reussis, 0), total = groupes.reduce((a, g) => a + g.total, 0), points = groupes.reduce((a, g) => a + g.points, 0), points_max = groupes.reduce((a, g) => a + g.points_max, 0);
  return { nom, date: date.toISOString().slice(0, 10), reussis, total, points, points_max, pourcentage: total ? Math.round(reussis * 100 / total) : 0, groupes };
}
export function toText(b) {
  let t = `BILAN CYBERLAB\nÉlève : ${b.nom || '(non renseigné)'}\nDate : ${b.date}\nDéfis réussis : ${b.reussis}/${b.total} (${b.pourcentage} %)\nPoints : ${b.points}/${b.points_max}\n`;
  for (const g of b.groupes) { t += `\n${g.nom} : ${g.reussis}/${g.total} défis, ${g.points}/${g.points_max} points\n`; for (const d of g.defis) t += `  [${d.statut === 'reussi' ? 'x' : ' '}] ${d.id} ${d.titre} : ${d.points}/${d.points_max} pts, ${d.indices} indice(s)${d.expert ? `, mode expert ${fmt(d.temps_s)}` : ''}\n`; }
  return t;
}
export function render(b) {
  let h = `<nav class="crumbs" aria-label="Fil d'Ariane"><a href="#/">Parcours</a><span aria-hidden="true"> / </span><span>Bilan</span></nav><section class="bilan"><h1>Bilan de progression</h1><p class="muted">Calculé sur cet appareil, à partir de votre progression. Rien n'est envoyé : exportez le bilan pour le transmettre à votre formateur.</p>`;
  h += `<p class="no-print"><label>Votre nom <input id="bilan-nom" type="text" maxlength="60" autocomplete="name" value="${esc(b.nom)}"></label></p>`;
  h += `<div class="bilan-tot"><strong>${b.reussis}/${b.total}</strong> défis réussis (${b.pourcentage} %) · <strong>${b.points}/${b.points_max}</strong> points · <span class="muted">${esc(b.date)}</span></div>`;
  for (const g of b.groupes) {
    h += `<section class="bilan-g"><h2>${esc(g.nom)} <span class="muted">${g.reussis}/${g.total} · ${g.points}/${g.points_max} pts</span></h2><table><thead><tr><th>Défi</th><th>État</th><th>Points</th><th>Indices</th></tr></thead><tbody>`;
    for (const d of g.defis) h += `<tr><td>${esc(d.id)} ${esc(d.titre)}</td><td>${d.statut === 'reussi' ? 'Réussi' : 'À faire'}</td><td>${d.points}/${d.points_max}</td><td>${d.indices}</td></tr>`;
    h += `</tbody></table></section>`;
  }
  h += `<p class="no-print bilan-acts"><button class="btn" id="bilan-print" type="button">Imprimer ou enregistrer en PDF</button><button class="btn ghost" id="bilan-txt" type="button">Télécharger (.txt)</button><button class="btn ghost" id="bilan-json" type="button">Télécharger (.json)</button></p></section>`;
  return h;
}
const save = (nom, type, contenu) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([contenu], { type })); a.download = nom; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
export function wire(root, get, rerender) {
  const nom = root.querySelector('#bilan-nom'); let t;
  nom.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { try { localStorage.setItem('cyberlab.nom', nom.value); } catch { } rerender(nom.value); }, 400); });
  root.querySelector('#bilan-print').addEventListener('click', () => window.print());
  root.querySelector('#bilan-txt').addEventListener('click', () => save('bilan-cyberlab.txt', 'text/plain;charset=utf-8', toText(get())));
  root.querySelector('#bilan-json').addEventListener('click', () => save('bilan-cyberlab.json', 'application/json', JSON.stringify(get(), null, 2)));
}
