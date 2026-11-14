/**
 * mascota.js · El personaje de Cloudin asomado sobre la raya: sigue el ratón con la cabeza y la mirada.
 *
 * La foto recortada (mascota.webp) se usa como textura sobre una malla fina y el movimiento solo desplaza
 * vértices (WebGL):
 *   - la cara se desliza dentro del capuchón: es una meseta rígida (no se deforma la cara) y el borde de
 *     pelo que la rodea absorbe el movimiento (se comprime por un lado y se estira por el otro)
 *   - la cabeza entera acompaña un poco, con caída suave hasta los hombros
 *   - los ojos se mueven algo más que la cara: es lo que da la sensación de mirada
 *   - el cuerpo se inclina hacia el ratón y sube un poco al mirar hacia arriba (se asoma más)
 *   - parpadea de vez en cuando (aplasta los ojos hacia su línea central; la cara lisa no deja rastro)
 * Solo pide frames mientras algo se mueve. Sin WebGL se inclina con CSS. Con prefers-reduced-motion,
 * quieto.
 *
 * Uso: import { createMascot } from './mascota.js'; const m = createMascot(el); … m.destroy();
 * `el` contiene la <img> del recorte y tiene su misma proporción.
 */

/* Parámetros. Distancias en px de la imagen (mascota.webp mide 542 × 402). */
export const CONFIG = {
  head: { x: 16, y: 9 },        // desplazamiento de la cara con la mirada al máximo
  broad: { x: 6, y: 3 },        // desplazamiento de toda la cabeza
  eyes: { x: 7, y: 5 },         // desplazamiento extra de los ojos (mirada)
  lean: 4.5,                    // inclinación máxima del cuerpo (°)
  lift: { up: 12, down: 5 },    // sube al mirar hacia arriba, baja un poco al mirar hacia abajo
  reach: { x: 420, y: 300 },    // distancia (px de pantalla) del ratón a la que la mirada llega al ~70 %
  spring: { stiffness: 110, damping: 15 }, // ζ ≈ 0,7: llega con un pequeño rebote
  blink: { min: 2.4, max: 6.5, close: 0.06, hold: 0.05, open: 0.09, double: 0.22 },
  touchHold: 1.8,               // en táctil, segundos mirando al último toque antes de volver al frente
  mesh: { cols: 108, rows: 80 },
  pad: 0.1,                     // margen del lienzo alrededor de la imagen (fracción) para la inclinación
  maxDpr: 2,
};

/* Medidas sobre mascota.webp (px): las genera tools/mascota/recorte.py */
export const RIG = {
  size: [542, 402],
  face: { c: [273.5, 182], r: [129, 86] },
  head: { c: [275, 161], r: [205, 165] },
  eyes: [[204.3, 182.7], [341.7, 182.7]],
  eyeR: 15.5,
  pivot: [275, 308],             // en la línea de corte (donde pasa la raya)
};

