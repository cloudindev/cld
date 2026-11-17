# Vista cenital rectificada de la cara superior del chip, medidas del marco y de la estrella, y alturas de las capas
# leídas en las paredes (requiere chip_fit.json, de fit_chip.py)
# Uso (desde la raíz del repo): python3 tools/jelly/chip_deco.py   · salida en _inventory/jelly/ (chip_top.png, chip_deco.json)
import os, math, json
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')) + '/'
OUT = os.path.join(ROOT, '_inventory', 'jelly'); os.makedirs(OUT, exist_ok=True); os.chdir(OUT)
import numpy as np
from PIL import Image

p = json.load(open('chip_fit.json'))
im = np.array(Image.open(ROOT + 'public/jelly/chip.webp').convert('RGBA')).astype(np.float32)
H, W = im.shape[:2]
yaw, e, d, s, cx, cy, T, D = p['yaw'], p['e'], p['d'], p['s'], p['cx'], p['cy'], p['T'], p['D']
c, sn = math.cos(yaw), math.sin(yaw)


def proj(lx, ly, lz):
    x = lx * c + lz * sn; z = -lx * sn + lz * c; qy = ly - T / 2
    yv = qy * math.cos(e) - z * math.sin(e); zd = d - (qy * math.sin(e) + z * math.cos(e))
    return cx + s * x * d / zd, cy - s * yv * d / zd


def sample(X, Y):
    X = np.clip(X, 0, W - 1.001); Y = np.clip(Y, 0, H - 1.001)
    x0 = np.floor(X).astype(int); y0 = np.floor(Y).astype(int); fx = (X - x0)[..., None]; fy = (Y - y0)[..., None]
    return im[y0, x0] * (1 - fx) * (1 - fy) + im[y0, x0 + 1] * fx * (1 - fy) + im[y0 + 1, x0] * (1 - fx) * fy + im[y0 + 1, x0 + 1] * fx * fy


# 1 · vista cenital de la cara superior (a la altura de los relieves: un poco por encima de la tapa)
PX = 400
lx = np.linspace(-1.02, 1.02, int(2.04 * PX)); lz = np.linspace(-D / 2 - 0.02, D / 2 + 0.02, int((D + 0.04) * PX))
LX, LZ = np.meshgrid(lx, lz)
X, Y = proj(LX, T + 0.012, LZ)
top = sample(X, Y)
rgb = top[..., :3]; a = top[..., 3:] / 255
img = (rgb * a + 255 * (1 - a)).astype(np.uint8)
Image.fromarray(img).save('chip_top.png')
R, G, B = [img[..., i].astype(int) for i in range(3)]
mx = np.maximum(np.maximum(R, G), B); mn = np.minimum(np.minimum(R, G), B)
cream = (mn > 150) & (mx - mn < 60) & (G >= B + 1) & (R >= G - 3) & (np.abs(LX) < 0.95) & (np.abs(LZ) < D / 2 - 0.03)

# 2 · marco: radio de cada punto crema respecto al centro en «norma infinito» (cuadrado) → anillo
cxm, czm = LX[cream].mean(), LZ[cream].mean()
ninf = np.maximum(np.abs(LX - cxm), np.abs(LZ - czm))
def flood(seed, allowed):
    out = seed & allowed; front = out.copy()
    while front.any():
        g = np.zeros_like(front)
        g[1:] |= front[:-1]; g[:-1] |= front[1:]; g[:, 1:] |= front[:, :-1]; g[:, :-1] |= front[:, 1:]
        front = g & allowed & ~out; out |= front
    return out
c0 = np.zeros_like(cream); c0[np.abs(LZ - czm) < 0.02] = True; c0 &= np.abs(LX - cxm) < 0.02
star = flood(c0, cream)          # la estrella: la mancha crema que contiene el centro
ring = cream & ~star & (ninf > 0.6)
# bordes interior y exterior del marco en los cuatro lados: perfil en una franja de ±0,2 alrededor de cada eje
def prof(mask, along_x):
    band = (np.abs(LZ - czm) < 0.2) if along_x else (np.abs(LX - cxm) < 0.2)
    m = mask & band
    frac = m.sum(0) / np.maximum(band.sum(0), 1) if along_x else m.sum(1) / np.maximum(band.sum(1), 1)
    vals = lx if along_x else lz
    return vals[frac > 0.5]
def split(v):
    v = np.sort(v); k = int(np.argmax(np.diff(v))); return v[:k + 1], v[k + 1:]
