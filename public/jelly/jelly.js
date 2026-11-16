/**
 * jelly.js · Nube de gominola animada (sin dependencias).
 *
 * La foto recortada se usa tal cual como textura sobre una malla subdividida; la animación
 * solo desplaza vértices (no se redibuja nada). Sin WebGL se usa un fallback con CSS transforms.
 *
 * Marcado esperado dentro del contenedor:
 *   <div class="jelly">
 *     <div class="jelly-body">                               (si falta, se crea)
 *       <img class="jelly-shadow" src="shadow.webp" alt="">   (opcional)
 *       <img class="jelly-img" src="cloud.webp" alt="…">
 *     </div>
 *   </div>
 * Con ratón la pieza se puede arrastrar dentro de su contenedor posicionado (la tarjeta);
 * `reset()` la devuelve a su sitio.
 * Uso: import { createJelly } from './jelly.js'; const j = createJelly(el); … j.destroy();
 */

/* =========================================================================
 * CONFIGURACIÓN · todos los parámetros ajustables están aquí
 * Unidades: distancias en «alturas de imagen» (1 = alto de la nube), tiempo en segundos.
 * ========================================================================= */
export const CONFIG = {
  loop: 4,                 // duración del bucle en reposo (s). Todo lo idle es periódico en este valor.
  idle: {
    trigger: 'hover',      // 'hover' = quieto hasta que pasa el ratón / se toca; 'always' = bucle continuo
    fade: 0.35,            // segundos que tarda el bucle en entrar / apagarse (sin saltos)
    touchHold: 2.5,        // en táctil, segundos que sigue animado tras tocar
    float: 0.045,          // amplitud de la flotación vertical
    squash: 0.035,         // squash & stretch: aplasta abajo, estira arriba (desfasado = inercia)
    squashLag: 0.7,        // retraso (rad) del squash respecto a la flotación
    sway: 0.012,           // bamboleo lateral de la parte alta
    ripple: 0.006,         // onda gelatinosa que recorre el contorno
  },
  shadow: {
    minScale: 0.84,        // escala de la sombra cuando la nube está arriba
    minOpacity: 0.55,      // opacidad de la sombra cuando la nube está arriba
  },
  spring: {                // muelle amortiguado: ζ = damping / (2·√stiffness) ≈ 0.18 → 2-3 oscilaciones
    stiffness: 190,
    damping: 5,
  },
  hover: {
    depth: 0.55,           // cuánto se hunde la zona bajo el puntero (0-1)
    radius: 0.42,          // radio de influencia del puntero
    enterKick: 0.9,        // impulso de squash al entrar el puntero / tocar
    follow: 14,            // rapidez con que la abolladura sigue al puntero (1/s)
  },
  hop: { kick: 1.6, cooldown: 0.6 }, // rebote al pasar el ratón por la tarjeta (impulso de squash)
  click: {
    kick: 2.6,             // impulso de squash al hacer clic (rebote fuerte)
    poke: 3.5,             // impulso extra de la abolladura al hacer clic
  },
  drag: {                  // arrastre con ratón / lápiz (en táctil se mantiene el toque)
    enabled: true,
    stiffness: 170,        // muelle que lleva el cuerpo hacia el puntero (más alto = sigue antes)
    damping: 11,           // ζ ≈ 0.42 → se pasa un poco y vuelve
    stretchRadius: 0.55,   // tamaño de la zona agarrada que se estira hacia el puntero
    maxStretch: 0.32,      // estiramiento máximo (alturas de imagen), con saturación suave
    thin: 1.1,             // adelgazamiento perpendicular al estirar (conserva volumen)
    jiggleStiffness: 240,  // muelle secundario de inercia: el resto del cuerpo llega tarde
    jiggleDamping: 6,
    jiggleGain: 0.6,
    jiggleMax: 0.16,
    grabKick: 1.2,         // pellizco al agarrar
    dropKick: 1.8,         // rebote al soltar
    throw: 0.09,           // inercia al soltar (s de velocidad que se conservan)
    edge: 0.22,            // el centro de la pieza no sale de la tarjeta (fracción del tamaño menor)
    lift: 0.9,             // la sombra se encoge/aclara al levantar la pieza
  },
  speed: 1,                // multiplicador global de velocidad del bucle en reposo
  mesh: { cols: 48, rows: 32 }, // subdivisión de la malla
  pad: 0.3,                // margen del canvas alrededor de la imagen (fracción) para la deformación
  maxDpr: 2,               // límite de densidad de píxeles (rendimiento)
};

