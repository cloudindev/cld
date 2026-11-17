// Placa de circuito impreso bajo el chip de «Hosting para IA» (ver AiHosting.tsx y NOTAS.md, punto 42).
// Se diseña en el plano del suelo del chip, en sus coordenadas (mide 2 de lado; x y z antes de girarlo), y se
// proyecta con la cámara de la foto, la misma del motor 3D (SHAPES.chip en public/jelly/jelly3d.js;
// tools/ia/hosting-ia.mjs comprueba que los números coinciden). Así, en reposo, las pistas salen justo de debajo
// de las patitas. El resultado son trazados SVG en píxeles del recorte chip.webp (860 × 690); el SVG cubre
// 4 × 3 huecos alrededor del de la pieza (ver BOARD_VIEWBOX).

/** Cámara y medidas del chip (copia de SHAPES.chip: view, yaw, thickness, rect y pins). */
export const CHIP_VIEW = { yaw: 58.41, elevation: 40.13, distance: 17.03, scale: 0.3068, cx: 0.5031, cy: 0.4449, thickness: 0.803, depth: 2, radius: 0.327 };
export const CHIP_PINS = { count: 4, pitch: 0.413, shift: 0, width: 0.32, out: 0.18 };

const W = 860, H = 690;
export const BOARD_VIEWBOX = `${-1.5 * W} ${-1 * H} ${4 * W} ${3 * H}`;

type Pt = [number, number];
const DEG = Math.PI / 180;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Punto del suelo (x, z locales del chip) → píxeles del recorte. */
export function project([lx, lz]: Pt): Pt {
  const v = CHIP_VIEW, c = Math.cos(v.yaw * DEG), s = Math.sin(v.yaw * DEG), e = v.elevation * DEG;
  const x = lx * c + lz * s, z = -lx * s + lz * c, qy = -v.thickness / 2;
  const yv = qy * Math.cos(e) - z * Math.sin(e), zd = v.distance - (qy * Math.sin(e) + z * Math.cos(e));
  const f = v.scale * W * v.distance / zd;
  return [v.cx * W + x * f, v.cy * H - yv * f];
}
const path = (pts: Pt[], close = false) => pts.map((p, i) => `${i ? 'L' : 'M'}${project(p).map(r1).join(' ')}`).join('') + (close ? 'Z' : '');
// polígono de un círculo / rectángulo redondeado del suelo, ya proyectado
const circle = ([x, z]: Pt, r: number, n = 14) => path(Array.from({ length: n }, (_, i): Pt => [x + r * Math.cos(i / n * 2 * Math.PI), z + r * Math.sin(i / n * 2 * Math.PI)]), true);
function rrect(x0: number, x1: number, z0: number, z1: number, r: number): Pt[] {
  const o: Pt[] = [];
  const corners: [number, number, number][] = [[x1 - r, z1 - r, 0], [x0 + r, z1 - r, 90], [x0 + r, z0 + r, 180], [x1 - r, z0 + r, 270]];
  for (const [cx, cz, a0] of corners) {
    for (let k = 0; k <= 6; k++) { const a = (a0 + 15 * k) * DEG; o.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]); }
  }
  return o;
}
// rectángulo girado (eje a lo largo de u, de semiancho hu y semialto hv)
const quad = (c: Pt, u: Pt, hu: number, hv: number): Pt[] => {
  const v: Pt = [-u[1], u[0]];
  const signs: Pt[] = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  return signs.map(([a, b]): Pt => [c[0] + u[0] * hu * a + v[0] * hv * b, c[1] + u[1] * hu * a + v[1] * hv * b]);
};

export type Board = {
  socket: string;          // contorno del zócalo
  pads: string[];          // almohadillas bajo las patitas
  traces: string[];        // pistas (de fuera hacia el chip, para que el pulso entre en él)
  vias: string[];          // taladros al final de las pistas
  parts: string[];         // componentes pequeños (resistencias / condensadores)
  silk: { text: string; transform: string; size: number }[];   // serigrafía
};

