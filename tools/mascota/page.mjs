// La sección en la página: contexto (escritorio y móvil), animación al asomarse, CPU en reposo y Firefox.
// Uso: node tools/mascota/page.mjs
import { chromium, firefox } from 'playwright';
import fs from 'node:fs';
const S = '_inventory/mascota'; fs.mkdirSync(S, { recursive: true });
for (const [name, launch] of [['chrome', () => chromium.launch({ channel: 'chrome' })], ['firefox', () => firefox.launch()]]) {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://localhost:3000/', { waitUntil: 'load' });
  // frames de la subida (se asoma al entrar en pantalla)
  const top = await p.evaluate(() => { const r = document.querySelector('section[class*="Mascot_section"]').getBoundingClientRect(); return r.top + scrollY; });
  await p.evaluate(t => scrollTo(0, t - 560), top);
  const sec = p.locator('section[class*="Mascot_section"]');
  const rise = [];
  for (const ms of [60, 260, 480, 1300]) { await p.waitForTimeout(ms - (rise.length ? [60, 260, 480, 1300][rise.length - 1] : 0)); const bb = await sec.boundingBox(); rise.push(`${ms}ms`); await p.screenshot({ path: `${S}/${name}-rise-${ms}.png`, clip: { x: 400, y: bb.y, width: 640, height: bb.height + 4 } }); }
  // contexto: planes arriba, raya y personaje, sección siguiente debajo
  await p.mouse.move(1100, 200, { steps: 3 }); await p.waitForTimeout(900);
  const bb = await sec.boundingBox();
  await p.screenshot({ path: `${S}/${name}-context.png`, clip: { x: 0, y: Math.max(0, bb.y - 330), width: 1440, height: Math.min(900 - Math.max(0, bb.y - 330), bb.height + 560) } });
  // CPU en reposo: frames que pide el motor del personaje (su bucle es el único con «blinkPause») durante
  // 3 s sin mover el ratón (solo deberían aparecer los de algún parpadeo), y al volver a moverlo
  const count = ms => p.evaluate(ms => new Promise(res => {
    let n = 0; const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = cb => { if (/blinkPause/.test(String(cb))) n++; return orig(cb); };
    setTimeout(() => { window.requestAnimationFrame = orig; res(n); }, ms);
  }), ms);
  await p.waitForTimeout(1500);
  const idle = await count(3000);
  const [moving] = await Promise.all([count(500), p.mouse.move(200, 600, { steps: 10 })]);
  console.log(name, '· motor', await p.evaluate(() => document.querySelector('[class*="Mascot_char"]').__mascota?.kind),
    '· frames del personaje: en reposo 3 s →', idle, '| moviendo el ratón 0,5 s →', moving, '· errores:', errs.length ? errs : 'ninguno');
  if (name === 'chrome') {
    const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await m.goto('http://localhost:3000/', { waitUntil: 'load' });
    const t2 = await m.evaluate(() => { const r = document.querySelector('section[class*="Mascot_section"]').getBoundingClientRect(); return r.top + scrollY; });
    await m.evaluate(t => scrollTo(0, t - 420), t2); await m.waitForTimeout(1600);
    await m.screenshot({ path: `${S}/mobile.png` });
    const rm = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const r = await rm.newPage(); await r.goto('http://localhost:3000/', { waitUntil: 'load' });
    const t3 = await r.evaluate(() => { const q = document.querySelector('section[class*="Mascot_section"]').getBoundingClientRect(); return q.top + scrollY; });
    await r.evaluate(t => scrollTo(0, t - 500), t3); await r.waitForTimeout(400);
    await r.mouse.move(100, 100, { steps: 3 }); await r.waitForTimeout(500);
    const rb = await r.locator('section[class*="Mascot_section"]').boundingBox();
    await r.screenshot({ path: `${S}/reduced.png`, clip: { x: 400, y: rb.y, width: 640, height: rb.height + 4 } });
  }
  await b.close();
}