const TAU = Math.PI * 2;

/* ---------- Shaders ---------- */
const VERT = `
attribute vec2 a_uv;            // 0..1, y hacia abajo (coordenadas de textura)
uniform vec2  u_scale;          // semitamaño de la imagen en coordenadas de clip
uniform float u_aspect;         // ancho / alto de la imagen
uniform float u_float;          // desplazamiento vertical (alturas de imagen)
uniform float u_squash;         // >0 aplasta, <0 estira
uniform float u_sway;           // bamboleo lateral
uniform float u_ripple;         // amplitud de la onda del contorno
uniform float u_phase;          // fase del bucle 0..2π
uniform vec2  u_poke;           // posición del puntero (x centrada, y desde la base)
uniform float u_pokeAmt;        // intensidad de la abolladura
uniform float u_pokeR;          // radio de la abolladura
uniform vec2  u_grab;           // punto agarrado (espacio de imagen)
uniform vec2  u_lag;            // distancia del cuerpo al puntero (lo que se estira la zona agarrada)
uniform float u_grabW;          // 0 suelto … 1 agarrado
uniform float u_grabR;          // radio de la zona agarrada
uniform float u_thin;           // adelgazamiento al estirar
uniform vec2  u_jig;            // desplazamiento por inercia (muelle secundario)
varying vec2  v_uv;
varying float v_press;

void main() {
  v_uv = a_uv;
  // espacio de imagen: x centrada en 0 (en alturas), y = 0 en la base, 1 arriba
  vec2 p = vec2((a_uv.x - 0.5) * u_aspect, 1.0 - a_uv.y);
  float h = p.y;

  // squash & stretch anclado a la base, más fuerte arriba (la gelatina «llega tarde»)
  float s = u_squash * (0.55 + 0.45 * h);
  p.y *= 1.0 - s;
  p.x *= 1.0 + s * (0.45 + 0.35 * (1.0 - h)); // conserva volumen: se ensancha sobre todo abajo

  // bamboleo lateral (crece con la altura) + onda que recorre el borde
  p.x += u_sway * h * h;
  p.y += u_ripple * sin(p.x * 6.0 + u_phase * 2.0) * h;
  p.x += u_ripple * 0.6 * sin(p.y * 7.0 - u_phase * 3.0) * h;

  // arrastre: la zona agarrada se estira hasta el puntero y adelgaza; el resto llega tarde (inercia)
  vec2 dg = (p - u_grab) / u_grabR;
  float g = exp(-dot(dg, dg));
  float wg = g * u_grabW;
  p += u_jig * mix(0.25 + 0.75 * h, 1.0 - g, u_grabW);
  float L = length(u_lag);
  if (L > 1e-5) {
    vec2 n = u_lag / L;
    vec2 rel = p - u_grab;
    vec2 perp = rel - dot(rel, n) * n;
    p -= perp * wg * min(L * u_thin, 0.45);
    p += u_lag * wg;
  }

  // abolladura hacia el puntero: la zona cercana se hunde y se recoge hacia el dedo
  vec2 d = (p - u_poke) / u_pokeR;
  float w = exp(-dot(d, d));
  p += w * u_pokeAmt * ((u_poke - p) * 0.35 + vec2(0.0, -0.09));
  v_press = w * u_pokeAmt;

  p.y += u_float;
  gl_Position = vec4(p.x / u_aspect * 2.0 * u_scale.x, (p.y - 0.5) * 2.0 * u_scale.y, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
varying vec2  v_uv;
varying float v_press;
void main() {
  vec4 c = texture2D(u_tex, v_uv);           // premultiplicado
  c.rgb *= 1.0 - clamp(v_press, 0.0, 1.0) * 0.12; // la zona hundida se oscurece un poco (profundidad)
  gl_FragColor = c;
}`;

