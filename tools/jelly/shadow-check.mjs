// Busca «líneas claras» dentro de la sombra del suelo: valles finos en el alfa del lienzo (sombra) que no
// deberían existir. Recorre varios anchos de ventana y densidades de píxel, en reposo y con la pieza movida.
// Uso: node tools/jelly/shadow-check.mjs [firefox]
import { chromium, firefox } from 'playwright';
const useFx = process.argv[2] === 'firefox';
const b = useFx ? await firefox.launch() : await chromium.launch({ channel: 'chrome' });
// valle = cierre morfológico (máx. y luego mín., radio d) − alfa: detecta líneas finas más claras que su entorno
const detect = () => [...document.querySelectorAll('#pp-tab-web .jelly, #pp-tab-vps .jelly')].map(el => {
  const { width: W, height: H, data } = el.__jelly3d.pixels();
  const a = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) a[i] = data[i * 4 + 3];
  const d = 4, filt = (src, max) => {
    const t = new Uint8Array(W * H), o = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = max ? 0 : 255; for (let k = -d; k <= d; k++) { const xx = Math.min(W - 1, Math.max(0, x + k)), s = src[y * W + xx]; v = max ? Math.max(v, s) : Math.min(v, s); } t[y * W + x] = v; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = max ? 0 : 255; for (let k = -d; k <= d; k++) { const yy = Math.min(H - 1, Math.max(0, y + k)), s = t[yy * W + x]; v = max ? Math.max(v, s) : Math.min(v, s); } o[y * W + x] = v; }
    return o;
  };
  // solo la sombra: se quita la pieza (opaca) y un margen de 2·d píxeles a su alrededor (borde suavizado)
  const sh = new Uint8Array(W * H); let peak = 0;
  for (let i = 0; i < W * H; i++) { sh[i] = a[i] > 232 ? 255 : a[i]; }
  const d0 = d; const nearPiece = (() => { const m = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) m[i] = a[i] > 232 ? 255 : 0; return filt(filt(m, true), true); })();
  const closed = filt(filt(sh, true), false);
  let worst = 0, wx = 0, wy = 0, n = 0;
  for (let y = d0; y < H - d0; y++) for (let x = d0; x < W - d0; x++) {
    const i = y * W + x; if (nearPiece[i]) continue;
    peak = Math.max(peak, a[i]);
    const v = closed[i] - a[i];
    if (v > 3) n++; if (v > worst) { worst = v; wx = x; wy = H - 1 - y; }
  }
  return { piece: el.closest('[role=tab]').id.replace('pp-tab-', ''), worst, at: [wx, wy], count: n, size: [W, H], peak };
});
let bad = 0;
for (const dpr of [1, 2]) for (const vw of [1280, 1366, 1440, 1512, 1680, 1920]) {
  const p = await b.newPage({ viewport: { width: vw, height: 900 }, deviceScaleFactor: dpr });
  await p.goto('http://localhost:3000/', { waitUntil: 'load' });
  await p.evaluate(() => { const r = document.querySelector('[aria-label="Tipo de hosting"]').getBoundingClientRect(); scrollBy(0, r.top - 120); });
  await p.waitForTimeout(2200);
  const rest = await p.evaluate(detect);
  // mover un poco cada pieza (arrastre corto) y volver a medir, ya quieta
  for (const id of ['web', 'vps']) {
    const c = await p.locator('#pp-tab-' + id).boundingBox(); const sx = c.x + c.width * 0.8, sy = c.y + c.height * 0.45;
    await p.mouse.move(sx, sy); await p.mouse.down();
    for (let i = 1; i <= 8; i++) { await p.mouse.move(sx - i * 14, sy - i * 3); await p.waitForTimeout(16); }
    await p.mouse.up();
  }
  await p.waitForTimeout(1800);
  const moved = await p.evaluate(detect);
  const fmt = r => r.map(o => `${o.piece}: ${o.worst}${o.worst > 3 ? ` ← en (${o.at}) de ${o.size}, ${o.count} px` : ''} (sombra máx. ${o.peak})`).join(' · ');
  if ([...rest, ...moved].some(o => o.worst > 3)) bad++;
  console.log(`dpr ${dpr} · ${vw}px  reposo → ${fmt(rest)}  |  movida → ${fmt(moved)}`);
  await p.close();
}
console.log(bad ? `¡${bad} configuraciones con valle > 3/255!` : 'sin líneas en la sombra');
await b.close();
