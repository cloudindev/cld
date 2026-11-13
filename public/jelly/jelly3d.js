/**
 * jelly3d.js · Piezas de gominola en 3D con física de sólido blando real (sin dependencias).
 *
 * FÍSICA · El cuerpo es una malla volumétrica de tetraedros (retícula de celdas partidas en 6 tetraedros)
 * resuelta con XPBD a 60 Hz fijos y 10 subpasos:
 *   - restricción de distancia en cada arista (elasticidad, con «compliance» finita → blanda)
 *   - restricción de volumen en cada tetraedro (casi incompresible: al estirarla adelgaza, como la gelatina)
 *   - amortiguación solo de la velocidad relativa a lo largo de las aristas (cae y vuelca libremente,
 *     pero el temblor se apaga)
 *   - contacto con el suelo con rozamiento y paredes invisibles en los bordes de la tarjeta
 *   - agarre: unión blanda a un parche de partículas alrededor del punto pulsado
 * La superficie lisa y los adornos son mallas aparte: cada vértice va «cosido» a un tetraedro con
 * coordenadas baricéntricas, así se estiran y giran con la gelatina que los rodea.
 *
 * RENDER (WebGL2) · Primero el suelo (fondo de la tarjeta + sombra) en una textura; luego las caras
 * traseras para medir cuánta gelatina atraviesa cada rayo; las caras delanteras refractan el fondo según
 * ese grosor, lo absorben con Beer–Lambert por capas, añaden dispersión lechosa, brillo en bordes finos,
 * reflejos Fresnel de un estudio procedural y brillos GGX. Sombra suave teñida + oclusión de contacto
 * a partir de un mapa de alturas visto desde arriba.
 *
 * Uso: const j = createJelly3D(el, { shape: 'cloud' | 'web' }); → null si no hay WebGL2.
 *      j.reset() la devuelve a su sitio · j.destroy()
 * `el` marca el sitio y el tamaño de la pieza en reposo; el lienzo cubre su contenedor posicionado
 * (la tarjeta), que es el «suelo» por el que se puede mover.
 */

/* =========================================================================
 * CONFIGURACIÓN
 * Unidades del mundo: la pieza mide 2 de ancho. Tiempo en segundos.
 * ========================================================================= */
export const CONFIG3D = {
  physics: {
    hz: 60,
    substeps: 10,
    gravity: 140,
    edgeCompliance: 0.006,  // blandura de la gelatina (más alto = más blanda)
    shapeMatch: 0.016,      // tirón por subpaso hacia su forma rígida mejor encajada: evita que se pliegue (0 = sin límite)
    volumeCompliance: 0,    // 0 = incompresible
    damping: 2.2,           // amortiguación interna (1/s): más alto = menos temblor
    air: 0.15,              // rozamiento con el aire (1/s)
    friction: 0.55,         // rozamiento con el suelo (0-1)
    cell: 0.14,             // tamaño de celda de la malla de tetraedros
    settleSteps: 40,        // pasos para dejarla asentada en reposo antes de mostrarla
  },
  hover: { kick: 0.9, radius: 0.5 }, // golpecito al pasar el ratón por encima (un temblor)
  grab: {
    radius: 0.55,           // tamaño del parche agarrado (grande: el tirón se reparte y no pellizca)
    compliance: 2e-3,       // unión del parche al puntero (más alto = agarre más elástico; nunca rígido, para que no pellizque)
    maxHeight: 0.7,         // hasta dónde se puede levantar
    maxStretch: 0.2,        // cuánto puede alejarse el punto agarrado del cuerpo (tope de la flexión)
    clickKick: 2.4,         // golpecito al hacer clic sin arrastrar
  },
  reset: { duration: 0.8 }, // vuelta a su sitio (s)
  camera: { fov: 15, elevation: 37, fill: 0.9 },
  shadow: { strength: 0.32, contact: 0.35 },
  sleep: { speed: 0.012, frames: 45 }, // se detiene (0 % CPU) cuando todo está quieto
  maxDpr: 2,
};

/* =========================================================================
 * PIEZAS · silueta (SDF en planta), grosor, capas de material y adornos
 * h = altura relativa (0 base … 1 cara superior). sigma = absorción (Beer–Lambert, por unidad);
 * milk = densidad de dispersión lechosa; milkColor = color de esa dispersión.
 * ========================================================================= */
const SHAPES = {
  cloud: {
    sdf(x, z) {
      const base = sdRoundBox(x, z, 0, 0.16, 1.0, 0.42, 0.42);
      let d = smin(base, sdCircle(x, z, -0.56, -0.08, 0.44), 0.2);
      d = smin(d, sdCircle(x, z, 0.08, -0.3, 0.56), 0.2);
      d = smin(d, sdCircle(x, z, 0.7, -0.02, 0.42), 0.2);
      return d;
    },
    thickness: 0.54, bevel: 0.15, yaw: -14,
    layers: [0.4, 0.52],
    materials: [
      { sigma: [14.0, 3.0, 2.0], milk: 0.9, milkColor: [0.04, 0.42, 0.5] },  // base turquesa
      { sigma: [0.3, 0.35, 0.5], milk: 14, milkColor: [0.98, 0.96, 0.9] },   // franja crema (geometría interior)
      { sigma: [3.2, 0.9, 0.08], milk: 0.5, milkColor: [0.5, 0.82, 1.0] },  // nube azul hielo (cristal)
    ],
    tint: [0.15, 0.5, 0.56],
  },
  web: {
    sdf(x, z) { return sdRoundBox(x, z, 0, 0, 1.0, 0.68, 0.22); },
    thickness: 0.42, bevel: 0.12, yaw: -18,
    layers: [0.36, 0.5],
    materials: [
      { sigma: [1.2, 10.0, 14.0], milk: 0.7, milkColor: [0.8, 0.25, 0.12] }, // base naranja rojizo
      { sigma: [0.3, 0.4, 0.6], milk: 14, milkColor: [0.99, 0.94, 0.85] },   // franja crema (geometría interior)
      { sigma: [0.06, 1.5, 2.2], milk: 0.45, milkColor: [1.0, 0.68, 0.5] },  // tapa melocotón (cristal)
    ],
    tint: [0.9, 0.42, 0.3],
    // Adornos en relieve sobre la cara superior (z negativo = fondo de la pieza)
    decorations: [
      { pill: [-0.96, 0.96, -0.42, 0.022], color: [0.99, 0.72, 0.6] },  // línea de la barra de título
      { dot: [-0.83, -0.55, 0.05], color: [0.86, 0.17, 0.13] },
      { dot: [-0.69, -0.55, 0.05], color: [0.96, 0.72, 0.16] },
      { dot: [-0.55, -0.55, 0.05], color: [0.33, 0.68, 0.24] },
      { pill: [-0.62, 0.12, -0.2, 0.12], color: [0.98, 0.94, 0.85] },
      { pill: [0.3, 0.86, -0.22, 0.12], color: [0.98, 0.94, 0.85] },
      { pill: [-0.5, 0.18, -0.02, 0.055], color: [0.98, 0.94, 0.85] },
      { pill: [0.36, 0.82, -0.03, 0.055], color: [0.98, 0.94, 0.85] },
      { pill: [-0.3, 0.24, 0.16, 0.12], color: [0.98, 0.94, 0.85] },
      { pill: [-0.22, 0.26, 0.34, 0.055], color: [0.98, 0.94, 0.85] },
    ],
  },
};

const TAU = Math.PI * 2, DEG = Math.PI / 180, HMAX = 4;

/* ---------- SDF 2D ---------- */
function sdCircle(x, z, cx, cz, r) { return Math.hypot(x - cx, z - cz) - r; }
function sdRoundBox(x, z, cx, cz, hx, hz, r) {
  const qx = Math.abs(x - cx) - hx + r, qz = Math.abs(z - cz) - hz + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
}
function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }

/* =========================================================================
 * GEOMETRÍA · silueta → superficie con bordes redondeados + retícula de tetraedros
 * ========================================================================= */
