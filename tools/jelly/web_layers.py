# Alturas de las capas y colores de la ventana leídos de la foto (requiere web_fit.json)
# Uso (desde la raíz del repo): python3 tools/jelly/web_layers.py   · salida en _inventory/jelly/
import os, sys
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')) + '/'
OUT = os.path.join(ROOT, '_inventory', 'jelly'); os.makedirs(OUT, exist_ok=True); os.chdir(OUT)
import numpy as np, math, json
from PIL import Image
p=json.load(open('web_fit.json'))
im=np.array(Image.open(ROOT+'public/jelly/web.webp').convert('RGBA')).astype(np.float32)
H,W=im.shape[:2]
yaw,e,d,s,cx,cy,T,D,R=p['yaw'],p['e'],p['d'],p['s'],p['cx'],p['cy'],p['T'],p['D'],p['R']
c,sn=math.cos(yaw),math.sin(yaw)
def proj(lx,ly,lz):
    x=lx*c+lz*sn; z=-lx*sn+lz*c; qy=ly-T/2
    yv=qy*math.cos(e)-z*math.sin(e); zd=d-(qy*math.sin(e)+z*math.cos(e))
    return cx+s*x*d/zd, cy-s*yv*d/zd
def px(X,Y):
    return im[int(round(Y)),int(round(X))]
def cls(c):
    r,g,b,a=c
    if a<128: return '.'
    if min(r,g,b)>200 and max(r,g,b)-min(r,g,b)<55: return 'C'      # crema
    if g<125 and r>150: return 'B'                                   # base rojiza
    return 'G'                                                       # cristal melocotón
# puntos del contorno en la pared frontal: lado inferior (z=+D/2) y lado izquierdo (x=-1) y esquina cercana
pts={'frente centro':(0.0,D/2),'frente izq':(-0.5,D/2),'frente dcha':(0.5,D/2),'lado izq centro':(-1.0,0.0),'lado izq cerca':(-1.0,0.35),
     'esquina cercana':(-1+R-R*math.cos(math.radians(45)), D/2-R+R*math.sin(math.radians(45)))}
for name,(lx,lz) in pts.items():
    row=''; cols=[]
    for i in range(101):
        y=T*i/100; X,Y=proj(lx,y,lz); c4=px(X,Y); row+=cls(c4); cols.append(c4)
    # transiciones
    tr=[(i,row[i-1]+'>'+row[i]) for i in range(1,101) if row[i]!=row[i-1]]
    print('%-16s %s'%(name,row)); print('   transiciones (h%%):',tr)
# colores medios por zona
def mean_at(lx,ly,lz,rad=3):
    X,Y=proj(lx,ly,lz); X=int(round(X)); Y=int(round(Y)); patch=im[Y-rad:Y+rad+1,X-rad:X+rad+1,:3].reshape(-1,3); return tuple(int(v) for v in patch.mean(0))
print('COLORES (sRGB):')
print(' tapa centro-libre (0.75,-0.1):', mean_at(0.78,T,-0.1), ' (-0.8,0.2):', mean_at(-0.82,T,0.2), ' (0,0.62):', mean_at(0,T,0.62), ' barra título (0.3,-0.55):', mean_at(0.3,T,-0.55), ' entre barras (0,0.16):', mean_at(-0.02,T,0.16))
print(' barra marfil A centro:', mean_at(0,T+0.015,-0.11), ' B:', mean_at(0.35,T+0.015,0.3), ' línea:', mean_at(-0.3,T+0.015,0.09))
print(' punto rojo:', mean_at(-0.689,T+0.03,-0.512,1), ' amarillo:', mean_at(-0.548,T+0.03,-0.511,1), ' verde:', mean_at(-0.405,T+0.03,-0.511,1))
for name,(lx,lz) in (('frente centro',(0.0,D/2)),('frente dcha',(0.6,D/2)),('lado izq',(-1.0,0.1))):
    print(' pared', name, ' h=0.08:', mean_at(lx,0.08*T,lz,2), ' h=0.2:', mean_at(lx,0.2*T,lz,2), ' h=0.3:', mean_at(lx,0.3*T,lz,2), ' h=0.45:', mean_at(lx,0.45*T,lz,2), ' h=0.62:', mean_at(lx,0.62*T,lz,2), ' h=0.75:', mean_at(lx,0.75*T,lz,2), ' h=0.9:', mean_at(lx,0.9*T,lz,2))
