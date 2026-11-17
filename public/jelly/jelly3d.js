/**
 * jelly3d.js · Piezas de gominola en 3D con física de sólido blando real (sin dependencias).
 *
 * GEOMETRÍA · Cada pieza está medida sobre su foto de referencia (assets/jelly): contorno en planta,
 * grosor, altura de cada capa, pose y perspectiva de la cámara, y posición de cada adorno. En reposo
 * el render ocupa exactamente el sitio de la foto recortada (public/jelly/*.webp).
 *
 * FÍSICA · El cuerpo es una malla volumétrica de tetraedros (retícula de celdas partidas en 6 tetraedros)
 * resuelta con XPBD a 60 Hz fijos y 10 subpasos:
 *   - restricción de distancia en cada arista (elasticidad, con «compliance» finita → blanda)
 *   - restricción de volumen en cada tetraedro (casi incompresible: al estirarla adelgaza)
 *   - «shape matching» suave hacia la forma rígida mejor encajada (no se pliega por mucho que se tire)
 *   - amortiguación solo de la velocidad relativa a lo largo de las aristas
 *   - contacto con el suelo con rozamiento y paredes invisibles en los bordes de la tarjeta
 *   - agarre: unión blanda a un parche de partículas alrededor del punto pulsado, con alcance limitado
 * La superficie lisa, la franja interior y los adornos son mallas aparte: cada vértice va «cosido» a un
 * tetraedro con coordenadas baricéntricas, así se estiran y giran con la gelatina que los rodea.
 *
 * RENDER (WebGL2, luz en espacio lineal) · 1) suelo + franja crema interior en una textura (lo que se ve
 * a través del cristal); 2) caras traseras y franja para medir cuánta gelatina atraviesa cada rayo;
 * 3) caras delanteras: refracción según ese grosor, absorción Beer–Lambert y dispersión por capas,
 * motas y vetas de luz, reflejos Fresnel de una carpa de luz con cajas y brillos especulares;
 * 4) calcas (sombras de los relieves, ranura) y adornos esmaltados. Sombra suave en el suelo a partir de
 * un mapa de alturas visto desde arriba.
 *
 * Uso: const j = createJelly3D(el, { shape: 'cloud' | 'web' | 'chip' }); → null si no hay WebGL2 (o la forma no existe).
 *      j.reset() la devuelve a su sitio · j.hop() da un saltito (al pasar el ratón por la tarjeta) · j.destroy()
 *      Al hacerle clic (sin arrastrar), `el` emite el evento «jellypoke» (burbujea).
 * `el` es el hueco de la foto (mismo tamaño y proporción); el lienzo cubre su contenedor posicionado
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
  // Rebote al entrar el ratón en la tarjeta. Es solo visual (no toca la física: con la gravedad y la firmeza
  // de la gelatina un salto real dura 0,1 s y no se ve): se agacha, salta, al caer se aplasta, da un rebotito
  // y tiembla. height = altura del salto (la pieza mide 2 de ancho) · air = tiempo en el aire (s) ·
  // crouch = lo que tarda en agacharse (s) · squash = cuánto se aplasta / estira (0-1) · bounce = lo que
  // conserva del salto al rebotar · freq / damping = muelle del aplastamiento (Hz, 0-1) · cooldown = tiempo
  // mínimo entre rebotes (s) · afterPlay = sin rebotes mientras se juega con la pieza y hasta estos s después
  hop: { height: 0.1, air: 0.3, crouch: 0.07, squash: 0.07, bounce: 0.3, freq: 4.5, damping: 0.28, cooldown: 1.5, afterPlay: 5 },
  grab: {
    radius: 0.55,           // tamaño del parche agarrado (grande: el tirón se reparte y no pellizca)
    compliance: 2e-3,       // unión del parche al puntero (nunca rígido, para que no pellizque)
    maxHeight: 0.7,         // hasta dónde se puede levantar
    maxStretch: 0.2,        // cuánto puede alejarse el punto agarrado del cuerpo (tope de la flexión)
    clickKick: 2.4,         // golpecito al hacer clic sin arrastrar
  },
  reset: { duration: 0.8 }, // vuelta a su sitio (s)
  shadow: { strength: 0.3, contact: 0.3 },
  sleep: { speed: 0.012, frames: 45 }, // se detiene (0 % CPU) cuando todo está quieto
  maxDpr: 2,
};

/* =========================================================================
 * PIEZAS · medidas sobre las fotos de referencia
 *
 * outline / rect   contorno en planta (x, z); z negativo = fondo. La nube trae el contorno ya orientado.
 * cell             tamaño de celda de la malla física, si no es el general (CONFIG3D.physics.cell)
 * pins             patitas en la base (chip); deco = relieves de la cara superior (barras, puntos, marco, estrella)
 * thickness        grosor total; bevelTop / bevelBottom = radio del canto superior / inferior
 * layers           alturas relativas (0-1) donde acaba la base y donde acaba la franja crema
 * view             cámara de la foto: elevación (°), distancia, escala (anchos de foto por unidad) y
 *                  punto de la foto (0-1) donde cae el centro de la pieza
 * materials        [base, franja, tapa] · sigma = absorción RGB por unidad (lineal) · scatter = densidad
 *                  de dispersión («leche») · color = color de esa dispersión (sRGB) · path = recorrido
 *                  máximo efectivo (satura la absorción en los tramos largos) · shade = cuánto oscurece
 *                  el lado que no mira a la luz (0 = nada: la luz se reparte por dentro)
 * ========================================================================= */
const CLOUD_OUTLINE = [[0.177,-0.751],[0.201,-0.748],[0.225,-0.747],[0.249,-0.742],[0.273,-0.736],[0.296,-0.728],[0.319,-0.717],[0.342,-0.704],[0.364,-0.688],[0.386,-0.67],[0.407,-0.649],[0.427,-0.626],[0.448,-0.603],[0.469,-0.584],[0.492,-0.571],[0.516,-0.565],[0.54,-0.565],[0.564,-0.569],[0.588,-0.573],[0.611,-0.577],[0.635,-0.577],[0.659,-0.577],[0.683,-0.576],[0.707,-0.571],[0.731,-0.565],[0.755,-0.557],[0.778,-0.548],[0.801,-0.536],[0.824,-0.523],[0.846,-0.507],[0.868,-0.488],[0.889,-0.467],[0.909,-0.444],[0.928,-0.418],[0.945,-0.388],[0.96,-0.355],[0.974,-0.32],[0.985,-0.282],[0.994,-0.242],[1,-0.2],[0.992,-0.161],[0.978,-0.126],[0.963,-0.093],[0.946,-0.062],[0.927,-0.035],[0.908,-0.009],[0.887,0.012],[0.866,0.033],[0.845,0.052],[0.823,0.07],[0.801,0.086],[0.778,0.101],[0.756,0.115],[0.733,0.129],[0.71,0.141],[0.687,0.154],[0.664,0.166],[0.641,0.178],[0.618,0.191],[0.595,0.202],[0.572,0.215],[0.549,0.226],[0.526,0.239],[0.503,0.251],[0.48,0.263],[0.457,0.276],[0.434,0.288],[0.411,0.3],[0.388,0.312],[0.365,0.324],[0.342,0.337],[0.319,0.349],[0.296,0.361],[0.273,0.373],[0.25,0.385],[0.227,0.397],[0.204,0.41],[0.181,0.422],[0.158,0.435],[0.135,0.447],[0.112,0.46],[0.089,0.471],[0.066,0.484],[0.043,0.496],[0.02,0.509],[-0.003,0.521],[-0.026,0.533],[-0.049,0.546],[-0.072,0.558],[-0.095,0.57],[-0.118,0.582],[-0.141,0.595],[-0.164,0.607],[-0.187,0.619],[-0.21,0.632],[-0.233,0.644],[-0.256,0.656],[-0.279,0.668],[-0.302,0.68],[-0.325,0.692],[-0.348,0.702],[-0.371,0.712],[-0.395,0.721],[-0.418,0.728],[-0.442,0.735],[-0.466,0.741],[-0.49,0.744],[-0.514,0.748],[-0.538,0.749],[-0.562,0.751],[-0.586,0.748],[-0.609,0.745],[-0.633,0.741],[-0.657,0.734],[-0.681,0.727],[-0.704,0.719],[-0.727,0.708],[-0.75,0.697],[-0.773,0.683],[-0.796,0.668],[-0.818,0.651],[-0.84,0.633],[-0.861,0.614],[-0.882,0.592],[-0.901,0.568],[-0.92,0.541],[-0.938,0.511],[-0.954,0.479],[-0.969,0.446],[-0.983,0.411],[-0.994,0.373],[-1,0.332],[-0.995,0.29],[-0.987,0.25],[-0.976,0.212],[-0.963,0.176],[-0.948,0.142],[-0.932,0.11],[-0.914,0.082],[-0.895,0.056],[-0.875,0.031],[-0.854,0.009],[-0.833,-0.011],[-0.812,-0.029],[-0.789,-0.045],[-0.767,-0.06],[-0.748,-0.084],[-0.744,-0.126],[-0.74,-0.169],[-0.736,-0.211],[-0.73,-0.253],[-0.723,-0.293],[-0.713,-0.332],[-0.7,-0.369],[-0.685,-0.403],[-0.669,-0.433],[-0.65,-0.461],[-0.631,-0.486],[-0.61,-0.509],[-0.589,-0.528],[-0.567,-0.546],[-0.545,-0.562],[-0.522,-0.576],[-0.499,-0.589],[-0.476,-0.601],[-0.453,-0.61],[-0.429,-0.618],[-0.406,-0.624],[-0.382,-0.629],[-0.358,-0.634],[-0.334,-0.634],[-0.31,-0.634],[-0.286,-0.634],[-0.262,-0.631],[-0.238,-0.627],[-0.214,-0.62],[-0.191,-0.614],[-0.167,-0.606],[-0.143,-0.6],[-0.119,-0.598],[-0.096,-0.603],[-0.072,-0.614],[-0.051,-0.631],[-0.029,-0.652],[-0.008,-0.672],[0.013,-0.69],[0.036,-0.707],[0.058,-0.72],[0.082,-0.73],[0.105,-0.739],[0.129,-0.744],[0.153,-0.748]];
const IVORY = [0.976, 0.949, 0.894];

