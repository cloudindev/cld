// Capturas de Academy para comparar con el diseño: node tools/academy/shots.mjs [base] [navegador]
// Salida en _inventory/academy/ (no se sube al repositorio).
import { chromium, firefox } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:3000';
const ENGINE = process.argv[3] ?? 'chrome';
const OUT = new URL('../../_inventory/academy/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const pages = [
  ['home', '/academy/'],
  ['guia', '/academy/correo/configurar-iphone-android/'],
  ['tema', '/academy/dominios/'],
  ['pasos', '/academy/primeros-pasos/'],
  ['buscar', '/academy/buscar/?q=dns'],
  ['buscar-vacio', '/academy/buscar/?q=zzzz'],
  ['guia-vps', '/academy/vps/configurar-firewall/'],
];
const sizes = [['d', 1305, 900], ['m', 390, 844]];

const browser = ENGINE === 'firefox' ? await firefox.launch() : await chromium.launch({ channel: 'chrome' });
for (const [sz, w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  for (const [name, path] of pages) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1300);   // subida del personaje y fuentes
    await page.screenshot({ path: `${OUT}${ENGINE}-${sz}-${name}.png`, fullPage: true });
  }
  if (errors.length) console.log(sz, 'errores:', errors);
  await ctx.close();
}
await browser.close();
console.log('ok', OUT);
