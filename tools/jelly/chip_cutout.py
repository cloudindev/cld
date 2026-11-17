# Recorta la pieza «chip» (Hosting para IA) de la foto del cliente: fondo gris claro fuera, borde suave, y la sombra
# de la foto como capa «multiply» aparte (blanco = sin efecto), igual que web.webp / web-shadow.webp.
# Uso (desde la raíz del repo): python3 tools/jelly/chip_cutout.py
#   entrada: assets/jelly/hosting-ia-original.jpg · salida: public/jelly/chip.webp + chip-shadow.webp (+ control en _inventory/jelly/)
import os
import numpy as np
from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')) + '/'
OUT = os.path.join(ROOT, '_inventory', 'jelly'); os.makedirs(OUT, exist_ok=True)
SRC = ROOT + 'assets/jelly/hosting-ia-original.jpg'
CROP = (262, 64, 1122, 754)        # encuadre del recorte en la foto (x0, y0, x1, y1): la pieza y su sombra

im = np.array(Image.open(SRC).convert('RGB')).astype(np.float64)
H, W, _ = im.shape
chroma = im.max(2) - im.min(2)
luma = im.mean(2)


def dilate(m, r):
    out = m.copy()
    for _ in range(r):
        g = out.copy()
        g[1:] |= out[:-1]; g[:-1] |= out[1:]; g[:, 1:] |= out[:, :-1]; g[:, :-1] |= out[:, 1:]
        out = g
    return out


def erode(m, r):
    return ~dilate(~m, r)


def flood(seed, allowed):
    out = seed & allowed; front = out.copy()
    while front.any():
        g = np.zeros_like(front)
        g[1:] |= front[:-1]; g[:-1] |= front[1:]; g[:, 1:] |= front[:, :-1]; g[:, :-1] |= front[:, 1:]
        front = g & allowed & ~out; out |= front
    return out


# 1 · Pieza: todo lo que tiene color (la gelatina morada y la crema tienen croma; el fondo y su sombra son grises).
# Por debajo de la recta que une los extremos izquierdo y derecho de la pieza, el suelo lleva el reflejo morado
# de la luz que atraviesa la gelatina (croma 10-25, claro): ahí solo cuenta lo oscuro o muy saturado (patitas y base).
lenient = chroma > 9
strict = (chroma > 30) | ((luma < 185) & (chroma > 12))
Yg, Xg = np.mgrid[0:H, 0:W]
XL, YL, XR, YR = 300, 372, 1086, 392          # extremos izquierdo y derecho de la pieza en la foto (px)
below = Yg > YL + (Xg - XL) * (YR - YL) / (XR - XL)
core = np.where(below, strict, lenient)
# componente principal (la que contiene el centro de la pieza) y huecos rellenos (crema, reflejos claros)
seed = np.zeros_like(core); seed[380, 690] = True
body = flood(dilate(seed, 3), dilate(core, 1))
outside = flood(np.pad(np.zeros((H - 2, W - 2), bool), 1, constant_values=True), ~body)
mask = ~outside
mask = erode(dilate(mask, 4), 4)   # cierra rendijas y muescas de pocos px en el contorno (un brillo junto a la patita de la esquina izquierda)
mask = erode(mask, 1)              # fuera el filo gris (mezcla con el fondo)

# 2 · Fondo: superficie cuadrática ajustada al gris lejos de la pieza (casi uniforme, ~243)
far = ~dilate(mask, 60)
ys, xs = np.nonzero(far)
sel = np.random.default_rng(1).choice(len(ys), 20000, replace=False)
yy, xx = ys[sel] / H, xs[sel] / W
A = np.stack([np.ones_like(xx), xx, yy, xx * xx, xx * yy, yy * yy], 1)
Y, X = np.mgrid[0:H, 0:W]; Yn, Xn = Y / H, X / W
B = np.stack([np.ones_like(Xn), Xn, Yn, Xn * Xn, Xn * Yn, Yn * Yn], -1)
bg = np.zeros_like(im)
for c in range(3):
    coef, *_ = np.linalg.lstsq(A, im[ys[sel], xs[sel], c], rcond=None)
    bg[..., c] = B @ coef

# 3 · Alfa: la máscara con el borde suavizado (1-2 px). El color es el de la foto, sin «desmezclar» (amplificaría el ruido).
alpha = mask.astype(np.float64)
for _ in range(2):
    a2 = alpha.copy()
    a2[1:-1, 1:-1] = (alpha[:-2, 1:-1] + alpha[2:, 1:-1] + alpha[1:-1, :-2] + alpha[1:-1, 2:] + 2 * alpha[1:-1, 1:-1]) / 6
    alpha = a2
alpha = np.where(mask, np.maximum(alpha, 0.5), alpha)
rgb = im

# 4 · Sombra: cociente foto / fondo fuera de la pieza, por canal (conserva el reflejo morado); dentro, se rellena
# difuminando lo de alrededor (el motor 2D mueve la pieza y deja ver el suelo)
ratio = np.clip(im / bg, 0, 1)
inside = dilate(mask, 1)
sh = ratio.copy()
ring = dilate(inside, 3) & ~inside
sh[inside] = np.percentile(ratio[ring], 25, axis=0)
for _ in range(60):
    s2 = sh.copy()
    s2[1:-1, 1:-1] = (sh[:-2, 1:-1] + sh[2:, 1:-1] + sh[1:-1, :-2] + sh[1:-1, 2:]) / 4
    sh = np.where(inside[..., None], s2, sh)
sh = np.clip(sh, 0, 1)
sh = np.where(sh.min(2, keepdims=True) > 0.985, 1, sh)   # el ruido del papel no es sombra

x0, y0, x1, y1 = CROP
rgba = np.dstack([rgb, alpha * 255])[y0:y1, x0:x1].round().astype(np.uint8)
shadow = (sh * 255)[y0:y1, x0:x1].round().astype(np.uint8)
assert not mask[:y0].any() and not mask[y1:].any() and not mask[:, :x0].any() and not mask[:, x1:].any(), 'la pieza no cabe en CROP'
Image.fromarray(rgba, 'RGBA').save(ROOT + 'public/jelly/chip.webp', quality=88, method=6)
Image.fromarray(shadow, 'RGB').save(ROOT + 'public/jelly/chip-shadow.webp', quality=80, method=6)

# control: recorte sobre un fondo de color, con y sin sombra
ctl = Image.new('RGB', (x1 - x0, y1 - y0), (228, 232, 246))
sh_img = Image.fromarray(shadow, 'RGB')
ctl = Image.fromarray((np.array(ctl).astype(float) * np.array(sh_img).astype(float) / 255).astype(np.uint8))
ctl.paste(Image.fromarray(rgba, 'RGBA'), (0, 0), Image.fromarray(rgba, 'RGBA'))
ctl.save(OUT + '/chip-cutout-check.png')
ys, xs = np.nonzero(mask[y0:y1, x0:x1])
print('recorte', rgba.shape[1], 'x', rgba.shape[0], '· pieza x[%d,%d] y[%d,%d]' % (xs.min(), xs.max(), ys.min(), ys.max()),
      '· fondo medio', bg.mean((0, 1)).round(1), '· sombra mín', shadow.min())