const SHAPES = {
  cloud: {
    outline: CLOUD_OUTLINE, yaw: 0,
    thickness: 0.548, bevelTop: 0.11, bevelBottom: 0.03, lip: { width: 0.1, depth: 0.016 },
    layers: [0.529, 0.7],
    view: { elevation: 34, distance: 200, scale: 0.4918, cx: 0.4995, cy: 0.4341 },
    materials: [
      { sigma: [8, 2, 1.5], scatter: 5, color: [0.02, 0.407, 0.436], path: 0.35, shade: 0.15 }, // base turquesa (gominola traslúcida)
      { sigma: [0, 0, 0], scatter: 80, color: [0.875, 0.848, 0.751], path: 1, shade: 0.3 }, // franja crema
      { sigma: [0.25, 0.06, 0.03], scatter: 7, color: [0.553, 0.812, 0.929], path: 0.4, shade: 0.06 }, // tapa azul hielo (ópalo)
    ],
    look: { wave: 0.9, speck: 1, streak: 0.5, bandShade: 0.14 },
    light: { env: [6.0, 3.5, 1.7, 0.16], back: [36, 0.42, 0.42], top: 3, floor: 0.12 }, // panel trasero alto: brillo «líquido» sobre la tapa
    tint: [0.2, 0.62, 0.7],
  },
  web: {
    rect: { depth: 1.5416, radius: 0.2465 }, yaw: 39.98,
    thickness: 0.3628, bevelTop: 0.035, bevelBottom: 0.022,
    layers: [0.445, 0.62],
    view: { elevation: 25.6, distance: 5.7127, scale: 0.40976, cx: 0.5079, cy: 0.4145 },
    materials: [
      { sigma: [1.5, 6, 8], scatter: 14, color: [0.755, 0.28, 0.152], path: 0.3, shade: 0.15 }, // base naranja rojizo (gominola traslúcida)
      { sigma: [0, 0, 0], scatter: 80, color: [1, 0.98, 0.889], path: 1, shade: 0.3 }, // franja crema
      { sigma: [0.281, 8.25, 10.214], scatter: 0.25, color: [1, 0.7, 0.55], path: 0.16, shade: 0.1 }, // tapa melocotón (cristal)
    ],
    look: { wave: 0, speck: 0, streak: 0.22, bandShade: 0, border: 0.2 },
    light: { env: [4.5, 3.0, 3.6, 0.16], back: [14, 0.2, 0.25], top: 1.2, floor: 0.5 },
    tint: [1.0, 0.62, 0.48],
    // Relieves de la cara superior, medidos sobre la vista cenital rectificada de la foto
    deco: {
      bars: [ // [x0, x1, z0, z1, radio de esquina]
        [-0.643, 0.634, -0.202, -0.016, 0.04],
        [-0.637, 0.154, 0.071, 0.109, 0.019],
        [-0.649, -0.098, 0.216, 0.399, 0.04],
        [0.064, 0.629, 0.212, 0.399, 0.04],
        [-0.643, -0.25, 0.492, 0.53, 0.019],
        [0.066, 0.476, 0.489, 0.527, 0.019],
      ],
      dots: [ // [x, z, color]
        [-0.705, -0.493, [0.86, 0.1, 0.1]],
        [-0.564, -0.492, [0.97, 0.76, 0.1]],
        [-0.421, -0.492, [0.27, 0.66, 0.18]],
      ],
      dotRadius: 0.046, ringRadius: 0.066,
      groove: { z: -0.379, x0: -0.91, x1: 0.87 },
    },
  },
  // Chip (Hosting para IA). Cámara a partir del marco crema (tools/jelly/fit_chip.py); grosor, capas y patitas
  // leídos en la foto con esa cámara (arista de la esquina delantera y pie de cada patita); marco y estrella
  // medidos en la vista cenital rectificada (chip_deco.py). Ver NOTAS.md, punto 42.
  chip: {
    rect: { depth: 2, radius: 0.327 }, yaw: 58.41,
    thickness: 0.803, bevelTop: 0.12, bevelBottom: 0.03,
    cell: 0.19,   // es el doble de gruesa que la ventana: con la celda general tendría 2,4 veces más partículas
    layers: [0.39, 0.5],
    view: { elevation: 40.13, distance: 17.03, scale: 0.3068, cx: 0.5031, cy: 0.4449 },
    materials: [
      { sigma: [2.5, 6, 1], scatter: 4, color: [0.397, 0.258, 0.317], path: 0.35, shade: 0.15 }, // base morada (gominola traslúcida)
      { sigma: [0, 0, 0], scatter: 80, color: [0.861, 0.822, 0.762], path: 1, shade: 0.3 }, // franja crema
      { sigma: [0.7, 1.6, 0.2], scatter: 1.4, color: [1, 0.97, 1], path: 1, shade: 0.08 }, // tapa lila (cristal)
    ],
    look: { wave: 0, speck: 0, streak: 0.25, bandShade: 0.05, border: 0.25 },
    light: { env: [4.5, 3.0, 3.6, 0.16], back: [14, 0.2, 0.25], top: 1.2, floor: 0.5 },
    tint: [0.66, 0.5, 0.88],
    // 4 patitas por lado, centradas: separación, ancho, saliente, alto, y radios de la tapa y de las esquinas
    pins: { count: 4, pitch: 0.413, shift: 0, width: 0.32, out: 0.18, inset: 0.06, height: 0.33, round: 0.12, corner: 0.1 },
    deco: {
      color: [0.95, 0.93, 0.88], shadow: [0.36, 0.24, 0.55],
      frame: { center: [-0.016, 0.006], half: [0.775, 0.775], radius: 0.295, width: 0.116, height: 0.055, shadowWidth: 0.05, shadowAlpha: 0.28 },
      star: { x: 0, z: 0, angle: 1, height: 0.15, tip: 1, shadowWidth: 0.05, shadowAlpha: 0.3,
        profile: [0.502, 0.49, 0.466, 0.435, 0.402, 0.369, 0.341, 0.319, 0.301, 0.286, 0.274, 0.265, 0.258, 0.253, 0.249, 0.246, 0.244, 0.243, 0.243, 0.244, 0.246, 0.249, 0.253, 0.258, 0.265, 0.274, 0.286, 0.301, 0.319, 0.341, 0.369, 0.402, 0.435, 0.466, 0.49, 0.502] },   // radio cada 2,5° (chip_deco.py)
    },
  },
};

const TAU = Math.PI * 2, DEG = Math.PI / 180, HMAX = 4;

/* =========================================================================
 * GEOMETRÍA · contorno → superficie con cantos redondeados + franja + adornos + retícula de tetraedros
 * ========================================================================= */
