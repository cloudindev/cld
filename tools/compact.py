# Resumen compacto de un volcado de tools/measure.mjs: solo filas con texto, fondo, imagen o enlace.
# Uso: python3 tools/compact.py <fichero> <yDesde> <yHasta>
import re, sys
f, y0, y1 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
for line in open(f):
    m = re.search(r'@(-?[\d.]+),(-?[\d.]+),([\d.]+),([\d.]+)', line)
    if not m: continue
    x, y, w, h = map(float, m.groups())
    if not (y0 <= y <= y1): continue
    if 'split-inner' in line or 'vis:hidden' in line: continue
    keep = ('«' in line) or ('bg:' in line) or ('bgi:' in line) or ('src:' in line) or ('href:' in line) or ('[text' in line) or ('[submit' in line)
    if not keep: continue
    tag = line.strip().split(' @')[0].split('.')[0]
    props = [p.strip() for p in line.split(' | ')[1:]]
    props = [p for p in props if not p.startswith(('pos:relative', 'maxw:', 'ov:'))]
    txt = re.search(r'«(.*)»', line)
    t = (txt.group(1)[:50] if txt else '')
    props = [re.sub(r'«.*»', '', p).strip() for p in props]
    print(f"{tag} {x:.1f},{y:.1f} {w:.1f}x{h:.1f} | {' | '.join(p for p in props if p)[:230]} {('«'+t+'»') if t else ''}")
