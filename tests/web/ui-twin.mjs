// Test navigateur : mission SIM03-1 (outils simulés, Vue du lab, Web, correction). Usage : node tests/web/ui-twin.mjs [URL]
import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('playwright');
import { build, TW } from '../../site/js/missions.js';
const BASE = process.argv[2] || 'http://127.0.0.1:8765/';
const br = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--proxy-server=direct://', '--proxy-bypass-list=*'] });
const pg = await br.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && !/ERR_NAME_NOT_RESOLVED|ERR_INTERNET|ERR_CONNECTION|formaxionlandes/.test(m.text()) && errs.push(m.text()));
let bad = 0; const ok = (c, m) => { console.log((c ? 'OK ' : 'KO ') + m); if (!c) bad++; };
const run = async (l, w = 350) => { await pg.fill('#term input', l); await pg.press('#term input', 'Enter'); await pg.waitForTimeout(w); };
await pg.goto(BASE); await pg.waitForSelector('.group');
ok((await pg.textContent('#parcours')).includes('Parcours pentest'), 'groupe « Parcours pentest » sur l\'accueil');
await pg.goto(BASE + '#/defi/SIM03-1'); await pg.waitForSelector('#term input');
ok((await pg.textContent('#def-title')).includes('hôtes actifs'), 'mission SIM03-1 ouverte');
const seed = await pg.evaluate(() => JSON.parse(localStorage.getItem('cyberlab.v1')).work['SIM03-1'].seed); const b = build(TW['SIM03-1'], seed); const tw = b.tw;
await run('cat inventaire.csv | head -3'); ok((await pg.textContent('#term')).includes('hote;ip;role'), 'inventaire.csv fourni');
await run(`nmap -sn ${tw.net}.0/24`, 700); const t = await pg.textContent('#term'); ok(t.includes('Nmap done: 256 IP addresses'), 'nmap -sn répond au format de nmap');
await pg.click('[data-ptab=lab]'); ok((await pg.textContent('[data-ppane=lab]')).includes('Balayage de découverte'), 'Vue du lab : le balayage est vu côté défense');
ok(Number(await pg.textContent('#lcount')) >= 1, 'compteur d\'alertes');
await pg.click('[data-ptab=web]'); await pg.click('#webform button'); await pg.waitForTimeout(300); ok((await pg.textContent('#webout')).includes('HTTP/1.1 200 OK'), 'panneau Web : réponse du serveur fictif');
await run(`host www.${tw.domain}`); ok((await pg.textContent('#term')).includes('has address'), 'host répond');
await pg.click('[data-ptab=comprendre]'); ok((await pg.textContent('[data-ppane=comprendre]')).toLowerCase().includes('host'), 'Comprendre explique host');
const facts = { hotes_actifs: tw.hosts.filter(h => h.up && !h.self).length, hote_inconnu: tw.hosts.find(h => h.shadow).ip, hote_absent: tw.hosts.find(h => !h.up).name };
const enonce = await pg.textContent('#enonce-body'); const letter = enonce.split('\n').find(l => /^\s+[abc]\) Identifier/.test(l)).trim()[0];
const rep = Object.entries({ ...facts, defense: letter }).map(([k, v]) => `${k}=${v}`).join('\\n');
await run(`printf '${rep}\\n' > reponses.txt`); await run('defi valider', 800);
const t2 = await pg.textContent('#term'); ok(/DÉFI RÉUSSI/.test(t2), 'mission validée sur les faits du jumeau');
await pg.reload(); await pg.waitForSelector('#term input'); const seed2 = await pg.evaluate(() => JSON.parse(localStorage.getItem('cyberlab.v1')).work['SIM03-1'].seed); ok(seed2 === seed, 'la plage est la même après rechargement');

// SIM01-2 de bout en bout dans le terminal : scan redirigé, empreinte, validation, puis preuve modifiée refusée
await pg.goto(BASE + '#/defi/SIM01-2'); await pg.waitForSelector('#term input');
const seedP = await pg.evaluate(() => JSON.parse(localStorage.getItem('cyberlab.v1')).work['SIM01-2'].seed); const bp = build(TW['SIM01-2'], seedP);
await run(`nmap -sV ${bp.tw.H.www.ip} > preuve-scan.txt`, 700); await run('sha256sum preuve-scan.txt', 500);
const hash = /([0-9a-f]{64})\s+preuve-scan\.txt/.exec(await pg.textContent('#term'))[1]; ok(!!hash, 'sha256sum affiche une empreinte de 64 caractères');
await run('grep -c open preuve-scan.txt', 400); await pg.waitForFunction(() => document.querySelector('#enonce-body')?.textContent.includes('Scellez la preuve')); const enP = await pg.textContent('#enonce-body'); const lp = enP.split('\n').find(l => /^\s+[abc]\) Calculer/.test(l)).trim()[0];
const nb = bp.tw.H.www.ports.length;
await run(`printf 'nb_ports_ouverts=${nb}\\nempreinte=${hash}\\ndefense=${lp}\\n' > reponses.txt`); await run('defi valider', 800); ok(/DÉFI RÉUSSI/.test(await pg.textContent('#term')), 'SIM01-2 validée avec une preuve scellée');
await run('echo "retouche" >> preuve-scan.txt'); await run('defi valider', 800); ok(!/ \.\.\.DÉFI RÉUSSI[\s\S]*$/.test('') && (await pg.textContent('#term')).lastIndexOf('empreinte : valeur incorrecte') > (await pg.textContent('#term')).lastIndexOf('DÉFI RÉUSSI'), 'preuve modifiée après scellage : empreinte refusée');
ok(errs.length === 0, 'aucune erreur JS' + (errs[0] ? ' : ' + errs[0] : ''));
await br.close(); console.log(bad ? `ECHEC (${bad})` : 'UI jumeau numérique : OK'); process.exit(bad ? 1 : 0);