function buildModel(shape, cfg) {
  const N = 192; // puntos del contorno (múltiplo de 8 para las tapas)
  // Contorno denso: polígono dado (nube) o rectángulo redondeado (ventana)
  let dense = shape.outline;
  if (shape.rect) {
    const hx = 1, hz = shape.rect.depth / 2, R = shape.rect.radius;
    dense = [];
    for (const [cx, cz, a0] of [[hx - R, hz - R, 0], [-hx + R, hz - R, 90], [-hx + R, -hz + R, 180], [hx - R, -hz + R, 270]]) {
      for (let k = 0; k <= 40; k++) { const a = (a0 + 90 * k / 40) * DEG; dense.push([cx + R * Math.cos(a), cz + R * Math.sin(a)]); }
    }
  }
  const ring0 = resample(dense, N);
  const ccw = signedArea(ring0) > 0;
  const ol = ring0.map((p, i) => {
    const a = ring0[(i + N - 1) % N], b = ring0[(i + 1) % N];
    let nx = b[1] - a[1], nz = -(b[0] - a[0]); const l = Math.hypot(nx, nz) || 1;
    if (!ccw) { nx = -nx; nz = -nz; }
    return { x: p[0], z: p[1], nx: nx / l, nz: nz / l };
  });
  const sdf = polySdf(ring0);
  let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity;
  for (const p of ol) { xMin = Math.min(xMin, p.x); xMax = Math.max(xMax, p.x); zMin = Math.min(zMin, p.z); zMax = Math.max(zMax, p.z); }

  const T = shape.thickness, rt = shape.bevelTop, rb = shape.bevelBottom;
  const mesh = () => {
    const v = [], t = [], al = [];
    return {
      v, t, al,
      add(x, y, z, extra, alpha = 1) { v.push({ x, y, z, e: extra }); al.push(alpha); return v.length - 1; },
      // triángulo orientado según la normal esperada n
      tri(a, b, c, n) {
        const A = v[a], B = v[b], C = v[c];
        const ux = B.x - A.x, uy = B.y - A.y, uz = B.z - A.z, vx = C.x - A.x, vy = C.y - A.y, vz = C.z - A.z;
        if ((uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2] < 0) t.push(a, c, b); else t.push(a, b, c);
      },
    };
  };

  /* ----- Superficie exterior (cristal) ----- */
  const S = mesh();
  // Anillos del perfil: canto inferior, pared (con anillos en los cambios de capa) y canto superior
  const rings = [];
  for (let k = 0; k <= 4; k++) { const f = (-90 + k * 22.5) * DEG; rings.push({ d: rb * (1 - Math.cos(f)), y: rb + rb * Math.sin(f), f }); }
  for (const l of shape.layers) { const y = l * T; if (y > rb + 0.01 && y < T - rt - 0.01) rings.push({ d: 0, y, f: 0 }); }
  for (let k = 0; k <= 5; k++) { const f = (k * 18) * DEG; rings.push({ d: rt * (1 - Math.cos(f)), y: T - rt + rt * Math.sin(f), f }); }
  // labio: tras el canto, la cara superior baja suavemente hacia un interior algo hundido
  if (shape.lip) {
    const { width: w, depth: dp } = shape.lip;
    for (const [fd, fy] of [[0.3, 0.12], [0.6, 0.5], [0.85, 0.88], [1.15, 1]]) rings.push({ d: rt + w * fd, y: T - dp * fy, f: 90 * DEG });
  }
  for (const rg of rings) for (const p of ol) { const x = p.x - p.nx * rg.d, z = p.z - p.nz * rg.d; S.add(x, rg.y, z, [rg.y / T, x, z]); }
  for (let k = 0; k < rings.length - 1; k++) {
    const fm = (rings[k].f + rings[k + 1].f) / 2;
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N, n = [ol[i].nx * Math.cos(fm), Math.sin(fm), ol[i].nz * Math.cos(fm)];
      const a = k * N + i, b = k * N + j, c = (k + 1) * N + j, d = (k + 1) * N + i;
      S.tri(a, b, c, n); S.tri(a, c, d, n);
    }
  }
  // Tapas: polígono grueso (1 de cada 8) por recorte de orejas + 3 subdivisiones ajustadas al anillo
  const cap = (k, up) => {
    const ringXZ = i => S.v[k * N + i];
    const vs = [];
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
    const gi = vs.map(v => (v.ring >= 0 ? k * N + v.ring : S.add(v.x, y, v.z, [y / T, v.x, v.z])));
    for (let t = 0; t < ts.length; t += 3) S.tri(gi[ts[t]], gi[ts[t + 1]], gi[ts[t + 2]], [0, up ? 1 : -1, 0]);
  };
  cap(rings.length - 1, true);
  cap(0, false);

  /* ----- Patitas (chip): cajas redondeadas que salen de la pared en la capa de la base ----- */
  // Cada lado lleva `count` patitas separadas `pitch`; `shift` las corre a lo largo del lado, en el mismo sentido de
  // giro en los cuatro lados (en el chip es 0: están centradas). Van en la misma malla que el cuerpo: se dibujan,
  // proyectan sombra y se pueden agarrar como el resto de la gelatina.
  const pinPolys = [];
  if (shape.pins) {
    const pn = shape.pins, hz = shape.rect.depth / 2, ph = pn.height, rt = Math.min(pn.round, ph / 2), rb2 = 0.012;
    for (const [nx, nz, half] of [[1, 0, 1], [0, 1, hz], [-1, 0, 1], [0, -1, hz]]) {
      const tx = -nz, tz = nx;
      for (let k = 0; k < pn.count; k++) {
        const u = (k - (pn.count - 1) / 2) * pn.pitch + pn.shift, px = nx * half + tx * u, pz = nz * half + tz * u;
        // huella en planta: de `inset` dentro de la pared a `out` fuera, ancho `width`, esquinas redondeadas
        const a0 = -pn.inset, a1 = pn.out, b0 = -pn.width / 2, b1 = pn.width / 2, rc = Math.min(pn.corner, pn.width / 2 - 1e-3);
        const foot = [];
        for (const [ca, cb, g0] of [[a1 - rc, b1 - rc, 0], [a0 + rc, b1 - rc, 90], [a0 + rc, b0 + rc, 180], [a1 - rc, b0 + rc, 270]]) {
          for (let q = 0; q <= 6; q++) { const g = (g0 + 15 * q) * DEG; foot.push([ca + rc * Math.cos(g), cb + rc * Math.sin(g)]); }
        }
        const fp = foot.map(([a, b]) => [px + nx * a + tx * b, pz + nz * a + tz * b]);
        pinPolys.push(fp);
        const M = fp.length, fc = fp.reduce((q, v) => [q[0] + v[0] / M, q[1] + v[1] / M], [0, 0]);
        const fn = fp.map((v, i) => {
          const a = fp[(i + M - 1) % M], b = fp[(i + 1) % M]; let ex = b[1] - a[1], ez = -(b[0] - a[0]); const l = Math.hypot(ex, ez) || 1; ex /= l; ez /= l;
          return (v[0] - fc[0]) * ex + (v[1] - fc[1]) * ez < 0 ? [-ex, -ez] : [ex, ez];
        });
        // perfil: canto inferior pequeño, pared y canto superior redondeado (radio rt)
        const pr = [];
        for (let q = 0; q <= 2; q++) { const f = (-90 + q * 45) * DEG; pr.push({ d: rb2 * (1 - Math.cos(f)), y: rb2 + rb2 * Math.sin(f), f }); }
        for (let q = 0; q <= 5; q++) { const f = (q * 18) * DEG; pr.push({ d: rt * (1 - Math.cos(f)), y: ph - rt + rt * Math.sin(f), f }); }
        // toda la patita es de la gelatina de la base, aunque asome por encima de la franja
        const hb = Math.max(0, shape.layers[0] - 0.02), hOf = y => Math.min(y / T, hb);
        const base = S.v.length;
        for (const rg of pr) for (let i = 0; i < M; i++) { const x = fp[i][0] - fn[i][0] * rg.d, z = fp[i][1] - fn[i][1] * rg.d; S.add(x, rg.y, z, [hOf(rg.y), x, z]); }
        for (let q = 0; q < pr.length - 1; q++) {
          const fm = (pr[q].f + pr[q + 1].f) / 2;
          for (let i = 0; i < M; i++) {
            const j = (i + 1) % M, n = [fn[i][0] * Math.cos(fm), Math.sin(fm), fn[i][1] * Math.cos(fm)];
            const a = base + q * M + i, b = base + q * M + j, c = base + (q + 1) * M + j, d = base + (q + 1) * M + i;
            S.tri(a, b, c, n); S.tri(a, c, d, n);
          }
        }
        const top = base + (pr.length - 1) * M, tc = S.add(fc[0], ph, fc[1], [hOf(ph), fc[0], fc[1]]);
        for (let i = 0; i < M; i++) S.tri(top + i, top + (i + 1) % M, tc, [0, 1, 0]);
        const bc = S.add(fc[0], 0, fc[1], [0, fc[0], fc[1]]);
        for (let i = 0; i < M; i++) S.tri(base + i, base + (i + 1) % M, bc, [0, -1, 0]);
      }
    }
  }

  /* ----- Franja crema: malla opaca interior entre las dos alturas de capa (se ve a través del cristal) ----- */
  const B = mesh();
  {
    const y0 = shape.layers[0] * T, y1 = shape.layers[1] * T, inset = 0.012;
    const ring = ol.map(p => ({ x: p.x - p.nx * inset, z: p.z - p.nz * inset }));
    for (const y of [y0, y1]) for (const q of ring) B.add(q.x, y, q.z, [0, 0, 0]);       // lados
    for (let i = 0; i < N; i++) { const j = (i + 1) % N, n = [ol[i].nx, 0, ol[i].nz]; B.tri(i, j, N + j, n); B.tri(i, N + j, N + i, n); }
    for (const y of [y0, y1]) for (const q of ring) B.add(q.x, y, q.z, [0, 0, 0]);       // tapas (vértices propios)
    const ct = earClip(ring);
    for (let t = 0; t < ct.length; t += 3) {
      B.tri(3 * N + ct[t], 3 * N + ct[t + 1], 3 * N + ct[t + 2], [0, 1, 0]);
      B.tri(2 * N + ct[t], 2 * N + ct[t + 1], 2 * N + ct[t + 2], [0, -1, 0]);
    }
  }

  /* ----- Adornos en relieve (opacos, color por vértice) y calcas (sombras, ranura; color + alfa) ----- */
  const D = mesh(), K = mesh();
  const dc = shape.deco;
  if (dc) {
    const rrect = (x0, x1, z0, z1, r, n = 6) => {
      const o = [];
      for (const [cx, cz, a0] of [[x1 - r, z1 - r, 0], [x0 + r, z1 - r, 90], [x0 + r, z0 + r, 180], [x1 - r, z0 + r, 270]]) {
        for (let k = 0; k <= n; k++) { const a = (a0 + 90 * k / n) * DEG; o.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]); }
      }
      return o;
    };
    const circle = (x, z, r, n = 28) => Array.from({ length: n }, (_, i) => [x + r * Math.cos(i / n * TAU), z + r * Math.sin(i / n * TAU)]);
    // extrusión con perfil [retranqueo, altura sobre la tapa] y tapa en abanico
    const loft = (o, profile, color, capY) => {
      const M = o.length, cx = o.reduce((s, p) => s + p[0], 0) / M, cz = o.reduce((s, p) => s + p[1], 0) / M;
      const nrm = o.map((p, i) => { const a = o[(i + M - 1) % M], b = o[(i + 1) % M]; let nx = b[1] - a[1], nz = -(b[0] - a[0]); const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; return (p[0] - cx) * nx + (p[1] - cz) * nz < 0 ? [-nx, -nz] : [nx, nz]; });
      const base = D.v.length;
      profile.forEach(([d, y]) => o.forEach((p, i) => D.add(p[0] - nrm[i][0] * d, T + y, p[1] - nrm[i][1] * d, color)));
      for (let k = 0; k < profile.length - 1; k++) for (let i = 0; i < M; i++) {
        const j = (i + 1) % M, a = base + k * M + i, b = base + k * M + j, c = base + (k + 1) * M + j, d = base + (k + 1) * M + i;
        const n = [nrm[i][0], 0.6, nrm[i][1]];
        D.tri(a, b, c, n); D.tri(a, c, d, n);
      }
      if (capY != null) {
        const c = D.add(cx, T + capY, cz, color), top = base + (profile.length - 1) * M;
        for (let i = 0; i < M; i++) D.tri(top + i, top + (i + 1) % M, c, [0, 1, 0]);
      }
    };
    // sombra de contacto alrededor de un relieve: anillo que se desvanece, desplazado en contra de la luz
    const skirt = (o, w, a0, shift = [0.012, 0.03]) => {
      const M = o.length, cx = o.reduce((s, p) => s + p[0], 0) / M, cz = o.reduce((s, p) => s + p[1], 0) / M, col = dc.shadow ?? [0.6, 0.27, 0.19];
      const base = K.v.length;
      o.forEach(p => K.add(p[0], T + 0.0025, p[1], col, a0));
      o.forEach((p, i) => {
        const a = o[(i + M - 1) % M], b = o[(i + 1) % M]; let nx = b[1] - a[1], nz = -(b[0] - a[0]); const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
        if ((p[0] - cx) * nx + (p[1] - cz) * nz < 0) { nx = -nx; nz = -nz; }
        K.add(p[0] + nx * w + shift[0], T + 0.0025, p[1] + nz * w + shift[1], col, 0);
      });
      for (let i = 0; i < M; i++) { const j = (i + 1) % M; K.tri(base + i, base + j, base + M + j, [0, 1, 0]); K.tri(base + i, base + M + j, base + M + i, [0, 1, 0]); }
      // interior (bajo el relieve) para que la sombra desplazada no deje hueco
      const c = K.add(cx, T + 0.0025, cz, col, a0);
      for (let i = 0; i < M; i++) K.tri(base + i, base + (i + 1) % M, c, [0, 1, 0]);
    };
    for (const [x0, x1, z0, z1, r] of dc.bars ?? []) {
      const o = rrect(x0, x1, z0, z1, r);
      skirt(o, 0.045, 0.34);
      loft(o, [[0, -0.004], [0.0012, 0.009], [0.006, 0.0145], [0.014, 0.0165]], IVORY, 0.0168);
    }
    for (const [x, z, color] of dc.dots ?? []) {
      skirt(circle(x, z, dc.ringRadius), 0.03, 0.3, [0.008, 0.02]);
      loft(circle(x, z, dc.ringRadius), [[0, -0.004], [0.001, 0.006], [0.006, 0.011], [0.016, 0.011]], IVORY, null);
      const dome = []; for (let k = 0; k <= 6; k++) { const a = k / 7 * 90 * DEG; dome.push([dc.dotRadius * (1 - Math.cos(a)), 0.004 + 0.036 * Math.sin(a)]); }
      loft(circle(x, z, dc.dotRadius), dome, color, 0.0405);
    }
    // ranura de la barra de título: línea oscura fina + filo claro, y el reflejo de cada punto sobre ella
    if (dc.groove) {
      const g = dc.groove, seg = 24;
      const strip = (zc, w, col, a) => {
        const base = K.v.length;
        for (let i = 0; i <= seg; i++) {
          const x = g.x0 + (g.x1 - g.x0) * i / seg, e = Math.min(1, Math.min(i, seg - i) / 1.5);
          K.add(x, T + 0.003, zc - w / 2, col, 0); K.add(x, T + 0.003, zc, col, a * e); K.add(x, T + 0.003, zc + w / 2, col, 0);
        }
        for (let i = 0; i < seg; i++) for (let r = 0; r < 2; r++) {
          const a0 = base + i * 3 + r, b0 = base + (i + 1) * 3 + r;
          K.tri(a0, b0, b0 + 1, [0, 1, 0]); K.tri(a0, b0 + 1, a0 + 1, [0, 1, 0]);
        }
      };
      strip(g.z, 0.03, [0.66, 0.26, 0.17], 0.8);
      strip(g.z - 0.016, 0.014, [1, 0.94, 0.9], 0.7);
      for (const [x, , color] of dc.dots) {
        const c = K.add(x - 0.02, T + 0.0035, g.z + 0.004, color, 0.6), base = K.v.length, M = 16;
        for (let i = 0; i < M; i++) K.add(x - 0.02 + 0.05 * Math.cos(i / M * TAU), T + 0.0035, g.z + 0.004 + 0.012 * Math.sin(i / M * TAU), color, 0);
        for (let i = 0; i < M; i++) K.tri(base + i, base + (i + 1) % M, c, [0, 1, 0]);
      }
    }
    // Marco en relieve (chip): tubo de sección casi rectangular con cantos redondos a lo largo de un rectángulo
    // redondeado, con su sombra de contacto a los dos lados
    if (dc.frame) {
      const f = dc.frame, col = dc.color ?? IVORY, w = f.width, hR = f.height;
      const [ox, oz] = f.center ?? [0, 0];
      const path = resample(rrect(ox - f.half[0], ox + f.half[0], oz - f.half[1], oz + f.half[1], f.radius, 12), 176), M = path.length;
      const pn = path.map((p, i) => {
        const a = path[(i + M - 1) % M], b = path[(i + 1) % M]; let ex = b[1] - a[1], ez = -(b[0] - a[0]); const l = Math.hypot(ex, ez) || 1; ex /= l; ez /= l;
        return (p[0] - ox) * ex + (p[1] - oz) * ez < 0 ? [-ex, -ez] : [ex, ez];
      });
      const prof = [];   // [desplazamiento hacia fuera del eje, altura sobre la tapa]: superelipse (n = 3) apoyada en la tapa
      for (let k = 0; k <= 14; k++) {
        const a = Math.PI * k / 14, c = Math.cos(a), sn = Math.sin(a);
        prof.push([-Math.sign(c) * Math.pow(Math.abs(c), 2 / 3) * w / 2, k === 0 || k === 14 ? -0.004 : Math.pow(sn, 2 / 3) * hR]);
      }
      const base = D.v.length;
      for (const [so, y] of prof) for (let i = 0; i < M; i++) D.add(path[i][0] + pn[i][0] * so, T + y, path[i][1] + pn[i][1] * so, col);
      for (let k = 0; k < prof.length - 1; k++) {
        let ns = prof[k + 1][1] - prof[k][1], ny = -(prof[k + 1][0] - prof[k][0]); if (ny < 0) { ns = -ns; ny = -ny; }
        for (let i = 0; i < M; i++) {
          const j = (i + 1) % M, n = [pn[i][0] * ns, ny, pn[i][1] * ns];
          const a = base + k * M + i, b = base + k * M + j, c = base + (k + 1) * M + j, d = base + (k + 1) * M + i;
          D.tri(a, b, c, n); D.tri(a, c, d, n);
        }
      }
      const sc = dc.shadow ?? [0.6, 0.27, 0.19], [shx, shz] = f.shift ?? [0.012, 0.03];
      for (const side of [1, -1]) {
        const kb = K.v.length;
        for (let i = 0; i < M; i++) {
          const x = path[i][0], z = path[i][1], nx = pn[i][0] * side, nz = pn[i][1] * side;
          K.add(x + nx * w * 0.45, T + 0.0025, z + nz * w * 0.45, sc, f.shadowAlpha);
          K.add(x + nx * (w / 2 + f.shadowWidth) + shx, T + 0.0025, z + nz * (w / 2 + f.shadowWidth) + shz, sc, 0);
        }
        for (let i = 0; i < M; i++) { const j = (i + 1) % M; K.tri(kb + 2 * i, kb + 2 * j, kb + 2 * j + 1, [0, 1, 0]); K.tri(kb + 2 * i, kb + 2 * j + 1, kb + 2 * i + 1, [0, 1, 0]); }
      }
    }
    // Estrella de 4 puntas abombada (chip): contorno de superelipse con exponente < 1 (lados cóncavos) y cuerpo
    // «inflado»: cada anillo es el contorno escalado hacia el centro, más alto cuanto más dentro
    if (dc.star) {
      const st = dc.star, col = dc.color ?? IVORY, n = 160, o = [];
      const ca = Math.cos(st.angle * DEG), sa = Math.sin(st.angle * DEG);
      // radio en cada ángulo: el contorno medido (`profile`: de una punta a la siguiente, repetido en los 4 cuadrantes) o una
      // superelipse; un promedio móvil de ±`tip` muestras redondea las puntas
      const prof = st.profile, pl = prof?.length ?? 0;
      const rr = Array.from({ length: n }, (_, i) => {
        const t = i / n * TAU;
        if (pl) { const f = ((t / (TAU / 4)) % 1) * pl, j = Math.floor(f), w = f - j; return prof[j % pl] * (1 - w) + prof[(j + 1) % pl] * w; }
        return st.radius * Math.pow(Math.pow(Math.abs(Math.cos(t)), st.power) + Math.pow(Math.abs(Math.sin(t)), st.power), -1 / st.power);
      });
      const k = st.tip ?? 0;
      for (let i = 0; i < n; i++) {
        let r = 0; for (let j = -k; j <= k; j++) r += rr[(i + j + n) % n]; r /= 2 * k + 1;
        const t = i / n * TAU, lx = r * Math.cos(t), lz = r * Math.sin(t) * (st.squash ?? 1);
        o.push([st.x + lx * ca - lz * sa, st.z + lx * sa + lz * ca]);
      }
      skirt(o, st.shadowWidth, st.shadowAlpha, st.shift ?? [0.012, 0.03]);
      const rings = [];
      for (let k = 0; k <= 10; k++) { const a = k / 10 * Math.PI / 2; rings.push([Math.pow(Math.cos(a), 2 / 2.6), k === 0 ? -0.004 : Math.pow(Math.sin(a), 2 / 2.6) * st.height]); }
      const base = D.v.length;
      for (const [fs, y] of rings) for (const p of o) D.add(st.x + (p[0] - st.x) * fs, T + y, st.z + (p[1] - st.z) * fs, col);
      for (let k = 0; k < rings.length - 1; k++) {
        const up = (k + 0.5) / (rings.length - 1);
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n, nv = [(o[i][0] - st.x) * (1 - up), up, (o[i][1] - st.z) * (1 - up)];
          const a = base + k * n + i, b = base + k * n + j, c = base + (k + 1) * n + j, d = base + (k + 1) * n + i;
          D.tri(a, b, c, nv); D.tri(a, c, d, nv);
        }
      }
      const tip = D.add(st.x, T + st.height, st.z, col), top = base + (rings.length - 1) * n;
      for (let i = 0; i < n; i++) D.tri(top + i, top + (i + 1) % n, tip, [0, 1, 0]);
    }
  }

  /* ----- Retícula de tetraedros que cubre el contorno (dilatada para envolver toda la superficie) ----- */
  const h = shape.cell ?? cfg.physics.cell, ny = Math.max(2, Math.round(T / h)), hy = T / ny;   // celda propia en piezas gruesas (chip)
  const gx0 = xMin - h, gz0 = zMin - h;
  const nx = Math.ceil((xMax - xMin + 2 * h) / h), nz = Math.ceil((zMax - zMin + 2 * h) / h);
  const keep = new Uint8Array(nx * nz), pinSdf = pinPolys.map(polySdf);
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
    const qx = gx0 + (i + 0.5) * h, qz = gz0 + (k + 0.5) * h;
    if (sdf(qx, qz) < 0.8 * h || pinSdf.some(f => f(qx, qz) < 0.5 * h)) keep[i * nz + k] = 1;
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

  // Coser cada vértice a un tetraedro con coordenadas baricéntricas
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
  const pack = m => (m.v.length ? { n: m.v.length, extra: new Float32Array(m.v.flatMap(v => v.e)), alpha: new Float32Array(m.al), index: new Uint32Array(m.t), ...embed(m.v) } : null);

  return { T, outline: ol, particles: pos, tets: tetArr, surface: pack(S), band: pack(B), deco: pack(D), decal: pack(K) };
}

