// Prueba el rebote de las piezas de gominola al llegar el ratón a su tarjeta (home, «Hosting Web» y «Hosting
// VPS»; NOTAS.md, punto 34). Es un saludo: rebota al entrar en el bloque de tarjetas desde fuera, pero no al
// pasar de una tarjeta a otra, ni al salir y volver enseguida, ni mientras se juega con la pieza (y 5 s
// después). Agarrar la pieza a mitad de rebote lo desvanece. Ni en táctil ni con «movimiento reducido».
// Uso: node tools/jelly/rebote.mjs [firefox]   (web servida en :3000)
import { chromium, firefox } from 'playwright';

const BASE = 'http://localhost:3000/';
const useFx = process.argv[2] === 'firefox';
const browser = useFx ? await firefox.launch() : await chromium.launch({ channel: 'chrome' });
const results = [];
const ok = (name, pass, info = '') => results.push([pass ? 'OK ' : 'MAL', name, info]);
const errors = [];
const OUT = [700, 40];   // fuera del bloque de tarjetas

async function open(ctxOpts, tag) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...ctxOpts });
  await ctx.route('**/video/hero-cloudin.mp4', r => r.abort());   // el vídeo hero no hace falta aquí
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/google|olabrain|Failed to load resource|RSC payload/i.test(m.text())) errors.push(`${tag}: ${m.text()}`); });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.evaluate(() => { const r = document.querySelector('[aria-label="Tipo de hosting"]').getBoundingClientRect(); scrollBy(0, r.top - 120); });
  await p.waitForFunction(() => [...document.querySelectorAll('[role=tab] .jelly')].every(j => j.__jelly3d), null, { timeout: 15000 });
  await p.mouse.move(...OUT);
  await p.waitForTimeout(700);
  // cuenta los rebotes que llegan a empezar en cada pieza
  await p.evaluate(() => {
    window.__hops = { web: 0, vps: 0 };
    for (const tab of document.querySelectorAll('[role=tab]')) {
      const id = tab.id.replace('pp-tab-', ''), j = tab.querySelector('.jelly').__jelly3d, orig = j.hop.bind(j);
      j.hop = () => { const before = !!j.hopping; orig(); if (!before && j.hopping) window.__hops[id]++; };
    }
  });
  return { ctx, p };
}
const hops = p => p.evaluate(() => ({ ...window.__hops }));
const textPoint = async (p, id) => { const b = await p.locator('#pp-tab-' + id).boundingBox(); return [b.x + 110, b.y + b.height - 50]; };
const piecePoint = async (p, id) => { const b = await p.locator(`#pp-tab-${id} .jelly`).boundingBox(); return [b.x + b.width * 0.5, b.y + b.height * 0.45]; };
// sigue el rebote de una pieza durante `ms`: altura máxima y cuándo termina
const follow = (p, id, ms) => p.evaluate(([id, ms]) => new Promise(res => {
  const j = document.querySelector(`#pp-tab-${id} .jelly`).__jelly3d, t0 = performance.now();
  let max = 0, seen = !!j.hopping, end = 0;
  const f = () => {
    const s = j.hopping;
    if (s) { seen = true; max = Math.max(max, s.h); } else if (seen && !end) end = performance.now() - t0;
    if (performance.now() - t0 < ms) requestAnimationFrame(f); else res({ seen, max: +max.toFixed(3), end: Math.round(end) });
  };
  requestAnimationFrame(f);
}), [id, ms]);

