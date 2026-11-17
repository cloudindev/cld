// Calibra los materiales de una pieza contra la foto: ajusta absorción (sigma) o color de dispersión
// de cada capa hasta que el color medio del render en cada zona coincide con el de la foto.
import { chromium } from 'playwright';
import fs from 'node:fs';
// Uso: node tools/jelly/fit-materials.mjs web|cloud|chip   → _inventory/jelly/tune.json (luego: python3 tools/jelly/bake.py)
const shape = process.argv[2], regFile = '_inventory/jelly/regions.json', outFile = '_inventory/jelly/tune.json';
const regions = JSON.parse(fs.readFileSync(regFile, 'utf8'))[shape];
const PLAN = {
  web: [{ region: 'top', layer: 2, mode: 'sigma' }, { region: 'base', layer: 0, mode: 'color' }, { region: 'band', layer: 1, mode: 'color' }],
  cloud: [{ region: 'base', layer: 0, mode: 'color' }, { region: 'band', layer: 1, mode: 'color' }, { region: 'top', layer: 2, mode: 'color' }],
  // chip: la cara superior manda (es lo que más se ve); con este modelo las paredes no pueden salir a la vez más moradas
  chip: [{ region: 'top', layer: 2, mode: 'color' }, { region: 'base', layer: 0, mode: 'color' }, { region: 'band', layer: 1, mode: 'color' }],
}[shape];
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(`http://localhost:3000/jelly/test?shape=${shape}`, { waitUntil: 'load' });
await p.waitForTimeout(1200);
const sample = tune => p.evaluate(([regs, tune]) => {
  if (tune) window.piece.tune(tune);
  const { width, height, data } = window.piece.pixels(), r = window.slotRect, out = {};
  const lin = v => Math.pow(v / 255, 2.2);
  for (const [k, v] of Object.entries(regs)) {
    const acc = [0, 0, 0]; let n = 0;
    for (const [x, y] of v.pts) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const px = Math.round(x) + dx + r.x, py = height - 1 - (Math.round(y) + dy + r.y), i = (py * width + px) * 4;
      acc[0] += lin(data[i]); acc[1] += lin(data[i + 1]); acc[2] += lin(data[i + 2]); n++;
    }
    out[k] = acc.map(a => a / n);
  }
  return out;
}, [regions, tune]);
const mats = await p.evaluate(() => JSON.parse(JSON.stringify(window.piece.shape.materials)));
const srgb = c => c.map(v => Math.round(255 * Math.pow(Math.max(v, 0), 1 / 2.2)));
let cur = await sample(null);
for (let it = 0; it < 22; it++) {
  for (const { region, layer, mode } of PLAN) {
    const t = regions[region].target, c = cur[region], m = mats[layer];
    for (let k = 0; k < 3; k++) {
      const ratio = Math.max(c[k], 1e-4) / Math.max(t[k], 1e-4);
      if (mode === 'sigma') m.sigma[k] = Math.min(80, Math.max(0, m.sigma[k] + 0.7 * Math.log(ratio) / 0.2));
      else m.color[k] = Math.min(1, Math.max(0.02, m.color[k] * Math.pow(1 / ratio, 0.8 / 2.2)));
    }
  }
  cur = await sample({ materials: mats });
}
console.log('zona      render sRGB        foto sRGB');
for (const k of Object.keys(regions)) console.log(k.padEnd(8), JSON.stringify(srgb(cur[k])).padEnd(18), JSON.stringify(srgb(regions[k].target)));
const rnd = o => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === 'number' ? +v.toFixed(3) : v)));
console.log('materials:', JSON.stringify(rnd(mats)));
if (outFile) { const all = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {}; all[shape] = { materials: rnd(mats) }; fs.writeFileSync(outFile, JSON.stringify(all)); }
await b.close();