/* ---------- Muelle amortiguado (integración semi-implícita con subpasos) ---------- */
function spring() { return { x: 0, v: 0, target: 0 }; }
function stepSpring(sp, dt, k, c) {
  const a = -k * (sp.x - sp.target) - c * sp.v;
  sp.v += a * dt;
  sp.x += sp.v * dt;
}

export function createJelly(root, overrides = {}) {
  const cfg = merge(structuredClone(CONFIG), overrides);
  const body = root.querySelector('.jelly-body') || wrapBody(root);
  const img = root.querySelector('.jelly-img');
  const shadow = root.querySelector('.jelly-shadow');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const squash = spring();   // squash global (idle se suma aparte)
  const poke = spring();     // intensidad de la abolladura
  const pokePos = { x: 0, y: 0.5, tx: 0, ty: 0.5 };
  const act = { x: cfg.idle.trigger === 'always' ? 1 : 0, target: cfg.idle.trigger === 'always' ? 1 : 0 }; // intensidad del bucle (0-1)
  // Arrastre: pos = desplazamiento del cuerpo (px) respecto a su sitio; jig = inercia (unidades de imagen)
  const pos = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
  const jig = { x: 0, y: 0, vx: 0, vy: 0 };
  const grab = spring();
  const grabPt = { x: 0, y: 0.5 };
  let drag = null, H = 1, shownX = NaN, shownY = NaN;
  let raf = 0, last = 0, visible = true, destroyed = false, paused = false, touchTimer = 0, lastHop = -1e9;
  let renderer = null;

  /* ----- Estado en cada instante: idle (periódico) + muelles ----- */
  // a = intensidad del bucle en reposo (0 = quieto); los muelles de la interacción no dependen de ella
  function sample(t, a = act.x) {
    const ph = ((t * cfg.speed) % cfg.loop) / cfg.loop * TAU; // fase del bucle
    const i = cfg.idle;
    const up = Math.sin(ph);                                     // -1 abajo … 1 arriba
    return {
      ph,
      float: a * i.float * up,
      // aplasta al llegar abajo, estira al subir (con retraso) + armónico 2 para el temblor
      squash: a * (-i.squash * Math.sin(ph - i.squashLag) + i.squash * 0.35 * Math.sin(2 * ph + 1.1)) + squash.x * 0.06,
      sway: a * i.sway * Math.sin(2 * ph + 0.6) + squash.v * 0.0015,
      ripple: a * i.ripple,
      pokeAmt: Math.max(0, poke.x) * cfg.hover.depth,
      lift: Math.max(a * (up + 1) / 2, Math.max(0, grab.x) * cfg.drag.lift),
      grabW: Math.max(0, Math.min(1, grab.x)),
      lag: lagVec(),
      jig: { x: jig.x, y: jig.y },
      grab: grabPt,
    };
  }

  // Lo que se estira la zona agarrada: distancia cuerpo → puntero, en alturas de imagen, con saturación suave
  function lagVec() {
    const m = cfg.drag.maxStretch;
    const x = (pos.tx - pos.x) / H, y = -(pos.ty - pos.y) / H, l = Math.hypot(x, y);
    const k = l > 0 ? 1 / (1 + l / m) : 0;
    return { x: x * k, y: y * k };
  }

  /* ----- Sombra: se encoge y aclara al subir; se ensancha al aplastarse ----- */
  function drawShadow(st) {
    if (!shadow) return;
    const k = st.lift; // 0 abajo / en reposo, 1 arriba
    const sc = 1 - (1 - cfg.shadow.minScale) * k;
    const op = 1 - (1 - cfg.shadow.minOpacity) * k;
    shadow.style.transform = `scale(${(sc * (1 + st.squash * 0.6)).toFixed(4)}, ${sc.toFixed(4)})`;
    shadow.style.opacity = op.toFixed(3);
  }

  /* ----- Bucle principal ----- */
  function frame(now) {
    raf = 0;
    if (destroyed) return;
    const t = now / 1000;
    let dt = last ? Math.min(t - last, 1 / 20) : 0; // tras una pausa no se «salta»
    last = t;
    // física con subpasos de 1/240 s → estable con cualquier fps
    const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
    for (let n = 0; n < sub; n++) {
      stepSpring(squash, h, cfg.spring.stiffness, cfg.spring.damping);
      stepSpring(poke, h, cfg.spring.stiffness, cfg.spring.damping);
      stepSpring(grab, h, 300, 30);
      const d = cfg.drag;
      const ax = -d.stiffness * (pos.x - pos.tx) - d.damping * pos.vx;
      const ay = -d.stiffness * (pos.y - pos.ty) - d.damping * pos.vy;
      pos.vx += ax * h; pos.vy += ay * h; pos.x += pos.vx * h; pos.y += pos.vy * h;
      // inercia: al acelerar el cuerpo, la gelatina se queda atrás (y hacia abajo en pantalla = negativo en imagen)
      const jx = -d.jiggleStiffness * jig.x - d.jiggleDamping * jig.vx - d.jiggleGain * ax / H;
      const jy = -d.jiggleStiffness * jig.y - d.jiggleDamping * jig.vy + d.jiggleGain * ay / H;
      jig.vx += jx * h; jig.vy += jy * h; jig.x += jig.vx * h; jig.y += jig.vy * h;
      const jl = Math.hypot(jig.x, jig.y);
      if (jl > d.jiggleMax) { jig.x *= d.jiggleMax / jl; jig.y *= d.jiggleMax / jl; }
    }
    if (reduce.matches) { pos.x = pos.tx; pos.y = pos.ty; pos.vx = pos.vy = 0; jig.x = jig.y = jig.vx = jig.vy = 0; }
    placeBody();
    act.x += (act.target - act.x) * (1 - Math.exp(-dt / cfg.idle.fade));
    if (Math.abs(act.x - act.target) < 0.002) act.x = act.target;
    const f = 1 - Math.exp(-cfg.hover.follow * dt);
    pokePos.x += (pokePos.tx - pokePos.x) * f;
    pokePos.y += (pokePos.ty - pokePos.y) * f;

    const st = sample(reduce.matches ? 0 : t);
    if (reduce.matches) { st.float = 0; st.squash = 0; st.sway = 0; st.ripple = 0; st.pokeAmt = 0; }
    renderer.draw(st, pokePos);
    drawShadow(st);
    // sin bucle activo y con los muelles en reposo no se pide otro frame (0 % CPU parado)
    const moving = act.x > 0 || act.target > 0 || Math.abs(squash.x) + Math.abs(squash.v) + Math.abs(poke.x) + Math.abs(poke.v) > 1e-4 || poke.target > 0
      || drag || grab.x > 1e-3 || Math.abs(pos.x - pos.tx) + Math.abs(pos.y - pos.ty) > 0.05 || Math.abs(pos.vx) + Math.abs(pos.vy) > 0.5
      || Math.abs(jig.x) + Math.abs(jig.y) + Math.abs(jig.vx) + Math.abs(jig.vy) > 1e-4;
    if (!moving) { pos.x = pos.tx; pos.y = pos.ty; pos.vx = pos.vy = 0; jig.x = jig.y = jig.vx = jig.vy = 0; grab.x = grab.v = 0; placeBody(); }
    if (!reduce.matches && visible && moving) raf = requestAnimationFrame(frame);
  }
  // Mueve el cuerpo con left/top (sin transform: aislaría la mezcla «multiply» de la sombra)
  function placeBody() {
    const x = Math.round(pos.x * 10) / 10, y = Math.round(pos.y * 10) / 10;
    if (x === shownX && y === shownY) return;
    shownX = x; shownY = y;
    body.style.left = x ? `${x}px` : ''; body.style.top = y ? `${y}px` : '';
  }
  const start = () => { if (!raf && !destroyed && !paused) { last = 0; raf = requestAnimationFrame(frame); } };

  /* ----- Interacción: puntero → coordenadas de imagen ----- */
  function toImage(e) {
    const r = img.getBoundingClientRect();
    const aspect = r.width / r.height;
    return { x: ((e.clientX - r.left) / r.width - 0.5) * aspect, y: 1 - (e.clientY - r.top) / r.height };
  }
  function onMove(e) {
    const p = toImage(e); pokePos.tx = p.x; pokePos.ty = p.y;
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) > 4) { drag.moved = true; root.classList.add('jelly--dragging'); }
    const b = drag.bounds;
    pos.tx = clamp(drag.ox + dx, b.x0, b.x1); pos.ty = clamp(drag.oy + dy, b.y0, b.y1);
    drag.hist.push({ x: e.clientX, y: e.clientY, t: e.timeStamp }); if (drag.hist.length > 6) drag.hist.shift();
    start();
  }
  // Límites del arrastre: el centro de la pieza no sale de su contenedor posicionado (la tarjeta)
  function bounds() {
    const box = (root.offsetParent || root.parentElement).getBoundingClientRect();
    const r = root.getBoundingClientRect(); // sitio original (el contenedor .jelly no se mueve)
    const m = cfg.drag.edge * Math.min(r.width, r.height), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return { x0: Math.min(0, box.left + m - cx), x1: Math.max(0, box.right - m - cx), y0: Math.min(0, box.top + m - cy), y1: Math.max(0, box.bottom - m - cy) };
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    try { body.releasePointerCapture(e.pointerId); } catch { /* ya liberado */ }
    root.classList.remove('jelly--grabbing', 'jelly--dragging');
    grab.target = 0;
    if (d.moved) {
      // un poco de inercia al soltar, según la velocidad de los últimos movimientos
      const a = d.hist[0], z = d.hist[d.hist.length - 1], dt = a && z ? (z.t - a.t) / 1000 : 0;
      if (dt > 0.008 && e.timeStamp - z.t < 80) {
        pos.tx = clamp(pos.tx + (z.x - a.x) / dt * cfg.drag.throw, d.bounds.x0, d.bounds.x1);
        pos.ty = clamp(pos.ty + (z.y - a.y) / dt * cfg.drag.throw, d.bounds.y0, d.bounds.y1);
      }
      // el clic que sigue al arrastre no debe llegar a la tarjeta
      const stop = ev => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('click', stop, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 0);
    }
    squash.v += cfg.drag.dropKick * 10;
    const r = body.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onLeave(e);
    start();
  }
  function onEnter(e) {
    if (reduce.matches) return;
    const p = toImage(e); pokePos.x = pokePos.tx = p.x; pokePos.y = pokePos.ty = p.y;
    poke.target = 1; act.target = 1; squash.v += cfg.hover.enterKick * 10; start();
  }
  function onLeave(e) {
    if (e && e.pointerType === 'touch') return; // en táctil se apaga con el temporizador
    if (drag) return;
    poke.target = 0; if (cfg.idle.trigger !== 'always') act.target = 0;
  }
  function onDown(e) {
    if (reduce.matches) return;
    onMove(e);
    squash.v += cfg.click.kick * 10; poke.v += cfg.click.poke; start();
    if (cfg.drag.enabled && e.pointerType !== 'touch' && e.button === 0 && !drag) {
      const r = body.getBoundingClientRect();
      H = r.height || 1;
      const p = toImage(e); grabPt.x = p.x; grabPt.y = p.y;
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: pos.tx, oy: pos.ty, moved: false, bounds: bounds(), hist: [] };
      try { body.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
      grab.target = 1; squash.v += cfg.drag.grabKick * 10;
      root.classList.add('jelly--grabbing');
      e.preventDefault();
    }
    if (e.pointerType === 'touch') { // toque: abolladura breve y bucle activo unos segundos
      poke.target = 1; act.target = 1; setTimeout(() => { poke.target = 0; }, 350);
      clearTimeout(touchTimer);
      touchTimer = setTimeout(() => { if (cfg.idle.trigger !== 'always') act.target = 0; start(); }, cfg.idle.touchHold * 1000);
    }
  }
  body.addEventListener('pointerenter', onEnter);
  body.addEventListener('pointermove', onMove);
  body.addEventListener('pointerleave', onLeave);
  body.addEventListener('pointerdown', onDown);
  body.addEventListener('pointerup', onUp);
  body.addEventListener('pointercancel', onUp);

  // Pausa fuera de pantalla
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); });
  io.observe(root);
  const onReduce = () => start();
  reduce.addEventListener('change', onReduce);

  function ready() {
    H = img.getBoundingClientRect().height || 1;
    renderer = createWebGL(body, img, cfg, start) || createCss(img, cfg);
    root.classList.add(renderer.kind === 'webgl' ? 'jelly--webgl' : 'jelly--css');
    start();
  }
  if (img.complete && img.naturalWidth) ready(); else img.addEventListener('load', ready, { once: true });

  return {
    get kind() { return renderer?.kind; },
    /** Detiene / reanuda el bucle (p. ej. para capturas o pruebas). */
    pause() { paused = true; cancelAnimationFrame(raf); raf = 0; },
    play() { paused = false; start(); },
    /** Rebote (al pasar el ratón por la tarjeta). */
    hop() {
      const now = performance.now();
      if (destroyed || drag || reduce.matches || now - lastHop < cfg.hop.cooldown * 1000) return;
      lastHop = now; squash.v += cfg.hop.kick * 10; start();
    },
    /** Devuelve la pieza a su sitio (con el mismo muelle, así que llega rebotando). */
    reset() { if (drag) return; H = img.getBoundingClientRect().height || H; pos.tx = 0; pos.ty = 0; start(); },
    /** true si la pieza no está en su sitio. */
    get moved() { return pos.tx !== 0 || pos.ty !== 0; },
    /** Dibuja un instante concreto del bucle (para pruebas): t en segundos. */
    render(t) { const st = sample(t, 1); renderer.draw(st, pokePos); drawShadow(st); },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); clearTimeout(touchTimer); io.disconnect();
      reduce.removeEventListener('change', onReduce);
      body.removeEventListener('pointerenter', onEnter); body.removeEventListener('pointermove', onMove);
      body.removeEventListener('pointerleave', onLeave); body.removeEventListener('pointerdown', onDown);
      body.removeEventListener('pointerup', onUp); body.removeEventListener('pointercancel', onUp);
      renderer?.destroy();
    },
  };
}

