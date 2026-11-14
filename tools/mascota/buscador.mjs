// Prueba a Cloudy en el buscador de dominios de la home (components/home/CloudySearch.tsx) y el widget de
// Olabrain: saludo, mirada al escribir, comentarios, titular que lleva al campo, búsqueda vacía, zambullida al
// buscar (el envío al panel se intercepta: no sale nada a panel.cloudin.pro) y móvil.
// Uso: node tools/mascota/buscador.mjs [firefox]   (web servida en :3000) → _inventory/mascota/buscador/
import { chromium, firefox } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const useFx = process.argv[2] === 'firefox';
const ENG = useFx ? 'firefox' : 'chrome';
const OUT = new URL('../../_inventory/mascota/buscador/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const browser = useFx ? await firefox.launch() : await chromium.launch({ channel: 'chrome' });
const results = [];
const ok = (name, pass, info = '') => results.push([pass ? 'OK ' : 'MAL', name, info]);
const errors = [];

async function open(ctxOpts, tag, path = '/') {
  const ctx = await browser.newContext(ctxOpts);
  // el envío del buscador va a panel.cloudin.pro: en la prueba se responde aquí mismo
  await ctx.route('https://panel.cloudin.pro/**', r => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>prueba</p>' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/google|olabrain|Failed to load resource|RSC payload/i.test(m.text())) errors.push(`${tag}: ${m.text()}`); });
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  return { ctx, p };
}
const state = p => p.evaluate(() => {
  const sec = document.querySelector('section[aria-label="Buscar dominio"]');
  const b = sec.querySelector('span[data-show]');
  return { mascot: sec.querySelector('[data-state]')?.getAttribute('data-state'), text: b?.textContent ?? '', shown: b?.getAttribute('data-show') === 'true' };
});
// espía de la mirada: guarda cada llamada a look(x, y) del motor
const spy = p => p.evaluate(() => {
  const api = document.querySelector('section[aria-label="Buscar dominio"] [class*="Mascot_char"]').__mascota;
  window.__looks = [];
  const orig = api.look.bind(api);
  api.look = (x, y) => { window.__looks.push([x, y]); orig(x, y); };
});
const looks = p => p.evaluate(() => window.__looks);

// ---------------- Escritorio ----------------
{
  const { ctx, p } = await open({ viewport: { width: 1440, height: 900 } }, 'escritorio');
  await p.waitForTimeout(2200);
  let st = await state(p);
  ok('Cloudy se asoma encima del buscador y saluda', st.mascot === 'up' && st.shown && /Cómo se llamará/.test(st.text), JSON.stringify(st));
  const engine = await p.evaluate(() => document.querySelector('section[aria-label="Buscar dominio"] [class*="Mascot_char"]').className);
  ok('Motor WebGL cargado', /mascota--webgl/.test(engine), engine);
  await p.screenshot({ path: `${OUT}${ENG}-1-saludo.png`, clip: { x: 0, y: 0, width: 1440, height: 420 } });
  await spy(p);

  // el titular lleva al campo
  await p.locator('label[for="dominio-home"]').click();
  ok('El titular «Encuentra tu dominio» lleva al campo', await p.evaluate(() => document.activeElement?.id) === 'dominio-home');
  await p.waitForTimeout(300);
  st = await state(p);
  ok('Al enfocar, Cloudy invita a escribir', /Escríbelo aquí/.test(st.text), st.text);

  // escribir: comentarios y mirada que sigue al cursor de texto
  await p.keyboard.type('mi negocio', { delay: 40 });
  st = await state(p);
  ok('Con espacios, Cloudy propone guiones', /mi-negocio/.test(st.text), st.text);
  for (let i = 0; i < 10; i++) await p.keyboard.press('Backspace');
  await p.keyboard.type('panaderialola', { delay: 40 });
  await p.waitForTimeout(500);
  st = await state(p);
  ok('Sin extensión, Cloudy sugiere .com', /«panaderialola\.com»/.test(st.text), st.text);
  await p.screenshot({ path: `${OUT}${ENG}-2-escribiendo.png`, clip: { x: 0, y: 0, width: 1440, height: 420 } });
  const ls = await looks(p);
  const box = await p.locator('#dominio-home').boundingBox();
  const last = ls.at(-1), firstX = ls.find(l => l[0] != null)?.[0];
  ok('Cloudy mira al campo mientras escribes', !!last && last[1] > box.y && last[1] < box.y + box.height && last[0] > box.x, JSON.stringify(last));
  ok('…y la mirada avanza con el texto', !!last && last[0] > firstX + 60, `${Math.round(firstX)} → ${Math.round(last?.[0])}`);

  // vaciar y salir: vuelve el saludo y deja de mirar al campo
  await p.fill('#dominio-home', '');
  await p.locator('h2').first().click({ force: true }).catch(() => {});
  await p.evaluate(() => document.activeElement?.blur());
  await p.waitForTimeout(400);
  st = await state(p);
  ok('Campo vacío al salir: vuelve el saludo', /Cómo se llamará/.test(st.text), st.text);
  ok('Al salir, mira otra vez al frente', (await looks(p)).at(-1)?.[0] == null);

  // buscar sin escribir: no se envía
  let popup = false;
  ctx.on('page', () => { popup = true; });
  await p.locator('section[aria-label="Buscar dominio"] input[type="submit"]').click();
  await p.waitForTimeout(500);
  st = await state(p);
  ok('Buscar vacío: no se envía y Cloudy lo pide', !popup && /Primero escribe/.test(st.text) && await p.evaluate(() => document.activeElement?.id) === 'dominio-home', JSON.stringify({ popup, text: st.text }));

  // buscar: se abre otra pestaña y Cloudy se zambulle «a buscarlo» y vuelve
  await p.fill('#dominio-home', 'panaderialola.es');
  const [tab] = await Promise.all([ctx.waitForEvent('page'), p.locator('section[aria-label="Buscar dominio"] input[type="submit"]').click()]);
  await p.waitForTimeout(150);
  st = await state(p);
  ok('Buscar: Cloudy dice «¡Voy a buscarlo!»', /Voy a buscarlo/.test(st.text), st.text);
  await p.waitForTimeout(700);
  st = await state(p);
  const splash = await p.evaluate(() => !!document.querySelector('section[aria-label="Buscar dominio"] [data-splash]'));
  ok('Buscar: Cloudy se zambulle detrás del buscador (y la raya se ondula)', st.mascot === 'down' && splash, JSON.stringify({ ...st, splash }));
  await p.screenshot({ path: `${OUT}${ENG}-3-zambullida.png`, clip: { x: 0, y: 0, width: 1440, height: 420 } });
  ok('Buscar: el panel se abre en otra pestaña', /panel\.cloudin\.pro/.test(tab.url()), tab.url());
  await tab.close();
  await p.waitForTimeout(2200);
  st = await state(p);
  ok('Buscar: Cloudy vuelve y avisa de la pestaña', st.mascot === 'up' && /otra pestaña/.test(st.text), JSON.stringify(st));
  await p.screenshot({ path: `${OUT}${ENG}-4-vuelta.png`, clip: { x: 0, y: 0, width: 1440, height: 420 } });

  // widget de Olabrain
  await p.waitForTimeout(1500);
  const ola = await p.evaluate(() => { const s = document.querySelector('script[src="https://app.olabrain.com/widget.js"]'); return s && s.getAttribute('data-agent'); });
  ok('Widget de Olabrain en la home', ola === '3c1d7f49-2af6-4648-b673-9a4aa6cfd09f', String(ola));
  await ctx.close();
}

// ---------------- Otras páginas: widget presente ----------------
for (const path of ['/academy/', '/contacto/', '/blog/']) {
  const { ctx, p } = await open({ viewport: { width: 1280, height: 800 } }, path, path);
  await p.waitForTimeout(1500);
  const ola = await p.evaluate(() => document.querySelector('script[src="https://app.olabrain.com/widget.js"]')?.getAttribute('data-agent'));
  ok(`Widget de Olabrain en ${path}`, ola === '3c1d7f49-2af6-4648-b673-9a4aa6cfd09f', String(ola));
  await ctx.close();
}

// ---------------- Móvil ----------------
{
  const { ctx, p } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true }, 'móvil');
  await p.waitForTimeout(2200);
  const m = await p.evaluate(() => {
    const sec = document.querySelector('section[aria-label="Buscar dominio"]');
    const b = sec.querySelector('span[data-show]').getBoundingClientRect(), t = sec.querySelector('label').getBoundingClientRect();
    return { bubble: [Math.round(b.left), Math.round(b.right)], titleHidden: t.width === 0, state: sec.querySelector('[data-state]').getAttribute('data-state') };
  });
  ok('Móvil: Cloudy y su burbuja dentro de la pantalla', m.state === 'up' && m.bubble[0] >= 0 && m.bubble[1] <= 390, JSON.stringify(m));
  ok('Móvil: sin titular (no cabe)', m.titleHidden);
  await p.screenshot({ path: `${OUT}${ENG}-m1.png`, clip: { x: 0, y: 0, width: 390, height: 520 } });
  await ctx.close();
}

ok('Sin errores en consola (sin contar el widget externo)', !errors.length, errors.join(' | '));
await browser.close();
for (const x of results) console.log(x[0], x[1], x[2] ? `· ${x[2]}` : '');
console.log(results.some(x => x[0] === 'MAL') ? 'HAY FALLOS' : 'TODO OK');
