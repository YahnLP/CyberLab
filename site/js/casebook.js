// Casebook : dossier de preuves et rapport exportable, 100 % local (aucun envoi).
import { sha256 } from './sha256.js';
import { fmtTime } from './panel.js';
const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clean = s => s.replace(/\x1b\[[0-9;]*m/g, '');
export const MAX_EV = 20, MAX_EXC = 800;
export const ensure = w => (w.case ||= { ev: [], concl: '' });
export function addEvidence(w, line, out) {
  const c = ensure(w); const o = clean(out).replace(/\s+$/, ''); if (!line || c.ev.length >= MAX_EV) return null;
  const ev = { n: (c.ev.at(-1)?.n || 0) + 1, t: w.elapsed || 0, line, sha: sha256(o), len: o.length, exc: o.slice(0, MAX_EXC), cut: o.length > MAX_EXC };
  c.ev.push(ev); return ev;
}
export function removeEvidence(w, n) { const c = ensure(w); c.ev = c.ev.filter(e => e.n !== n); }
export function reportData(def, w, prog) {
  const c = ensure(w);
  return { titre: `Défi ${def.id} — ${def.title}`, date: new Date().toISOString().slice(0, 16).replace('T', ' '), mode: w.mode === 'expert' ? 'Expert' : 'Guidé', duree: w.elapsed || 0, etat: prog?.st === 'reussi' ? `réussi (${prog.pts}/${def.points} pts, ${prog.hints || 0} indice(s))` : 'en cours', commandes: (w.log || []).length, preuves: c.ev, conclusion: c.concl || '' };
}
export function toMarkdown(r) {
  let m = `# Rapport — ${r.titre}\n\n- Date : ${r.date}\n- Mode : ${r.mode} · durée ${fmtTime(r.duree)}\n- État : ${r.etat}\n- Commandes exécutées : ${r.commandes}\n\n## Preuves\n\n`;
  m += r.preuves.length ? r.preuves.map(e => `### Preuve ${e.n} (${fmtTime(e.t)})\n\nCommande : \`${e.line}\`\n\nSHA-256 de la sortie : \`${e.sha}\` (${e.len} caractères)\n\n\`\`\`\n${e.exc}${e.cut ? '\n[… tronqué]' : ''}\n\`\`\`\n`).join('\n') : '_Aucune preuve enregistrée._\n';
  return m + `\n## Conclusion\n\n${r.conclusion || '_À rédiger._'}\n\n_Données fictives, simulateur CyberLab (Formaxion Landes)._\n`;
}
export function toHtml(r) {
  const ev = r.preuves.length ? r.preuves.map(e => `<section><h3>Preuve ${e.n} <small>(${fmtTime(e.t)})</small></h3><p>Commande : <code>${esc(e.line)}</code></p><p>SHA-256 de la sortie : <code>${e.sha}</code> (${e.len} caractères)</p><pre>${esc(e.exc)}${e.cut ? '\n[… tronqué]' : ''}</pre></section>`).join('') : '<p><em>Aucune preuve enregistrée.</em></p>';
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Rapport — ${esc(r.titre)}</title><style>body{font:16px/1.6 Montserrat,Arial,sans-serif;max-width:50rem;margin:2rem auto;padding:0 1rem;color:#0F2939}h1{color:#0082CB}code{background:#D6EEFC;border-radius:4px;padding:0 .3em}pre{background:#0F2939;color:#e6f1f8;padding:1rem;border-radius:12px;white-space:pre-wrap;overflow-wrap:anywhere}section{border-left:4px solid #39A848;padding-left:1rem;margin:1.2rem 0}footer{color:#5b6b76;font-size:.85rem}</style><h1>Rapport — ${esc(r.titre)}</h1><ul><li>Date : ${esc(r.date)}</li><li>Mode : ${r.mode} · durée ${fmtTime(r.duree)}</li><li>État : ${esc(r.etat)}</li><li>Commandes exécutées : ${r.commandes}</li></ul><h2>Preuves</h2>${ev}<h2>Conclusion</h2><p style="white-space:pre-wrap">${esc(r.conclusion) || '<em>À rédiger.</em>'}</p><footer>Données fictives, simulateur CyberLab (Formaxion Landes).</footer></html>`;
}
export function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
export function view(w) {
  const c = ensure(w);
  return `<div class="cbk"><div class="cbk-bar"><button class="btn small" data-cb="add">Ajouter la dernière sortie aux preuves</button><span class="muted small" id="cb-count">${c.ev.length}/${MAX_EV} preuve(s)</span></div><ol class="evl">${c.ev.map(e => `<li><div class="evh"><strong>Preuve ${e.n}</strong> <span class="muted">${fmtTime(e.t)}</span> <code>${esc(e.line)}</code><button class="btn ghost small" data-cb="del" data-n="${e.n}" aria-label="Retirer la preuve ${e.n}">Retirer</button></div><div class="muted small">SHA-256 <code>${e.sha.slice(0, 16)}…</code> · ${e.len} caractères</div><pre class="exc">${esc(e.exc.slice(0, 240))}${e.exc.length > 240 || e.cut ? '\n…' : ''}</pre></li>`).join('') || '<li class="muted small">Aucune preuve. Exécutez une commande puis ajoutez sa sortie.</li>'}</ol><label class="small" for="cb-concl"><strong>Conclusion</strong> : ce que vous avez observé, ce que vous en déduisez, ce que vous recommandez.</label><textarea id="cb-concl" rows="4" maxlength="4000">${esc(c.concl)}</textarea><div class="cbk-bar"><button class="btn small" data-cb="md">Exporter le rapport (Markdown)</button><button class="btn ghost small" data-cb="html">Exporter le rapport (HTML)</button></div></div>`;
}
