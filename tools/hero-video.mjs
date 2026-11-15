// Prueba el vídeo hero de la home (components/home/VideoHero.tsx, NOTAS.md, punto 35): un solo vídeo en bucle,
// capítulos por tramos de tiempo, salto de capítulo, pausa, bucle, movimiento reducido y móvil.
// Uso: node tools/hero-video.mjs [firefox]   (web servida en :3000) → _inventory/hero/
import { chromium, firefox } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:3000/';
const useFx = process.argv[2] === 'firefox';
const ENG = useFx ? 'firefox' : 'chrome';
const OUT = new URL('../_inventory/hero/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const browser = useFx ? await firefox.launch() : await chromium.launch({ channel: 'chrome' });
const results = [];
const ok = (name, pass, info = '') => results.push([pass ? 'OK ' : 'MAL', name, info]);
const errors = [];

async function open(ctxOpts, tag) {
  const ctx = await browser.newContext(ctxOpts);
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/google|olabrain|Failed to load resource|RSC payload/i.test(m.text())) errors.push(`${tag}: ${m.text()}`); });
  // «load» y no «networkidle»: el vídeo se va descargando mientras se reproduce y la red no queda quieta
  await p.goto(BASE, { waitUntil: 'load' });
  return { ctx, p };
}
const info = p => p.evaluate(() => {
  const sec = document.querySelector('[class*="VideoHero_section"]');
  const v = sec.querySelector('video');
  const chs = [...sec.querySelectorAll('button[class*="VideoHero_chapter"]')];
  return {
    videos: sec.querySelectorAll('video').length, src: v.getAttribute('src'), poster: v.getAttribute('poster'),
    loop: v.loop, muted: v.muted, paused: v.paused, t: Math.round(v.currentTime * 10) / 10,
    current: chs.findIndex(b => b.getAttribute('aria-current') === 'step'),
    fills: chs.map(b => Math.round(parseFloat(/scaleX\(([\d.e-]+)\)/.exec(b.querySelector('[class*="VideoHero_fill"]').style.transform)?.[1] ?? 'NaN') * 100) / 100),
    toggle: sec.querySelector('button[class*="VideoHero_toggle"]').getAttribute('aria-label'),
  };
});
const card = p => p.evaluate(() => { const r = document.querySelector('[class*="VideoHero_card"]').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
const chapter = (p, title) => p.locator('button[class*="VideoHero_chapter"]', { hasText: title }).click();

// ---------------- Escritorio ----------------
{
  const { ctx, p } = await open({ viewport: { width: 1440, height: 900 } }, 'escritorio');
  await p.waitForTimeout(2500);
  let st = await info(p);
  ok('Un solo vídeo, el nuevo, en bucle y sin sonido', st.videos === 1 && st.src === '/video/hero-cloudin.mp4' && st.poster === '/video/hero-cloudin.webp' && st.loop && st.muted, JSON.stringify(st));
  ok('Arranca solo', !st.paused && st.t > 0.5, `t=${st.t}`);
  ok('Capítulo 1 en curso y su barra avanza', st.current === 0 && st.fills[0] > 0 && st.fills[0] < 1 && st.fills.slice(1).every(f => f === 0), JSON.stringify(st.fills));
  await p.screenshot({ path: `${OUT}${ENG}-1-idea.png`, clip: await card(p) });

  await chapter(p, 'Tus clientes te encuentran');
  await p.waitForTimeout(1500);
  st = await info(p);
  ok('Pulsar «Tus clientes te encuentran» salta a su tramo', st.current === 2 && st.t >= 24 && st.t < 27 && !st.paused, `t=${st.t}, capítulo ${st.current + 1}`);
  ok('…con las barras de antes llenas y la de después vacía', st.fills[0] === 1 && st.fills[1] === 1 && st.fills[2] > 0 && st.fills[3] === 0, JSON.stringify(st.fills));
  await p.screenshot({ path: `${OUT}${ENG}-3-clientes.png`, clip: await card(p) });

  await chapter(p, 'La llevamos a la nube');
  await p.waitForTimeout(1200);
  st = await info(p);
  ok('Volver a «La llevamos a la nube»', st.current === 1 && st.t >= 6 && st.t < 9 && st.fills[2] === 0, `t=${st.t}`);
  await p.waitForTimeout(4000);
  await p.screenshot({ path: `${OUT}${ENG}-2-nube.png`, clip: await card(p) });

  await chapter(p, 'Tu negocio crece');
  await p.waitForTimeout(2500);
  st = await info(p);
  ok('Pulsar «Tu negocio crece» salta a su tramo', st.current === 3 && st.t >= 34.1 && st.t < 38, `t=${st.t}`);
  await p.screenshot({ path: `${OUT}${ENG}-4-crece.png`, clip: await card(p) });

  // pausa y vuelta a reproducir
  await p.locator('button[class*="VideoHero_toggle"]').click();
  await p.waitForTimeout(400);
  st = await info(p);
  const t1 = st.t;
  await p.waitForTimeout(800);
  const t2 = (await info(p)).t;
  ok('Pausa', st.paused && t1 === t2 && st.toggle === 'Reproducir vídeo', JSON.stringify({ paused: st.paused, t1, t2, label: st.toggle }));
  await p.locator('button[class*="VideoHero_toggle"]').click();
  await p.waitForTimeout(600);
  ok('Reproducir otra vez', !(await info(p)).paused);

  // bucle: al terminar vuelve al capítulo 1
  await p.evaluate(() => { const v = document.querySelector('[class*="VideoHero_section"] video'); v.currentTime = v.duration - 0.6; });
  await p.waitForTimeout(2000);
  st = await info(p);
  ok('Al terminar, vuelve a empezar (capítulo 1)', st.current === 0 && st.t < 2 && !st.paused && st.fills.slice(1).every(f => f === 0), JSON.stringify({ t: st.t, current: st.current, fills: st.fills }));

  // los 4 clips anteriores ya no están
  const gone = await p.evaluate(async () => (await Promise.all([1, 2, 3, 4].map(n => fetch(`/video/section${n}.mp4`, { method: 'HEAD' })))).map(r => r.status));
  ok('Los 4 clips anteriores ya no se publican', gone.every(s => s === 404), gone.join(','));
  await ctx.close();
}

// ---------------- Movimiento reducido: no arranca solo ----------------
{
  const { ctx, p } = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, 'reducido');
  await p.waitForTimeout(2000);
  const st = await info(p);
  ok('Reducido: no arranca solo; se ve el póster y el botón de reproducir', st.paused && st.t === 0 && st.toggle === 'Reproducir vídeo', JSON.stringify({ paused: st.paused, t: st.t, toggle: st.toggle }));
  await ctx.close();
}

// ---------------- Móvil ----------------
{
  const { ctx, p } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true }, 'móvil');
  await p.waitForTimeout(2000);
  const st = await info(p);
  ok('Móvil: se reproduce', !st.paused && st.t > 0.3, `t=${st.t}`);
  const titles = await p.evaluate(() => [...document.querySelectorAll('[class*="VideoHero_title"]')].filter(e => getComputedStyle(e).opacity === '1').map(e => e.textContent));
  ok('Móvil: solo se ve el título del capítulo actual', titles.length === 1 && titles[0] === 'Tienes una idea', JSON.stringify(titles));
  for (const [t, name] of [[3, 'idea'], [14, 'nube'], [27, 'clientes'], [40, 'crece']]) {
    await p.evaluate(t => { document.querySelector('[class*="VideoHero_section"] video').currentTime = t; }, t);
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}${ENG}-m-${name}.png`, clip: await card(p) });
  }
  await ctx.close();
}

ok('Sin errores en consola', !errors.length, errors.join(' | '));
await browser.close();
for (const x of results) console.log(x[0], x[1], x[2] ? `· ${x[2]}` : '');
console.log(results.some(x => x[0] === 'MAL') ? 'HAY FALLOS' : 'TODO OK');