function buildModel(shape, cfg) {
  const N = 192; // puntos de la silueta (múltiplo de 8 para las tapas)
  // Silueta por muestreo polar del SDF y reescalado a 2 de ancho, centrada
  const raw = [];
  for (let i = 0; i < 720; i++) {
    const a = i / 720 * TAU, dx = Math.cos(a), dz = Math.sin(a);
    let lo = 0, hi = 4;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (shape.sdf(dx * m, dz * m) < 0) lo = m; else hi = m; }
    raw.push([dx * lo, dz * lo]);
  }
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of raw) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  const sc = 2 / (x1 - x0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const sdf = (x, z) => shape.sdf(x / sc + cx, z / sc + cz) * sc;
  const pts = raw.map(([x, z]) => [(x - cx) * sc, (z - cz) * sc]);
  // remuestreo por longitud de arco
  const cum = [0];
  for (let i = 1; i <= pts.length; i++) { const a = pts[i - 1], b = pts[i % pts.length]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const L = cum[pts.length], ol = [];
  for (let j = 0, s = 0; j < N; j++) {
    const t = j / N * L;
    while (cum[s + 1] < t) s++;
    const a = pts[s], b = pts[(s + 1) % pts.length], f = (t - cum[s]) / (cum[s + 1] - cum[s] || 1);
    ol.push({ x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f, nx: 0, nz: 0 });
  }
  for (let i = 0; i < N; i++) {
    const p = ol[(i + N - 1) % N], q = ol[(i + 1) % N];
    let nx = q.z - p.z, nz = -(q.x - p.x); const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
    if (sdf(ol[i].x + nx * 0.01, ol[i].z + nz * 0.01) < sdf(ol[i].x, ol[i].z)) { nx = -nx; nz = -nz; }
    ol[i].nx = nx; ol[i].nz = nz;
  }
  const zMin = Math.min(...ol.map(p => p.z)), zMax = Math.max(...ol.map(p => p.z));

  const T = shape.thickness, r = shape.bevel;
  const verts = [], tris = [];
  const addV = (x, y, z, extra) => { verts.push({ x, y, z, e: extra }); return verts.length - 1; };
  const addTri = (a, b, c, n) => {
    const A = verts[a], B = verts[b], C = verts[c];
    const ux = B.x - A.x, uy = B.y - A.y, uz = B.z - A.z, vx = C.x - A.x, vy = C.y - A.y, vz = C.z - A.z;
    const cxp = uy * vz - uz * vy, cyp = uz * vx - ux * vz, czp = ux * vy - uy * vx;
    if (cxp * n[0] + cyp * n[1] + czp * n[2] < 0) tris.push(a, c, b); else tris.push(a, b, c);
  };

  // Anillos del perfil redondeado: abajo de -90° a 0°, arriba de 0° a 90°
  const rings = [];
  for (let k = 0; k <= 4; k++) { const f = (-90 + k * 22.5) * DEG; rings.push({ d: r * (1 - Math.cos(f)), y: r + r * Math.sin(f), f }); }
  for (let k = 0; k <= 4; k++) { const f = (k * 22.5) * DEG; rings.push({ d: r * (1 - Math.cos(f)), y: T - r + r * Math.sin(f), f }); }
  for (const rg of rings) for (const p of ol) addV(p.x - p.nx * rg.d, rg.y, p.z - p.nz * rg.d, [rg.y / T, 0, 0]);
  for (let k = 0; k < rings.length - 1; k++) {
    const fm = (rings[k].f + rings[k + 1].f) / 2;
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N, n = [ol[i].nx * Math.cos(fm), Math.sin(fm), ol[i].nz * Math.cos(fm)];
      const a = k * N + i, b = k * N + j, c = (k + 1) * N + j, d = (k + 1) * N + i;
      if (rings[k].y === rings[k + 1].y && rings[k].d === rings[k + 1].d) continue;
      addTri(a, b, c, n); addTri(a, c, d, n);
    }
  }
  // Tapas: polígono grueso (1 de cada 8) por recorte de orejas + 3 subdivisiones ajustadas al anillo
  const cap = (k, up) => {
    const ringXZ = i => verts[k * N + i];
    let vs = [];
    for (let i = 0; i < N; i += 8) vs.push({ x: ringXZ(i).x, z: ringXZ(i).z, ring: i });
    let ts = earClip(vs), step = 8;
    for (let lvl = 0; lvl < 3; lvl++) {
      const mids = new Map(), nt = [];
      const mid = (a, b) => {
        const key = a < b ? a * 100003 + b : b * 100003 + a;
        if (mids.has(key)) return mids.get(key);
        const A = vs[a], B = vs[b];
        let ring = -1;
        if (A.ring >= 0 && B.ring >= 0) {
          if ((B.ring - A.ring + N) % N === step) ring = (A.ring + step / 2) % N;
          else if ((A.ring - B.ring + N) % N === step) ring = (B.ring + step / 2) % N;
        }
        vs.push(ring >= 0 ? { x: ringXZ(ring).x, z: ringXZ(ring).z, ring } : { x: (A.x + B.x) / 2, z: (A.z + B.z) / 2, ring: -1 });
        mids.set(key, vs.length - 1);
        return vs.length - 1;
      };
      for (let t = 0; t < ts.length; t += 3) {
        const a = ts[t], b = ts[t + 1], c = ts[t + 2], ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
        nt.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
      }
      ts = nt; step /= 2;
    }
    const y = rings[k].y;
    const gi = vs.map(v => (v.ring >= 0 ? k * N + v.ring : addV(v.x, y, v.z, [y / T, 0, 0])));
    for (let t = 0; t < ts.length; t += 3) addTri(gi[ts[t]], gi[ts[t + 1]], gi[ts[t + 2]], [0, up ? 1 : -1, 0]);
  };
  cap(rings.length - 1, true);
  cap(0, false);

  // Adornos en relieve (malla aparte con color por vértice)
  const dv = [], dt = [];
  const addDV = (x, y, z, col) => { dv.push({ x, y, z, e: col }); return dv.length - 1; };
  const addDT = (a, b, c, n) => {
    const A = dv[a], B = dv[b], C = dv[c];
    const ux = B.x - A.x, uy = B.y - A.y, uz = B.z - A.z, vx = C.x - A.x, vy = C.y - A.y, vz = C.z - A.z;
    const s = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2];
    if (s < 0) dt.push(a, c, b); else dt.push(a, b, c);
  };
  for (const d of shape.decorations ?? []) {
    let o = [];
    if (d.pill) {
      const [xa, xb, z, w] = d.pill, rr = w / 2, M = 10;
      for (let i = 0; i <= M; i++) { const a = -Math.PI / 2 + i / M * Math.PI; o.push([xb - rr + Math.cos(a) * rr, z + Math.sin(a) * rr]); }
      for (let i = 0; i <= M; i++) { const a = Math.PI / 2 + i / M * Math.PI; o.push([xa + rr + Math.cos(a) * rr, z + Math.sin(a) * rr]); }
    } else {
      const [x, z, rr] = d.dot;
      for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; o.push([x + Math.cos(a) * rr, z + Math.sin(a) * rr]); }
    }
    const h = d.pill ? 0.026 : 0.034, inset = 0.008;
    const cxo = o.reduce((s, p) => s + p[0], 0) / o.length, czo = o.reduce((s, p) => s + p[1], 0) / o.length;
    const M = o.length, base = dv.length;
    for (const [x, z] of o) addDV(x, T - 0.012, z, d.color);
    for (const [x, z] of o) { const dx = cxo - x, dz = czo - z, l = Math.hypot(dx, dz) || 1; addDV(x + dx / l * inset, T + h, z + dz / l * inset, d.color); }
    const c = addDV(cxo, T + h, czo, d.color);
    for (let i = 0; i < M; i++) {
      const j = (i + 1) % M, a = base + i, b = base + j, a2 = base + M + i, b2 = base + M + j;
      const nx = o[j][1] - o[i][1], nz = -(o[j][0] - o[i][0]);
      const out = (o[i][0] - cxo) * nx + (o[i][1] - czo) * nz > 0 ? 1 : -1;
      addDT(a, b, b2, [nx * out, 0.3, nz * out]); addDT(a, b2, a2, [nx * out, 0.3, nz * out]);
      addDT(a2, b2, c, [0, 1, 0]);
    }
  }

  // Franja crema: malla opaca interior entre las dos alturas de capa, metida dentro del bisel
  const bv = [], bt = [];
  {
    const y0 = shape.layers[0] * T, y1 = shape.layers[1] * T, inset = r * 0.5;
    const ring = ol.map(p => ({ x: p.x - p.nx * inset, z: p.z - p.nz * inset }));
    // lados (vértices 0..2N-1)
    for (const y of [y0, y1]) for (const q of ring) bv.push({ x: q.x, y, z: q.z, e: [0, 0, 0] });
    for (let i = 0; i < N; i++) { const j = (i + 1) % N; bt.push(i, j, N + j, i, N + j, N + i); }
    for (let t = 0; t < N * 6; t += 3) { // hacia fuera
      const A = bv[bt[t]], B = bv[bt[t + 1]], C = bv[bt[t + 2]];
      const ux = B.x - A.x, uy = B.y - A.y, uz = B.z - A.z, vx = C.x - A.x, vy = C.y - A.y, vz = C.z - A.z;
      const nx = uy * vz - uz * vy, nz = ux * vy - uy * vx, i = bt[t] % N;
      if (nx * ol[i].nx + nz * ol[i].nz < 0) { const tmp = bt[t + 1]; bt[t + 1] = bt[t + 2]; bt[t + 2] = tmp; }
    }
    // tapas con vértices propios (2N..4N-1), trianguladas sobre el anillo completo
    for (const y of [y0, y1]) for (const q of ring) bv.push({ x: q.x, y, z: q.z, e: [0, 0, 0] });
    const ct = earClip(ring.map(q => ({ x: q.x, z: q.z })));
    for (let t = 0; t < ct.length; t += 3) bt.push(3 * N + ct[t], 3 * N + ct[t + 1], 3 * N + ct[t + 2], 2 * N + ct[t], 2 * N + ct[t + 2], 2 * N + ct[t + 1]);
    for (let t = N * 6; t < bt.length; t += 3) { // tapa superior hacia arriba, inferior hacia abajo
      const A = bv[bt[t]], B = bv[bt[t + 1]], C = bv[bt[t + 2]];
      const ny = (B.z - A.z) * (C.x - A.x) - (B.x - A.x) * (C.z - A.z);
      const up = bt[t] >= 3 * N;
      if ((ny > 0) !== up) { const tmp = bt[t + 1]; bt[t + 1] = bt[t + 2]; bt[t + 2] = tmp; }
    }
  }

  // Retícula de tetraedros que cubre la silueta (dilatada para envolver toda la superficie)
  const h = cfg.physics.cell, ny = Math.max(2, Math.round(T / h)), hy = T / ny;
  const gx0 = -1 - h, gz0 = zMin - h;
  const nx = Math.ceil((2 + 2 * h) / h), nz = Math.ceil((zMax - zMin + 2 * h) / h);
  const keep = new Uint8Array(nx * nz);
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
    if (sdf(gx0 + (i + 0.5) * h, gz0 + (k + 0.5) * h) < 0.8 * h) keep[i * nz + k] = 1;
  }
  const nodeId = new Int32Array((nx + 1) * (ny + 1) * (nz + 1)).fill(-1);
  const P = [];
  const node = (i, j, k) => {
    const key = (i * (ny + 1) + j) * (nz + 1) + k;
    if (nodeId[key] < 0) { nodeId[key] = P.length / 3; P.push(gx0 + i * h, j * hy, gz0 + k * h); }
    return nodeId[key];
  };
  const tets = [], cellTets = new Map();
  const PERMS = [[1, 2, 4], [1, 4, 2], [2, 1, 4], [2, 4, 1], [4, 1, 2], [4, 2, 1]];
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
    if (!keep[i * nz + k]) continue;
    for (let j = 0; j < ny; j++) {
      const c = [];
      for (let b = 0; b < 8; b++) c.push(node(i + (b & 1), j + ((b >> 1) & 1), k + ((b >> 2) & 1)));
      const list = [];
      for (const [p0, p1] of PERMS) { list.push(tets.length / 4); tets.push(c[0], c[p0], c[p0 | p1], c[7]); }
      cellTets.set((i * ny + j) * nz + k, list);
    }
  }
  const pos = new Float32Array(P);
  const tetArr = new Uint32Array(tets);

  // Coser cada vértice (superficie y adornos) a un tetraedro con coordenadas baricéntricas
  const embed = list => {
    const ids = new Uint32Array(list.length * 4), w = new Float32Array(list.length * 4);
    list.forEach((v, n) => {
      const ci = clampI(Math.floor((v.x - gx0) / h), 0, nx - 1), ck = clampI(Math.floor((v.z - gz0) / h), 0, nz - 1);
      const cj = clampI(Math.floor(Math.min(v.y, T - 1e-4) / hy), 0, ny - 1);
      let best = -Infinity, bt = -1, bw = null;
      for (let r2 = 0; r2 <= 2 && bt < 0; r2++) {
        for (let di = -r2; di <= r2; di++) for (let dj = -r2; dj <= r2; dj++) for (let dk = -r2; dk <= r2; dk++) {
          const ii = ci + di, jj = cj + dj, kk = ck + dk;
          if (ii < 0 || jj < 0 || kk < 0 || ii >= nx || jj >= ny || kk >= nz) continue;
          const lst = cellTets.get((ii * ny + jj) * nz + kk); if (!lst) continue;
          for (const t of lst) {
            const bc = bary(pos, tetArr, t, v.x, v.y, v.z), m = Math.min(...bc);
            if (m > best) { best = m; bt = t; bw = bc; }
          }
        }
      }
      for (let q = 0; q < 4; q++) { ids[n * 4 + q] = tetArr[bt * 4 + q]; w[n * 4 + q] = bw[q]; }
    });
    return { ids, w };
  };

  return {
    T, outline: ol,
    particles: pos, tets: tetArr,
    surface: { n: verts.length, extra: new Float32Array(verts.flatMap(v => v.e)), index: new Uint32Array(tris), ...embed(verts) },
    deco: dv.length ? { n: dv.length, extra: new Float32Array(dv.flatMap(v => v.e)), index: new Uint32Array(dt), ...embed(dv) } : null,
    band: { n: bv.length, extra: new Float32Array(bv.flatMap(v => v.e)), index: new Uint32Array(bt), ...embed(bv) },
  };
}

