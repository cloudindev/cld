// Captura el render 3D de cada pieza en el hueco exacto de la foto (página de pruebas) → PNG + máscara
import { chromium } from 'playwright';
import fs from 'node:fs';
// Uso: node tools/jelly/shot.mjs [web,cloud] [tune.json]   (sirve out/ en http://localhost:3000 antes)
const out = '_inventory/jelly', shapes = (process.argv[2] || 'web,cloud').split(',');
fs.mkdirSync(out, { recursive: true });
const tune = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : null;
const b = await chromium.launch({ channel: 'chrome' });
for (const shape of shapes) {
  const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  const logs = []; p.on('console', m => logs.push(m.text())); p.on('pageerror', e => logs.push('ERR ' + e.message));
  await p.goto(`http://localhost:3000/jelly/test?shape=${shape}`, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  if (!(await p.evaluate(() => !!window.piece))) { console.log(shape, 'NO PIECE', logs.join(' | ')); continue; }
  if (tune?.[shape]) await p.evaluate(t => window.piece.tune(t), tune[shape]);
  const r = await p.evaluate(() => window.slotRect);
  await p.screenshot({ path: `${out}/${shape}-3d.png`, clip: r });
  // RGBA del lienzo recortado al hueco (fila 0 = arriba) → archivo crudo para Python
  const raw = await p.evaluate(() => {
    const { width, height, data } = window.piece.pixels(), r = window.slotRect, o = new Uint8Array(r.width * r.height * 4);
    for (let y = 0; y < r.height; y++) { const sy = height - 1 - (y + r.y); o.set(data.subarray((sy * width + r.x) * 4, (sy * width + r.x + r.width) * 4), y * r.width * 4); }
    let s = ''; for (let i = 0; i < o.length; i += 8192) s += String.fromCharCode.apply(null, o.subarray(i, i + 8192)); return btoa(s);
  });
  fs.writeFileSync(`${out}/${shape}-rgba.bin`, Buffer.from(raw, 'base64'));
  console.log(shape, JSON.stringify(await p.evaluate(() => window.piece.stats)), logs.filter(l => /jelly|ERR|WebGL/i.test(l)).slice(0, 6).join(' | '));
  await p.close();
}
await b.close();
