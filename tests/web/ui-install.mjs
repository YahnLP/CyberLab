// Test navigateur : page « Lab complet ». Usage : node tests/web/ui-install.mjs [URL]
import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8765/';
const br = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--proxy-server=direct://', '--proxy-bypass-list=*'] });
const pg = await br.newPage({ viewport: { width: 390, height: 800 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
let bad = 0; const ok = (c, m) => { console.log((c ? 'OK ' : 'KO ') + m); if (!c) bad++; };
await pg.goto(BASE); await pg.waitForSelector('.cta-real a');
await pg.click('.cta-real a'); await pg.waitForSelector('.install');
ok((await pg.textContent('h1')).includes('vraie machine'), 'bouton accueil -> page Lab complet');
ok((await pg.locator('.cb').count()) >= 5, 'blocs de commandes présents');
ok((await pg.textContent('.install')).includes('docker compose up --build'), 'commande docker compose');
ok((await pg.textContent('.install')).includes('127.0.0.1:7681:7681'), 'avertissement sécurité du port');
ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'pas de débordement horizontal sur mobile');
await pg.click('.copy >> nth=0'); await pg.waitForFunction(() => document.querySelector('.copy').textContent !== 'Copier', null, { timeout: 3000 }).catch(() => {}); ok(['Copié', 'Sélectionné'].includes(await pg.textContent('.copy >> nth=0')), 'bouton Copier réagit');
await pg.goto(BASE + '#/'); await pg.click('.top nav a[href="#/installer"]'); ok(await pg.isVisible('.install'), 'lien du menu');
ok(errs.length === 0, 'aucune erreur JS' + (errs[0] ? ' : ' + errs[0] : ''));
await br.close(); console.log(bad ? `ECHEC (${bad})` : 'UI Lab complet : OK'); process.exit(bad ? 1 : 0);
