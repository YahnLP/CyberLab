// Test navigateur : panneau « Base SQL » de SIM15. Usage : node tests/web/ui-sql.mjs [URL]
import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8765/';
const br = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--proxy-server=direct://', '--proxy-bypass-list=*'] });
const pg = await br.newPage({ viewport: { width: 390, height: 800 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
let bad = 0; const ok = (c, m) => { console.log((c ? 'OK ' : 'KO ') + m); if (!c) bad++; };
const go = async v => { await pg.fill('#sqlin', v); await pg.click('#sqlform button'); await pg.waitForTimeout(400); return pg.textContent('#sqlout'); };
await pg.goto(BASE + '#/defi/SIM03-1'); await pg.waitForSelector('#term input');
ok(await pg.locator('[data-ptab=sql]').count() === 0, 'pas d\'onglet Base SQL hors SIM15');
await pg.goto(BASE + '#/defi/SIM15-2'); await pg.waitForSelector('#term input'); await pg.reload(); await pg.waitForSelector('#term input');
await pg.click('[data-ptab=sql]');
let t = await go('1'); ok(t.includes('1 ligne(s)') && t.includes('visible = 1'), 'id=1 : une ligne, requête affichée');
t = await go("1'"); ok(t.includes('Erreur 500') && t.includes('SQL syntax'), 'une apostrophe provoque une erreur SQL');
const n = (await go('1 OR 1=1')).match(/(\d+) ligne\(s\)/); ok(n && Number(n[1]) >= 5, 'OR 1=1 renvoie plusieurs lignes');
t = await go('1 OR 1=1 -- '); ok(t.includes('commentaire') && /6 ligne\(s\)/.test(t), 'le commentaire retire le filtre et révèle la ligne cachée (6 lignes)');
await pg.click('[data-ptab=lab]'); ok((await pg.textContent('[data-ppane=lab]')).includes('SQL'), 'la vue du lab (défense) voit les charges SQL');
ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'pas de débordement horizontal sur mobile');
ok(errs.length === 0, 'aucune erreur JS' + (errs[0] ? ' : ' + errs[0] : ''));
await br.close(); console.log(bad ? `ECHEC (${bad})` : 'UI Base SQL : OK'); process.exit(bad ? 1 : 0);
