// Correcteur : port JavaScript de engine/lib.sh (mêmes règles de normalisation et de hachage).
import { sha256 } from './sha256.js';
const hashOf = s => sha256(s);
const normSetLines = text => [...new Set(text.replace(/\r/g, '').split('\n').map(l => l.replace(/^[ \t]+|[ \t]+$/g, '')).filter(l => l !== ''))].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
const normList = v => [...new Set(v.replace(/[A-Z]/g, c => c.toLowerCase()).replace(/[èé]/g, 'e').replace(/ /g, '').split(',').filter(Boolean))].sort().join(',');
const given = (files, key) => { const t = files['reponses.txt']; if (t === undefined) return ''; for (const l of t.split('\n')) if (l.startsWith(key + '=')) return l.slice(key.length + 1).replace(/^\s+|\s+$/g, ''); return ''; };

// Prépare les réponses « vérité » d'une variante (déjà hachées par les scripts d'origine).
export function runChecks(def, variant, files) {
  const out = []; let fail = false; const T = variant.answers;
  const say = (k, t) => out.push({ k, t });
  for (const c of def.checks) {
    if (c.t === 'phase') { say('phase', c.title); continue; }
    if (c.t === 'num' || c.t === 'kv') {
      const v = given(files, c.key);
      if (!v) { say('ko', `${c.key} : non renseigné`); fail = true; }
      else if (hashOf(c.t === 'num' ? v : normList(v)) === T[c.key]) say('ok', c.key);
      else { say('ko', `${c.key} : valeur incorrecte`); fail = true; }
    } else if (c.t === 'set') {
      const f = files[c.file];
      if (f === undefined || f === '') { say('ko', `${c.file} : absent ou vide`); fail = true; continue; }
      const got = normSetLines(f);
      if (hashOf(got.join('\n')) === T[c.key]) say('ok', `${c.file} (${got.length} ligne(s))`);
      else { say('ko', `${c.file} : ${got.length} ligne(s) distincte(s), contenu incorrect (attendu : ${T['n_' + c.key]} ligne(s))`); fail = true; }
    }
  }
  if (def.special === 'synthese') {
    const M = files['synthese.md'];
    if (M === undefined || M.includes('A COMPLETER')) { say('ko', 'synthese.md à compléter'); fail = true; }
    else {
      const w = (M.split('\n').filter(l => !l.startsWith('#')).join('\n').match(/\S+/g) || []).length;
      if (w >= 40) say('ok', `${w} mots`); else { say('ko', `synthèse trop courte (${w} mots, 40 minimum)`); fail = true; }
      const ids = (files['priorites.csv'] || '').split('\n').map(l => l.split(';')).filter(a => a[2] === 'P1').map(a => a[0]);
      for (const id of ids) { if (new RegExp('(^|[^A-Za-z0-9_])' + id + '([^A-Za-z0-9_]|$)').test(M)) say('ok', `cite ${id}`); else { say('ko', `ne cite pas le constat P1 ${id}`); fail = true; } }
      if (/retest/i.test(M)) say('ok', 'prévoit un retest'); else { say('ko', 'ne prévoit pas de retest'); fail = true; }
    }
  }
  return { ok: !fail, lines: out };
}