function clampI(v, a, b) { return v < a ? a : v > b ? b : v; }

function bary(pos, tets, t, x, y, z) {
  const i = tets[t * 4] * 3, a = [pos[i], pos[i + 1], pos[i + 2]];
  const col = q => { const j = tets[t * 4 + q] * 3; return [pos[j] - a[0], pos[j + 1] - a[1], pos[j + 2] - a[2]]; };
  const b = col(1), c = col(2), d = col(3), p = [x - a[0], y - a[1], z - a[2]];
  const det = dot3(b, cross3(c, d));
  const u = dot3(p, cross3(c, d)) / det, v = dot3(b, cross3(p, d)) / det, w = dot3(b, cross3(c, p)) / det;
  return [1 - u - v - w, u, v, w];
}
function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

// Recorte de orejas en planta (x, z) → índices de triángulos
function earClip(vs) {
  const idx = vs.map((_, i) => i), out = [];
  let area = 0;
  for (let i = 0; i < vs.length; i++) { const a = vs[i], b = vs[(i + 1) % vs.length]; area += a.x * b.z - b.x * a.z; }
  const sgn = Math.sign(area);
  const cr = (a, b, c) => ((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)) * sgn;
  let guard = 0;
  while (idx.length > 3 && guard++ < 10000) {
    let cut = false;
    for (let n = 0; n < idx.length; n++) {
      const ia = idx[(n + idx.length - 1) % idx.length], ib = idx[n], ic = idx[(n + 1) % idx.length];
      const a = vs[ia], b = vs[ib], c = vs[ic];
      if (cr(a, b, c) <= 1e-9) continue;
      let inside = false;
      for (const j of idx) {
        if (j === ia || j === ib || j === ic) continue;
        const p = vs[j];
        if (cr(a, b, p) >= 0 && cr(b, c, p) >= 0 && cr(c, a, p) >= 0) { inside = true; break; }
      }
      if (inside) continue;
      out.push(ia, ib, ic); idx.splice(n, 1); cut = true; break;
    }
    if (!cut) break;
  }
  if (idx.length === 3) out.push(idx[0], idx[1], idx[2]);
  return out;
}

/* =========================================================================
 * MATRICES (column-major, como WebGL)
 * ========================================================================= */
function perspective(fovy, aspect, near, far, sx, sy) {
  const f = 1 / Math.tan(fovy / 2);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, -sx, -sy, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]);
}
function lookAt(e, t, u) {
  let zx = e[0] - t[0], zy = e[1] - t[1], zz = e[2] - t[2]; let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
  let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx; l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
    -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
}
function mul4(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s;
  }
  return o;
}
function invert4(m) {
  const inv = new Float32Array(16);
  inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
  inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
  inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
  inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
  inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
  inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
  inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
  inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
  inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
  inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
  inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
  inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
  inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
  inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
  inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
  inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
  const det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
  for (let i = 0; i < 16; i++) inv[i] /= det;
  return inv;
}
function xform(m, x, y, z, w = 1) {
  const o = [m[0] * x + m[4] * y + m[8] * z + m[12] * w, m[1] * x + m[5] * y + m[9] * z + m[13] * w,
    m[2] * x + m[6] * y + m[10] * z + m[14] * w, m[3] * x + m[7] * y + m[11] * z + m[15] * w];
  return o;
}

/* =========================================================================
 * SHADERS (GLSL ES 3.00)
 * ========================================================================= */
const VS = `#version 300 es
layout(location=0) in vec3 a_pos; layout(location=1) in vec3 a_nrm; layout(location=2) in vec3 a_x;
uniform mat4 u_view, u_proj;
out vec3 v_pos; out vec3 v_nrm; out vec3 v_x; out float v_vz;
void main() {
  vec4 vp = u_view * vec4(a_pos, 1.0);
  v_pos = a_pos; v_nrm = a_nrm; v_x = a_x; v_vz = -vp.z;
  gl_Position = u_proj * vp;
}`;

// Profundidad lineal de las caras traseras, empaquetada en 16 bits (RG)
const FS_BACK = `#version 300 es
precision highp float;
in float v_vz; uniform float u_far; out vec4 o;
void main() { float d = clamp(v_vz / u_far, 0.0, 1.0) * 255.0; o = vec4(floor(d) / 255.0, fract(d), 0.0, 1.0); }`;

