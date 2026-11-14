// Reproduce y comprueba cuándo se abre el desplegable de Hosting en escritorio, y la estructura del menú
// (Academy es un enlace a la derecha, junto a «Iniciar sesión»; ya no tiene submenú).
// Uso: node tools/header/menus.mjs [firefox]
import { chromium, firefox } from 'playwright';
const useFx = process.argv[2] === 'firefox';
const b = useFx ? await firefox.launch() : await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:3000/', { waitUntil: 'load' });
await p.waitForTimeout(500);
const state = () => p.evaluate(() => {
  // ABIERTO = visible y recoge el ratón · cerrándose = desvaneciéndose sin recoger el ratón · fantasma = medio
  // visible y recogiendo el ratón (el fallo: al pasar por su zona se vuelve a abrir)
  const vis = sel => {
    const el = [...document.querySelectorAll(sel)].find(e => e.getBoundingClientRect().width > 0); if (!el) return 'no existe';
    const cs = getComputedStyle(el), live = cs.pointerEvents !== 'none';
    if (cs.visibility !== 'visible' || +cs.opacity <= 0.02) return 'cerrado';
    if (+cs.opacity > 0.5 && live) return 'ABIERTO';
    return live ? 'fantasma' : 'cerrándose';
  };
  return { hosting: vis('[class*="Header_hostingMenu"]') };
});
const pos = async text => { const bb = await p.locator('header a:visible', { hasText: new RegExp('^' + text) }).first().boundingBox(); return { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2, bb }; };
const H = await pos('Hosting'), D = await pos('Dominios'), C = await pos('Páginas Web'), K = await pos('Seguridad');
// estructura: ítems del menú y, a la derecha, Academy (enlace externo) e «Iniciar sesión»
const nav = await p.evaluate(() => ({
  items: [...document.querySelectorAll('#primary-nav > li > a')].map(a => a.textContent.trim()),
  right: [...document.querySelectorAll('[class*="Header_actions"] a')].map(a => [a.textContent.trim(), a.getAttribute('href'), a.target || '']),
  submenusAcademy: document.querySelectorAll('[class*="megamenu"]').length,
}));
console.log('menú:', JSON.stringify(nav));
const panel = await p.evaluate(() => { const el = document.querySelector('[class*="Header_hostingMenu"]'); const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
console.log('panel Hosting (cerrado):', JSON.stringify(panel));
const results = [];
const check = async (name, fn, expect) => {
  await p.mouse.move(1300, 700); await p.waitForTimeout(1200);   // estado limpio: ratón lejos, todo cerrado
  await fn();
  const st = await state();
  // «cerrado» admite «cerrándose» (el desvanecimiento de 0,85 s del tema); 1 s después tiene que estar cerrado del todo
  let ok = Object.entries(expect).every(([k, v]) => st[k] === v || (v === 'cerrado' && st[k] === 'cerrándose'));
  let after = '';
  if (ok && Object.values(expect).includes('cerrado')) {
    await p.waitForTimeout(1000); const st2 = await state();
    ok = Object.entries(expect).every(([k, v]) => v !== 'cerrado' || st2[k] === 'cerrado'); after = ' → 1 s después ' + JSON.stringify(st2);
  }
  results.push([ok ? 'OK ' : 'MAL', name, JSON.stringify(st) + after]);
};
// 1) pasar por Hosting y bajar enseguida a la zona donde estaba el panel (debajo de Dominios / Cloud)
await check('Hosting → bajar en 0,3 s a la página bajo «Páginas Web» (fuera del menú)', async () => {
  await p.mouse.move(H.x, H.y, { steps: 3 }); await p.waitForTimeout(400);
  await p.mouse.move(C.x + 40, H.y + 60, { steps: 2 }); await p.waitForTimeout(80);
  await p.mouse.move(C.x + 60, H.y + 260, { steps: 6 }); await p.waitForTimeout(250);
}, { hosting: 'cerrado' });
// 2) cruzar el menú en horizontal desde Contacto hasta el logo pasando por debajo de los ítems
await check('Barrer de derecha a izquierda 60 px por debajo del menú', async () => {
  await p.mouse.move(K.x, K.y + 60); await p.waitForTimeout(100);
  await p.mouse.move(200, K.y + 60, { steps: 25 }); await p.waitForTimeout(300);
}, { hosting: 'cerrado' });
// 3) pasar el ratón de largo por encima de «Hosting» (bajando desde arriba hacia la página)
await check('Pasar de largo sobre «Hosting» camino de la página', async () => {
  await p.mouse.move(H.x, 5); await p.waitForTimeout(100);
  await p.mouse.move(H.x, H.y + 400, { steps: 6 }); await p.waitForTimeout(120);
}, { hosting: 'cerrado' });
// 5) uso normal: abrir Hosting y bajar al panel hasta «Hosting GPU»: debe seguir abierto
await check('Uso normal: Hosting → bajar dentro del panel', async () => {
  await p.mouse.move(H.x, H.y, { steps: 3 }); await p.waitForTimeout(400);
  const gpu = await p.locator('header a:visible', { hasText: /^Hosting GPU$/ }).first().boundingBox();
  await p.mouse.move(gpu.x + 20, gpu.y + gpu.height / 2, { steps: 8 }); await p.waitForTimeout(400);
}, { hosting: 'ABIERTO' });
// 7) clic en un enlace del panel (navegación sin recargar): luego ratón lejos → el panel no debe quedarse abierto
await check('Clic en «Hosting Web» del panel y ratón fuera', async () => {
  await p.mouse.move(H.x, H.y, { steps: 3 }); await p.waitForTimeout(400);
  const web = await p.locator('header a:visible', { hasText: /^Hosting Web$/ }).first().boundingBox();
  await p.mouse.move(web.x + 20, web.y + web.height / 2, { steps: 6 }); await p.waitForTimeout(200);
  await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(1500);
  await p.mouse.move(1300, 700, { steps: 4 }); await p.waitForTimeout(1200);
}, { hosting: 'cerrado' });
// 8) clic en «Hosting» (ítem principal) y ratón fuera
await check('Clic en «Hosting» y ratón fuera', async () => {
  await p.goto('http://localhost:3000/', { waitUntil: 'load' }); await p.waitForTimeout(400);
  await p.mouse.move(H.x, H.y, { steps: 3 }); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(1500);
  await p.mouse.move(1300, 700, { steps: 4 }); await p.waitForTimeout(1200);
}, { hosting: 'cerrado' });
// 9) teclado: tabular hasta «Hosting» debe abrir el panel (accesibilidad)
await check('Teclado: Tab hasta «Hosting» abre el panel', async () => {
  await p.goto('http://localhost:3000/', { waitUntil: 'load' }); await p.waitForTimeout(400);
  await p.mouse.move(1300, 700);
  await p.evaluate(() => document.body.focus());
  for (let i = 0; i < 40; i++) { await p.keyboard.press('Tab'); const t = await p.evaluate(() => document.activeElement?.textContent?.trim()); if (t === 'Hosting') break; }
  await p.waitForTimeout(500);
}, { hosting: 'ABIERTO' });
for (const r of results) console.log(r.join('  '));
console.log(results.every(r => r[0] === 'OK ') ? 'todo bien' : `${results.filter(r => r[0] !== 'OK ').length} casos mal`);
await b.close();
