# Ajusta la pose, la perspectiva y las proporciones del chip (cuadrado redondeado extruido + 4 patitas por lado) a
# la foto recortada → chip_fit.json (+ chip_fit.png: rojo = modelo, verde = foto)
#   1) cámara a partir del marco crema de la cara superior (un cuadrado redondeado nítido: fija giro e inclinación)
#   2) medidas directas en la foto con esa cámara: grosor (arista de la esquina delantera) y patitas (su pie en el suelo)
#   3) paso a unidades del cuerpo (medio lado = 1) y comprobación de la silueta
# La silueta sola no basta: las patitas (y el canto superior, muy redondeado) confunden el ajuste.
# Variable FIX_CAM=1: no repite el paso 1 (lento y determinista) y usa la cámara ya obtenida.
# Uso (desde la raíz del repo): python3 tools/jelly/fit_chip.py   · salida en _inventory/jelly/
import os, sys, math, json
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')) + '/'
OUT = os.path.join(ROOT, '_inventory', 'jelly'); os.makedirs(OUT, exist_ok=True); os.chdir(OUT)
import numpy as np
from PIL import Image, ImageDraw
im = Image.open(ROOT + 'public/jelly/chip.webp').convert('RGBA'); A = np.array(im)[..., 3].astype(np.float32) / 255
H, W = A.shape
SS = 2
NPIN = 4
RGB = np.array(im)[..., :3].astype(np.float32)


def flood(seed, allowed):
    out = seed & allowed; front = out.copy()
    while front.any():
        g = np.zeros_like(front)
        g[1:] |= front[:-1]; g[:-1] |= front[1:]; g[:, 1:] |= front[:, :-1]; g[:, :-1] |= front[:, 1:]
        front = g & allowed & ~out; out |= front
    return out


# crema (marco, estrella y franja): claro, poco croma y cálido (la tapa lila es más azul que verde)
r_, g_, b_ = RGB[..., 0], RGB[..., 1], RGB[..., 2]
CREAM = (A > 0.8) & (RGB.min(2) > 150) & (RGB.max(2) - RGB.min(2) < 60) & (g_ >= b_ + 1) & (r_ >= g_ - 3)
def component_at(x, y, M):
    ys, xs = np.nonzero(M); i = np.argmin((xs - x) ** 2 + (ys - y) ** 2)
    seed = np.zeros_like(M); seed[ys[i], xs[i]] = True
    return flood(seed, M)
RING = component_at(172, 250, CREAM)            # el marco (lado izquierdo)
STAR = component_at(430, 215, CREAM)            # la estrella
print('marco', int(RING.sum()), 'px · estrella', int(STAR.sum()), 'px', flush=True)