/* =========================================================================
 * Render WebGL: imagen como textura sobre una malla de cols × rows
 * ========================================================================= */
function createWebGL(root, img, cfg, redraw) {
  const canvas = document.createElement('canvas');
  canvas.className = 'jelly-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
  if (!gl) return null;

  const prog = program(gl, VERT, FRAG);
  if (!prog) return null;
  gl.useProgram(prog);

  // Malla: vértices en uv + índices de triángulos
  const { cols, rows } = cfg.mesh;
  const uv = new Float32Array((cols + 1) * (rows + 1) * 2);
  for (let y = 0, i = 0; y <= rows; y++) for (let x = 0; x <= cols; x++) { uv[i++] = x / cols; uv[i++] = y / rows; }
  const idx = new Uint16Array(cols * rows * 6);
  for (let y = 0, i = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const a = y * (cols + 1) + x, b = a + 1, c = a + cols + 1, d = c + 1;
    idx.set([a, c, b, b, c, d], i); i += 6;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_uv');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

  // Textura (alfa premultiplicado para bordes limpios)
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const U = n => gl.getUniformLocation(prog, n);
  const u = { scale: U('u_scale'), aspect: U('u_aspect'), float: U('u_float'), squash: U('u_squash'), sway: U('u_sway'),
    ripple: U('u_ripple'), phase: U('u_phase'), poke: U('u_poke'), pokeAmt: U('u_pokeAmt'), pokeR: U('u_pokeR'),
    grab: U('u_grab'), lag: U('u_lag'), grabW: U('u_grabW'), grabR: U('u_grabR'), thin: U('u_thin'), jig: U('u_jig') };
  const aspect = img.naturalWidth / img.naturalHeight;
  gl.uniform1f(u.aspect, aspect);
  gl.uniform1f(u.pokeR, cfg.hover.radius);
  gl.uniform1f(u.grabR, cfg.drag.stretchRadius);
  gl.uniform1f(u.thin, cfg.drag.thin);
  // la imagen ocupa 1/(1+2·pad) del canvas en cada eje
  gl.uniform2f(u.scale, 1 / (1 + 2 * cfg.pad), 1 / (1 + 2 * cfg.pad));

  // El canvas sobresale de la imagen por `pad` en cada lado; se redimensiona con el contenedor
  // Tamaño CSS explícito: un <canvas> con width:auto tomaría su tamaño interno (× devicePixelRatio)
  canvas.style.left = canvas.style.top = `${-cfg.pad * 100}%`;
  canvas.style.width = canvas.style.height = `${(1 + 2 * cfg.pad) * 100}%`;
  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, cfg.maxDpr);
    const r = img.getBoundingClientRect();
    const w = Math.round(r.width * (1 + 2 * cfg.pad) * dpr), h = Math.round(r.height * (1 + 2 * cfg.pad) * dpr);
    // cambiar el tamaño vacía el canvas: se pide un frame para repintarlo aunque la animación esté parada
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); redraw?.(); }
  };
  const ro = new ResizeObserver(fit);
  ro.observe(root);
  root.appendChild(canvas);
  fit();

  return {
    kind: 'webgl',
    draw(st, pp) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(u.float, st.float); gl.uniform1f(u.squash, st.squash); gl.uniform1f(u.sway, st.sway);
      gl.uniform1f(u.ripple, st.ripple); gl.uniform1f(u.phase, st.ph);
      gl.uniform2f(u.poke, pp.x, pp.y); gl.uniform1f(u.pokeAmt, st.pokeAmt);
      gl.uniform2f(u.grab, st.grab.x, st.grab.y); gl.uniform2f(u.lag, st.lag.x, st.lag.y);
      gl.uniform1f(u.grabW, st.grabW); gl.uniform2f(u.jig, st.jig.x, st.jig.y);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
    },
    destroy() { ro.disconnect(); canvas.remove(); gl.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}