(xl, xr), (zb, zf) = split(prof(ring, True)), split(prof(ring, False))
out_half = np.mean([xr.max() - cxm, cxm - xl.min(), zf.max() - czm, czm - zb.min()])
in_half = np.mean([xr.min() - cxm, cxm - xl.max(), zf.min() - czm, czm - zb.max()])
ra, rw = (out_half + in_half) / 2, out_half - in_half
cxm, czm = (xl.min() + xr.max()) / 2, (zb.min() + zf.max()) / 2   # centro del marco por sus bordes exteriores
# radio de esquina: en cada diagonal, distancia de la esquina del cuadrado exterior al borde del marco = r (√2 − 1)
diag = []
for sx in (1, -1):
    for sz in (1, -1):
        t = np.linspace(0, 0.6, 600); px = cxm + sx * (out_half - t / math.sqrt(2)); pz = czm + sz * (out_half - t / math.sqrt(2))
        ix = np.clip(np.searchsorted(lx, px), 0, len(lx) - 1); iz = np.clip(np.searchsorted(lz, pz), 0, len(lz) - 1)
        hit = np.nonzero(ring[iz, ix])[0]
        if len(hit): diag.append(t[hit[0]])
rr_out = float(np.mean(diag)) / (math.sqrt(2) - 1) if diag else 0.0
print('MARCO centro (%.3f, %.3f) · eje a %.3f del centro · ancho %.3f · radio exterior %.3f → radio del eje %.3f' % (cxm, czm, ra, rw, rr_out, rr_out - rw / 2))

# 3 · estrella: centro, puntas (ángulo y alcance) y cintura
sx_, sz_ = LX[star].mean(), LZ[star].mean()
ang = np.degrees(np.arctan2(LZ[star] - sz_, LX[star] - sx_)); rad = np.hypot(LX[star] - sx_, LZ[star] - sz_)
bins = np.arange(-180, 181, 3); rmax = np.array([rad[(ang >= b) & (ang < b + 3)].max() if ((ang >= b) & (ang < b + 3)).any() else 0 for b in bins[:-1]])
tips = []
for k in range(len(rmax)):
    if rmax[k] == rmax[max(0, k - 6):k + 7].max() and rmax[k] > np.percentile(rmax, 70): tips.append((bins[k] + 1.5, rmax[k]))
waist = np.percentile(rmax, 8)
print('ESTRELLA centro (%.3f, %.3f) · puntas' % (sx_, sz_), [(round(a_, 1), round(r_, 3)) for a_, r_ in tips], '· cintura %.3f' % waist)

# contorno de la estrella para el motor: radio máximo cada 2,5°, mediana de los 4 cuadrantes (simetría de la pieza y
# fuera los defectos de la perspectiva), suavizado; 36 puntos por cuadrante, con la punta en el ángulo 0
STEP = 2.5
nb = int(90 / STEP)
prof4 = []
for q0 in (0, 90, 180, 270):
    row = []
    for k in range(nb):
        a0 = q0 + k * STEP - 180
        sel = ((ang - a0) % 360 < STEP)
        row.append(rad[sel].max() if sel.any() else np.nan)
    prof4.append(row)
prof4 = np.array(prof4); quarter = np.nanmedian(prof4, 0)
q_s = np.convolve(np.r_[quarter[-2:], quarter, quarter[:2]], np.ones(5) / 5, 'valid')
# simétrica respecto a la bisectriz (45°): media con su reflejo
q_sym = (q_s + q_s[::-1]) / 2
print('ESTRELLA contorno (radio cada %.1f° desde una punta hasta la siguiente):' % STEP, [round(float(v), 3) for v in q_sym])
STAR_Q = [round(float(v), 3) for v in q_sym]

# 4 · capas en la esquina delantera (la más cercana a la cámara): de abajo arriba, base morada → franja crema → tapa
front = max([(1, 1), (1, -1), (-1, 1), (-1, -1)], key=lambda q: -q[0] * sn + q[1] * D / 2 * c)
R0 = p['R']; k = 1 - R0 + R0 / math.sqrt(2)
fx, fz = front[0] * k, front[1] * (D / 2 - R0 + R0 / math.sqrt(2))
col = []
for i in range(101):
    X1, Y1 = proj(fx, T * i / 100, fz); col.append(sample(np.array(X1), np.array(Y1)))
row = ''
for v in col:
    r_, g_, b_, a_ = v
    row += '.' if a_ < 128 else ('C' if (min(r_, g_, b_) > 150 and g_ >= b_ + 1 and r_ >= g_ - 3) else ('B' if g_ < 120 else 'G'))
print('ESQUINA delantera', front, 'de abajo arriba:', row)
json.dump({'ring': {'center': [float(cxm), float(czm)], 'half': float(ra), 'width': float(rw), 'radius': float(rr_out - rw / 2)},
           'star': {'center': [float(sx_), float(sz_)], 'tips': [[float(a_), float(r_)] for a_, r_ in tips], 'waist': float(waist), 'quarter': STAR_Q},
           'wall': row}, open('chip_deco.json', 'w'))
