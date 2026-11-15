// Défi 01 sur le web : sshd -T, ssh-keygen -lf, contrôles de remédiation et correcteur (port de check.sh / controls.sh).
import { sha256, sha256Bytes } from './sha256.js';
const hex2b64 = h => { let s = ''; for (let i = 0; i < h.length; i += 2) s += String.fromCharCode(parseInt(h.slice(i, i + 2), 16)); return btoa(s).replace(/=+$/, ''); };
// Empreinte d'une ligne de clé publique OpenSSH (ssh-ed25519 AAAA… commentaire)
export function fingerprint(line) {
  const m = /^\s*(ssh-ed25519)\s+([A-Za-z0-9+/=]+)(?:\s+(.*))?$/.exec(line); if (!m) return null;
  let bin; try { bin = atob(m[2]); } catch { return null; }
  const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return { bits: 256, fpr: 'SHA256:' + hex2b64(sha256Bytes(b)), comment: (m[3] || 'no comment').trim(), type: 'ED25519' };
}
export function keygenLf(text) { const out = []; for (const l of text.split('\n')) { if (!l.trim() || l.startsWith('#')) continue; const f = fingerprint(l); if (f) out.push(`${f.bits} ${f.fpr} ${f.comment} (${f.type})`); } return out; }

const BOOL = new Set(['passwordauthentication', 'pubkeyauthentication', 'usepam', 'x11forwarding', 'printmotd', 'permitemptypasswords', 'kbdinteractiveauthentication', 'challengeresponseauthentication', 'strictmodes', 'tcpkeepalive', 'hostbasedauthentication', 'ignorerhosts', 'permituserenvironment', 'usedns', 'allowagentforwarding']);
const KNOWN = new Set([...BOOL, 'port', 'permitrootlogin', 'maxauthtries', 'acceptenv', 'subsystem', 'loglevel', 'logingracetime', 'allowusers', 'allowgroups', 'denyusers', 'denygroups', 'clientaliveinterval', 'clientalivecountmax', 'maxsessions', 'allowtcpforwarding', 'listenaddress', 'authorizedkeysfile', 'hostkey', 'banner', 'ciphers', 'macs', 'kexalgorithms', 'syslogfacility', 'maxstartups', 'gatewayports', 'permittunnel', 'pidfile', 'authenticationmethods', 'addressfamily', 'compression', 'include']);
const DEF = { acceptenv: null, addressfamily: 'any', allowagentforwarding: 'yes', allowtcpforwarding: 'yes', authorizedkeysfile: '.ssh/authorized_keys .ssh/authorized_keys2', challengeresponseauthentication: 'no', clientalivecountmax: '3', clientaliveinterval: '0', kbdinteractiveauthentication: 'no', logingracetime: '120', loglevel: 'INFO', maxauthtries: '6', maxsessions: '10', passwordauthentication: 'yes', permitemptypasswords: 'no', permitrootlogin: 'without-password', port: '22', printmotd: 'yes', pubkeyauthentication: 'yes', strictmodes: 'yes', syslogfacility: 'AUTH', usepam: 'no', x11forwarding: 'no' };
// Évalue un sshd_config : { ok, err, eff } ; la première occurrence d'un mot-clé l'emporte (comme sshd).
export function sshdT(text) {
  const seen = {}; const lines = text.split('\n'); let stop = false;
  for (let i = 0; i < lines.length && !stop; i++) {
    const l = lines[i].trim(); if (!l || l.startsWith('#')) continue;
    const m = /^(\S+?)(?:\s*=\s*|\s+)(.*)$/.exec(l); const k = (m ? m[1] : l).toLowerCase(); const v = m ? m[2].trim() : '';
    if (k === 'match') { stop = true; continue; }
    if (!KNOWN.has(k)) return { ok: false, err: `line ${i + 1}: Bad configuration option: ${m ? m[1] : l}` };
    if (!v) return { ok: false, err: `line ${i + 1}: missing argument.` };
    if (BOOL.has(k) && !/^(yes|no)$/i.test(v)) return { ok: false, err: `line ${i + 1}: Bad yes/no argument: ${v}` };
    if (k === 'permitrootlogin' && !/^(yes|no|prohibit-password|without-password|forced-commands-only)$/i.test(v)) return { ok: false, err: `line ${i + 1}: Bad yes/without-password/prohibit-password/forced-commands-only/no argument: ${v}` };
    if (['maxauthtries', 'port', 'logingracetime', 'maxsessions'].includes(k) && !/^\d+$/.test(v)) return { ok: false, err: `line ${i + 1}: Bad number: ${v}` };
    if (!(k in seen)) seen[k] = (k === 'permitrootlogin' ? v.toLowerCase().replace('prohibit-password', 'without-password') : BOOL.has(k) ? v.toLowerCase() : v);
  }
  const eff = { ...DEF, ...seen }; const out = Object.keys(eff).sort().filter(k => eff[k] !== null).map(k => `${k} ${eff[k]}`);
  return { ok: true, eff, out };
}
const ans = (files, key) => { const t = files['reponses.txt']; if (t === undefined) return ''; for (const l of t.split('\n')) if (l.startsWith(key + '=')) return l.slice(key.length + 1).replace(/^\s+|\s+$/g, ''); return ''; };
const wordIn = (text, w) => text.split('\n').some(l => new RegExp('(^|[^A-Za-z0-9_])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^A-Za-z0-9_])').test(l));
const sec = (M, n) => { let p = false; const o = []; for (const l of M.split('\n')) { if (l.startsWith('## ')) { p = l === '## ' + n; continue; } if (p) o.push(l); } return o.join('\n'); };
const words = t => (t.match(/\S+/g) || []).length;