// ---------------- Ratón ----------------
{
  const { ctx, p } = await open({}, 'ratón');
  // llegar desde fuera
  const run = follow(p, 'web', 1400);
  await p.mouse.move(...await textPoint(p, 'web'), { steps: 2 });
  const r = await run;
  ok('Llegar a «Hosting Web»: su pieza rebota y queda quieta', r.seen && r.max > 0.05 && r.end > 400 && r.end < 1300, JSON.stringify(r));
  ok('…la otra pieza no se mueve', (await hops(p)).vps === 0);

  // pasar a la otra tarjeta, salir y volver enseguida: nada
  await p.mouse.move(...await textPoint(p, 'vps'), { steps: 8 });
  await p.waitForTimeout(400);
  ok('Pasar de una tarjeta a otra no hace rebotar', (await hops(p)).vps === 0, JSON.stringify(await hops(p)));
  await p.mouse.move(...OUT, { steps: 3 }); await p.waitForTimeout(1200);
  await p.mouse.move(...await textPoint(p, 'vps'), { steps: 3 }); await p.waitForTimeout(400);
  ok('Salir y volver enseguida no hace rebotar', (await hops(p)).vps === 0);

  // jugar con la ventana: arrastrar y soltar; salir 3,5 s y volver a su tarjeta → nada (se ha jugado hace poco)
  const [wx, wy] = await piecePoint(p, 'web');
  await p.mouse.move(wx, wy, { steps: 6 }); await p.mouse.down();
  for (let i = 1; i <= 10; i++) { await p.mouse.move(wx - i * 20, wy - i * 5); await p.waitForTimeout(16); }
  await p.mouse.up(); await p.waitForTimeout(300);
  await p.mouse.move(...OUT, { steps: 3 }); await p.waitForTimeout(3500);
  await p.mouse.move(...await textPoint(p, 'web'), { steps: 3 }); await p.waitForTimeout(400);
  ok('Después de jugar con la pieza no rebota (aunque se salga y se vuelva)', (await hops(p)).web === 1, JSON.stringify(await hops(p)));
  // …pero la otra, con la que no se ha jugado, sí saluda si se llega tras un rato fuera
  await p.mouse.move(...OUT, { steps: 3 }); await p.waitForTimeout(3300);
  await p.mouse.move(...await textPoint(p, 'vps'), { steps: 3 }); await p.waitForTimeout(400);
  ok('Al volver tras un rato fuera, la pieza con la que no se ha jugado saluda', (await hops(p)).vps === 1, JSON.stringify(await hops(p)));

  // agarrar a mitad de rebote: se desvanece sin saltos (antes, la ventana vuelve a su sitio: se había arrastrado)
  await p.evaluate(() => document.querySelector('#pp-tab-web .jelly').__jelly3d.reset());
  await p.mouse.move(...OUT, { steps: 3 }); await p.waitForTimeout(5600);   // pasa el tiempo de juego de la ventana
  await p.mouse.move(...await textPoint(p, 'web'), { steps: 2 });
  await p.waitForTimeout(150);
  const mid = await p.evaluate(() => document.querySelector('#pp-tab-web .jelly').__jelly3d.hopping);
  const [px, py] = await piecePoint(p, 'web');
  await p.mouse.move(px, py, { steps: 2 }); await p.mouse.down(); await p.waitForTimeout(350);
  const after = await p.evaluate(() => document.querySelector('#pp-tab-web .jelly').__jelly3d.hopping);
  await p.mouse.up();
  ok('Al volver más de 5 s después de jugar, vuelve a saludar', !!mid, JSON.stringify(mid));
  ok('Agarrar la pieza a mitad de rebote lo desvanece', !!mid && after === null, JSON.stringify({ mid, after }));
  await ctx.close();
}

// ---------------- Táctil y movimiento reducido: sin rebote ----------------
{
  const { ctx, p } = await open({ hasTouch: true }, 'táctil');
  await p.touchscreen.tap(...await textPoint(p, 'vps'));
  await p.waitForTimeout(500);
  ok('Táctil: al tocar la tarjeta no rebota (se elige)', (await hops(p)).vps === 0 && await p.evaluate(() => document.querySelector('[role=tab][aria-selected=true]').id) === 'pp-tab-vps');
  await ctx.close();
}
{
  const { ctx, p } = await open({ reducedMotion: 'reduce' }, 'reducido');
  const run = follow(p, 'web', 700);
  await p.mouse.move(...await textPoint(p, 'web'), { steps: 2 });
  ok('Movimiento reducido: no rebota', !(await run).seen);
  await ctx.close();
}

ok('Sin errores en consola', !errors.length, errors.join(' | '));
await browser.close();
for (const r of results) console.log(r[0], r[1], r[2] ? `· ${r[2]}` : '');
console.log(results.some(r => r[0] === 'MAL') ? 'HAY FALLOS' : 'TODO OK');
