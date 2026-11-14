# Deriva el contorno en planta de la nube (192 puntos) y su encuadre a partir de la foto → cloud_shape.json
# Uso (desde la raíz del repo): python3 tools/jelly/cloud_shape.py   · salida en _inventory/jelly/
import os, sys, math, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import cloud_fit as cf
T_PX = 175          # grosor visible de la pieza en la foto (px): base 100 + franja 34 + tapa
ELEV = 34           # elevación de cámara elegida (el contorno rectificado queda con lóbulos circulares)
e = math.radians(ELEV)
O0 = cf.derive(T_PX, 0.01, 0.01)                       # contorno (px) en el plano del suelo, suavizado
x0, x1 = O0[:, 0].min(), O0[:, 0].max(); y0, y1 = O0[:, 1].min(), O0[:, 1].max()
s = (x1 - x0) / 2; Xm = (x0 + x1) / 2; Ym = (y0 + y1) / 2
pts = np.stack([(O0[:, 0] - Xm) / s, (O0[:, 1] - Ym) / (s * math.sin(e))], 1)
out = {'outline': [[round(float(a), 3), round(float(b), 3)] for a, b in pts], 'thickness': round(T_PX / (s * math.cos(e)), 4),
       'view': {'elevation': ELEV, 'scale': round(s / cf.W, 5), 'cx': round(Xm / cf.W, 5), 'cy': round((Ym - T_PX / 2) / cf.H, 5)}}
json.dump(out, open('cloud_shape.json', 'w'))
open('cloud_outline.txt', 'w').write(','.join('[%g,%g]' % (a, b) for a, b in out['outline']))
print('grosor', out['thickness'], 'encuadre', out['view'], '· contorno en cloud_outline.txt (pegar en CLOUD_OUTLINE de jelly3d.js)')
print('Nota: los valores finales de thickness, layers y view.cy de jelly3d.js incluyen la compensación de los cantos redondeados (ver NOTAS.md, punto 34).')
