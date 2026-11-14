// Capturas del personaje en distintas poses (mirada fija) y con el ratón real. Uso: node tools/mascota/poses.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
const S = '_inventory/mascota'; fs.mkdirSync(S, { recursive: true });
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
await p.goto('http://localhost:3000/', { waitUntil: 'load' });
const sec = p.locator('section[class*="Mascot_section"]');
await sec.scrollIntoViewIfNeeded(); await p.evaluate(() => scrollBy(0, 120)); await p.waitForTimeout(1800);
const kind = await p.evaluate(() => document.querySelector('[class*="Mascot_char"]').__mascota?.kind);
console.log('motor:', kind);
const box = await sec.boundingBox();
const clip = { x: box.x + box.width / 2 - 260, y: box.y, width: 520, height: box.height + 6 };
const poses = { centro: [0, 0], izquierda: [-1, 0], derecha: [1, 0], arriba: [0, -1], abajo: [0, 0.85], 'arriba-dcha': [0.8, -0.8], parpadeo: [0, 0, 1], 'medio parpadeo': [0, 0, 0.5] };
for (const [name, [x, y, bl = 0]] of Object.entries(poses)) {
  await p.evaluate(([x, y, bl]) => document.querySelector('[class*="Mascot_char"]').__mascota.pose(x, y, bl), [x, y, bl]);
  await p.screenshot({ path: `${S}/pose-${name}.png`, clip });
}
// ratón real: varias posiciones de la pantalla
for (const [name, mx, my] of [['raton-izq-arriba', 80, 60], ['raton-dcha-abajo', 1400, 880], ['raton-encima', 720, box.y - 60]]) {
  await p.mouse.move(mx, my, { steps: 4 }); await p.waitForTimeout(900);
  await p.screenshot({ path: `${S}/${name}.png`, clip });
}
console.log(errs.length ? errs : 'sin errores');
await b.close();
