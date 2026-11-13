/**
 * jelly.js · Nube de gominola animada (sin dependencias).
 *
 * La foto recortada se usa tal cual como textura sobre una malla subdividida; la animación
 * solo desplaza vértices (no se redibuja nada). Sin WebGL se usa un fallback con CSS transforms.
 *
 * Marcado esperado dentro del contenedor:
 *   <div class="jelly">
 *     <img class="jelly-shadow" src="shadow.webp" alt="">
 *     <img class="jelly-img" src="cloud.webp" alt="…">
 *   </div>
 * Uso: import { createJelly } from './jelly.js'; const j = createJelly(el); … j.destroy();
 */

/* =========================================================================
 * CONFIGURACIÓN · todos los parámetros ajustables están aquí
 * Unidades: distancias en «alturas de imagen» (1 = alto de la nube), tiempo en segundos.
 * ========================================================================= */
export const CONFIG = {
  loop: 4,                 // duración del bucle en reposo (s). Todo lo idle es periódico en este valor.
  idle: {
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
  click: {
    kick: 2.6,             // impulso de squash al hacer clic (rebote fuerte)
    poke: 3.5,             // impulso extra de la abolladura al hacer clic
  },
  speed: 1,                // multiplicador global de velocidad del bucle en reposo
  mesh: { cols: 48, rows: 32 }, // subdivisión de la malla
  pad: 0.14,               // margen del canvas alrededor de la imagen (fracción) para la deformación
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
  const img = root.querySelector('.jelly-img');
  const shadow = root.querySelector('.jelly-shadow');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const squash = spring();   // squash global (idle se suma aparte)
  const poke = spring();     // intensidad de la abolladura
  const pokePos = { x: 0, y: 0.5, tx: 0, ty: 0.5 };
  let raf = 0, last = 0, visible = true, destroyed = false, paused = false;
  let renderer = null;

  /* ----- Estado en cada instante: idle (periódico) + muelles ----- */
  function sample(t) {
    const ph = ((t * cfg.speed) % cfg.loop) / cfg.loop * TAU; // fase del bucle
    const i = cfg.idle;
    const up = Math.sin(ph);                                     // -1 abajo … 1 arriba
    return {
      ph,
      up,
      float: i.float * up,
      // aplasta al llegar abajo, estira al subir (con retraso) + armónico 2 para el temblor
      squash: -i.squash * Math.sin(ph - i.squashLag) + i.squash * 0.35 * Math.sin(2 * ph + 1.1) + squash.x * 0.06,
      sway: i.sway * Math.sin(2 * ph + 0.6) + squash.v * 0.0015,
      ripple: i.ripple,
      pokeAmt: Math.max(0, poke.x) * cfg.hover.depth,
    };
  }

  /* ----- Sombra: se encoge y aclara al subir; se ensancha al aplastarse ----- */
  function drawShadow(st) {
    if (!shadow) return;
    const k = (st.up + 1) / 2; // 0 abajo, 1 arriba
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
    }
    const f = 1 - Math.exp(-cfg.hover.follow * dt);
    pokePos.x += (pokePos.tx - pokePos.x) * f;
    pokePos.y += (pokePos.ty - pokePos.y) * f;

    const st = sample(reduce.matches ? 0 : t);
    if (reduce.matches) { st.float = 0; st.squash = 0; st.sway = 0; st.ripple = 0; st.pokeAmt = 0; }
    renderer.draw(st, pokePos);
    drawShadow(st);
    if (!reduce.matches && visible) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf && !destroyed && !paused) { last = 0; raf = requestAnimationFrame(frame); } };

  /* ----- Interacción: puntero → coordenadas de imagen ----- */
  function toImage(e) {
    const r = img.getBoundingClientRect();
    const aspect = r.width / r.height;
    return { x: ((e.clientX - r.left) / r.width - 0.5) * aspect, y: 1 - (e.clientY - r.top) / r.height };
  }
  function onMove(e) { const p = toImage(e); pokePos.tx = p.x; pokePos.ty = p.y; }
  function onEnter(e) {
    if (reduce.matches) return;
    const p = toImage(e); pokePos.x = pokePos.tx = p.x; pokePos.y = pokePos.ty = p.y;
    poke.target = 1; squash.v += cfg.hover.enterKick * 10; start();
  }
  function onLeave() { poke.target = 0; }
  function onDown(e) {
    if (reduce.matches) return;
    onMove(e);
    squash.v += cfg.click.kick * 10; poke.v += cfg.click.poke; start();
    if (e.pointerType !== 'mouse') { poke.target = 1; setTimeout(() => { poke.target = 0; }, 350); } // toque
  }
  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerleave', onLeave);
  root.addEventListener('pointerdown', onDown);

  // Pausa fuera de pantalla
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); });
  io.observe(root);
  const onReduce = () => start();
  reduce.addEventListener('change', onReduce);

  function ready() {
    renderer = createWebGL(root, img, cfg) || createCss(img, cfg);
    root.classList.add(renderer.kind === 'webgl' ? 'jelly--webgl' : 'jelly--css');
    start();
  }
  if (img.complete && img.naturalWidth) ready(); else img.addEventListener('load', ready, { once: true });

  return {
    get kind() { return renderer?.kind; },
    /** Detiene / reanuda el bucle (p. ej. para capturas o pruebas). */
    pause() { paused = true; cancelAnimationFrame(raf); raf = 0; },
    play() { paused = false; start(); },
    /** Dibuja un instante concreto del bucle (para pruebas): t en segundos. */
    render(t) { const st = sample(t); renderer.draw(st, pokePos); drawShadow(st); },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); io.disconnect();
      reduce.removeEventListener('change', onReduce);
      root.removeEventListener('pointerenter', onEnter); root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave); root.removeEventListener('pointerdown', onDown);
      renderer?.destroy();
    },
  };
}

/* =========================================================================
 * Render WebGL: imagen como textura sobre una malla de cols × rows
 * ========================================================================= */
function createWebGL(root, img, cfg) {
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
    ripple: U('u_ripple'), phase: U('u_phase'), poke: U('u_poke'), pokeAmt: U('u_pokeAmt'), pokeR: U('u_pokeR') };
  const aspect = img.naturalWidth / img.naturalHeight;
  gl.uniform1f(u.aspect, aspect);
  gl.uniform1f(u.pokeR, cfg.hover.radius);
  // la imagen ocupa 1/(1+2·pad) del canvas en cada eje
  gl.uniform2f(u.scale, 1 / (1 + 2 * cfg.pad), 1 / (1 + 2 * cfg.pad));

  // El canvas sobresale de la imagen por `pad` en cada lado; se redimensiona con el contenedor
  canvas.style.inset = `${-cfg.pad * 100}%`;
  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, cfg.maxDpr);
    const r = img.getBoundingClientRect();
    const w = Math.round(r.width * (1 + 2 * cfg.pad) * dpr), h = Math.round(r.height * (1 + 2 * cfg.pad) * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
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
      const lean = st.pokeAmt * pp.x * -4; // se inclina hacia el puntero
      img.style.transform =
        `translateY(${(-st.float * 100).toFixed(3)}%) skewX(${(st.sway * -60 + lean).toFixed(3)}deg) scale(${(1 + s * 0.6).toFixed(4)}, ${(1 - s).toFixed(4)})`;
    },
    destroy() { img.style.transform = ''; },
  };
}

function merge(a, b) {
  for (const k of Object.keys(b)) a[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? merge(a[k] ?? {}, b[k]) : b[k];
  return a;
}