const VERT = `
attribute vec2 a_p;
uniform vec2 u_size; uniform float u_pad;
uniform vec2 u_look; uniform float u_blink, u_lean, u_lift;
uniform vec2 u_faceC, u_faceR, u_headC, u_headR, u_eyeL, u_eyeR, u_pivot; uniform float u_eyeRad;
uniform vec2 u_headAmp, u_broadAmp, u_eyeAmp;
varying vec2 v_uv;
void main() {
  v_uv = a_p / u_size;
  vec2 p = a_p;
  // cara: meseta rígida; el borde de pelo del capuchón absorbe el desplazamiento
  float wf = 1.0 - smoothstep(0.86, 1.5, length((a_p - u_faceC) / u_faceR));
  // cabeza entera: menos desplazamiento, con caída hasta los hombros
  float wh = 1.0 - smoothstep(0.6, 1.2, length((a_p - u_headC) / u_headR));
  p += u_look * (u_headAmp * wf + u_broadAmp * wh);
  // ojos: un poco más que la cara
  vec2 dl = (a_p - u_eyeL) / u_eyeRad, dr = (a_p - u_eyeR) / u_eyeRad;
  float el = 1.0 - smoothstep(1.25, 2.5, length(dl)), er = 1.0 - smoothstep(1.25, 2.5, length(dr));
  p += u_look * u_eyeAmp * (el + er);
  // parpadeo: cada ojo se aplasta hacia su línea central
  float bl = 1.0 - smoothstep(1.08, 1.75, length(dl)), br = 1.0 - smoothstep(1.08, 1.75, length(dr));
  p.y -= u_blink * 0.9 * ((a_p.y - u_eyeL.y) * bl + (a_p.y - u_eyeR.y) * br);
  // inclinación hacia el ratón (pivote en la línea de corte) y altura
  vec2 q = p - u_pivot; float c = cos(u_lean), s = sin(u_lean);
  p = u_pivot + vec2(c * q.x - s * q.y, s * q.x + c * q.y);
  p.y += u_lift;
  vec2 n = (p / u_size + u_pad) / (1.0 + 2.0 * u_pad);
  gl_Position = vec4(n.x * 2.0 - 1.0, 1.0 - n.y * 2.0, 0.0, 1.0);
}`;
const FRAG = `
precision mediump float;
uniform sampler2D u_tex; varying vec2 v_uv;
void main() { gl_FragColor = texture2D(u_tex, v_uv); }`;

