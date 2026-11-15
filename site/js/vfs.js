// Système de fichiers virtuel en mémoire.
export class VFS {
  constructor() { this.f = new Map(); this.d = new Set(['/']); this.now = 1767225600; }
  static norm(p) { const out = []; for (const s of p.split('/')) { if (!s || s === '.') continue; if (s === '..') out.pop(); else out.push(s); } return '/' + out.join('/'); }
  resolve(p, cwd) { return VFS.norm(p.startsWith('/') ? p : cwd + '/' + p); }
  isFile(p) { return this.f.has(p); } isDir(p) { return this.d.has(p); } exists(p) { return this.isFile(p) || this.isDir(p); }
  mkdirp(p) { let c = ''; for (const s of p.split('/').filter(Boolean)) { c += '/' + s; this.d.add(c); } }
  write(p, content, append = false) { const dir = p.slice(0, p.lastIndexOf('/')) || '/'; if (!this.d.has(dir)) throw new Error(`${p} : Aucun fichier ou dossier de ce type`); if (this.d.has(p)) throw new Error(`${p} : est un dossier`); const o = this.f.get(p); this.f.set(p, { c: (append && o ? o.c : '') + content, m: this.now++, x: o?.x || false }); }
  read(p) { const o = this.f.get(p); if (!o) throw new Error(this.d.has(p) ? `${p} : est un dossier` : `${p} : Aucun fichier ou dossier de ce type`); return o.c; }
  list(dir) { const pre = dir === '/' ? '/' : dir + '/'; const names = new Set(); for (const k of [...this.f.keys(), ...this.d]) if (k !== dir && k.startsWith(pre)) names.add(k.slice(pre.length).split('/')[0]); return [...names].sort(); }
  rm(p, rec = false) { if (this.f.delete(p)) return; if (this.d.has(p)) { if (!rec) throw new Error(`${p} : est un dossier`); for (const k of [...this.f.keys()]) if (k.startsWith(p + '/')) this.f.delete(k); for (const k of [...this.d]) if (k === p || k.startsWith(p + '/')) this.d.delete(k); return; } throw new Error(`${p} : Aucun fichier ou dossier de ce type`); }
  snapshot(prefix) { const o = {}; for (const [k, v] of this.f) if (k.startsWith(prefix + '/')) o[k.slice(prefix.length + 1)] = v.c; return o; }
}