function clampI(v, a, b) { return v < a ? a : v > b ? b : v; }

// Remuestreo de un polígono cerrado a n puntos equidistantes en longitud de arco
function resample(pts, n) {
  const m = pts.length, cum = [0];
  for (let i = 1; i <= m; i++) { const a = pts[i - 1], b = pts[i % m]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const L = cum[m], out = [];
  for (let j = 0, s = 0; j < n; j++) {
    const t = j / n * L;
    while (cum[s + 1] < t) s++;
    const a = pts[s], b = pts[(s + 1) % m], f = (t - cum[s]) / (cum[s + 1] - cum[s] || 1);
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  return out;
}
function signedArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a / 2; }
// Distancia con signo a un polígono (negativa dentro)
function polySdf(p) {
  const n = p.length;
  return (x, z) => {
    let d = Infinity, inside = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const ax = p[j][0], az = p[j][1], bx = p[i][0], bz = p[i][1];
      const ex = bx - ax, ez = bz - az, wx = x - ax, wz = z - az;
      const t = Math.max(0, Math.min(1, (wx * ex + wz * ez) / (ex * ex + ez * ez || 1)));
      d = Math.min(d, Math.hypot(wx - ex * t, wz - ez * t));
      if ((az > z) !== (bz > z) && x < ax + (z - az) / (bz - az) * ex) inside = !inside;
    }
    return inside ? -d : d;
  };
}

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

// Recorte de orejas en planta (x, z) → índices de triángulos. Admite puntos {x, z} o [x, z].
function earClip(pts) {
  const vs = pts.map(p => (Array.isArray(p) ? { x: p[0], z: p[1] } : p));
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
  const inv = new Float64Array(16);
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
  return [m[0] * x + m[4] * y + m[8] * z + m[12] * w, m[1] * x + m[5] * y + m[9] * z + m[13] * w,
    m[2] * x + m[6] * y + m[10] * z + m[14] * w, m[3] * x + m[7] * y + m[11] * z + m[15] * w];
}

/* =========================================================================
 * SHADERS (GLSL ES 3.00)
 * ========================================================================= */
