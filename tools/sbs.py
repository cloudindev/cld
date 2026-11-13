# Vista lado a lado original | réplica | diff para un tramo vertical.
# Uso: python3 tools/sbs.py <slug> <ancho> <yDesde> <yHasta> <salida.png> [escala]
import sys
from PIL import Image
slug, w, y0, y1, out = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
sc = float(sys.argv[6]) if len(sys.argv) > 6 else 0.5
o = Image.open(f'_inventory/screens/{slug}/{w}.png').convert('RGB')
r = Image.open(f'_inventory/replica/{slug}/{w}.png').convert('RGB')
d = Image.open(f'_inventory/replica/{slug}/diff-{w}.png').convert('RGB')
W = int(w)
parts = [im.crop((0, y0, W, y1)) for im in (o, r, d)]
pw, ph = int(W * sc), int((y1 - y0) * sc)
canvas = Image.new('RGB', (pw * 3 + 20, ph), 'red')
for i, p in enumerate(parts):
    canvas.paste(p.resize((pw, ph)), (i * (pw + 10), 0))
canvas.save(out)
