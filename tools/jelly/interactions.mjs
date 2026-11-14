// Pruebas de interacción en la home con el motor 3D: reposo, hover, arrastre, vuelta, rendimiento, móvil y Firefox
import { chromium, firefox } from 'playwright';
// Uso: node tools/jelly/interactions.mjs   → capturas int-*.png en _inventory/jelly/
const S = '_inventory/jelly';
for (const [name, launch] of [['chrome', () => chromium.launch({ channel: 'chrome' })], ['firefox', () => firefox.launch()]]) {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => /jelly/i.test(m.text()) && errs.push(m.text()));
  await p.goto('http://localhost:3000/', { waitUntil: 'load' });
  await p.evaluate(() => { const r = document.querySelector('[aria-label="Tipo de hosting"]').getBoundingClientRect(); scrollBy(0, r.top - 120); });
  await p.waitForTimeout(2500);
  const clip = await p.locator('[aria-label="Tipo de hosting"]').boundingBox();
  await p.screenshot({ path: `${S}/int-${name}-rest.png`, clip });
  const sel = () => p.evaluate(() => document.querySelector('[role=tab][aria-selected=true]').id);
  if (name === 'chrome') {
    const out = [];
    for (const [id, fx] of [['web', 0.8], ['vps', 0.82]]) {
      const card = await p.locator('#pp-tab-' + id).boundingBox();
      const sx = card.x + card.width * fx, sy = card.y + card.height * 0.45;
      await p.mouse.move(sx, sy); await p.waitForTimeout(150);
      out.push(`${id} cursor=${await p.evaluate(i => document.querySelector('#pp-tab-' + i).style.cursor, id)}`);
      await p.mouse.down();
      await p.evaluate(() => { window.__f = 0; const t = () => { window.__f++; requestAnimationFrame(t); }; requestAnimationFrame(t); });
      const t0 = Date.now();
      for (let i = 1; i <= 12; i++) { await p.mouse.move(sx - i * 30, sy - i * 8); await p.waitForTimeout(16); }
      await p.screenshot({ path: `${S}/int-${id}-drag.png`, clip });
      for (let i = 1; i <= 12; i++) { await p.mouse.move(sx - 360 + i * 12, sy - 96 + i * 14); await p.waitForTimeout(16); }
      out.push(`fps≈${Math.round((await p.evaluate(() => window.__f)) / (Date.now() - t0) * 1000)}`);
      await p.mouse.up(); await p.waitForTimeout(140);
      await p.screenshot({ path: `${S}/int-${id}-drop.png`, clip });
      await p.waitForTimeout(1500);
      out.push(`sel tras arrastre=${await sel()}`);
    }
    await p.screenshot({ path: `${S}/int-moved.png`, clip });
    await p.click('#pp-tab-vps', { position: { x: 60, y: 60 } }); await p.waitForTimeout(2000);
    out.push(`clic vps → sel=${await sel()} web movida=${await p.evaluate(() => document.querySelector('#pp-tab-web .jelly').__jelly3d.moved)}`);
    await p.click('#pp-tab-web', { position: { x: 60, y: 60 } }); await p.waitForTimeout(2000);
    out.push(`clic web → sel=${await sel()} vps movida=${await p.evaluate(() => document.querySelector('#pp-tab-vps .jelly').__jelly3d.moved)}`);
    await p.screenshot({ path: `${S}/int-reset.png`, clip });
    await p.click('#pp-tab-web .btn-sm'); await p.waitForTimeout(600);
    out.push(`ver planes ok scrollY=${await p.evaluate(() => Math.round(scrollY))}`);
    console.log(out.join(' · '));
    const mp = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await mp.goto('http://localhost:3000/', { waitUntil: 'load' });
    await mp.evaluate(() => { const r = document.querySelector('[aria-label="Tipo de hosting"]').getBoundingClientRect(); scrollBy(0, r.top - 80); });
    await mp.waitForTimeout(2500);
    await mp.screenshot({ path: `${S}/int-mobile.png`, clip: await mp.locator('[aria-label="Tipo de hosting"]').boundingBox() });
    const lp = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await lp.goto('http://localhost:3000/iniciar-sesion/', { waitUntil: 'load' }); await lp.waitForTimeout(2200);
    await lp.screenshot({ path: `${S}/int-login.png`, clip: { x: 0, y: 60, width: 1440, height: 700 } });
  }
  console.log(name, errs.length ? errs.slice(0, 5) : 'sin errores');
  await b.close();
}