// Mapa de alturas visto desde arriba: R = altura máxima, G = 1 - altura mínima (mezcla MAX)
const VS_HEIGHT = `#version 300 es
layout(location=0) in vec3 a_pos;
uniform vec2 u_c; uniform float u_s; out float v_y;
void main() { v_y = a_pos.y; gl_Position = vec4((a_pos.x - u_c.x) / u_s, (a_pos.z - u_c.y) / u_s, 0.0, 1.0); }`;
const FS_HEIGHT = `#version 300 es
precision highp float;
in float v_y; out vec4 o;
void main() { float h = clamp(v_y / ${HMAX.toFixed(1)}, 0.0, 1.0); o = vec4(h, 1.0 - h, 0.0, 1.0); }`;

// Suelo: fondo de la tarjeta + sombra suave teñida + oclusión de contacto
const FS_FLOOR = `#version 300 es
precision highp float;
in vec3 v_pos;
uniform sampler2D u_height; uniform vec2 u_c; uniform float u_s;
uniform vec3 u_bg, u_tint; uniform vec2 u_shift; uniform float u_mode, u_strength, u_contact;
out vec4 o;
void main() {
  vec2 uv = (v_pos.xz - u_c) / u_s * 0.5 + 0.5;
  float occ = 0.0, ao = 0.0, bot = 0.0, n = 0.0;
  // altura de la base bajo la pieza (para aclarar y ensanchar la sombra al levantarla)
  vec4 c0 = textureLod(u_height, uv - u_shift, 0.0);
  float lift = c0.r > 0.0 ? (1.0 - c0.g) * ${HMAX.toFixed(1)} : 0.0;
  float rad = 0.035 + lift * 0.05;
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 2.39996, r = sqrt((float(i) + 0.5) / 12.0);
    vec2 d = vec2(cos(a), sin(a)) * r;
    occ += smoothstep(0.0, 0.02, textureLod(u_height, uv - u_shift + d * rad, 2.5).r);
    vec4 c = textureLod(u_height, uv + d * 0.012, 0.0);
    ao += smoothstep(0.0, 0.03, c.r) * smoothstep(0.12, 0.0, (1.0 - c.g) * ${HMAX.toFixed(1)});
  }
  occ /= 12.0; ao /= 12.0;
  float a = clamp(occ * u_strength * exp(-lift * 1.5) + ao * u_contact, 0.0, 0.8);
  vec3 sh = mix(vec3(0.16, 0.13, 0.12), u_tint * 0.55, 0.35);
  if (u_mode < 0.5) o = vec4(mix(u_bg, sh, a), 1.0);   // fondo para la refracción
  else o = vec4(sh * a, a);                               // en pantalla: solo la sombra (premultiplicada)
}`;

// Gelatina: refracción por grosor, absorción por capas, dispersión lechosa, Fresnel, GGX
const FS_JELLY = `#version 300 es
precision highp float;
in vec3 v_pos; in vec3 v_nrm; in vec3 v_x; in float v_vz;
uniform sampler2D u_scene, u_back; uniform vec2 u_res; uniform vec3 u_cam; uniform mat4 u_view; uniform float u_far;
uniform vec3 u_sig[3]; uniform vec3 u_milkC[3]; uniform float u_milk[3]; uniform vec2 u_layers; uniform vec3 u_L;
out vec4 o;
// Estudio: cielo claro, una caja de luz grande arriba a la izquierda (el reflejo ancho) y relleno a la derecha
float box(vec3 r, vec3 c, float w, float h) {
  // «ventana» rectangular blanda en la dirección c (ancho w, alto h, en radianes aprox.)
  vec3 up = abs(c.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 rt = normalize(cross(c, up)); up = cross(rt, c);
  float d = dot(r, c); if (d <= 0.0) return 0.0;
  vec2 q = vec2(dot(r, rt), dot(r, up)) / d;
  return smoothstep(w, w * 0.6, abs(q.x)) * smoothstep(h, h * 0.6, abs(q.y));
}
vec3 env(vec3 r) {
  vec3 c = vec3(0.32, 0.32, 0.34) + vec3(0.5, 0.5, 0.52) * smoothstep(-0.4, 0.9, r.y);
  c += vec3(3.2) * box(r, normalize(vec3(-0.4, 0.85, 0.35)), 0.9, 0.35);   // caja de luz principal (reflejo ancho)
  c += vec3(1.6) * box(r, normalize(vec3(0.75, 0.55, 0.4)), 0.35, 0.3);    // relleno a la derecha
  c += vec3(2.4) * box(r, normalize(vec3(-0.1, 0.55, -0.85)), 0.9, 0.22);  // ventana tras la pieza: es la que refleja la tapa plana
  return c;
}
void main() {
  vec3 N = normalize(v_nrm), V = normalize(u_cam - v_pos);
  float NdV = clamp(dot(N, V), 0.0, 1.0);
  vec2 uv = gl_FragCoord.xy / u_res;
  vec4 bk = texture(u_back, uv);
  float back = (bk.r + bk.g / 255.0) * u_far;
  float t = clamp(back - v_vz, 0.0, 2.2);
  float la = smoothstep(u_layers.x - 0.025, u_layers.x + 0.025, v_x.x);
  float lb = smoothstep(u_layers.y - 0.025, u_layers.y + 0.025, v_x.x);
  vec3 sig = mix(mix(u_sig[0], u_sig[1], la), u_sig[2], lb);
  vec3 mc = mix(mix(u_milkC[0], u_milkC[1], la), u_milkC[2], lb);
  float mk = mix(mix(u_milk[0], u_milk[1], la), u_milk[2], lb);
  vec3 nV = mat3(u_view) * N;
  // lo que hay detrás (suelo con sombra y la franja crema interior), refractado según el grosor; a lineal
  vec3 bg = pow(texture(u_scene, clamp(uv - nV.xy * (0.035 + t * 0.05), 0.001, 0.999)).rgb, vec3(2.2));
  mc = pow(mc, vec3(2.2));
  float m = 1.0 - exp(-mk * t);
  vec3 col = bg * exp(-sig * t) * (1.0 - m) + mc * m;
  float dif = clamp(dot(N, u_L) * 0.5 + 0.5, 0.0, 1.0);
  col *= 0.9 + 0.3 * dif;
  // luz que entra por los bordes finos y biselados (brillo de borde, como en la foto)
  float rim = pow(1.0 - NdV, 2.5) * smoothstep(u_layers.x * 0.5, u_layers.y, v_x.x);
  col += (mc * 0.6 + 0.4) * rim * (0.18 + 0.35 * exp(-t * 4.0));
  vec3 R = reflect(-V, N);
  float F = 0.05 + 0.95 * pow(1.0 - NdV, 5.0);
  col = col * (1.0 - F) + env(R) * F;
  col *= 1.0 - 0.25 * (1.0 - smoothstep(0.0, 0.3, v_x.x));   // la base queda en sombra junto al suelo
  vec3 H = normalize(u_L + V);
  float NdH = max(dot(N, H), 0.0), NdL = max(dot(N, u_L), 0.0);
  float a2 = 0.0016, dd = NdH * NdH * (a2 - 1.0) + 1.0;
  float D = a2 / (3.14159 * dd * dd);
  col += vec3(1.0) * min(D * 0.06 * NdL, 4.0);
  float a2b = 0.012, ddb = NdH * NdH * (a2b - 1.0) + 1.0;
  col += vec3(0.95) * min(a2b / (3.14159 * ddb * ddb) * 0.05 * NdL, 1.5);
  vec3 H2 = normalize(normalize(vec3(0.8, 0.45, 0.4)) + V);
  float nh2 = max(dot(N, H2), 0.0), dd2 = nh2 * nh2 * (0.004 - 1.0) + 1.0;
  col += vec3(0.5) * min(0.004 / (3.14159 * dd2 * dd2) * 0.04, 2.0);
  o = vec4(pow(max(col, 0.0), vec3(1.0 / 2.2)), 1.0);
}`;

