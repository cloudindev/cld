# Vuelca los materiales calibrados (tune.json, de fit-materials.mjs) en SHAPES de public/jelly/jelly3d.js
# Uso (desde la raíz del repo): python3 tools/jelly/bake.py
import os, sys
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')) + '/'
OUT = os.path.join(ROOT, '_inventory', 'jelly'); os.makedirs(OUT, exist_ok=True); os.chdir(OUT)
import json, re, sys
p=ROOT+'public/jelly/jelly3d.js'; s=open(p).read()
tune=json.load(open('tune.json'))
names={'cloud':['base turquesa (gominola traslúcida)','franja crema','tapa azul hielo (ópalo)'],'web':['base naranja rojizo (gominola traslúcida)','franja crema','tapa melocotón (cristal)'],'chip':['base morada (gominola traslúcida)','franja crema','tapa lila (cristal)']}
def fmt(m,c):
    g=lambda v: ('%g'%round(v,3))
    return "      { sigma: [%s], scatter: %s, color: [%s], path: %s, shade: %s }, // %s" % (', '.join(g(v) for v in m['sigma']), g(m['scatter']), ', '.join(g(v) for v in m['color']), g(m['path']), g(m.get('shade',0.3)), c)
for sh in tune:
    i=s.index('  %s: {'%sh); a=s.index('    materials: [\n',i)+len('    materials: [\n'); b=s.index('    ],',a)
    lines=[fmt(m,c) for m,c in zip(tune[sh]['materials'],names[sh])]
    s=s[:a]+'\n'.join(lines)+'\n'+s[b:]
open(p,'w').write(s)
print('baked', list(tune))