export function createMascot(root, opts = {}) {
  const cfg = merge(structuredClone(CONFIG), opts.config ?? {});
  const rig = opts.rig ?? RIG;
  const img = root.querySelector('img');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // estado: mirada (con muelle), objetivo, parpadeo
  const look = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
  let blink = 0, blinkT = -1, blinkPause = 0, blinkQueue = 0, blinkTimer = 0, touchTimer = 0;
  let pointer = null, raf = 0, last = 0, visible = false, destroyed = false, renderer = null;

  /* ----- Objetivo de la mirada: del punto entre los ojos al puntero ----- */
  function aim() {
    if (!pointer) { look.tx = 0; look.ty = 0; return; }
    const r = root.getBoundingClientRect(), s = r.width / rig.size[0];
    const ex = r.left + (rig.eyes[0][0] + rig.eyes[1][0]) / 2 * s, ey = r.top + rig.eyes[0][1] * s;
    const dx = pointer.x - ex, dy = pointer.y - ey;
    look.tx = dx / Math.hypot(dx, cfg.reach.x);   // satura suavemente hacia ±1
    look.ty = dy / Math.hypot(dy, cfg.reach.y);
  }

  /* ----- Bucle: solo mientras algo se mueve ----- */
  function frame(now) {
    raf = 0;
    if (destroyed) return;
    const t = now / 1000, dt = last ? Math.min(t - last, 1 / 20) : 1 / 60;
    last = t;
    aim();
    const k = cfg.spring.stiffness, c = cfg.spring.damping, sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
    for (let i = 0; i < sub; i++) {
      look.vx += (-k * (look.x - look.tx) - c * look.vx) * h; look.x += look.vx * h;
      look.vy += (-k * (look.y - look.ty) - c * look.vy) * h; look.y += look.vy * h;
    }
    // parpadeo: cierra, mantiene, abre (y a veces repite tras una pausa corta)
    if (blinkT >= 0) {
      blinkT += dt;
      const b = cfg.blink, a = b.close, m = a + b.hold, e = m + b.open;
      blink = blinkT < a ? blinkT / a : blinkT < m ? 1 : blinkT < e ? 1 - (blinkT - m) / b.open : 0;
      blink = blink * blink * (3 - 2 * blink);
      if (blinkT >= e) { blink = 0; blinkT = -1; if (blinkQueue > 0) { blinkQueue--; blinkPause = 0.12; } }
    } else if (blinkPause > 0) { blinkPause -= dt; if (blinkPause <= 0) { blinkPause = 0; blinkT = 0; } }
    draw();
    const moving = Math.abs(look.x - look.tx) + Math.abs(look.y - look.ty) + Math.abs(look.vx) + Math.abs(look.vy) > 1e-3 || blinkT >= 0 || blinkPause > 0;
    if (moving && visible) raf = requestAnimationFrame(frame);
    else { last = 0; }
  }
  const wake = () => { if (!raf && visible && !destroyed && !reduce.matches) raf = requestAnimationFrame(frame); };

  function draw() {
    const lean = look.x * cfg.lean * Math.PI / 180;
    const lift = look.y < 0 ? look.y * cfg.lift.up : look.y * cfg.lift.down;
    renderer?.draw(look, blink, lean, lift);
  }

  /* ----- Parpadeo aleatorio ----- */
  function scheduleBlink() {
    clearTimeout(blinkTimer);
    if (destroyed || reduce.matches) return;
    const b = cfg.blink;
    blinkTimer = setTimeout(() => {
      if (visible && !document.hidden) { blinkT = 0; blinkQueue = Math.random() < b.double ? 1 : 0; wake(); }
      scheduleBlink();
    }, (b.min + Math.random() * (b.max - b.min)) * 1000);
  }

  /* ----- Puntero (toda la página) ----- */
  const onMove = e => {
    if (e.pointerType === 'touch') return;
    pointer = { x: e.clientX, y: e.clientY }; wake();
  };
  const onTouch = e => {
    if (e.pointerType !== 'touch') return;
    pointer = { x: e.clientX, y: e.clientY }; wake();
    clearTimeout(touchTimer);
    touchTimer = setTimeout(() => { pointer = null; wake(); }, cfg.touchHold * 1000);
  };
  const onLeave = () => { pointer = null; wake(); };     // el ratón sale de la ventana: vuelve a mirar al frente
  const onScroll = () => { if (pointer) wake(); };       // al hacer scroll cambia la posición relativa
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onTouch, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  window.addEventListener('scroll', onScroll, { passive: true });
  const onReduce = () => { if (reduce.matches) { look.x = look.y = look.vx = look.vy = 0; blink = 0; blinkT = -1; blinkPause = 0; draw(); } else scheduleBlink(); };
  reduce.addEventListener('change', onReduce);

  // Solo trabaja mientras está en pantalla
  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) { wake(); if (!blinkTimer) scheduleBlink(); }
    else { cancelAnimationFrame(raf); raf = 0; last = 0; clearTimeout(blinkTimer); blinkTimer = 0; }
  });
  io.observe(root);

  function ready() {
    renderer = createWebGL(root, img, cfg, rig, () => draw()) || createCss(img, rig);
    root.classList.add(renderer.kind === 'webgl' ? 'mascota--webgl' : 'mascota--css');
    draw();
  }
  if (img.complete && img.naturalWidth) ready(); else img.addEventListener('load', ready, { once: true });

  const api = {
    get kind() { return renderer?.kind; },
    /** Para pruebas: fija la mirada (−1…1) sin muelle y dibuja. */
    pose(x, y, b = 0) { look.x = look.tx = x; look.y = look.ty = y; look.vx = look.vy = 0; blink = b; draw(); },
    /** Mira a un punto de la pantalla (coordenadas de cliente), p. ej. donde se está escribiendo; null = al frente.
     *  Con muelle, como con el ratón; el siguiente movimiento del ratón vuelve a mandar. */
    look(x, y) { pointer = x == null ? null : { x, y }; wake(); },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); clearTimeout(blinkTimer); clearTimeout(touchTimer); io.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onTouch);
      document.documentElement.removeEventListener('pointerleave', onLeave); window.removeEventListener('scroll', onScroll);
      reduce.removeEventListener('change', onReduce);
      renderer?.destroy(); root.classList.remove('mascota--webgl', 'mascota--css');
      delete root.__mascota;
    },
  };
  root.__mascota = api; // acceso desde las pruebas
  return api;
}

/* =========================================================================
 * WebGL: la imagen como textura sobre una malla de cols × rows
 * ========================================================================= */
