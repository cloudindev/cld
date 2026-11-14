// Captura las tarjetas de la home con las fotos (motor 2D) y con el 3D, una sobre otra
import { chromium } from 'playwright';
// Uso: node tools/jelly/home.mjs   → _inventory/jelly/home-foto.png y home-3d.png
const S = '_inventory/jelly';
const b = await chromium.launch({ channel: 'chrome' });
for (const mode of ['foto', '3d']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => /jelly/i.test(m.text()) && errs.push(m.text()));
  if (mode === 'foto') await p.route('**/jelly/jelly3d.js', r => r.abort());
  await p.goto('http://localhost:3000/', { waitUntil: 'load' });
  await p.evaluate(() => { const r = document.querySelector('[aria-label="Tipo de hosting"]').getBoundingClientRect(); scrollBy(0, r.top - 120); });
  await p.waitForTimeout(2500);
  const clip = await p.locator('[aria-label="Tipo de hosting"]').boundingBox();
  await p.screenshot({ path: `${S}/home-${mode}.png`, clip });
  console.log(mode, await p.evaluate(() => [...document.querySelectorAll('.jelly')].map(j => j.className.split(' ').filter(c => c.startsWith('jelly--')).join('/')).join(' | ')), errs.filter(e => !/ERR_FAILED|Failed to load/.test(e)).join(' | ') || 'sin errores');
  await ctx.close();
}
await b.close();