const VS = `#version 300 es
layout(location=0) in vec3 a_pos; layout(location=1) in vec3 a_nrm; layout(location=2) in vec3 a_x; layout(location=3) in float a_a;
uniform mat4 u_view, u_proj;
out vec3 v_pos; out vec3 v_nrm; out vec3 v_x; out float v_vz; out float v_a;
void main() {
  vec4 vp = u_view * vec4(a_pos, 1.0);
  v_pos = a_pos; v_nrm = a_nrm; v_x = a_x; v_vz = -vp.z; v_a = a_a;
  gl_Position = u_proj * vp;
}`;

// Trozos comunes: color lineal ↔ sRGB y la carpa de luz que se refleja en las piezas
const GLSL_COMMON = `
vec3 toLin(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }
vec3 toSrgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
uniform vec3 u_envFloor;   // color del suelo (fondo de la tarjeta), lineal
uniform vec4 u_envK;       // intensidades: caja principal, caja derecha, panel trasero, penumbra del estudio
uniform vec4 u_envB;       // panel trasero: elevación del centro (rad), semialto hacia arriba y hacia abajo (tangentes); w = caja cenital
// «ventana» rectangular blanda en la dirección c (semiancho w, semialto h, en tangentes)
float box(vec3 r, vec3 c, float w, float h) {
  vec3 up = abs(c.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 rt = normalize(cross(c, up)); up = cross(rt, c);
  float d = dot(r, c); if (d <= 0.0) return 0.0;
  vec2 q = vec2(dot(r, rt), dot(r, up)) / d;
  return (1.0 - smoothstep(w * 0.8, w, abs(q.x))) * (1.0 - smoothstep(h * 0.8, h, abs(q.y)));
}
// Carpa de luz de estudio: suelo, paredes claras, techo más claro y tres cajas de luz
vec3 env(vec3 r) {
  vec3 c = mix(u_envFloor, vec3(u_envK.w), smoothstep(-0.2, 0.12, r.y));          // suelo (lo reflejan las paredes) → penumbra
  c += vec3(u_envK.x) * box(r, normalize(vec3(-0.77, 0.58, -0.25)), 0.6, 0.32);        // caja principal: izquierda, algo detrás
  c += vec3(u_envK.y) * box(r, normalize(vec3(0.72, 0.62, 0.1)), 0.42, 0.3);           // caja derecha
  c += vec3(u_envB.w) * box(r, normalize(vec3(0.0, 0.85, 0.5)), 0.9, 0.6);             // caja cenital, algo adelantada (la reflejan los cantos)
  // panel trasero: es lo que refleja la cara superior (degradado suave hacia arriba y hacia abajo)
  vec3 bc = normalize(vec3(-0.1, tan(u_envB.x), -1.0)); float bd = dot(r, bc);
  if (bd > 0.0) {
    vec3 brt = normalize(cross(bc, vec3(0.0, 1.0, 0.0))); vec2 q = vec2(dot(r, brt), dot(r, cross(brt, bc))) / bd;
    float fy = q.y > 0.0 ? 1.0 - smoothstep(0.02, u_envB.y, q.y) : 1.0 - smoothstep(0.02, u_envB.z, -q.y);
    c += vec3(u_envK.z) * (1.0 - smoothstep(1.0, 1.7, abs(q.x))) * fy;
  }
  return c;
}`;

// Profundidad lineal empaquetada en 16 bits (RG) entre los planos cercano y lejano
const FS_BACK = `#version 300 es
precision highp float;
in float v_vz; in vec3 v_nrm; uniform vec2 u_range; out vec4 o;
void main() { float d = clamp((v_vz - u_range.x) / (u_range.y - u_range.x), 0.0, 1.0) * 255.0; o = vec4(floor(d) / 255.0, fract(d), abs(normalize(v_nrm).y), 1.0); }`;

// Mapa de alturas visto desde arriba: R = altura máxima, G = 1 - altura mínima (mezcla MAX)
const VS_HEIGHT = `#version 300 es
layout(location=0) in vec3 a_pos;
uniform vec2 u_c; uniform float u_s; out float v_y;
void main() { v_y = a_pos.y; gl_Position = vec4((a_pos.x - u_c.x) / u_s, (a_pos.z - u_c.y) / u_s, 0.0, 1.0); }`;
const FS_HEIGHT = `#version 300 es
precision highp float;
in float v_y; out vec4 o;
void main() { float h = clamp(v_y / ${HMAX.toFixed(1)}, 0.0, 1.0); o = vec4(h, 1.0 - h, 1.0, 1.0); }`; // B = cobertura

// Sombra del suelo: el mapa de alturas (512²) se resume en máscaras a 128² y la ancha se desenfoca con un
// gaussiano separable. Así la penumbra es continua (un muestreo en disco deja lóbulos y escalones que en
// pantalla se ven como líneas claras).
const VS_QUAD = `#version 300 es
layout(location=0) in vec3 a_pos; out vec2 v_uv;
void main() { v_uv = a_pos.xy * 0.5 + 0.5; gl_Position = vec4(a_pos.xy, 0.0, 1.0); }`;
// R = sombra ancha (más tenue cuanto más levantada está la pieza), G = sombra de contacto, B = cobertura
const FS_RESOLVE = `#version 300 es
precision highp float;
uniform sampler2D u_height; out vec4 o;
void main() {
  ivec2 base = ivec2(gl_FragCoord.xy) * 4;
  float soft = 0.0, contact = 0.0, cov = 0.0;
  for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) {
    vec4 c = texelFetch(u_height, base + ivec2(i, j), 0);
    float minH = (1.0 - c.g) * ${HMAX.toFixed(1)};      // altura de la base de la pieza sobre ese punto del suelo
    soft += c.b * exp(-minH * 1.5);
    contact += c.b * (1.0 - smoothstep(0.0, 0.12, minH));
    cov += c.b;
  }
  o = vec4(soft, contact, cov, 16.0) / 16.0;
}`;
const FS_BLUR = `#version 300 es
precision highp float;
uniform sampler2D u_src; uniform vec2 u_dir; in vec2 v_uv; out vec4 o;
void main() {
  vec4 acc = vec4(0.0); float wsum = 0.0;
  for (int i = -9; i <= 9; i++) { float w = exp(-float(i * i) / 22.0); acc += texture(u_src, v_uv + u_dir * float(i)) * w; wsum += w; }
  o = acc / wsum;
}`;

// Suelo. Modo 0 = lo que se ve a través de la pieza (suelo iluminado por la luz que la atraviesa);
// modo 1 = en pantalla, solo la sombra (premultiplicada) sobre la tarjeta.
const FS_FLOOR = `#version 300 es
precision highp float;
in vec3 v_pos;
uniform sampler2D u_blur, u_res; uniform vec2 u_c; uniform float u_s;
uniform vec3 u_bg, u_tint; uniform vec2 u_shift; uniform float u_mode, u_strength, u_contact;
out vec4 o;
void main() {
  vec2 uv = (v_pos.xz - u_c) / u_s * 0.5 + 0.5;
  if (u_mode < 0.5) {
    // bajo la pieza el suelo recibe la luz teñida que la atraviesa
    o = vec4(mix(u_bg, u_bg * u_tint, smoothstep(0.0, 0.7, texture(u_blur, uv).b) * 0.85), 1.0);
    return;
  }
  // sombra ancha: desplazada en contra de la luz; sombra de contacto: pegada a la pieza (filtro tienda 3×3)
  float soft = smoothstep(0.0, 0.9, texture(u_blur, uv - u_shift).r);
  float ao = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++)
    ao += texture(u_res, uv + vec2(float(i), float(j)) / 128.0).g * (2.0 - abs(float(i))) * (2.0 - abs(float(j)));
  ao /= 16.0;
  float a = clamp(soft * u_strength + ao * u_contact, 0.0, 0.8);
  vec3 sh = mix(vec3(0.16, 0.13, 0.12), u_tint * 0.45, 0.4);
  o = vec4(sh * a, a);
}`;