/** Placa completa (determinista: el mismo resultado en el servidor y en el navegador). */
export function board(silk: { ref: string; name: string; gpu: string }): Board {
  const P = CHIP_PINS, hz = CHIP_VIEW.depth / 2;
  const out: Board = { socket: '', pads: [], traces: [], vias: [], parts: [], silk: [] };
  out.socket = path(rrect(-1.06, 1.06, -hz - 0.06, hz + 0.06, CHIP_VIEW.radius + 0.06), true);
  // lados: normal hacia fuera, tangente (sentido de giro de las patitas) y distancia del centro a la pared
  const sides: { n: Pt; half: number; len: number[] }[] = [
    { n: [1, 0], half: 1, len: [0.9, 1.5, 1.1, 0.7] },
    { n: [0, 1], half: hz, len: [1.2, 0.8, 1.6, 1.0] },
    { n: [-1, 0], half: 1, len: [0.8, 1.3, 0.9, 1.6] },
    { n: [0, -1], half: hz, len: [1.4, 0.9, 1.2, 0.8] },
  ];
  sides.forEach(({ n, half, len }, si) => {
    const t: Pt = [-n[1], n[0]];
    for (let k = 0; k < P.count; k++) {
      const u = (k - (P.count - 1) / 2) * P.pitch + P.shift;
      const at = (a: number, b: number): Pt => [n[0] * (half + a) + t[0] * b, n[1] * (half + a) + t[1] * b];
      out.pads.push(path(quad(at(P.out / 2 - 0.01, u), n, P.out / 2 + 0.05, P.width / 2 + 0.03), true));
      // pista: sale recta, las de los extremos se abren a 45° y luego siguen rectas
      const spread = k === 0 ? -1 : k === P.count - 1 ? 1 : 0, L = len[k] ?? 1;
      const pts: Pt[] = [at(P.out + 0.04, u), at(P.out + 0.22, u)];
      if (spread) pts.push(at(P.out + 0.22 + 0.32, u + spread * 0.32));
      pts.push(at(P.out + 0.22 + (spread ? 0.32 : 0) + L, u + spread * (spread ? 0.32 : 0)));
      const end = pts[pts.length - 1] as Pt;
      out.traces.push(path([...pts].reverse()));
      out.vias.push(circle(end, 0.05));
      // algún componente junto a las pistas centrales
      if ((k === 1 && si % 2 === 0) || (k === 2 && si % 2 === 1)) {
        const c = at(P.out + 0.55, u + (k === 1 ? -0.17 : 0.17));
        out.parts.push(path(quad(c, n, 0.1, 0.05), true));
      }
    }
  });
  // serigrafía: texto tumbado en el suelo (transformación afín local de la proyección)
  // (se lee de izquierda a derecha en pantalla y sin espejo; el tamaño va en unidades del suelo)
  const label = (text: string, at: Pt, dir: Pt, size: number) => {
    const p0 = project(at), e = 0.01, d1 = (q: Pt): Pt => { const p = project([at[0] + q[0] * e, at[1] + q[1] * e]); return [(p[0] - p0[0]) / e, (p[1] - p0[1]) / e]; };
    let u = d1(dir);
    if (u[0] < 0) { dir = [-dir[0], -dir[1]]; u = d1(dir); }
    let v = d1([dir[1], -dir[0]]);
    if (u[0] * v[1] - u[1] * v[0] < 0) v = d1([-dir[1], dir[0]]);
    const m = [u[0], u[1], v[0], v[1], p0[0], p0[1]].map(n => Math.round(n * 100) / 100);
    out.silk.push({ text, size, transform: `matrix(${m.join(' ')})` });
  };
  // todas a lo largo del lado izquierdo de delante (se leen en suave diagonal) y en huecos sin pistas
  label(silk.ref, [-1.55, -hz - 0.62], [0, 1], 0.17);
  label(silk.name, [-1.75, -0.55], [0, 1], 0.13);
  label(silk.gpu, [-1.62, hz + 0.5], [0, 1], 0.13);
  return out;
}