// run_controls : retourne { lines: ['  [OK] …'], n }
export function controls(files) {
  const lines = []; let n = 0; const c = (ok, t) => { lines.push(`  [${ok ? 'OK' : 'KO'}] ${t}`); if (ok) n++; };
  const ip = ans(files, 'ip_attaquante'), acct = ans(files, 'compte'), fpr = ans(files, 'empreinte_cle'), rogue = ans(files, 'cron_malveillant');
  const cfg = files['srv01/etc/ssh/sshd_config']; const r = cfg === undefined ? { ok: false, err: 'Cannot open config' } : sshdT(cfg);
  if (!r.ok) { c(0, `sshd_config invalide (sshd -T) : ${r.err}`); c(0, 'PermitRootLogin non évalué'); c(0, 'MaxAuthTries non évalué'); }
  else { c(r.eff.passwordauthentication === 'no', 'authentification par mot de passe désactivée (sshd -T)'); c(r.eff.permitrootlogin === 'no', 'connexion root interdite (sshd -T)'); c(+r.eff.maxauthtries <= 3, 'MaxAuthTries <= 3 (sshd -T)'); }
  let d = 0, a = 0, i = 0; for (const l of (files['srv01/etc/nftables.conf'] || '').split('\n')) { i++; if (/^[ \t]*#/.test(l)) continue; if (!d && ip && l.includes('ip saddr ' + ip) && /drop/.test(l)) d = i; if (!a && /tcp dport 22 .*accept|tcp dport 22 accept/.test(l)) a = i; }
  c(d > 0 && (a === 0 || d < a), `IP ${ip || '?'} bloquée AVANT la règle d'acceptation du port 22 (nftables)`);
  let nk = 0, bad = 0; const ak = acct ? files[`srv01/home/${acct}/.ssh/authorized_keys`] : undefined;
  if (ak !== undefined) for (const l of ak.split('\n')) { if (!l.trim() || l.startsWith('#')) continue; nk++; if (fingerprint(l)?.fpr === fpr) bad = 1; }
  c(!!fpr && nk >= 1 && !bad, 'clé frauduleuse retirée, clé légitime conservée (ssh-keygen -lf)');
  const cr = acct ? files[`srv01/var/spool/cron/crontabs/${acct}`] : undefined;
  c(!!rogue && cr !== undefined && !cr.includes(rogue) && cr.includes('backup.sh'), 'tâche cron frauduleuse supprimée, sauvegarde légitime conservée');
  lines.push(`RETEST : ${n}/6`); return { lines, n };
}

// Sorties du detecte.sh de l'élève : journal de l'incident, journal de rejeu, rejeu avec seuil élevé.
export async function detectOutputs(variant, files, { Shell, VFS, Stream }) {
  const fs = new VFS(); fs.mkdirp('/w'); fs.mkdirp('/w/srv01/var/log');
  fs.write('/w/srv01/var/log/auth.log', files['srv01/var/log/auth.log'] ?? ''); fs.write('/w/replay.log', variant.replay.log);
  if (files['detecte.sh'] === undefined) return null;
  fs.write('/w/detecte.sh', files['detecte.sh']); fs.f.get('/w/detecte.sh').x = true;
  const sh = new Shell(fs, { home: '/w', cwd: '/w' });
  const run = async cmd => { const o = new Stream(); const io = { in: new Stream(''), out: o, err: new Stream() }; try { await sh.run(cmd, io); } catch { } return o.s.replace(/\n+$/, ''); };
  return { o1: await run('./detecte.sh srv01/var/log/auth.log'), o2: await run('./detecte.sh replay.log'), o3: await run('./detecte.sh replay.log 100000') };
}
const nl = o => o.split('\n').length;
export function check01(def, variant, files, extra = {}) {
  const T = variant.answers; const out = []; let FAIL = false, ANS_OK = true; const say = (k, t) => out.push({ k, t });
  const good = t => say('ok', t), bad = t => { say('ko', t); FAIL = true; };
  const chk = key => { const v = ans(files, key); if (!v) { bad(`${key} : non renseigné`); ANS_OK = false; } else if (sha256(v) === T[key]) good(key); else { bad(`${key} : valeur incorrecte`); ANS_OK = false; } };
  say('phase', '1. PRÉPARER · préserver la preuve');
  const L = files['srv01/var/log/auth.log'];
  if (files['preuves/auth.log'] !== undefined && files['preuves/auth.log'] === L) good("copie de auth.log dans preuves/ (identique à l'original)"); else bad("preuves/auth.log absent ou différent de l'original");
  const SUMS = files['preuves/SHA256SUMS']; let sumsOk = SUMS !== undefined && SUMS.includes('auth.log');
  if (sumsOk) for (const l of SUMS.split('\n').filter(Boolean)) { const m = /^([0-9a-f]{64}) [ *](.+)$/.exec(l); if (!m) continue; const t = files['preuves/' + m[2]]; if (t === undefined || sha256(t) !== m[1]) sumsOk = false; }
  if (sumsOk) good('SHA256SUMS valide (sha256sum -c)'); else bad('preuves/SHA256SUMS absent ou invalide');
  if (sha256(L ?? '') === T._log) good('journal original non altéré'); else bad('le journal original a été modifié');
  say('phase', "2. DÉCOUVRIR / ÉNUMÉRER · quantifier l'attaque"); chk('echecs_total'); chk('ip_attaquante'); chk('echecs_ip');
  say('phase', '3. VALIDER LE RISQUE · tentative ou compromission ?'); chk('compte'); chk('heure_succes'); chk('statut');
  say('phase', "4. CONSERVER LA PREUVE · persistance de l'attaquant"); chk('empreinte_cle'); chk('cron_malveillant');
  say('phase', '5. DÉTECTER · règle de détection rejouable');
  const d = extra.detect;
  if (d && files['detecte.sh'] !== undefined) {
    const ip = ans(files, 'ip_attaquante'); const N1 = (L || '').split('\n').filter(l => l.includes('Failed password') && l.includes(`from ${ip} `)).length; const two = o => o.split('\n')[0].split(/\s+/).slice(0, 2).join(' ');
    if (ANS_OK && nl(d.o1) === 1 && two(d.o1) === `${ip} ${N1}`) good('journal de l\'incident : seule l\'IP attaquante ressort (seuil 10 par défaut)'); else bad("journal de l'incident : attendu une seule ligne 'IP NOMBRE' pour l'attaquant");
    if (nl(d.o2) === 1 && two(d.o2) === `${variant.replay.ip} ${variant.replay.n}`) good('rejeu sur un autre journal : détection correcte, sans faux positif'); else bad(`rejeu sur un autre journal : sortie attendue '${variant.replay.ip} ${variant.replay.n}'`);
    if (d.o3 === '') good('le seuil passé en 2e argument est respecté'); else bad('avec un seuil de 100000, rien ne doit sortir');
  } else bad('detecte.sh absent ou non exécutable (usage : ./detecte.sh FICHIER [SEUIL])');
  say('phase', '6. REMÉDIER / 7. RETESTER · contenir et corriger');
  const ctl = controls(files); for (const l of ctl.lines) say('raw', l.startsWith('RETEST') ? l : '  ' + l);
  if (!(ctl.n === 6 && ANS_OK)) { FAIL = true; if (!ANS_OK) say('ko', 'les contrôles reposent sur vos constats (reponses.txt) : corrigez d\'abord les phases 2 à 4'); }
  const R = files['preuves/retest.txt'];
  if (R !== undefined && R.includes('RETEST : 6/6') && extra.fresh !== false) good('preuves/retest.txt : 6/6, postérieur à la dernière correction'); else bad('lancez ./retest.sh APRÈS vos corrections (preuves/retest.txt doit afficher 6/6)');
  say('phase', '8. RESTITUER · rapport d\'incident');
  const M = files['rapport.md'];
  if (M !== undefined && !M.includes('A COMPLETER')) {
    let okr = true;
    for (const s of ['Faits', 'Interprétation', 'Impact', 'Remédiation', 'Retest']) { const w = words(sec(M, s)); if (w < 15) { okr = false; bad(`section « ${s} » trop courte (${w} mots, 15 minimum)`); } }
    if (okr) good('5 sections renseignées');
    for (const k of ['ip_attaquante', 'compte', 'empreinte_cle']) { const v = ans(files, k); if (!(v && M.includes(v))) { bad(`le rapport doit citer ${k}`); okr = false; } }
    const F = sec(M, 'Faits'); const et = ans(files, 'echecs_total'), ei = ans(files, 'echecs_ip');
    if (et && wordIn(F, et) && wordIn(F, ei)) good('la section Faits cite les chiffres observés'); else bad('la section Faits doit citer echecs_total et echecs_ip');
  } else bad('rapport.md manquant ou contient encore « A COMPLETER »');
  return { ok: !FAIL, lines: out };
}
