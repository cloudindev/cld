// Comprueba lo interactivo de Academy en un navegador real: enlace del menú y del footer, filtro de
// «Las que más resuelven», buscador, pestañas, índice con la sección activa, valoración, copiar y la
// tabla en móvil. Uso: node tools/academy/interactions.mjs [firefox]   (con la web servida en :3000)
import { chromium, firefox } from 'playwright';

const BASE = 'http://localhost:3000';
const useFx = process.argv[2] === 'firefox';
const browser = useFx ? await firefox.launch() : await chromium.launch({ channel: 'chrome' });
const results = [];
const ok = (name, pass, info = '') => results.push([pass ? 'OK ' : 'MAL', name, info]);
const errors = [];
const watch = (page, tag) => {
  page.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
  // los recursos que fallan se apuntan con su dirección (la página 404 de la prueba es intencionada)
  page.on('console', m => { if (m.type() === 'error' && !/googletagmanager|gtag|Failed to load resource/.test(m.text())) errors.push(`${tag}: ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400 && !r.url().includes('/academy/no-existe/') && !/google/.test(r.url())) errors.push(`${tag}: ${r.status()} ${r.url()}`); });
};

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
// el vídeo hero (44 s) mantiene la red ocupada mientras se reproduce y aquí no hace falta: sin él, «networkidle» llega
await ctx.route('**/video/hero-cloudin.mp4', r => r.abort());
if (!useFx) await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
const p = await ctx.newPage();
watch(p, 'escritorio');

// ---- Menú y footer
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
const header = await p.evaluate(() => {
  const a = [...document.querySelectorAll('[class*="Header_actions"] a')].find(x => x.textContent.trim().startsWith('Academy'));
  return a && { href: a.getAttribute('href'), target: a.target, arrow: !!a.querySelector('svg') };
});
ok('Menú: Academy → /academy/, misma pestaña, con flecha', header?.href === '/academy/' && header.target === '' && header.arrow, JSON.stringify(header));
const footer = await p.evaluate(() => {
  const a = [...document.querySelectorAll('footer a')].find(x => x.textContent.trim() === 'Academy');
  return a && { href: a.getAttribute('href'), target: a.target };
});
ok('Footer: Academy → /academy/, misma pestaña', footer?.href === '/academy/' && footer.target === '', JSON.stringify(footer));
await p.locator('[class*="Header_actions"] a', { hasText: 'Academy' }).click();
await p.waitForURL('**/academy/');
ok('Clic en Academy abre /academy/ en la misma pestaña', new URL(p.url()).pathname === '/academy/', p.url());
ok('Menú: Academy marcado como página actual', await p.locator('[class*="Header_actions"] a[aria-current="page"]', { hasText: 'Academy' }).count() === 1);

// ---- Portada
const rows = () => p.$$eval('[class*="Home_topList"] li', ls => ls.map(l => [l.querySelector('[class*="topNum"]').textContent, l.querySelector('[class*="topCat"]').textContent]));
let r = await rows();
ok('«Las que más resuelven»: 8 guías con «Todas»', r.length === 8, r.map(x => x[1]).join(','));
await p.getByRole('button', { name: 'Dominios', exact: true }).click();
r = await rows();
ok('Filtro «Dominios»: 3 guías de dominios numeradas 01-03', r.length === 3 && r.every(x => x[1] === 'Dominios') && r.map(x => x[0]).join() === '01,02,03', JSON.stringify(r));
ok('Filtro: aria-pressed en el botón activo', await p.getByRole('button', { name: 'Dominios', exact: true }).getAttribute('aria-pressed') === 'true');
await p.getByRole('button', { name: 'Todas', exact: true }).click();
ok('Filtro «Todas» vuelve a las 8', (await rows()).length === 8);
const stage = await p.evaluate(() => getComputedStyle(document.querySelector('[class*="Mascot_stage"]')).pointerEvents);
ok('Personaje: no captura el ratón', stage === 'none', stage);
await p.waitForTimeout(800);
ok('Personaje: motor WebGL cargado', await p.locator('[class*="Mascot_char"].mascota--webgl').count() === 1);
const cards = await p.$$eval('[class*="Home_grid"] > li', ls => ls.map(l => l.querySelectorAll(':scope > ul a').length));
ok('Temas: 6 tarjetas con 3 guías cada una', cards.length === 6 && cards.every(n => n === 3), JSON.stringify(cards));

// ---- Buscar desde la portada (navegación sin recargar con next/form)
await p.evaluate(() => { window.__sinRecargar = true; });
await p.fill('#buscar-portada', 'ssl');
await p.press('#buscar-portada', 'Enter');
await p.waitForURL('**/academy/buscar/?q=ssl');
await p.waitForSelector('[class*="Search_list"] li');
const first = await p.textContent('[class*="Search_list"] li [class*="rowTitle"]');
ok('Buscar «ssl»: primera guía «Activar el certificado SSL…»', /Activar el certificado SSL/.test(first), first);
ok('Buscar: sin recargar la página', await p.evaluate(() => window.__sinRecargar === true));
ok('Buscar: el campo muestra la búsqueda', await p.inputValue('#buscar-resultados') === 'ssl');
const checks = [['correo iphone', 'configurar-iphone-android'], ['migrar', 'migrar-wordpress'], ['puerto 993', 'datos-imap-pop-smtp'], ['factura', 'pagar-facturas'], ['contraseña olvidada', 'area-de-cliente'], ['error critico', 'error-critico']];
for (const [q, slug] of checks) {
  await p.goto(`${BASE}/academy/buscar/?q=${encodeURIComponent(q)}`, { waitUntil: 'networkidle' });
  await p.waitForSelector('[class*="Search_list"] li, [class*="Search_count"]');
  const href = await p.getAttribute('[class*="Search_list"] li a', 'href').catch(() => null);
  ok(`Buscar «${q}» → ${slug}`, href?.includes(slug), href ?? 'sin resultados');
}
await p.goto(`${BASE}/academy/buscar/?q=xyzzy`, { waitUntil: 'networkidle' });
await p.waitForSelector('[class*="Search_count"]');
ok('Buscar algo que no existe: mensaje y sugerencias', /No hemos encontrado/.test(await p.textContent('[class*="Search_count"]')) && await p.locator('[class*="Search_suggest"] a').count() === 4);

// ---- Guía
await p.goto(`${BASE}/academy/correo/configurar-iphone-android/`, { waitUntil: 'networkidle' });
const active = () => p.evaluate(() => document.querySelector('nav[aria-labelledby="toc-titulo"] a[aria-current]')?.textContent);
ok('Índice: «Antes de empezar» activa al cargar', await active() === 'Antes de empezar', await active());
const panels = () => p.$$eval('[role="tabpanel"]', ps => ps.map(x => !x.hidden));
ok('Pestañas: iPhone visible al cargar', JSON.stringify(await panels()) === '[true,false]');
await p.getByRole('tab', { name: 'Android' }).click();
ok('Pestañas: clic en Android', JSON.stringify(await panels()) === '[false,true]');
await p.keyboard.press('ArrowLeft');
ok('Pestañas: flecha izquierda vuelve a iPhone (y lleva el foco)', JSON.stringify(await panels()) === '[true,false]' && await p.evaluate(() => document.activeElement.textContent) === 'iPhone');
await p.click('nav[aria-labelledby="toc-titulo"] a[href="#paso-a-paso"]');
await p.waitForTimeout(1200);
ok('Índice: clic en «Paso a paso» baja y la marca', await active() === 'Paso a paso', await active());
const top = await p.evaluate(() => document.getElementById('paso-a-paso').getBoundingClientRect().top);
ok('Índice: la sección no queda tapada por el header fijo', top > 70 && top < 140, String(Math.round(top)));
const sticky = await p.evaluate(() => document.querySelector('nav[aria-labelledby="toc-titulo"]').getBoundingClientRect().top);
ok('Índice: se queda fijo al bajar', sticky > 60 && sticky < 140, String(Math.round(sticky)));
await p.evaluate(() => { window.__ev = []; window.gtag = (...a) => window.__ev.push(a); });
await p.getByRole('button', { name: 'sí, resuelto' }).click();
ok('Valoración: «sí, resuelto» da las gracias', await p.getByText('¡Gracias!').isVisible());
const ev = await p.evaluate(() => window.__ev);
ok('Valoración: evento a Analytics', JSON.stringify(ev) === JSON.stringify([['event', 'valoracion_guia', { guia: 'configurar-iphone-android', util: 'si' }]]), JSON.stringify(ev));
await p.goto(`${BASE}/academy/dominios/apuntar-dominio-dns/`, { waitUntil: 'networkidle' });
await p.getByRole('button', { name: 'todavía no' }).click();
const fb = p.locator('section[aria-label="Valora esta guía"]');
ok('Valoración: «todavía no» ofrece ticket y teléfono', await fb.locator('a[href*="submitticket"]').count() === 1 && await fb.locator('a[href="tel:+34900433400"]').count() === 1);
if (!useFx) {
  await p.getByRole('button', { name: 'Copiar' }).click();
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  ok('Copiar: copia el comando', clip === 'nslookup -type=ns tudominio.com' && await p.getByRole('button', { name: 'Copiado' }).isVisible(), clip);
}
const links = await p.$$eval('article a[href^="/academy/"]', as => as.map(a => a.getAttribute('href')));
ok('Guía: enlaces internos', links.length > 0, links.join(' '));

// ---- Todas las páginas: sin errores y con un solo h1
const urls = await (await fetch(`${BASE}/academy-sitemap.xml`)).text().then(t => [...t.matchAll(/<loc>https:\/\/cloudin\.pro([^<]+)<\/loc>/g)].map(m => m[1]));
ok('Sitemap: 25 URL', urls.length === 25, String(urls.length));
let bad = [];
for (const u of [...urls, '/academy/buscar/']) {
  const res = await p.goto(BASE + u, { waitUntil: 'networkidle' });
  const h1 = await p.locator('h1').count();
  const title = await p.title();
  const canonical = await p.getAttribute('link[rel="canonical"]', 'href');
  if (![200, 304].includes(res.status()) || h1 !== 1 || !title.endsWith('Cloudin Academy') || canonical !== `https://cloudin.pro${u}`) bad.push(`${u} ${res.status()} h1=${h1} «${title}» ${canonical}`);
}
ok('26 páginas: 200, un h1, título y canonical', !bad.length, bad.join(' | '));
const res404 = await p.goto(`${BASE}/academy/no-existe/`);
ok('Tema que no existe: 404', res404.status() === 404, String(res404.status()));

// ---- Móvil
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: !useFx, hasTouch: true });
const mp = await m.newPage();
watch(mp, 'móvil');
for (const u of ['/academy/', '/academy/correo/datos-imap-pop-smtp/', '/academy/dominios/', '/academy/buscar/?q=dns']) {
  await mp.goto(BASE + u, { waitUntil: 'networkidle' });
  const over = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(`Móvil ${u}: sin scroll horizontal`, over <= 0, String(over));
}
await mp.goto(`${BASE}/academy/correo/datos-imap-pop-smtp/`, { waitUntil: 'networkidle' });
const t = await mp.evaluate(() => { const s = document.querySelector('[class*="Guide_tableScroll"]'); const td = s.querySelector('tbody td'); return { fits: s.scrollWidth <= s.clientWidth, label: getComputedStyle(td, '::before').content }; });
// Firefox no resuelve attr() en el estilo calculado: devuelve la expresión tal cual
ok('Móvil: la tabla cabe (fichas con etiqueta)', t.fits && ['"Servidor"', 'attr(data-label)'].includes(t.label), JSON.stringify(t));
await mp.locator('[class*="Header_toggle"]').click();
const mob = await mp.evaluate(() => { const a = [...document.querySelectorAll('#mobile-nav a')].find(x => x.textContent.trim().startsWith('Academy')); return a && { href: a.getAttribute('href'), target: a.target, arrow: !!a.querySelector('svg') }; });
ok('Menú móvil: Academy → /academy/ con flecha', mob?.href === '/academy/' && mob.target === '' && mob.arrow, JSON.stringify(mob));

ok('Sin errores en consola', !errors.length, errors.join(' | '));
await browser.close();
for (const x of results) console.log(x[0], x[1], x[2] ? `· ${x[2]}` : '');
console.log(results.filter(x => x[0] === 'MAL').length ? 'HAY FALLOS' : 'TODO OK');
