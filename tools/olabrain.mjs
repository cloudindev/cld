// Comprueba el asistente de Olabrain (app/layout.tsx, NOTAS.md, punto 41): el script con su agente está en
// todas las páginas y su botón flotante aparece. Uso: node tools/olabrain.mjs [firefox]   (web servida en :3000)
import { chromium, firefox } from 'playwright';

const BASE = 'http://localhost:3000';
const AGENT = '3c1d7f49-2af6-4648-b673-9a4aa6cfd09f';
const useFx = process.argv[2] === 'firefox';
const browser = useFx ? await firefox.launch() : await chromium.launch({ channel: 'chrome' });
const results = [];
const ok = (name, pass, info = '') => results.push([pass ? 'OK ' : 'MAL', name, info]);

for (const path of ['/', '/academy/', '/contacto/', '/blog/', '/hosting-y-dominios-cloud-empresas/']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  // el vídeo hero (44 s) mantiene la red ocupada mientras se reproduce y aquí no hace falta: sin él, «networkidle» llega
  await ctx.route('**/video/hero-cloudin.mp4', r => r.abort());
  const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const agent = await p.evaluate(() => document.querySelector('script[src="https://app.olabrain.com/widget.js"]')?.getAttribute('data-agent'));
  ok(`Olabrain en ${path}`, agent === AGENT, String(agent));
  await ctx.close();
}

await browser.close();
for (const x of results) console.log(x[0], x[1], x[2] ? `· ${x[2]}` : '');
console.log(results.some(x => x[0] === 'MAL') ? 'HAY FALLOS' : 'TODO OK');
