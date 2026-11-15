// Panneau « Base SQL » : visualise la requête construite par l'application fictive et son résultat.
// Il passe par la même route HTTP que curl (/produit?id=...) : l'effet côté défense reste identique.
const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const TEMPLATE = v => `SELECT id, nom, prix FROM produits WHERE id = ${v} AND visible = 1`;
// Affiche la requête telle que le moteur la lirait : un commentaire (-- ou #) coupe la fin.
export function shownQuery(v) { const c = v.search(/--|#/); return c >= 0 ? { sql: `SELECT id, nom, prix FROM produits WHERE id = ${v.slice(0, c)}`, cut: v.slice(c) } : { sql: TEMPLATE(v), cut: '' }; }
export function parseReply(raw) {
  const i = raw.indexOf('\r\n\r\n') >= 0 ? raw.indexOf('\r\n\r\n') : raw.indexOf('\n\n'); const head = raw.slice(0, i < 0 ? 0 : i); const body = raw.slice(i < 0 ? 0 : i).trim(); const status = /HTTP\/1\.1 (\d+)/.exec(head)?.[1] || '';
  if (status && status !== '200') return { status, err: body }; const rows = []; for (const l of body.split('\n').filter(l => l.startsWith('{'))) { try { rows.push(JSON.parse(l)); } catch { } } return { status, rows };
}
export function render(domain) {
  return `<form class="webbar" id="sqlform"><label for="sqlin" class="small">id =</label><input id="sqlin" value="1" spellcheck="false" autocomplete="off"><button class="btn small" type="submit">Exécuter</button></form><p class="small muted">Valeur envoyée au paramètre <code>id</code> de <code>http://www.${esc(domain)}/produit</code>. Le serveur la place telle quelle dans la requête.</p><div id="sqlout"><p class="muted small">Saisissez une valeur puis Exécuter.</p></div>`;
}
export function show(el, value, rep) {
  const q = shownQuery(value); let h = `<pre class="exc" aria-label="Requête construite"><code>${esc(q.sql)}</code>${q.cut ? `<span class="muted"> ${esc(q.cut)}   (ignoré : commentaire)</span>` : ''}</pre>`;
  if (rep.err) h += `<p class="err small"><strong>Erreur ${esc(rep.status)}</strong> : ${esc(rep.err)}</p>`;
  else if (!rep.rows.length) h += '<p class="muted small">Aucune ligne.</p>';
  else h += `<table class="sqlt"><thead><tr><th>id</th><th>nom</th><th>prix</th></tr></thead><tbody>${rep.rows.map(r => `<tr><td>${esc(r.id)}</td><td>${esc(r.nom)}</td><td>${esc(r.prix)}</td></tr>`).join('')}</tbody></table><p class="small muted">${rep.rows.length} ligne(s).</p>`;
  el.innerHTML = h;
}
