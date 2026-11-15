// Terminal HTML : sortie ANSI -> spans, saisie, historique, complétion, éditeur modal.
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function ansi(s) {
  let out = '', open = 0; const cls = { 1: 'b', 2: 'dim', 31: 'red', 32: 'grn', 33: 'yel', 36: 'cya' };
  for (const part of s.split(/(\x1b\[[0-9;]*m)/)) { const m = /^\x1b\[([0-9;]*)m$/.exec(part); if (!m) { out += esc(part); continue; } while (open) { out += '</span>'; open--; } for (const c of m[1].split(';')) if (cls[c]) { out += `<span class="${cls[c]}">`; open++; } }
  while (open--) out += '</span>'; return out;
}
export class Term {
  constructor(root, { onLine, prompt, complete }) {
    this.root = root; this.onLine = onLine; this.promptFn = prompt; this.complete = complete; this.hist = []; this.hp = 0; this.busy = false;
    root.innerHTML = '<div class="out" aria-live="polite"></div><form class="in"><span class="ps"></span><input type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Ligne de commande"></form>';
    this.out = root.querySelector('.out'); this.form = root.querySelector('form'); this.inp = root.querySelector('input'); this.ps = root.querySelector('.ps');
    root.addEventListener('click', () => { if (!getSelection().toString()) this.inp.focus(); });
    this.form.addEventListener('submit', async e => { e.preventDefault(); if (this.busy) return; const line = this.inp.value; this.inp.value = ''; this.print(`<span class="ps">${esc(this.ps.textContent)}</span>${esc(line)}\n`, true); if (line.trim()) { this.hist.push(line); } this.hp = this.hist.length; this.busy = true; try { await this.onLine(line); } finally { this.busy = false; this.refresh(); this.inp.focus(); } });
    this.inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') { if (this.hp > 0) this.inp.value = this.hist[--this.hp]; e.preventDefault(); }
      else if (e.key === 'ArrowDown') { this.inp.value = this.hp < this.hist.length - 1 ? this.hist[++this.hp] : (this.hp = this.hist.length, ''); e.preventDefault(); }
      else if (e.key === 'l' && e.ctrlKey) { this.out.innerHTML = ''; e.preventDefault(); }
      else if (e.key === 'c' && e.ctrlKey) { this.inp.value = ''; e.preventDefault(); }
      else if (e.key === 'Tab') { e.preventDefault(); const v = this.inp.value; const m = /(\S*)$/.exec(v); const cands = this.complete ? this.complete(m[1], v.slice(0, m.index).trim() === '') : []; if (cands.length === 1) this.inp.value = v.slice(0, m.index) + cands[0]; else if (cands.length > 1) { let p = cands[0]; for (const c of cands) while (!c.startsWith(p)) p = p.slice(0, -1); if (p.length > m[1].length) this.inp.value = v.slice(0, m.index) + p; else this.print(cands.join('  ') + '\n'); } }
    });
    this.refresh();
  }
  refresh() { this.ps.textContent = this.promptFn(); }
  print(txt, html = false) { const d = document.createElement('span'); d.innerHTML = html ? txt : ansi(txt); this.out.appendChild(d); this.out.scrollTop = this.out.scrollHeight; this.root.scrollTop = this.root.scrollHeight; }
  clear() { this.out.innerHTML = ''; }
}
export function editor(name, text) {
  return new Promise(res => {
    const dlg = document.createElement('dialog'); dlg.className = 'editor';
    dlg.innerHTML = `<form method="dialog"><h3>${esc(name)}</h3><textarea spellcheck="false" aria-label="Contenu du fichier"></textarea><div class="row"><button value="save" class="btn">Enregistrer (Ctrl+S)</button><button value="cancel" class="btn ghost">Annuler</button></div></form>`;
    const ta = dlg.querySelector('textarea'); ta.value = text; document.body.appendChild(dlg);
    ta.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); dlg.close('save'); } if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); } });
    dlg.addEventListener('close', () => { const v = dlg.returnValue === 'save' ? ta.value : null; dlg.remove(); res(v); });
    dlg.showModal(); ta.focus();
  });
}
