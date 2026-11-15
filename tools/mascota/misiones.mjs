// Prueba las misiones de Cloudy en la home (components/home/Missions.tsx): capturas de la coreografía al
// abrir, cambiar de misión y cerrar, y comprobaciones (vídeo, foco, Esc, móvil, movimiento reducido).
// Uso: node tools/mascota/misiones.mjs [firefox]   (web servida en :3000) → _inventory/mascota/misiones/
import { chromium, firefox } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:3000/';
const useFx = process.argv[2] === 'firefox';
const ENG = useFx ? 'firefox' : 'chrome';
const OUT = new URL('../../_inventory/mascota/misiones/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const browser = useFx ? await firefox.launch() : await chromium.launch({ channel: 'chrome' });
const results = [];
const ok = (name, pass, info = '') => results.push([pass ? 'OK ' : 'MAL', name, info]);
const errors = [];

async function open(ctxOpts, tag) {
  const ctx = await browser.newContext(ctxOpts);
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/google|Failed to load resource|RSC payload/.test(m.text())) errors.push(`${tag}: ${m.text()}`); });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  // la web tiene scroll suave: en la prueba se quita para que Playwright pulse donde está el elemento
  await p.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  return { ctx, p };
}
const bubble = p => p.evaluate(() => {
  const b = document.querySelector('span[data-show]');
  const st = b?.closest('[data-state]')?.getAttribute('data-state');
  return { text: b?.textContent ?? '', shown: b?.getAttribute('data-show') === 'true' && st === 'up', state: st };
});
// Elementos de la sección que se salen de la pantalla sin estar dentro de algo que los recorte (el carrusel).
// (La home ya desbordaba antes por el portfolio y el bloque «Cta»; el body lo oculta. Aquí solo se mira esta sección.)
const sectionOverflow = () => {
  const W = innerWidth, out = [];
  const root = document.querySelector('[class*="Missions_missions"]');
  const clipped = e => { for (let a = e.parentElement; a && a !== root; a = a.parentElement) if (getComputedStyle(a).overflowX !== 'visible') return true; return false; };
  for (const e of root.querySelectorAll('*')) {
    const r = e.getBoundingClientRect();
    if (r.width && (r.right > W + 1 || r.left < -1) && !clipped(e)) out.push(`${e.tagName}.${String(e.className).slice(0, 40)} ${Math.round(r.left)}..${Math.round(r.right)}`);
  }
  return out;
};
const shot = (p, name, clip) => p.screenshot({ path: `${OUT}${ENG}-${name}.png`, ...(clip ? { clip } : {}) });