function program(gl, vs, fs) {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

/* =========================================================================
 * Fallback sin WebGL: mismas curvas aplicadas con CSS transforms a la <img>
 * (sin malla: squash/stretch, bamboleo con skew y la abolladura como aplastamiento local)
 * ========================================================================= */
function createCss(img) {
  img.style.transformOrigin = '50% 100%';
  img.style.willChange = 'transform';
  return {
    kind: 'css',
    draw(st, pp) {
      const s = st.squash + st.pokeAmt * 0.08;
      const lean = st.pokeAmt * pp.x * -4 + (st.jig.x + st.lag.x * st.grabW) * 40; // se inclina hacia el puntero / por inercia
      img.style.transform =
        `translateY(${(-st.float * 100).toFixed(3)}%) skewX(${(st.sway * -60 + lean).toFixed(3)}deg) scale(${(1 + s * 0.6).toFixed(4)}, ${(1 - s).toFixed(4)})`;
    },
    destroy() { img.style.transform = ''; },
  };
}

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

// La demo y versiones anteriores no traen .jelly-body: se envuelven los hijos en uno
function wrapBody(root) {
  const b = document.createElement('div');
  b.className = 'jelly-body';
  while (root.firstChild) b.appendChild(root.firstChild);
  root.appendChild(b);
  return b;
}

function merge(a, b) {
  for (const k of Object.keys(b)) a[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? merge(a[k] ?? {}, b[k]) : b[k];
  return a;
}