function createWebGL(root, img, cfg, rig, redraw) {
  const canvas = document.createElement('canvas');
  canvas.className = 'mascota-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
  if (!gl) return null;
  const prog = program(gl, VERT, FRAG);
  if (!prog) return null;
  gl.useProgram(prog);

  const [W, H] = rig.size, { cols, rows } = cfg.mesh;
  const P = new Float32Array((cols + 1) * (rows + 1) * 2);
  for (let y = 0, i = 0; y <= rows; y++) for (let x = 0; x <= cols; x++) { P[i++] = x / cols * W; P[i++] = y / rows * H; }
  const I = new Uint16Array(cols * rows * 6);
  for (let y = 0, i = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const a = y * (cols + 1) + x, b = a + 1, c = a + cols + 1, d = c + 1;
    I.set([a, c, b, b, c, d], i); i += 6;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, P, gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, I, gl.STATIC_DRAW);

  // Textura en potencia de dos (mipmaps también en WebGL1: el pelo no centellea al reducir)
  const pot = document.createElement('canvas'); pot.width = 1024; pot.height = 1024;
  pot.getContext('2d').drawImage(img, 0, 0, pot.width, pot.height);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pot);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const U = n => gl.getUniformLocation(prog, n);
  const u = Object.fromEntries(['u_look', 'u_blink', 'u_lean', 'u_lift'].map(n => [n, U(n)]));
  gl.uniform2f(U('u_size'), W, H); gl.uniform1f(U('u_pad'), cfg.pad);
  gl.uniform2f(U('u_faceC'), ...rig.face.c); gl.uniform2f(U('u_faceR'), ...rig.face.r);
  gl.uniform2f(U('u_headC'), ...rig.head.c); gl.uniform2f(U('u_headR'), ...rig.head.r);
  gl.uniform2f(U('u_eyeL'), ...rig.eyes[0]); gl.uniform2f(U('u_eyeR'), ...rig.eyes[1]); gl.uniform1f(U('u_eyeRad'), rig.eyeR);
  gl.uniform2f(U('u_pivot'), ...rig.pivot);
  gl.uniform2f(U('u_headAmp'), cfg.head.x, cfg.head.y); gl.uniform2f(U('u_broadAmp'), cfg.broad.x, cfg.broad.y);
  gl.uniform2f(U('u_eyeAmp'), cfg.eyes.x, cfg.eyes.y);

  // El lienzo sobresale de la imagen `pad` por cada lado; tamaño CSS explícito (si no, toma el interno)
  canvas.style.left = canvas.style.top = `${-cfg.pad * 100}%`;
  canvas.style.width = canvas.style.height = `${(1 + 2 * cfg.pad) * 100}%`;
  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, cfg.maxDpr), r = root.getBoundingClientRect();
    const w = Math.round(r.width * (1 + 2 * cfg.pad) * dpr), h = Math.round(r.height * (1 + 2 * cfg.pad) * dpr);
    if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); redraw(); }
  };
  const ro = new ResizeObserver(fit); ro.observe(root);
  root.appendChild(canvas); fit();

  return {
    kind: 'webgl',
    draw(look, blink, lean, lift) {
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u.u_look, look.x, look.y); gl.uniform1f(u.u_blink, blink);
      gl.uniform1f(u.u_lean, lean); gl.uniform1f(u.u_lift, lift);
      gl.drawElements(gl.TRIANGLES, I.length, gl.UNSIGNED_SHORT, 0);
    },
    destroy() { ro.disconnect(); canvas.remove(); gl.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}

/* Sin WebGL: solo la inclinación y la altura, con CSS transforms */
function createCss(img, rig) {
  img.style.transformOrigin = `${rig.pivot[0] / rig.size[0] * 100}% ${rig.pivot[1] / rig.size[1] * 100}%`;
  return {
    kind: 'css',
    draw(look, blink, lean, lift) { img.style.transform = `translateY(${(lift / rig.size[1] * 100).toFixed(3)}%) rotate(${lean.toFixed(4)}rad)`; },
    destroy() { img.style.transform = ''; },
  };
}

function program(gl, vs, fs) {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

function merge(a, b) {
  for (const k of Object.keys(b)) a[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? merge(a[k] ?? {}, b[k]) : b[k];
  return a;
}