// Gelatina / cristal por capas
const FS_JELLY = `#version 300 es
precision highp float;
in vec3 v_pos; in vec3 v_nrm; in vec3 v_x; in float v_vz;
uniform sampler2D u_scene, u_back; uniform vec2 u_res, u_range, u_refr; uniform vec3 u_cam; uniform mat4 u_view;
uniform vec3 u_sig[3]; uniform vec3 u_scC[3]; uniform float u_sc[3]; uniform float u_path[3]; uniform float u_shade[3];
uniform vec2 u_layers; uniform vec3 u_L; uniform vec4 u_look; uniform float u_T; uniform vec4 u_spec; uniform vec4 u_rect; uniform vec3 u_under;
out vec4 o;
${GLSL_COMMON}
// Hash entero (exacto): el mismo punto de la rejilla da siempre el mismo valor, venga de la celda que venga.
// Con hashes en coma flotante las celdas vecinas pueden discrepar y se ven parches rectangulares.
float hash3(vec3 p) {
  ivec3 q = ivec3(floor(p + 0.5));
  uint h = uint(q.x) * 374761393u + uint(q.y) * 668265263u + uint(q.z) * 2246822519u;
  h = (h ^ (h >> 13)) * 1274126177u; h ^= h >> 16;
  return float(h & 0xffffffu) / 16777216.0;
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);   // interpolación quíntica (derivadas continuas)
  float a = hash3(vec3(i, 1.0)), b = hash3(vec3(i + vec2(1.0, 0.0), 1.0)), c = hash3(vec3(i + vec2(0.0, 1.0), 1.0)), d = hash3(vec3(i + vec2(1.0, 1.0), 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float ggx(float nh, float a2) { float d = nh * nh * (a2 - 1.0) + 1.0; return a2 / (3.14159 * d * d); }
void main() {
  vec3 N = normalize(v_nrm), V = normalize(u_cam - v_pos);
  float h = v_x.x; vec2 rest = v_x.yz;
  float la = smoothstep(u_layers.x - 0.004, u_layers.x + 0.004, h);
  float lb = smoothstep(u_layers.y - 0.004, u_layers.y + 0.004, h);
  vec3 sig = mix(mix(u_sig[0], u_sig[1], la), u_sig[2], lb);
  vec3 scC = toLin(mix(mix(u_scC[0], u_scC[1], la), u_scC[2], lb));
  float sc = mix(mix(u_sc[0], u_sc[1], la), u_sc[2], lb);
  float pmax = mix(mix(u_path[0], u_path[1], la), u_path[2], lb);
  float shade = mix(mix(u_shade[0], u_shade[1], la), u_shade[2], lb);

  // ondulación suave de la tapa (reflejos «líquidos»)
  float wv = u_look.x * lb * smoothstep(0.3, 0.8, N.y);
  if (wv > 0.0) {
    vec2 p = rest * 2.3; float e = 0.07;
    vec2 g = vec2(vnoise(p + vec2(e, 0.0)) - vnoise(p - vec2(e, 0.0)), vnoise(p + vec2(0.0, e)) - vnoise(p - vec2(0.0, e))) / (2.0 * e);
    N = normalize(N + vec3(g.x, 0.0, g.y) * 0.16 * wv);
  }
  float NdV = clamp(dot(N, V), 0.0, 1.0);

  // grosor de gelatina que atraviesa el rayo (hasta la cara trasera o la franja crema)
  vec2 uv = gl_FragCoord.xy / u_res;
  vec4 bk = texture(u_back, uv);
  float back = u_range.x + (bk.r + bk.g / 255.0) * (u_range.y - u_range.x);
  float t = clamp(back - v_vz, 0.0, 3.0);
  // el rayo se refracta al entrar (n ≈ 1,45): por la tapa baja más vertical (recorrido más corto que en línea
  // recta) y por las paredes más horizontal (más largo). Lo que hay al otro lado es casi siempre un plano
  // horizontal (franja o suelo), así que el recorrido real escala con la componente vertical de ambos rayos.
  vec3 Tr = refract(-V, N, 1.0 / 1.45);
  float t0 = t;
  t *= clamp(abs(V.y) / max(abs(Tr.y), 0.05), 0.4, 1.6);
  float te = pmax * (1.0 - exp(-t / pmax));

  // lo que hay detrás, refractado según la inclinación de la superficie y el grosor
  vec3 nV = mat3(u_view) * N;
  vec3 behind = toLin(texture(u_scene, clamp(uv - nV.xy * u_refr * (0.25 + te), 0.001, 0.999)).rgb);

  // Tapa de cristal: si el rayo acabaría saliendo por una pared, en realidad rebota dentro (reflexión total)
  // y lo que se ve es la franja crema con más recorrido, no el fondo
  float isWall = lb * (1.0 - smoothstep(0.35, 0.75, bk.b)) * step(t0, 2.9);  // el rayo recto saldría por una pared
  float dyTop = max(h - u_layers.y, 0.0) * u_T;                                // altura sobre la franja
  float reach = dyTop * sqrt(max(1.0 - Tr.y * Tr.y, 0.0)) / max(abs(Tr.y), 0.05); // alcance horizontal del rayo refractado
  float xw = t0 * sqrt(max(1.0 - V.y * V.y, 0.0));                             // distancia horizontal a esa pared
  float tir = isWall * (1.0 - smoothstep(reach * 0.75, reach * 1.15, xw));     // rebota en la pared antes de llegar a la franja
  behind = mix(behind, toLin(u_scC[1]) * 0.94, isWall);
  float tBand = dyTop / max(abs(Tr.y), 0.05);
  te = mix(te, pmax * (1.0 - exp(-(tBand * (1.0 + 0.9 * tir)) / pmax)), isWall);
  behind *= exp(-sig * 0.05 * tir);

  // Cara superior de cristal (pieza rectangular): junto a los cantos la franja recibe más luz (entra por la
  // pared) y se ve un borde interior más claro, rematado por una línea fina
  float line = 0.0;
  if (u_rect.w > 0.0) {
    vec2 qd = abs(rest) - u_rect.xy + u_rect.z;
    float dEdge = -(length(max(qd, 0.0)) + min(max(qd.x, qd.y), 0.0) - u_rect.z);   // distancia al contorno (dentro > 0)
    float topFace = lb * smoothstep(0.5, 0.9, N.y);
    behind *= 1.0 + u_rect.w * (1.0 - smoothstep(0.07, 0.09, dEdge)) * topFace * (1.0 - isWall);
    line = exp(-pow((dEdge - 0.092) / 0.008, 2.0)) * topFace;
  }
  float base = 1.0 - la;
  // base: al fondo está el suelo bajo la pieza, iluminado por la luz teñida que la atraviesa
  behind = mix(behind, u_under, base);

  float m = 1.0 - exp(-sc * te);
  float wrap = clamp(dot(N, u_L) * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = behind * exp(-sig * te) * (1.0 - m) + scC * m * (1.0 - shade * (1.0 - wrap));

  col *= 1.0 - 0.09 * line;
  // franja: algo más oscura hacia abajo; base: sombra bajo la franja, vetas de luz verticales y variación suave
  float inBand = la * (1.0 - lb);
  col *= 1.0 - u_look.w * inBand * (1.0 - smoothstep(u_layers.x, u_layers.y, h)) * 1.6;
  col *= 1.0 - 0.3 * base * exp(-(u_layers.x - h) / 0.03);
  float streak = smoothstep(0.52, 0.9, vnoise(vec2(rest.x * 3.1 + rest.y * 1.7, rest.y * 2.9 - rest.x * 1.3)));
  col *= 1.0 + base * u_look.z * (0.75 * streak + 0.3 * (vnoise(rest * 1.9 + 7.0) - 0.5));
  // tapa opalina: nubes suaves de densidad
  col *= 1.0 + lb * u_look.x * 0.12 * (vnoise(rest * 2.6 + 3.0) - 0.5);

  // motas (burbujas diminutas) dentro de la base
  if (u_look.y > 0.0) {
    vec3 q = vec3(rest.x, h * u_T, rest.y) * 70.0, id = floor(q), f = fract(q) - 0.5;
    float rnd = hash3(id);
    float speck = step(0.955, rnd) * (1.0 - smoothstep(0.05, 0.3, length(f + (vec3(hash3(id + 3.1), hash3(id + 7.3), hash3(id + 5.7)) - 0.5) * 0.5)));
    col += vec3(0.55, 0.85, 0.9) * speck * 0.5 * u_look.y * base;
  }

  // reflejo del estudio (Fresnel) y brillos de la luz principal
  vec3 R = reflect(-V, N);
  float F = u_spec.x + (1.0 - u_spec.x) * pow(1.0 - NdV, 5.0);
  col = col * (1.0 - F) + env(R) * F;
  vec3 H = normalize(u_L + V);
  float NdH = max(dot(N, H), 0.0), NdL = max(dot(N, u_L), 0.0);
  col += vec3(1.0) * min(ggx(NdH, 0.0009) * u_spec.y * NdL, 6.0);
  col += vec3(1.0) * min(ggx(NdH, 0.02) * u_spec.z * NdL, 1.5);
  o = vec4(toSrgb(col), 1.0);
}`;

// Franja crema interior: opaca y mate (va dentro de la escena que refracta el cristal)
const FS_BAND = `#version 300 es
precision highp float;
in vec3 v_pos; in vec3 v_nrm;
uniform vec3 u_cam, u_L, u_color; out vec4 o;
${GLSL_COMMON}
void main() {
  vec3 N = normalize(v_nrm);
  float wrap = clamp(dot(N, u_L) * 0.5 + 0.5, 0.0, 1.0);
  o = vec4(toSrgb(toLin(u_color) * (1.0 - 0.3 * (1.0 - wrap))), 1.0);
}`;

// Adornos opacos esmaltados (marfil / puntos de color)
const FS_DECO = `#version 300 es
precision highp float;
in vec3 v_pos; in vec3 v_nrm; in vec3 v_x;
uniform vec3 u_cam, u_L; uniform vec4 u_spec; out vec4 o;
${GLSL_COMMON}
float ggx(float nh, float a2) { float d = nh * nh * (a2 - 1.0) + 1.0; return a2 / (3.14159 * d * d); }
void main() {
  vec3 N = normalize(v_nrm), V = normalize(u_cam - v_pos);
  float NdV = clamp(dot(N, V), 0.0, 1.0);
  float wrap = clamp(dot(N, u_L) * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = toLin(v_x) * (0.74 + 0.3 * wrap);
  vec3 R = reflect(-V, N);
  float F = 0.045 + 0.955 * pow(1.0 - NdV, 5.0);
  col = col * (1.0 - F) + min(env(R), vec3(1.6)) * F * 0.6;
  vec3 H = normalize(u_L + V); float NdH = max(dot(N, H), 0.0), NdL = max(dot(N, u_L), 0.0);
  col += vec3(1.0) * min(ggx(NdH, 0.0012) * u_spec.y * 1.6 * NdL, 6.0);
  col += vec3(1.0) * min(ggx(NdH, 0.03) * u_spec.z * 0.6 * NdL, 0.6);
  o = vec4(toSrgb(col), 1.0);
}`;

// Calcas: color plano con alfa (sombras de contacto, ranura), premultiplicado
const FS_DECAL = `#version 300 es
precision highp float;
in vec3 v_x; in float v_a; out vec4 o;
void main() { o = vec4(v_x * v_a, v_a); }`;

/* =========================================================================
 * PIEZA
 * ========================================================================= */