// ---------------- Escritorio ----------------
{
  const { ctx, p } = await open({ viewport: { width: 1440, height: 900 } }, 'escritorio');
  // llevar la sección a la vista: el personaje sube y saluda
  await p.evaluate(() => { const m = document.querySelector('[class*="Mascot_section"]'); window.scrollTo(0, m.getBoundingClientRect().top + scrollY - 130); });
  await p.waitForTimeout(2600);
  const area = async () => {
    const r = await p.evaluate(() => {
      return { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
    });
    return r;
  };
  let b = await bubble(p);
  ok('Cloudy saluda al asomarse', b.shown && /Hola/.test(b.text), JSON.stringify(b));
  await shot(p, '1-tarjetas', await area());

  // pasar el ratón por la tarjeta de correo: cambia la burbuja y se anima la ventana
  await p.locator('button[class*="Missions_card"]').nth(1).hover();
  await p.waitForTimeout(1200);
  b = await bubble(p);
  ok('Hover: Cloudy cambia lo que dice', /volando/.test(b.text), b.text);
  const prev = await p.evaluate(() => { const v = document.querySelectorAll('[class*="Missions_window"] video')[1]; return { src: v.getAttribute('src'), paused: v.paused, t: v.currentTime }; });
  ok('Hover: la ventana reproduce el vídeo de la misión', prev.src?.includes('cloudy-email') && !prev.paused && prev.t > 0, JSON.stringify(prev));
  await shot(p, '2-hover', await area());

  // elegir «Páginas web»: secuencia de fotogramas
  const clip = await area();
  await p.locator('button[class*="Missions_card"]').nth(0).click();
  const t0 = Date.now();
  for (const ms of [60, 250, 450, 650, 850, 1100, 1500, 2300]) {
    await p.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
    await shot(p, `3-abrir-${String(ms).padStart(4, '0')}`, clip);
  }
  const st = await p.evaluate(() => {
    const v = document.querySelector('[class*="Missions_slot"] video');
    const panel = document.getElementById('mision-panel');
    return {
      panel: !!panel, title: document.getElementById('mision-titulo')?.textContent,
      focus: document.activeElement?.id, video: v && { src: v.getAttribute('src'), paused: v.paused, t: v.currentTime },
      mascot: document.querySelector('[class*="Mascot_section"]').getAttribute('data-state'),
      prices: [...document.querySelectorAll('[class*="Missions_amount"]')].map(e => e.textContent),
      gridHidden: getComputedStyle(document.querySelector('[class*="Missions_grid"]')).visibility,
    };
  });
  ok('Abrir: panel con el título de la misión', st.panel && /despegar/i.test(st.title), st.title);
  ok('Abrir: Cloudy se ha zambullido', st.mascot === 'down', st.mascot);
  ok('Abrir: el vídeo se reproduce', st.video?.src?.includes('cloudy-working') && !st.video.paused && st.video.t > 0, JSON.stringify(st.video));
  ok('Abrir: el foco va al título', st.focus === 'mision-titulo', st.focus);
  ok('Abrir: los precios han terminado de contar', JSON.stringify(st.prices) === JSON.stringify(['39 €', '14,90 €']), JSON.stringify(st.prices));
  ok('Abrir: las tarjetas quedan ocultas', st.gridHidden === 'hidden', st.gridHidden);
  await shot(p, '4-abierto', await area());

  // cambiar a «Correo electrónico» desde las pastillas
  await p.getByRole('button', { name: 'Correo electrónico', exact: true }).click();   // pastilla del panel
  await p.waitForTimeout(1400);
  const sw = await p.evaluate(() => ({ title: document.getElementById('mision-titulo')?.textContent, src: document.querySelector('[class*="Missions_slot"] video')?.getAttribute('src') }));
  ok('Cambiar de misión: título y vídeo nuevos', /sin líos/i.test(sw.title) && sw.src?.includes('cloudy-email'), JSON.stringify(sw));
  await shot(p, '5-correo', await area());

  // pausar el vídeo
  await p.getByRole('button', { name: 'Pausar el vídeo' }).click();
  ok('Botón de pausa', await p.evaluate(() => document.querySelector('[class*="Missions_slot"] video').paused));
  await p.getByRole('button', { name: 'Reproducir el vídeo' }).click();

  // cerrar con Esc: vuelve a la tarjeta de correo (la abierta en ese momento)
  const clip2 = await area();
  await p.keyboard.press('Escape');
  const t1 = Date.now();
  for (const ms of [120, 300, 520, 800, 1300]) {
    await p.waitForTimeout(Math.max(0, ms - (Date.now() - t1)));
    await shot(p, `6-cerrar-${String(ms).padStart(4, '0')}`, clip2);
  }
  await p.mouse.move(700, 40);   // el ratón fuera de las tarjetas: si no, Cloudy habla de la que tiene debajo
  await p.waitForTimeout(1500);
  const back = await p.evaluate(() => ({
    panel: !!document.getElementById('mision-panel'),
    mascot: document.querySelector('[class*="Mascot_section"]').getAttribute('data-state'),
    focus: document.activeElement?.getAttribute('aria-describedby'),
    cards: [...document.querySelectorAll('button[class*="Missions_card"]')].map(c => getComputedStyle(c).opacity),
  }));
  b = await bubble(p);
  ok('Cerrar con Esc: vuelven las tarjetas', !back.panel && back.cards.every(o => o === '1'), JSON.stringify(back.cards));
  ok('Cerrar: Cloudy vuelve a asomarse', back.mascot === 'up', back.mascot);
  ok('Cerrar: el foco vuelve a la tarjeta de la misión abierta', back.focus === 'mision-correo-texto', back.focus);
  ok('Cerrar: Cloudy propone otra misión', b.shown && /otra misión/.test(b.text), b.text);
  await shot(p, '7-vuelta', await area());

  // teclado: Tab hasta una tarjeta y Enter
  await p.locator('button[class*="Missions_card"]').nth(2).focus();
  await p.keyboard.press('Enter');
  await p.waitForTimeout(1600);
  ok('Teclado: Enter abre la misión', /elijan/i.test(await p.evaluate(() => document.getElementById('mision-titulo')?.textContent ?? '')));
  await p.getByRole('button', { name: 'Volver a las misiones' }).click();
  await p.waitForTimeout(1800);
  ok('Botón × vuelve a las tarjetas', !(await p.evaluate(() => !!document.getElementById('mision-panel'))));
  const over = await p.evaluate(sectionOverflow);
  ok('Escritorio: nada de la sección se sale por los lados', over.length === 0, over.join(' | '));
  await ctx.close();
}

// ---------------- Móvil ----------------
{
  // Ventana estrecha con pantalla táctil, sin emular un teléfono: la home desborda a lo ancho por el portfolio y
  // el bloque «Cta» (ya pasaba antes), y en la emulación de teléfono Chrome maqueta entonces a 788 px y las
  // capturas no coinciden con lo que se mide. Ver NOTAS.md, punto 39.
  const { ctx, p } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true }, 'móvil');
  await p.locator('[class*="Missions_head"]').scrollIntoViewIfNeeded();
  await p.waitForTimeout(2400);
  await shot(p, 'm1-tarjetas');
  // llevar el carrusel a la vista y la segunda tarjeta a su centro, y tocarla donde está (como un dedo).
  // (El scroll automático de Playwright no sitúa bien las tarjetas de un carrusel en la emulación móvil.)
  const tapAt = async loc => { const b = await loc.boundingBox(); await p.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); };
  await p.evaluate(() => {
    const g = document.querySelector('[class*="Missions_grid"]');
    window.scrollTo(0, g.getBoundingClientRect().top + scrollY - 140);
    const c = g.children[1]; g.scrollLeft = c.offsetLeft - (g.clientWidth - c.offsetWidth) / 2;
  });
  await p.waitForTimeout(600);
  await tapAt(p.locator('button[class*="Missions_card"]').nth(1));
  await p.waitForTimeout(2400);
  await shot(p, 'm2-abierto');
  const m = await p.evaluate(() => ({ title: document.getElementById('mision-titulo')?.textContent, top: document.getElementById('mision-panel')?.getBoundingClientRect().top }));
  const mo = await p.evaluate(sectionOverflow);
  ok('Móvil: abre la misión de correo', /sin líos/i.test(m.title ?? ''), m.title);
  ok('Móvil: nada de la sección se sale por los lados', mo.length === 0, mo.join(' | '));
  ok('Móvil: el panel queda a la vista', m.top > 0 && m.top < 400, String(Math.round(m.top)));
  await p.evaluate(() => window.scrollBy(0, 700));
  await p.waitForTimeout(300);
  await shot(p, 'm3-planes');
  await p.evaluate(() => document.getElementById('mision-panel').scrollIntoView({ block: 'start' }));
  await p.evaluate(() => window.scrollBy(0, -90));
  await p.waitForTimeout(300);
  await tapAt(p.getByRole('button', { name: 'Volver a las misiones' }));
  await p.waitForTimeout(1800);
  const g = await p.evaluate(() => { const g = document.querySelector('[class*="Missions_grid"]'); const c = g.children[1].getBoundingClientRect(); return { panel: !!document.getElementById('mision-panel'), cardLeft: Math.round(c.left), cardRight: Math.round(c.right) }; });
  ok('Móvil: al cerrar, la tarjeta elegida queda a la vista en el carrusel', !g.panel && g.cardLeft >= 0 && g.cardRight <= 390, JSON.stringify(g));
  await shot(p, 'm4-vuelta');
  await ctx.close();
}

// ---------------- Movimiento reducido ----------------
{
  const { ctx, p } = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, 'reducido');
  await p.locator('[class*="Missions_head"]').scrollIntoViewIfNeeded();
  await p.waitForTimeout(600);
  await p.locator('button[class*="Missions_card"]').nth(0).click();
  await p.waitForTimeout(200);
  const r = await p.evaluate(() => { const v = document.querySelector('[class*="Missions_slot"] video'); return { panel: !!document.getElementById('mision-panel'), paused: v?.paused, prices: [...document.querySelectorAll('[class*="Missions_amount"]')].map(e => e.textContent) }; });
  ok('Reducido: abre al momento, sin reproducir el vídeo y con los precios finales', r.panel && r.paused === true && r.prices[0] === '39 €', JSON.stringify(r));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(1200);
  ok('Reducido: Esc cierra', !(await p.evaluate(() => !!document.getElementById('mision-panel'))));
  await ctx.close();
}

ok('Sin errores en consola', !errors.length, errors.join(' | '));
await browser.close();
for (const x of results) console.log(x[0], x[1], x[2] ? `· ${x[2]}` : '');
console.log(results.some(x => x[0] === 'MAL') ? 'HAY FALLOS' : 'TODO OK');