def rrect(hx, hz, R, n=48):
    pts = []
    for (cx, cz, a0) in [(hx - R, hz - R, 0), (-hx + R, hz - R, 90), (-hx + R, -hz + R, 180), (hx - R, -hz + R, 270)]:
        for k in range(n // 4 + 1):
            a = math.radians(a0 + 90 * k / (n // 4)); pts.append((cx + R * math.cos(a), cz + R * math.sin(a)))
    return np.array(pts)


def project(P, p):
    yaw, e, d, s, cx, cy, T = p['yaw'], p['e'], p['d'], p['s'], p['cx'], p['cy'], p['T']
    c, sn = math.cos(yaw), math.sin(yaw)
    x = P[:, 0] * c + P[:, 2] * sn; y = P[:, 1]; z = -P[:, 0] * sn + P[:, 2] * c
    qy = y - T / 2
    yv = qy * math.cos(e) - z * math.sin(e); zd = d - (qy * math.sin(e) + z * math.cos(e))
    return np.stack([cx + s * x * d / zd, cy - s * yv * d / zd], 1)


def hull(pts):
    pts = sorted(map(tuple, pts))
    def half(ps):
        h = []
        for q in ps:
            while len(h) >= 2 and (h[-1][0] - h[-2][0]) * (q[1] - h[-2][1]) - (h[-1][1] - h[-2][1]) * (q[0] - h[-2][0]) <= 0: h.pop()
            h.append(q)
        return h
    lo = half(pts); up = half(pts[::-1])
    return lo[:-1] + up[:-1]


def body_points(p):
    hz = p['D'] / 2; o = rrect(1.0, hz, p['R']); rb = 0.05; T = p['T']
    P = []
    for dd, y in [(rb, 0), (0, rb), (0, T - rb), (rb, T)]:
        o2 = rrect(1.0 - dd, hz - dd, max(p['R'] - dd, 0.01))
        P.append(np.stack([o2[:, 0], np.full(len(o2), y), o2[:, 1]], 1))
    return np.concatenate(P)


def pin_centers(p):
    """Centros de las patitas: 4 por lado, separadas `pitch` y desplazadas `shift` a lo largo del lado, siempre en el
    mismo sentido de giro (en la foto cada lado tiene sus patitas corridas hacia la esquina siguiente: molinillo)."""
    hz = p['D'] / 2; out = []
    for (nx, nz) in ((1, 0), (0, 1), (-1, 0), (0, -1)):
        tx, tz = -nz, nx
        for k in range(NPIN):
            u = (k - (NPIN - 1) / 2) * p['pitch'] + p['shift']
            out.append(((nx * 1.0 + tx * u, nz * hz + tz * u), (nx, nz)))
    return out


def pin_points(p, c, n):
    # caja redondeada: de 0.04 dentro de la pared a `out` fuera, ancho `pw`, alto `ph`, cantos de radio r
    (x0, z0), (nx, nz) = c, n
    tx, tz = -nz, nx
    r = min(0.05, p['pw'] / 3, p['ph'] / 3)
    P = []
    for a in (-0.04, p['out'] - r, p['out']):
        for b in (-p['pw'] / 2, -p['pw'] / 2 + r, p['pw'] / 2 - r, p['pw'] / 2):
            for y in (0, p['ph'] - r, p['ph']):
                if (a == p['out']) + (abs(b) == p['pw'] / 2) + (y == p['ph']) >= 2: continue   # esquinas redondeadas
                P.append((x0 + nx * a + tx * b, y, z0 + nz * a + tz * b))
    return np.array(P)


def render(p, pins=True):
    img = Image.new('L', (W * SS, H * SS), 0); dr = ImageDraw.Draw(img)
    polys = [hull(project(body_points(p), p))]
    if pins: polys += [hull(project(pin_points(p, c, n), p)) for c, n in pin_centers(p)]
    for poly in polys: dr.polygon([(x * SS, y * SS) for x, y in poly], fill=255)
    return np.array(img.resize((W, H), Image.BOX)).astype(np.float32) / 255


def render_ring(p):
    # anillo plano en la cara superior (y = T): entre el cuadrado redondeado exterior y el interior
    img = Image.new('L', (W * SS, H * SS), 0); dr = ImageDraw.Draw(img)
    for half, rad, fill in ((p['ra'] + p['rw'] / 2, p['rr'] + p['rw'] / 2, 255), (p['ra'] - p['rw'] / 2, max(p['rr'] - p['rw'] / 2, 0.01), 0)):
        o = rrect(half, half, rad, 64)
        pts = project(np.stack([o[:, 0] + p.get('fx', 0), np.full(len(o), p['T']), o[:, 1] + p.get('fz', 0)], 1), p)
        dr.polygon([(x * SS, y * SS) for x, y in pts], fill=fill)
    return np.array(img.resize((W, H), Image.BOX)).astype(np.float32) / 255


def nelder(f, x0, step, iters=1500):
    n = len(x0); S = [np.array(x0, float)]
    for i in range(n):
        y = np.array(x0, float); y[i] += step[i]; S.append(y)
    F = [f(s) for s in S]
    for it in range(iters):
        o = np.argsort(F); S = [S[i] for i in o]; F = [F[i] for i in o]
        c = np.mean(S[:-1], 0); xr = c + (c - S[-1]); fr = f(xr)
        if fr < F[0]:
            xe = c + 2 * (c - S[-1]); fe = f(xe)
            if fe < fr: S[-1], F[-1] = xe, fe
            else: S[-1], F[-1] = xr, fr
        elif fr < F[-2]: S[-1], F[-1] = xr, fr
        else:
            xc = c + 0.5 * (S[-1] - c); fc = f(xc)
            if fc < F[-1]: S[-1], F[-1] = xc, fc
            else:
                for i in range(1, n + 1): S[i] = S[0] + 0.5 * (S[i] - S[0]); F[i] = f(S[i])
        if it % 300 == 0: print(it, round(min(F), 1), flush=True)
    o = np.argmin(F); return S[o], F[o]


# 1 · cámara con el marco (medio lado del eje del marco fijo en 0,7: la escala real sale en el paso 2)
RK = ['yaw', 'e', 'd', 's', 'cx', 'cy', 'rr', 'rw']
def loss_ring(v):
    p = dict(zip(RK, v), ra=0.7, T=0.37)
    if p['d'] < 3 or not 0.1 < p['e'] < 1.4 or p['rr'] < 0.02 or p['rr'] > 0.65 or not 0.02 < p['rw'] < 0.3: return 1e9
    return float(np.abs(render_ring(p) - RING).sum())
best = None
SKIP = os.environ.get('FIX_CAM') == '1'
for yaw0 in (() if SKIP else (45, 55, 62)):
    for e0 in (38, 48):
        x0 = [math.radians(yaw0), math.radians(e0), 8.0, 272.0, 430.0, 265.0, 0.2, 0.09]
        stp = [0.06, 0.06, 2.0, 12, 8, 8, 0.05, 0.02]
        x, fv = nelder(loss_ring, x0, stp, 900)
        if best is None or fv < best[1]: best = (x, fv)
        print('marco', yaw0, e0, '->', round(fv, 1), flush=True)
if SKIP: x, fv = [1.0194, 0.7004, 15.383, 292.1202, 432.6619, 267.6373, 0.2529, 0.108], loss_ring([1.0194, 0.7004, 15.383, 292.1202, 432.6619, 267.6373, 0.2529, 0.108])
else: x, fv = nelder(loss_ring, best[0], [0.02, 0.02, 1.0, 4, 3, 3, 0.02, 0.008], 1200)
cam = dict(zip(RK, [float(t) for t in x]))
print('MARCO ->', round(fv, 1), {k: round(v, 4) for k, v in cam.items()}, 'yaw°', round(math.degrees(cam['yaw']), 2), 'elev°', round(math.degrees(cam['e']), 2), flush=True)
# 2 · medidas directas, en «unidades del marco» (su eje mide 0,7 de medio lado) y en el sistema del paso 1: la cara
#     superior en y = 0.37 y el objetivo de la cámara en y = 0.185.
T0 = 0.37
CAM = dict(cam, T=T0)
def back(X, Y, yw):
    """Punto de la foto → punto (x, z) del plano horizontal y = yw (local, sin girar)."""
    c_, s_, e_, d_, k = math.cos(cam['yaw']), math.sin(cam['yaw']), cam['e'], cam['d'], cam['s'] * cam['d']
    qy = yw - T0 / 2
    z = (k * qy * math.cos(e_) - (cam['cy'] - Y) * (d_ - qy * math.sin(e_))) / (k * math.sin(e_) - (cam['cy'] - Y) * math.cos(e_))
    zd = d_ - qy * math.sin(e_) - z * math.cos(e_); x = (X - cam['cx']) * zd / k
    return x * c_ - z * s_, x * s_ + z * c_
# grosor: la arista vertical de la esquina delantera va del canto superior (515, 449) al suelo (515, 611) en la foto;
# es el grosor con el que sus dos extremos caen en el mismo punto en planta
TOP_PX, BOT_PX = (515, 449), (515, 611)
best_t = min((math.dist(back(*TOP_PX, T0), back(*BOT_PX, T0 - t)), t) for t in np.arange(0.4, 1.0, 0.0025))
TP = float(best_t[1]); corner = back(*BOT_PX, T0 - TP)
print('GROSOR %.3f · esquina delantera en (%.3f, %.3f)' % (TP, *corner), flush=True)
# patitas: el pie (centro del borde de abajo) de las 8 patitas que se ven en los dos lados de delante
FEET = {'-x': [(132, 495), (223, 537), (316, 577), (407, 617)], '+z': [(622, 595), (680, 522), (732, 460), (777, 400)]}
fl = {k: [back(X, Y, T0 - TP) for X, Y in v] for k, v in FEET.items()}
along = {'-x': [p_[1] for p_ in fl['-x']], '+z': [p_[0] for p_ in fl['+z']]}
face = np.mean([-np.mean([p_[0] for p_ in fl['-x']]), np.mean([p_[1] for p_ in fl['+z']])])   # cara exterior de las patitas
pitch = float(np.mean([np.diff(v).mean() for v in along.values()]))
centre = {k: float(np.mean(v)) for k, v in along.items()}
print('PATITAS separación %.3f · centro de cada lado' % pitch, {k: round(v, 3) for k, v in centre.items()}, '· cara exterior a %.3f' % face, flush=True)
# cuerpo: las patitas salen OUT de la pared; la esquina (a 45°) está a medio lado − 0,293 · radio
OUT = 0.145
hb = float(face - OUT); R = float((hb - np.mean(np.abs(corner))) / (1 - 1 / math.sqrt(2)))
print('CUERPO medio lado %.3f · radio %.3f' % (hb, R), flush=True)
# 3 · a unidades del cuerpo y a los parámetros del motor (centro de la pieza a media altura)
cen = project(np.array([[0.0, T0 - TP / 2, 0.0]]), CAM)[0]
p = {'yaw': cam['yaw'], 'e': cam['e'], 'd': cam['d'] / hb, 's': cam['s'] * hb, 'cx': float(cen[0]), 'cy': float(cen[1]),
     'T': TP / hb, 'D': 2.0, 'R': R / hb, 'pitch': pitch / hb, 'pw': 0.29 / hb, 'out': OUT / hb, 'ph': 0.27 / hb, 'shift': 0.0,
     'ra': 0.7 / hb, 'rr': cam['rr'] / hb, 'rw': cam['rw'] / hb, 'fx': 0.0, 'fz': 0.0, 'l0': 0.39, 'l1': 0.5}
print('MOTOR (SHAPES.chip) · yaw %.2f° · elevation %.2f° · distance %.3f · scale %.4f · cx %.4f · cy %.4f · thickness %.3f · radius %.3f · pitch %.3f'
      % (math.degrees(p['yaw']), math.degrees(p['e']), p['d'], p['s'] / W, p['cx'] / W, p['cy'] / H, p['T'], p['R'], p['pitch']), flush=True)
R = render(p); iou = float(((R > 0.5) & (A > 0.5)).sum() / ((R > 0.5) | (A > 0.5)).sum())
print('Silueta del modelo frente a la foto: IoU', round(iou, 4), '(las patitas de la foto son más redondeadas y las de atrás asoman más)')
json.dump(p, open('chip_fit.json', 'w'))
Rr = render_ring(p); ring_iou = float(((Rr > 0.5) & RING).sum() / ((Rr > 0.5) | RING).sum())
print('IoU del marco', round(ring_iou, 4))
out = np.zeros((H, W, 3), np.uint8); out[..., 0] = (np.maximum(R, Rr) * 255).astype(np.uint8); out[..., 1] = (np.maximum(A, RING) * 255).astype(np.uint8)
out[..., 2] = (RING * 120).astype(np.uint8)
Image.fromarray(out).save('chip_fit.png')