export function createJelly3D(root, opts = {}) {
  const cfg = CONFIG3D;
  if (!SHAPES[opts.shape ?? 'cloud']) return null;   // pieza sin forma 3D: el llamador usa el motor 2D
  const shape = structuredClone(SHAPES[opts.shape ?? 'cloud']);
  // luz y brillos (ajustables con tune() en la página de pruebas)
  const light = { dir: norm([-0.6, 0.72, -0.35]), env: [4.0, 2.6, 1.3, 0.16], back: [17, 0.3, 0.25], top: 2, floor: 0.5, spec: [0.045, 0.09, 0.035], refr: 0.16, ...(shape.light ?? {}), ...(opts.light ?? {}) };
  const box = root.offsetParent || root.parentElement;
  const canvas = document.createElement('canvas');
  canvas.className = 'jelly3d-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', pointerEvents: 'none' });
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true });
  if (!gl) return null;

  const progs = {
    back: program(gl, VS, FS_BACK), height: program(gl, VS_HEIGHT, FS_HEIGHT), floor: program(gl, VS, FS_FLOOR),
    resolve: program(gl, VS_QUAD, FS_RESOLVE), blur: program(gl, VS_QUAD, FS_BLUR),
    jelly: program(gl, VS, FS_JELLY), deco: program(gl, VS, FS_DECO), band: program(gl, VS, FS_BAND), decal: program(gl, VS, FS_DECAL),
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

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let grab = null, resetT = -1, sleeping = false, still = 0, acc = 0, last = 0, raf = 0, visible = true, destroyed = false;
  let moved = false, cursorOn = false, lastHop = -1e9, lastPlay = -1e9, hopS = null;
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

  /* ----- Mallas cosidas a los tetraedros ----- */
  // La retícula física deforma la superficie a trozos (lineal dentro de cada tetraedro): al asentarse por la
  // gravedad quedarían facetas visibles en los reflejos. Por eso la normal final es la ideal de la malla sin
  // deformar más el cambio respecto al reposo: en su sitio los reflejos son perfectamente lisos.
  function skin(m, src = x, upload = true) {
    const out = m.pos, nrm = m.nrm;
    for (let n = 0; n < m.n; n++) {
      let px = 0, py = 0, pz = 0;
      for (let q = 0; q < 4; q++) { const i = m.ids[n * 4 + q] * 3, w = m.w[n * 4 + q]; px += src[i] * w; py += src[i + 1] * w; pz += src[i + 2] * w; }
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
    if (!upload) return;
    if (m.nIdeal) {
      const a = m.nIdeal, b = m.nHome;
      // cambio de la normal respecto al reposo, suavizado entre vértices vecinos (difumina las facetas de la retícula)
      let d = m.dA, e = m.dB;
      for (let k = 0; k < nrm.length; k++) d[k] = nrm[k] - b[k];
      if (m.adj) for (let pass = 0; pass < 2; pass++) {
        const st = m.adjStart, ad = m.adj;
        for (let n = 0; n < m.n; n++) {
          let sx = d[n * 3], sy = d[n * 3 + 1], sz = d[n * 3 + 2]; const i0 = st[n], i1 = st[n + 1];
          for (let i = i0; i < i1; i++) { const q = ad[i] * 3; sx += d[q]; sy += d[q + 1]; sz += d[q + 2]; }
          const c = 1 / (i1 - i0 + 1); e[n * 3] = sx * c; e[n * 3 + 1] = sy * c; e[n * 3 + 2] = sz * c;
        }
        const t = d; d = e; e = t;
      }
      for (let k = 0; k < nrm.length; k += 3) {
        const nx = a[k] + d[k], ny = a[k + 1] + d[k + 1], nz = a[k + 2] + d[k + 2], l = Math.hypot(nx, ny, nz) || 1;
        nrm[k] = nx / l; nrm[k + 1] = ny / l; nrm[k + 2] = nz / l;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, m.pb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, out);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.nb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, nrm);
  }
  // normales de referencia: ideales (malla sin deformar) y las que da la retícula asentada en su sitio
  function bakeNormals() {
    for (const m of [surf, band, deco, decal]) {
      if (!m) continue;
      skin(m, x0, false); m.nIdeal = Float32Array.from(m.nrm);
      skin(m, home, false); m.nHome = Float32Array.from(m.nrm);
      m.dA = new Float32Array(m.n * 3); m.dB = new Float32Array(m.n * 3);
    }
    // vecinos de cada vértice de la superficie (para suavizar)
    const nb = Array.from({ length: surf.n }, () => new Set()), I = surf.index;
    for (let t = 0; t < I.length; t += 3) { const a = I[t], b = I[t + 1], c = I[t + 2]; nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b); }
    surf.adjStart = new Uint32Array(surf.n + 1);
    for (let n = 0; n < surf.n; n++) surf.adjStart[n + 1] = surf.adjStart[n] + nb[n].size;
    surf.adj = new Uint32Array(surf.adjStart[surf.n]);
    for (let n = 0, k = 0; n < surf.n; n++) for (const q of nb[n]) surf.adj[k++] = q;
  }
  const mkMesh = m => {
    if (!m) return null;
    m.pos = new Float32Array(m.n * 3); m.nrm = new Float32Array(m.n * 3);
    m.vao = gl.createVertexArray(); gl.bindVertexArray(m.vao);
    const buf = (loc, size, data, usage) => {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage);
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); return b;
    };
    m.pb = buf(0, 3, m.pos.byteLength, gl.DYNAMIC_DRAW); m.nb = buf(1, 3, m.nrm.byteLength, gl.DYNAMIC_DRAW);
    buf(2, 3, m.extra, gl.STATIC_DRAW); buf(3, 1, m.alpha, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.index, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    m.draw = () => { gl.bindVertexArray(m.vao); gl.drawElements(gl.TRIANGLES, m.index.length, gl.UNSIGNED_INT, 0); };
    return m;
  };
  const surf = mkMesh(model.surface), band = mkMesh(model.band), deco = mkMesh(model.deco), decal = mkMesh(model.decal);
  const sPos = surf.pos;
  const floorVao = gl.createVertexArray(); gl.bindVertexArray(floorVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-40, 0, -40, 40, 0, -40, -40, 0, 40, 40, 0, 40]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  gl.vertexAttrib3f(1, 0, 1, 0); gl.vertexAttrib3f(2, 0, 0, 0); gl.vertexAttrib1f(3, 1);

  const quadVao = gl.createVertexArray(); gl.bindVertexArray(quadVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const HS = 512, RS = 128; // mapa de alturas y máscaras de sombra (RS = HS / 4)
  const heightT = tex(gl, HS, HS), heightFB = fbo(gl, heightT, null);
  const resT = tex(gl, RS, RS), resFB = fbo(gl, resT, null);
  const blurAT = tex(gl, RS, RS), blurAFB = fbo(gl, blurAT, null);
  const blurBT = tex(gl, RS, RS), blurBFB = fbo(gl, blurBT, null);
  let sceneT, sceneFB, sceneDepth, backT, backDepth, backFB, W = 1, H = 1;

  /* ----- Cámara: la de la foto. La pieza en reposo cae exactamente sobre el hueco `root` ----- */
  let view, proj, viewProj, invVP, cam, near, far, refr = [0, 0];
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
    const vw = shape.view, el = vw.elevation * DEG, d = vw.distance;
    const fpx = vw.scale * rr.width;                        // px por unidad a la distancia del centro de la pieza
    const target = [0, model.T / 2, 0];
    cam = [0, target[1] + d * Math.sin(el), d * Math.cos(el)];
    near = Math.max(0.1, d - 5); far = d + 5;
    // el centro de la pieza se proyecta en el punto (cx, cy) del hueco
    const tx = rr.left - br.left + vw.cx * rr.width, ty = rr.top - br.top + vw.cy * rr.height;
    const sxn = tx / br.width * 2 - 1, syn = 1 - ty / br.height * 2;
    view = lookAt(cam, target, [0, 1, 0]);
    proj = new Float32Array([2 * fpx * d / br.width, 0, 0, 0, 0, 2 * fpx * d / br.height, 0, 0, -sxn, -syn, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]);
    viewProj = mul4(proj, view); invVP = invert4(viewProj);
    refr = [light.refr * fpx / br.width, light.refr * fpx / br.height];
    // paredes: los bordes de la tarjeta proyectados sobre el suelo, con margen
    const floorAt = (nx, ny) => { const [o, dir] = rayNdc(nx, ny); return dir[1] < -1e-4 ? [o[0] - dir[0] * o[1] / dir[1], o[2] - dir[2] * o[1] / dir[1]] : null; };
    const m = 0.45;
    const lA = floorAt(-1, -1), lB = floorAt(-1, syn), rA = floorAt(1, -1), rB = floorAt(1, syn);
    if (lA && lB && rA && rB) {
      bounds.zNear = Math.max(lA[1], rA[1]) + 0.1;
      bounds.l = [lA[0] - m, lA[1], (lB[0] - lA[0]) / (lB[1] - lA[1] || 1)];
      bounds.r = [rA[0] + m, rA[1], (rB[0] - rA[0]) / (rB[1] - rA[1] || 1)];
      bounds.zFar = Math.min(-1.2, lB[1] - 1.2);
      // las paredes nunca aprietan la pieza en su sitio (la foto sobresale de la tarjeta): se abren lo necesario
      let needL = -Infinity, needR = -Infinity, zMax = -Infinity, zMin = Infinity;
      for (let i = 0; i < np; i++) {
        const px = x0[i * 3], pz = x0[i * 3 + 2];
        needL = Math.max(needL, bounds.l[0] + (pz - bounds.l[1]) * bounds.l[2] - px);
        needR = Math.max(needR, px - (bounds.r[0] + (pz - bounds.r[1]) * bounds.r[2]));
        zMax = Math.max(zMax, pz); zMin = Math.min(zMin, pz);
      }
      if (needL > -0.08) bounds.l[0] -= needL + 0.08;
      if (needR > -0.08) bounds.r[0] += needR + 0.08;
      bounds.zNear = Math.max(bounds.zNear, zMax + 0.08); bounds.zFar = Math.min(bounds.zFar, zMin - 0.08);
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
  const bgColor = () => {
    for (let el = box; el; el = el.parentElement) {
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || +m[3] > 0)) return [m[0] / 255, m[1] / 255, m[2] / 255];
    }
    return [1, 1, 1];
  };
  let bg = bgColor();
  const uCache = new Map();
  function U(p, n) { if (!uCache.has(p)) uCache.set(p, {}); const c = uCache.get(p); if (!(n in c)) c[n] = gl.getUniformLocation(p, n); return c[n]; }
  function use(p) {
    gl.useProgram(p);
    gl.uniformMatrix4fv(U(p, 'u_view'), false, view); gl.uniformMatrix4fv(U(p, 'u_proj'), false, proj);
    gl.uniform3fv(U(p, 'u_cam'), cam); gl.uniform3fv(U(p, 'u_L'), light.dir);
    gl.uniform3fv(U(p, 'u_envFloor'), bg.map(c => Math.pow(c, 2.2) * light.floor)); gl.uniform4fv(U(p, 'u_envK'), light.env);
    gl.uniform4f(U(p, 'u_spec'), light.spec[0], light.spec[1], light.spec[2], 0);
    gl.uniform4f(U(p, 'u_envB'), light.back[0] * DEG, light.back[1], light.back[2], light.top);
    return p;
  }
  /* ----- Rebote (solo visual) ----- */
  // Altura: parábola (sale de height y air). Aplastamiento: muelle amortiguado; al despegar se estira, al
  // aterrizar se aplasta según la velocidad de llegada.
  function hopStep(dt) {
    const H = cfg.hop, g = 8 * H.height / (H.air * H.air), v0 = g * H.air / 2;
    const w = 2 * Math.PI * H.freq, k = w * w, c = 2 * H.damping * w;
    const b = hopS;
    b.t += dt;
    if (b.cut) {                                                                                          // se ha agarrado la pieza: se desvanece
      b.h *= 0.7; b.s *= 0.7; b.hv = b.sv = 0;
      if (b.h < 1e-3 && Math.abs(b.s) < 1e-3) hopS = null;
      return;
    }
    if (b.t < H.crouch) { b.s = -H.squash * Math.sin(b.t / H.crouch * Math.PI / 2); b.sv = 0; return; }   // se agacha
    if (!b.up) { b.up = true; b.hv = v0; b.sv = H.squash * w * 0.9; }                                    // despega estirándose
    if (b.h > 0 || b.hv > 0) {
      b.hv -= g * dt; b.h += b.hv * dt;
      if (b.h <= 0) {                                                                                     // aterriza
        const vin = -b.hv; b.h = 0;
        b.sv -= H.squash * w * 1.2 * (vin / v0);
        b.hv = vin * H.bounce > v0 * 0.15 ? vin * H.bounce : 0;
      }
    }
    b.sv += (-k * b.s - c * b.sv) * dt; b.s += b.sv * dt;
    if (b.h === 0 && b.hv === 0 && Math.abs(b.s) < 1e-3 && Math.abs(b.sv) < 0.03) hopS = null;
  }
  // Posiciones para dibujar: las de la física con el rebote encima (escala en vertical desde el suelo, que
  // conserva el volumen, y elevación)
  const xr = new Float32Array(np * 3);
  function posed() {
    if (!hopS) return x;
    const sy = 1 + hopS.s, sxz = 1 / Math.sqrt(sy), h = hopS.h;
    let cx = 0, cz = 0; for (let i = 0; i < np; i++) { cx += x[i * 3]; cz += x[i * 3 + 2]; } cx /= np; cz /= np;
    for (let i = 0; i < np; i++) {
      const k = i * 3;
      xr[k] = cx + (x[k] - cx) * sxz; xr[k + 1] = x[k + 1] * sy + h; xr[k + 2] = cz + (x[k + 2] - cz) * sxz;
    }
    return xr;
  }
  function draw() {
    const src = posed();
    skin(surf, src); skin(band, src); if (deco) skin(deco, src); if (decal) skin(decal, src);
    let cxs = 0, czs = 0; for (let i = 0; i < np; i++) { cxs += x[i * 3]; czs += x[i * 3 + 2]; } cxs /= np; czs /= np;
    const SH = 2.6, L = light.dir;

    // 1 · mapa de alturas (para la sombra)
    gl.bindFramebuffer(gl.FRAMEBUFFER, heightFB); gl.viewport(0, 0, HS, HS);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND); gl.blendEquation(gl.MAX); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(progs.height);
    gl.uniform2f(U(progs.height, 'u_c'), cxs, czs); gl.uniform1f(U(progs.height, 'u_s'), SH);
    surf.draw();
    gl.blendEquation(gl.FUNC_ADD); gl.disable(gl.BLEND);
    // máscaras de sombra a 128² y desenfoque gaussiano (horizontal + vertical) de la ancha
    gl.viewport(0, 0, RS, RS); gl.bindVertexArray(quadVao); gl.activeTexture(gl.TEXTURE0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, resFB); gl.useProgram(progs.resolve);
    gl.bindTexture(gl.TEXTURE_2D, heightT); gl.uniform1i(U(progs.resolve, 'u_height'), 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.useProgram(progs.blur); gl.uniform1i(U(progs.blur, 'u_src'), 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, blurAFB); gl.bindTexture(gl.TEXTURE_2D, resT); gl.uniform2f(U(progs.blur, 'u_dir'), 1 / RS, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, blurBFB); gl.bindTexture(gl.TEXTURE_2D, blurAT); gl.uniform2f(U(progs.blur, 'u_dir'), 0, 1 / RS); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const floor = mode => {
      const p = use(progs.floor);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, blurBT); gl.uniform1i(U(p, 'u_blur'), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, resT); gl.uniform1i(U(p, 'u_res'), 1);
      gl.uniform2f(U(p, 'u_c'), cxs, czs); gl.uniform1f(U(p, 'u_s'), SH);
      gl.uniform3fv(U(p, 'u_bg'), bg); gl.uniform3fv(U(p, 'u_tint'), shape.tint);
      gl.uniform2f(U(p, 'u_shift'), -L[0] * 0.03, -L[2] * 0.03);
      gl.uniform1f(U(p, 'u_mode'), mode); gl.uniform1f(U(p, 'u_strength'), cfg.shadow.strength); gl.uniform1f(U(p, 'u_contact'), cfg.shadow.contact);
      gl.bindVertexArray(floorVao); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    // 2 · escena que se ve a través del cristal: suelo + franja crema
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFB); gl.viewport(0, 0, W, H);
    gl.clearDepth(1); gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    floor(0);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    const pb = use(progs.band); gl.uniform3fv(U(pb, 'u_color'), shape.materials[1].color);
    band.draw();

    // 3 · grosor: caras traseras del cristal o la franja, lo que esté antes
    gl.bindFramebuffer(gl.FRAMEBUFFER, backFB); gl.viewport(0, 0, W, H);
    gl.clearColor(1, 1, 0, 1); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.cullFace(gl.FRONT);
    const pk = use(progs.back); gl.uniform2f(U(pk, 'u_range'), near, far);
    surf.draw();
    gl.cullFace(gl.BACK);
    band.draw();

    // 4 · pantalla: sombra, cristal, calcas y adornos
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    floor(1);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    const pj = use(progs.jelly);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sceneT); gl.uniform1i(U(pj, 'u_scene'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, backT); gl.uniform1i(U(pj, 'u_back'), 1);
    gl.uniform2f(U(pj, 'u_res'), W, H); gl.uniform2f(U(pj, 'u_range'), near, far); gl.uniform2f(U(pj, 'u_refr'), refr[0], refr[1]);
    const mt = shape.materials, lk = shape.look;
    gl.uniform3fv(U(pj, 'u_sig'), mt.flatMap(m => m.sigma));
    gl.uniform3fv(U(pj, 'u_scC'), mt.flatMap(m => m.color));
    gl.uniform1fv(U(pj, 'u_sc'), mt.map(m => m.scatter));
    gl.uniform1fv(U(pj, 'u_path'), mt.map(m => m.path)); gl.uniform1fv(U(pj, 'u_shade'), mt.map(m => m.shade ?? 0.3));
    gl.uniform2f(U(pj, 'u_layers'), shape.layers[0], shape.layers[1]);
    gl.uniform4f(U(pj, 'u_look'), lk.wave, lk.speck, lk.streak, lk.bandShade); gl.uniform1f(U(pj, 'u_T'), model.T);
    gl.uniform3fv(U(pj, 'u_under'), bg.map((c, i) => Math.pow(c * (1 - 0.85 * (1 - shape.tint[i])), 2.2)));
    gl.uniform4f(U(pj, 'u_rect'), 1, (shape.rect?.depth ?? 0) / 2, shape.rect?.radius ?? 0, shape.rect ? (lk.border ?? 0) : 0);
    surf.draw();
    if (decal) {
      gl.enable(gl.BLEND); gl.depthMask(false); gl.depthFunc(gl.LEQUAL);
      use(progs.decal); decal.draw();
      gl.disable(gl.BLEND); gl.depthMask(true); gl.depthFunc(gl.LESS);
    }
    if (deco) { use(progs.deco); deco.draw(); }
    gl.bindVertexArray(null);
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
    while (acc >= fixed && n < 3) { vmax = Math.max(vmax, step(fixed)); if (hopS) hopStep(fixed); acc -= fixed; n++; }
    if (n === 3) acc = 0;
    draw();
    still = vmax < cfg.sleep.speed && !grab && resetT < 0 && !hopS ? still + 1 : 0;
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
      const dd = dot3(e2, q) / det;
      if (dd > 0 && dd < best) { best = dd; hit = [o[0] + d[0] * dd, o[1] + d[1] * dd, o[2] + d[2] * dd]; }
    }
    return hit;
  }
  function planeTarget(cx, cyy) {
    const [o, d] = rayClient(cx, cyy), n = grab.normal;
    const den = dot3(d, n); if (Math.abs(den) < 1e-6) return grab.target;
    const t = dot3([grab.point[0] - o[0], grab.point[1] - o[1], grab.point[2] - o[2]], n) / den;
    const p = [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t];
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
    resetT = -1; lastPlay = performance.now(); if (hopS) hopS.cut = true;
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
    const g = grab; grab = null; lastPlay = performance.now();
    try { box.releasePointerCapture(e.pointerId); } catch { /* ya liberado */ }
    box.style.cursor = cursorOn ? 'grab' : '';
    if (g.moved) {
      moved = true;
      // el clic que sigue al arrastre no debe llegar a la tarjeta
      const stop = ev => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('click', stop, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 0);
    } else {
      poke(g.point, cfg.grab.clickKick, cfg.grab.radius); // clic sin arrastrar: un golpecito
      root.dispatchEvent(new CustomEvent('jellypoke', { bubbles: true }));   // aviso para la página (p. ej. la sección de IA)
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
  layout(); settle(); bakeNormals(); draw();
  root.classList.add('jelly--3d');

  const api = {
    kind: '3d',
    reset() { if (grab || !moved) return; moved = false; resetT = 0; wake(); },
    get moved() { return moved; },
    /** Rebote (al llegar el ratón a la tarjeta; ver CONFIG3D.hop). No hace nada con «movimiento reducido»,
     *  mientras dura otro, antes de `cooldown` desde el anterior ni mientras se juega con la pieza (agarrarla
     *  o hacerle clic) y hasta `afterPlay` después. */
    hop() {
      const now = performance.now();
      if (destroyed || grab || hopS || reduce.matches || now - lastHop < cfg.hop.cooldown * 1000 || now - lastPlay < cfg.hop.afterPlay * 1000) return;
      lastHop = now; hopS = { t: 0, up: false, h: 0, hv: 0, s: 0, sv: 0 }; wake();
    },
    /** Para pruebas: altura y aplastamiento del rebote en curso (null si no hay). */
    get hopping() { return hopS && { t: +hopS.t.toFixed(3), h: +hopS.h.toFixed(4), s: +hopS.s.toFixed(4) }; },
    /* --- utilidades para la página de pruebas --- */
    /** Caja envolvente de las partículas. */
    bbox() {
      const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
      for (let i = 0; i < np; i++) for (let q = 0; q < 3; q++) { b[q] = Math.min(b[q], x[i * 3 + q]); b[q + 3] = Math.max(b[q + 3], x[i * 3 + q]); }
      return b.map(n => +n.toFixed(2));
    },
    get stats() { return { particles: np, tets: nt, edges: ne, surface: surf.n, band: band.n, deco: deco?.n ?? 0, decal: decal?.n ?? 0 }; },
    /** Cambia materiales / luz en caliente y redibuja: tune({ materials, look, tint, light: { env, spec, dir, refr } }). */
    tune(p = {}) {
      if (p.materials) p.materials.forEach((m, i) => m && Object.assign(shape.materials[i], m));
      if (p.look) Object.assign(shape.look, p.look);
      if (p.tint) shape.tint = p.tint;
      if (p.light) { Object.assign(light, p.light); if (p.light.dir) light.dir = norm(p.light.dir); }
      layout(); draw();
      return { materials: shape.materials, look: shape.look, tint: shape.tint, light };
    },
    /** Dibuja y devuelve los píxeles RGBA del lienzo (de abajo arriba) con su tamaño. */
    pixels() { draw(); const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return { width: W, height: H, data: px }; },
    get shape() { return shape; },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      box.removeEventListener('pointerdown', onDown, true); box.removeEventListener('pointermove', onMove);
      box.removeEventListener('pointerup', onUp); box.removeEventListener('pointercancel', onUp);
      box.removeEventListener('pointerleave', onLeave); box.removeEventListener('touchstart', onTouch);
      box.style.cursor = ''; root.classList.remove('jelly--3d');
      canvas.remove(); gl.getExtension('WEBGL_lose_context')?.loseContext();
      delete root.__jelly3d;
    },
  };
  root.__jelly3d = api; // acceso desde las pruebas
  return api;
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