// Franja crema interior: opaca, mate con un poco de brillo (va dentro de la escena que refracta el cristal)
const FS_BAND = `#version 300 es
precision highp float;
in vec3 v_pos; in vec3 v_nrm;
uniform vec3 u_cam, u_L, u_color; out vec4 o;
void main() {
  vec3 N = normalize(v_nrm), V = normalize(u_cam - v_pos);
  vec3 base = pow(u_color, vec3(2.2));
  float dif = clamp(dot(N, u_L), 0.0, 1.0);
  vec3 col = base * (0.55 + 0.5 * dif);
  vec3 H = normalize(u_L + V); float nh = max(dot(N, H), 0.0), dd = nh * nh * (0.05 - 1.0) + 1.0;
  col += vec3(0.25) * min(0.05 / (3.14159 * dd * dd) * 0.1, 1.0);
  o = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

// Adornos opacos (crema / puntos de color) con brillo
const FS_DECO = `#version 300 es
precision highp float;
in vec3 v_pos; in vec3 v_nrm; in vec3 v_x;
uniform vec3 u_cam, u_L; out vec4 o;
void main() {
  vec3 N = normalize(v_nrm), V = normalize(u_cam - v_pos);
  float NdV = clamp(dot(N, V), 0.0, 1.0);
  vec3 col = pow(v_x, vec3(2.2)) * (0.55 + 0.5 * clamp(dot(N, u_L), 0.0, 1.0));
  float F = 0.05 + 0.95 * pow(1.0 - NdV, 5.0);
  col = mix(col, vec3(1.0), F * 0.7);
  vec3 H = normalize(u_L + V); float nh = max(dot(N, H), 0.0), dd = nh * nh * (0.006 - 1.0) + 1.0;
  col += vec3(0.8) * min(0.006 / (3.14159 * dd * dd) * 0.08, 1.5);
  o = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

/* =========================================================================
 * PIEZA
 * ========================================================================= */
export function createJelly3D(root, opts = {}) {
  const cfg = CONFIG3D;
  const shape = SHAPES[opts.shape] ?? SHAPES.cloud;
  const box = root.offsetParent || root.parentElement;
  const canvas = document.createElement('canvas');
  canvas.className = 'jelly3d-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', pointerEvents: 'none' });
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true });
  if (!gl) return null;

  const progs = {
    back: program(gl, VS, FS_BACK), height: program(gl, VS_HEIGHT, FS_HEIGHT),
    floor: program(gl, VS, FS_FLOOR), jelly: program(gl, VS, FS_JELLY), deco: program(gl, VS, FS_DECO), band: program(gl, VS, FS_BAND),
  };
  if (Object.values(progs).some(p => !p)) return null;

  /* ----- Modelo y estado físico ----- */
  const model = buildModel(shape, cfg);
  const np = model.particles.length / 3;
  const yaw = shape.yaw * DEG, cy = Math.cos(yaw), sy = Math.sin(yaw);
  const x = new Float32Array(np * 3), prev = new Float32Array(np * 3), v = new Float32Array(np * 3), home = new Float32Array(np * 3);
  for (let i = 0; i < np; i++) {
    const lx = model.particles[i * 3], ly = model.particles[i * 3 + 1], lz = model.particles[i * 3 + 2];
    x[i * 3] = lx * cy + lz * sy; x[i * 3 + 1] = ly; x[i * 3 + 2] = -lx * sy + lz * cy;
  }
  const x0 = Float32Array.from(x); // forma de reposo (para el shape matching)
  const tets = model.tets, nt = tets.length / 4;
  const restVol = new Float32Array(nt), invMass = new Float32Array(np);
  const edgeSet = new Map();
  for (let t = 0; t < nt; t++) {
    const vol = tetVol(x, tets, t); restVol[t] = vol;
    for (let q = 0; q < 4; q++) invMass[tets[t * 4 + q]] += Math.abs(vol) / 4;
    for (const [a, b] of [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]) {
      const i = tets[t * 4 + a], j = tets[t * 4 + b], key = i < j ? i * np + j : j * np + i;
      if (!edgeSet.has(key)) edgeSet.set(key, [Math.min(i, j), Math.max(i, j)]);
    }
  }
  for (let i = 0; i < np; i++) invMass[i] = invMass[i] > 0 ? 1 / invMass[i] : 0;
  const edges = new Uint32Array([...edgeSet.values()].flat()), ne = edges.length / 2;
  const restLen = new Float32Array(ne);
  for (let e = 0; e < ne; e++) restLen[e] = dist(x, edges[e * 2], edges[e * 2 + 1]);

  const surf = model.surface, deco = model.deco, band = model.band;
  const bPos = new Float32Array(band.n * 3), bNrm = new Float32Array(band.n * 3);
  const sPos = new Float32Array(surf.n * 3), sNrm = new Float32Array(surf.n * 3);
  const dPos = deco ? new Float32Array(deco.n * 3) : null, dNrm = deco ? new Float32Array(deco.n * 3) : null;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let grab = null, resetT = -1, sleeping = false, still = 0, acc = 0, last = 0, raf = 0, visible = true, destroyed = false;
  let moved = false, cursorOn = false;
  const bounds = { zNear: 1e9, zFar: -1e9, l: [-1e9, 0, 0], r: [1e9, 0, 0] };

  /* ----- Simulación XPBD ----- */
  function step(dt) {
    const P = cfg.physics, sub = P.substeps, h = dt / sub, g = P.gravity;
    const aE = P.edgeCompliance / (h * h), aV = P.volumeCompliance / (h * h);
    const air = Math.exp(-P.air * dt);
    for (let s = 0; s < sub; s++) {
      for (let i = 0; i < np; i++) {
        if (!invMass[i]) continue;
        const k = i * 3;
        v[k + 1] -= g * h;
        prev[k] = x[k]; prev[k + 1] = x[k + 1]; prev[k + 2] = x[k + 2];
        x[k] += v[k] * h; x[k + 1] += v[k + 1] * h; x[k + 2] += v[k + 2] * h;
      }
      // aristas
      for (let e = 0; e < ne; e++) {
        const i = edges[e * 2], j = edges[e * 2 + 1], wi = invMass[i], wj = invMass[j], w = wi + wj;
        const a = i * 3, b = j * 3;
        let dx = x[a] - x[b], dy = x[a + 1] - x[b + 1], dz = x[a + 2] - x[b + 2];
        const l = Math.hypot(dx, dy, dz); if (l < 1e-9) continue;
        const C = l - restLen[e], sc = -C / (w + aE) / l;
        dx *= sc; dy *= sc; dz *= sc;
        x[a] += dx * wi; x[a + 1] += dy * wi; x[a + 2] += dz * wi;
        x[b] -= dx * wj; x[b + 1] -= dy * wj; x[b + 2] -= dz * wj;
      }
      // volumen
      for (let t = 0; t < nt; t++) {
        const i0 = tets[t * 4] * 3, i1 = tets[t * 4 + 1] * 3, i2 = tets[t * 4 + 2] * 3, i3 = tets[t * 4 + 3] * 3;
        const g0 = cr(x, i1, i3, i2), g1 = cr(x, i0, i2, i3), g2 = cr(x, i0, i3, i1), g3 = cr(x, i0, i1, i2);
        const w0 = invMass[i0 / 3], w1 = invMass[i1 / 3], w2 = invMass[i2 / 3], w3 = invMass[i3 / 3];
        const w = w0 * sq(g0) + w1 * sq(g1) + w2 * sq(g2) + w3 * sq(g3);
        if (w < 1e-12) continue;
        const C = tetVolAt(x, i0, i1, i2, i3) - restVol[t], sc = -C / (w + aV);
        add(x, i0, g0, sc * w0); add(x, i1, g1, sc * w1); add(x, i2, g2, sc * w2); add(x, i3, g3, sc * w3);
      }
      if (P.shapeMatch > 0) shapeMatch(P.shapeMatch);
      // agarre: unión blanda del parche al puntero
      if (grab) {
        const aG = cfg.grab.compliance / (h * h);
        for (let n = 0; n < grab.ids.length; n++) {
          const i = grab.ids[n], k = i * 3, w = invMass[i];
          const gx = grab.target[0] + grab.off[n * 3], gy = grab.target[1] + grab.off[n * 3 + 1], gz = grab.target[2] + grab.off[n * 3 + 2];
          const f = w / (w + aG / grab.wt[n]);
          x[k] += (gx - x[k]) * f; x[k + 1] += (gy - x[k + 1]) * f; x[k + 2] += (gz - x[k + 2]) * f;
        }
      }
      // vuelta a su sitio: todas las partículas hacia la posición de reposo, cada vez más fuerte
      if (resetT >= 0) {
        const p = Math.min(1, resetT / cfg.reset.duration), s2 = p * p * (3 - 2 * p);
        const aR = Math.pow(10, -1 - 5 * s2) / (h * h);
        for (let i = 0; i < np; i++) {
          const k = i * 3, w = invMass[i], f = w / (w + aR);
          x[k] += (home[k] - x[k]) * f; x[k + 1] += (home[k + 1] - x[k + 1]) * f; x[k + 2] += (home[k + 2] - x[k + 2]) * f;
        }
      }
      // suelo (con rozamiento) y paredes
      const mu = P.friction;
      for (let i = 0; i < np; i++) {
        const k = i * 3;
        if (x[k + 1] < 0) {
          x[k + 1] = 0;
          x[k] = prev[k] + (x[k] - prev[k]) * (1 - mu); x[k + 2] = prev[k + 2] + (x[k + 2] - prev[k + 2]) * (1 - mu);
        }
        wall(k);
      }
      for (let i = 0; i < np; i++) {
        const k = i * 3;
        v[k] = (x[k] - prev[k]) / h; v[k + 1] = (x[k + 1] - prev[k + 1]) / h; v[k + 2] = (x[k + 2] - prev[k + 2]) / h;
      }
    }
    // amortiguación interna: solo la velocidad relativa a lo largo de las aristas
    const kd = Math.min(0.5, P.damping * dt);
    for (let e = 0; e < ne; e++) {
      const a = edges[e * 2] * 3, b = edges[e * 2 + 1] * 3;
      let nx = x[b] - x[a], ny = x[b + 1] - x[a + 1], nz = x[b + 2] - x[a + 2];
      const l = Math.hypot(nx, ny, nz); if (l < 1e-9) continue; nx /= l; ny /= l; nz /= l;
      const rv = ((v[b] - v[a]) * nx + (v[b + 1] - v[a + 1]) * ny + (v[b + 2] - v[a + 2]) * nz) * kd * 0.5;
      v[a] += nx * rv; v[a + 1] += ny * rv; v[a + 2] += nz * rv;
      v[b] -= nx * rv; v[b + 1] -= ny * rv; v[b + 2] -= nz * rv;
    }
    let vmax = 0;
    for (let i = 0; i < np * 3; i++) { v[i] *= air; vmax = Math.max(vmax, Math.abs(v[i])); }
    if (resetT >= 0) { resetT += dt; if (resetT > cfg.reset.duration) resetT = -1; }
    return vmax;
  }
  function wall(k) {
    const z = x[k + 2];
    if (z > bounds.zNear) x[k + 2] = bounds.zNear; else if (z < bounds.zFar) x[k + 2] = bounds.zFar;
    const xl = bounds.l[0] + (x[k + 2] - bounds.l[1]) * bounds.l[2], xr = bounds.r[0] + (x[k + 2] - bounds.r[1]) * bounds.r[2];
    if (x[k] < xl) x[k] = xl; else if (x[k] > xr) x[k] = xr;
  }

  /* ----- Shape matching: la pieza tiende a su forma de reposo mejor encajada (rotada y trasladada) ----- */
  const mass = new Float32Array(np); let M = 0;
  for (let i = 0; i < np; i++) { mass[i] = invMass[i] ? 1 / invMass[i] : 0; M += mass[i]; }
  const c0 = [0, 0, 0];
  for (let i = 0; i < np; i++) for (let q = 0; q < 3; q++) c0[q] += x0[i * 3 + q] * mass[i] / M;
  function centroid() {
    const c = [0, 0, 0];
    for (let i = 0; i < np; i++) for (let q = 0; q < 3; q++) c[q] += x[i * 3 + q] * mass[i] / M;
    return c;
  }
  function shapeMatch(k) {
    const c = centroid(), A = new Float64Array(9);
    for (let i = 0; i < np; i++) {
      const m = mass[i], px = x[i * 3] - c[0], py = x[i * 3 + 1] - c[1], pz = x[i * 3 + 2] - c[2];
      const qx = x0[i * 3] - c0[0], qy = x0[i * 3 + 1] - c0[1], qz = x0[i * 3 + 2] - c0[2];
      A[0] += m * px * qx; A[1] += m * px * qy; A[2] += m * px * qz;
      A[3] += m * py * qx; A[4] += m * py * qy; A[5] += m * py * qz;
      A[6] += m * pz * qx; A[7] += m * pz * qy; A[8] += m * pz * qz;
    }
    const R = polar(A);
    for (let i = 0; i < np; i++) {
      const qx = x0[i * 3] - c0[0], qy = x0[i * 3 + 1] - c0[1], qz = x0[i * 3 + 2] - c0[2];
      const gx = R[0] * qx + R[1] * qy + R[2] * qz + c[0], gy = R[3] * qx + R[4] * qy + R[5] * qz + c[1], gz = R[6] * qx + R[7] * qy + R[8] * qz + c[2];
      x[i * 3] += (gx - x[i * 3]) * k; x[i * 3 + 1] += (gy - x[i * 3 + 1]) * k; x[i * 3 + 2] += (gz - x[i * 3 + 2]) * k;
    }
  }

  // Asentar la pieza en reposo antes de mostrarla (y guardar esa forma como «su sitio»)
  function settle() {
    for (let n = 0; n < cfg.physics.settleSteps; n++) { step(1 / cfg.physics.hz); for (let i = 0; i < np * 3; i++) v[i] *= 0.85; }
    v.fill(0); home.set(x);
  }

  /* ----- Superficie cosida a los tetraedros ----- */
  function skin(m, out, nrm) {
    for (let n = 0; n < m.n; n++) {
      let px = 0, py = 0, pz = 0;
      for (let q = 0; q < 4; q++) { const i = m.ids[n * 4 + q] * 3, w = m.w[n * 4 + q]; px += x[i] * w; py += x[i + 1] * w; pz += x[i + 2] * w; }
      out[n * 3] = px; out[n * 3 + 1] = py; out[n * 3 + 2] = pz;
    }
    nrm.fill(0);
    const I = m.index;
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const ux = out[b] - out[a], uy = out[b + 1] - out[a + 1], uz = out[b + 2] - out[a + 2];
      const vx = out[c] - out[a], vy = out[c + 1] - out[a + 1], vz = out[c + 2] - out[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const k of [a, b, c]) { nrm[k] += nx; nrm[k + 1] += ny; nrm[k + 2] += nz; }
    }
    for (let k = 0; k < nrm.length; k += 3) { const l = Math.hypot(nrm[k], nrm[k + 1], nrm[k + 2]) || 1; nrm[k] /= l; nrm[k + 1] /= l; nrm[k + 2] /= l; }
  }

  /* ----- GPU: buffers ----- */
  const mkMesh = (m, posArr, nrmArr) => {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const pb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferData(gl.ARRAY_BUFFER, posArr.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    const nb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, nb); gl.bufferData(gl.ARRAY_BUFFER, nrmArr.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    const xb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, xb); gl.bufferData(gl.ARRAY_BUFFER, m.extra, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.index, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao, pb, nb, count: m.index.length, upload() {
      gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, posArr);
      gl.bindBuffer(gl.ARRAY_BUFFER, nb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, nrmArr);
    } };
  };
  const gSurf = mkMesh(surf, sPos, sNrm), gDeco = deco ? mkMesh(deco, dPos, dNrm) : null, gBand = mkMesh(band, bPos, bNrm);
  const floorVao = gl.createVertexArray(); gl.bindVertexArray(floorVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-30, 0, -30, 30, 0, -30, -30, 0, 30, 30, 0, 30]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.vertexAttrib3f(1, 0, 1, 0); gl.vertexAttrib3f(2, 0, 0, 0);
  gl.bindVertexArray(null);

  const HS = 512;
  const heightT = tex(gl, HS, HS, true), heightFB = fbo(gl, heightT, null);
  let sceneT, sceneFB, sceneDepth, backT, backDepth, backFB, W = 1, H = 1;

  /* ----- Cámara: la pieza en reposo ocupa el sitio y el tamaño del elemento `root` ----- */
  let view, proj, viewProj, invVP, cam, far;
  function layout() {
    const br = box.getBoundingClientRect(), rr = root.getBoundingClientRect();
    if (!br.width || !br.height || !rr.width) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, cfg.maxDpr);
    const w = Math.round(br.width * dpr), hh = Math.round(br.height * dpr);
    if (w !== W || hh !== H) {
      W = w; H = hh; canvas.width = W; canvas.height = H;
      [sceneT, backT].forEach(t => t && gl.deleteTexture(t));
      const rb = () => { const d = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, d); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, W, H); return d; };
      sceneT = tex(gl, W, H); sceneDepth = rb(); sceneFB = fbo(gl, sceneT, sceneDepth);
      backT = tex(gl, W, H); backDepth = rb(); backFB = fbo(gl, backT, backDepth);
    }
    const fov = cfg.camera.fov * DEG, el = cfg.camera.elevation * DEG;
    // ancho en pantalla de la pieza en reposo
    let mn = Infinity, mx = -Infinity;
    for (const p of model.outline) { const wx = p.x * cy + p.z * sy; mn = Math.min(mn, wx); mx = Math.max(mx, wx); }
    const fpx = (br.height / 2) / Math.tan(fov / 2);
    const d = (mx - mn) * fpx / (rr.width * cfg.camera.fill);
    const target = [0, model.T * 0.45, 0];
    cam = [0, target[1] + d * Math.sin(el), d * Math.cos(el)];
    far = d * 4;
    const hx = (rr.left + rr.width / 2 - br.left) / br.width * 2 - 1, hy = 1 - (rr.top + rr.height / 2 - br.top) / br.height * 2;
    view = lookAt(cam, target, [0, 1, 0]);
    proj = perspective(fov, br.width / br.height, d * 0.2, far, hx, hy);
    viewProj = mul4(proj, view); invVP = invert4(viewProj);
    // paredes: los bordes de la tarjeta proyectados sobre el suelo, con margen
    const floorAt = (nx, ny) => { const [o, dir] = rayNdc(nx, ny); return dir[1] < -1e-4 ? [o[0] - dir[0] * o[1] / dir[1], o[2] - dir[2] * o[1] / dir[1]] : null; };
    const m = 0.45;
    const lA = floorAt(-1, -1), lB = floorAt(-1, hy), rA = floorAt(1, -1), rB = floorAt(1, hy);
    if (lA && lB && rA && rB) {
      bounds.zNear = Math.max(lA[1], rA[1]) + 0.1;
      bounds.l = [lA[0] - m, lA[1], (lB[0] - lA[0]) / (lB[1] - lA[1] || 1)];
      bounds.r = [rA[0] + m, rA[1], (rB[0] - rA[0]) / (rB[1] - rA[1] || 1)];
      bounds.zFar = Math.min(-1.2, lB[1] - 1.2);
    }
    return true;
  }
  function rayNdc(nx, ny) {
    const a = xform(invVP, nx, ny, -1), b = xform(invVP, nx, ny, 1);
    const o = [a[0] / a[3], a[1] / a[3], a[2] / a[3]], e = [b[0] / b[3], b[1] / b[3], b[2] / b[3]];
    const d = [e[0] - o[0], e[1] - o[1], e[2] - o[2]], l = Math.hypot(...d);
    return [o, [d[0] / l, d[1] / l, d[2] / l]];
  }
  function rayClient(cx, cyy) {
    const r = canvas.getBoundingClientRect();
    return rayNdc((cx - r.left) / r.width * 2 - 1, 1 - (cyy - r.top) / r.height * 2);
  }

  /* ----- Dibujo ----- */
  const L = norm([-0.45, 0.85, 0.42]);
  const bgColor = () => {
    for (let el = box; el; el = el.parentElement) {
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || +m[3] > 0)) return [m[0] / 255, m[1] / 255, m[2] / 255];
    }
    return [1, 1, 1];
  };
  let bg = bgColor();
  function draw() {
    skin(surf, sPos, sNrm); gSurf.upload();
    skin(band, bPos, bNrm); gBand.upload();
    if (deco) { skin(deco, dPos, dNrm); gDeco.upload(); }
    let cxs = 0, czs = 0; for (let i = 0; i < np; i++) { cxs += x[i * 3]; czs += x[i * 3 + 2]; } cxs /= np; czs /= np;
    const S = 2.6;

    // 1 · mapa de alturas
    gl.bindFramebuffer(gl.FRAMEBUFFER, heightFB); gl.viewport(0, 0, HS, HS);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND); gl.blendEquation(gl.MAX); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(progs.height);
    gl.uniform2f(U(progs.height, 'u_c'), cxs, czs); gl.uniform1f(U(progs.height, 'u_s'), S);
    gl.bindVertexArray(gSurf.vao); gl.drawElements(gl.TRIANGLES, gSurf.count, gl.UNSIGNED_INT, 0);
    gl.blendEquation(gl.FUNC_ADD); gl.disable(gl.BLEND);
    gl.bindTexture(gl.TEXTURE_2D, heightT); gl.generateMipmap(gl.TEXTURE_2D);

    // 2 · suelo para la refracción
    const floorU = (mode) => {
      const p = progs.floor; gl.useProgram(p); setCam(p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, heightT); gl.uniform1i(U(p, 'u_height'), 0);
      gl.uniform2f(U(p, 'u_c'), cxs, czs); gl.uniform1f(U(p, 'u_s'), S);
      gl.uniform3fv(U(p, 'u_bg'), bg); gl.uniform3fv(U(p, 'u_tint'), shape.tint);
      gl.uniform2f(U(p, 'u_shift'), -L[0] * 0.03, -L[2] * 0.03);
      gl.uniform1f(U(p, 'u_mode'), mode); gl.uniform1f(U(p, 'u_strength'), cfg.shadow.strength); gl.uniform1f(U(p, 'u_contact'), cfg.shadow.contact);
      gl.bindVertexArray(floorVao); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFB); gl.viewport(0, 0, W, H);
    gl.clearDepth(1); gl.clear(gl.DEPTH_BUFFER_BIT);
    floorU(0);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    const pb = progs.band; gl.useProgram(pb); setCam(pb); gl.uniform3fv(U(pb, 'u_L'), L); gl.uniform3fv(U(pb, 'u_color'), shape.materials[1].milkColor);
    gl.bindVertexArray(gBand.vao); gl.drawElements(gl.TRIANGLES, gBand.count, gl.UNSIGNED_INT, 0);

    // 3 · caras traseras → grosor
    gl.bindFramebuffer(gl.FRAMEBUFFER, backFB); gl.viewport(0, 0, W, H);
    gl.clearColor(1, 1, 0, 1); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT);
    gl.useProgram(progs.back); setCam(progs.back); gl.uniform1f(U(progs.back, 'u_far'), far);
    gl.bindVertexArray(gSurf.vao); gl.drawElements(gl.TRIANGLES, gSurf.count, gl.UNSIGNED_INT, 0);
    gl.cullFace(gl.BACK);
    gl.bindVertexArray(gBand.vao); gl.drawElements(gl.TRIANGLES, gBand.count, gl.UNSIGNED_INT, 0);

    // 4 · pantalla: sombra, gelatina y adornos
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    floorU(1);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    const pj = progs.jelly; gl.useProgram(pj); setCam(pj);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sceneT); gl.uniform1i(U(pj, 'u_scene'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, backT); gl.uniform1i(U(pj, 'u_back'), 1);
    gl.uniform2f(U(pj, 'u_res'), W, H); gl.uniform1f(U(pj, 'u_far'), far); gl.uniform3fv(U(pj, 'u_L'), L);
    gl.uniform3fv(U(pj, 'u_sig'), shape.materials.flatMap(m => m.sigma));
    gl.uniform3fv(U(pj, 'u_milkC'), shape.materials.flatMap(m => m.milkColor));
    gl.uniform1fv(U(pj, 'u_milk'), shape.materials.map(m => m.milk));
    gl.uniform2f(U(pj, 'u_layers'), shape.layers[0], shape.layers[1]);
    gl.bindVertexArray(gSurf.vao); gl.drawElements(gl.TRIANGLES, gSurf.count, gl.UNSIGNED_INT, 0);
    if (gDeco) {
      const pd = progs.deco; gl.useProgram(pd); setCam(pd); gl.uniform3fv(U(pd, 'u_L'), L);
      gl.bindVertexArray(gDeco.vao); gl.drawElements(gl.TRIANGLES, gDeco.count, gl.UNSIGNED_INT, 0);
    }
    gl.bindVertexArray(null);
  }
  const uCache = new Map();
  function U(p, n) { const k = p; if (!uCache.has(k)) uCache.set(k, {}); const c = uCache.get(k); if (!(n in c)) c[n] = gl.getUniformLocation(p, n); return c[n]; }
  function setCam(p) {
    gl.uniformMatrix4fv(U(p, 'u_view'), false, view); gl.uniformMatrix4fv(U(p, 'u_proj'), false, proj);
    gl.uniform3fv(U(p, 'u_cam'), cam);
  }

  /* ----- Bucle ----- */
  function frame(now) {
    raf = 0;
    if (destroyed) return;
    const t = now / 1000, dt = last ? Math.min(t - last, 0.1) : 1 / cfg.physics.hz;
    last = t;
    acc += dt;
    const fixed = 1 / cfg.physics.hz;
    let n = 0, vmax = 0;
    while (acc >= fixed && n < 3) { vmax = Math.max(vmax, step(fixed)); acc -= fixed; n++; }
    if (n === 3) acc = 0;
    draw();
    still = vmax < cfg.sleep.speed && !grab && resetT < 0 ? still + 1 : 0;
    sleeping = still > cfg.sleep.frames;
    if (!sleeping && visible) raf = requestAnimationFrame(frame);
  }
  const wake = () => { sleeping = false; still = 0; if (!raf && !destroyed && visible) { last = 0; raf = requestAnimationFrame(frame); } };

  /* ----- Puntero: rayo contra la superficie deformada ----- */
  function pick(cx, cyy) {
    const [o, d] = rayClient(cx, cyy), I = surf.index;
    let best = Infinity, hit = null;
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const e1 = [sPos[b] - sPos[a], sPos[b + 1] - sPos[a + 1], sPos[b + 2] - sPos[a + 2]];
      const e2 = [sPos[c] - sPos[a], sPos[c + 1] - sPos[a + 1], sPos[c + 2] - sPos[a + 2]];
      const p = cross3(d, e2), det = dot3(e1, p); if (Math.abs(det) < 1e-12) continue;
      const tv = [o[0] - sPos[a], o[1] - sPos[a + 1], o[2] - sPos[a + 2]];
      const u = dot3(tv, p) / det; if (u < 0 || u > 1) continue;
      const q = cross3(tv, e1), w = dot3(d, q) / det; if (w < 0 || u + w > 1) continue;
      const dist = dot3(e2, q) / det;
      if (dist > 0 && dist < best) { best = dist; hit = [o[0] + d[0] * dist, o[1] + d[1] * dist, o[2] + d[2] * dist]; }
    }
    return hit;
  }
  function planeTarget(cx, cyy) {
    const [o, d] = rayClient(cx, cyy), n = grab.normal;
    const den = dot3(d, n); if (Math.abs(den) < 1e-6) return grab.target;
    const t = dot3([grab.point[0] - o[0], grab.point[1] - o[1], grab.point[2] - o[2]], n) / den;
    const p = [o[0] + d[0] * t, Math.min(cfg.grab.maxHeight, Math.max(0, o[1] + d[1] * t)), o[2] + d[2] * t];
    // tope de la flexión: el punto agarrado no se aleja del centro del cuerpo más que en reposo + maxStretch
    const c = centroid(), dx = p[0] - c[0], dy = p[1] - c[1], dz = p[2] - c[2], l = Math.hypot(dx, dy, dz), mx = grab.restDist + cfg.grab.maxStretch;
    if (l > mx) { p[0] = c[0] + dx / l * mx; p[1] = c[1] + dy / l * mx; p[2] = c[2] + dz / l * mx; }
    p[1] = Math.min(cfg.grab.maxHeight, Math.max(grab.point[1] - 0.03, p[1]));
    // dentro de las paredes
    p[2] = Math.min(bounds.zNear, Math.max(bounds.zFar, p[2]));
    const xl = bounds.l[0] + (p[2] - bounds.l[1]) * bounds.l[2], xr = bounds.r[0] + (p[2] - bounds.r[1]) * bounds.r[2];
    p[0] = Math.min(xr, Math.max(xl, p[0]));
    return p;
  }
  // Impulso hacia abajo alrededor de un punto de la superficie (temblor)
  function poke(at, kick, R) {
    for (let i = 0; i < np; i++) {
      const dd = Math.hypot(x[i * 3] - at[0], x[i * 3 + 1] - at[1], x[i * 3 + 2] - at[2]);
      if (dd < R) v[i * 3 + 1] -= kick * (1 - dd / R);
    }
    wake();
  }
  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const hit = pick(e.clientX, e.clientY); if (!hit) return;
    e.preventDefault();
    const R = cfg.grab.radius, ids = [], wt = [], off = [];
    for (let i = 0; i < np; i++) {
      const dd = Math.hypot(x[i * 3] - hit[0], x[i * 3 + 1] - hit[1], x[i * 3 + 2] - hit[2]);
      if (dd < R) { ids.push(i); wt.push(1 - dd / R); off.push(x[i * 3] - hit[0], x[i * 3 + 1] - hit[1], x[i * 3 + 2] - hit[2]); }
    }
    if (!ids.length) return;
    const fwd = norm([cam[0] - hit[0], cam[1] - hit[1], cam[2] - hit[2]]);
    const c = centroid();
    grab = { id: e.pointerId, ids, wt, off, point: hit, normal: fwd, target: hit.slice(), sx: e.clientX, sy: e.clientY, moved: false,
      restDist: Math.hypot(hit[0] - c[0], hit[1] - c[1], hit[2] - c[2]) };
    resetT = -1;
    try { box.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
    box.style.cursor = 'grabbing';
    wake();
  }
  function onMove(e) {
    if (grab && e.pointerId === grab.id) {
      if (!grab.moved && Math.hypot(e.clientX - grab.sx, e.clientY - grab.sy) > 4) grab.moved = true;
      grab.target = planeTarget(e.clientX, e.clientY);
      wake();
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const hit = pick(e.clientX, e.clientY), on = !!hit;
    if (on !== cursorOn) {
      cursorOn = on; box.style.cursor = on ? 'grab' : '';
      if (on && !reduce.matches) poke(hit, cfg.hover.kick, cfg.hover.radius);
    }
  }
  function onUp(e) {
    if (!grab || e.pointerId !== grab.id) return;
    const g = grab; grab = null;
    try { box.releasePointerCapture(e.pointerId); } catch { /* ya liberado */ }
    box.style.cursor = cursorOn ? 'grab' : '';
    if (g.moved) {
      moved = true;
      // el clic que sigue al arrastre no debe llegar a la tarjeta
      const stop = ev => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('click', stop, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 0);
    } else {
      // clic sin arrastrar: un golpecito
      poke(g.point, cfg.grab.clickKick, cfg.grab.radius);
    }
    wake();
  }
  // En táctil, si el dedo cae sobre la pieza no se desplaza la página
  function onTouch(e) { const t = e.touches[0]; if (t && pick(t.clientX, t.clientY)) e.preventDefault(); }
  function onLeave() { if (cursorOn && !grab) { cursorOn = false; box.style.cursor = ''; } }

  box.addEventListener('pointerdown', onDown, true);
  box.addEventListener('pointermove', onMove);
  box.addEventListener('pointerup', onUp);
  box.addEventListener('pointercancel', onUp);
  box.addEventListener('pointerleave', onLeave);
  box.addEventListener('touchstart', onTouch, { passive: false });

  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !sleeping) wake(); });
  io.observe(box);
  const ro = new ResizeObserver(() => { if (layout()) { bg = bgColor(); draw(); } });
  ro.observe(box); ro.observe(root);

  box.appendChild(canvas);
  layout(); settle(); draw();
  root.classList.add('jelly--3d');

  return {
    kind: '3d',
    reset() { if (grab || !moved) return; moved = false; resetT = 0; wake(); },
    get moved() { return moved; },
    /** Caja envolvente de las partículas (para pruebas). */
    bbox() {
      const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
      for (let i = 0; i < np; i++) for (let q = 0; q < 3; q++) { b[q] = Math.min(b[q], x[i * 3 + q]); b[q + 3] = Math.max(b[q + 3], x[i * 3 + q]); }
      return b.map(n => +n.toFixed(2));
    },
    get stats() { return { particles: np, tets: nt, edges: ne, surface: surf.n }; },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      box.removeEventListener('pointerdown', onDown, true); box.removeEventListener('pointermove', onMove);
      box.removeEventListener('pointerup', onUp); box.removeEventListener('pointercancel', onUp);
      box.removeEventListener('pointerleave', onLeave); box.removeEventListener('touchstart', onTouch);
      box.style.cursor = ''; root.classList.remove('jelly--3d');
      canvas.remove(); gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

/* ---------- utilidades ---------- */
function dist(x, i, j) { return Math.hypot(x[i * 3] - x[j * 3], x[i * 3 + 1] - x[j * 3 + 1], x[i * 3 + 2] - x[j * 3 + 2]); }
function tetVol(x, tets, t) { return tetVolAt(x, tets[t * 4] * 3, tets[t * 4 + 1] * 3, tets[t * 4 + 2] * 3, tets[t * 4 + 3] * 3); }
function tetVolAt(x, a, b, c, d) {
  const ux = x[b] - x[a], uy = x[b + 1] - x[a + 1], uz = x[b + 2] - x[a + 2];
  const vx = x[c] - x[a], vy = x[c + 1] - x[a + 1], vz = x[c + 2] - x[a + 2];
  const wx = x[d] - x[a], wy = x[d + 1] - x[a + 1], wz = x[d + 2] - x[a + 2];
  return ((uy * vz - uz * vy) * wx + (uz * vx - ux * vz) * wy + (ux * vy - uy * vx) * wz) / 6;
}
// gradiente de volumen respecto a un vértice: (x[b]-x[a]) × (x[c]-x[a]) / 6
function cr(x, a, b, c) {
  const ux = x[b] - x[a], uy = x[b + 1] - x[a + 1], uz = x[b + 2] - x[a + 2];
  const vx = x[c] - x[a], vy = x[c + 1] - x[a + 1], vz = x[c + 2] - x[a + 2];
  return [(uy * vz - uz * vy) / 6, (uz * vx - ux * vz) / 6, (ux * vy - uy * vx) / 6];
}
function sq(g) { return g[0] * g[0] + g[1] * g[1] + g[2] * g[2]; }
function add(x, i, g, s) { x[i] += g[0] * s; x[i + 1] += g[1] * s; x[i + 2] += g[2] * s; }
// Parte de rotación de una matriz 3×3 (descomposición polar por iteración de Higham)
function polar(A) {
  let R = Float64Array.from(A);
  for (let it = 0; it < 12; it++) {
    const [a, b, c, d, e, f, g, h, i] = R;
    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    if (Math.abs(det) < 1e-12) break;
    // inversa transpuesta
    const it0 = (e * i - f * h) / det, it1 = (f * g - d * i) / det, it2 = (d * h - e * g) / det;
    const it3 = (c * h - b * i) / det, it4 = (a * i - c * g) / det, it5 = (b * g - a * h) / det;
    const it6 = (b * f - c * e) / det, it7 = (c * d - a * f) / det, it8 = (a * e - b * d) / det;
    const N = [(a + it0) / 2, (b + it1) / 2, (c + it2) / 2, (d + it3) / 2, (e + it4) / 2, (f + it5) / 2, (g + it6) / 2, (h + it7) / 2, (i + it8) / 2];
    let diff = 0; for (let k = 0; k < 9; k++) diff += Math.abs(N[k] - R[k]);
    R = Float64Array.from(N);
    if (diff < 1e-7) break;
  }
  return R;
}
function norm(a) { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

function program(gl, vs, fs) {
  const sh = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('jelly3d shader:', gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn('jelly3d link:', gl.getProgramInfoLog(p)); return null; }
  return p;
}
function tex(gl, w, h, mip = false) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}
function fbo(gl, t, depth) {
  const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
  if (depth) gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return f;
}
