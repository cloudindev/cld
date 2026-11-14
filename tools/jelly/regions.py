# Zonas de muestreo de cada material sobre las fotos y su color objetivo → regions.json (requiere web_fit.json)
# Uso (desde la raíz del repo): python3 tools/jelly/regions.py   · salida en _inventory/jelly/
import os, sys
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')) + '/'
OUT = os.path.join(ROOT, '_inventory', 'jelly'); os.makedirs(OUT, exist_ok=True); os.chdir(OUT)
import numpy as np, math, json
from PIL import Image
def lin(c): return (np.asarray(c,float)/255)**2.2
def load(n):
    im=Image.open(ROOT+f'public/jelly/{n}.webp').convert('RGBA'); bg=Image.new('RGBA',im.size,(255,255,255,255)); bg.alpha_composite(im)
    return np.array(bg.convert('RGB')).astype(float), np.array(im)[...,3]>128
def patch_mean(img,pts,r=3):
    v=[]
    for x,y in pts:
        x=int(round(x)); y=int(round(y)); v.append(lin(img[y-r:y+r+1,x-r:x+r+1].reshape(-1,3)).mean(0))
    return np.mean(v,0)
out={}
# ---------- ventana: proyección con la cámara ajustada ----------
p=json.load(open('web_fit.json')); img,mask=load('web')
yaw,e,d,s,cx,cy,T,D=p['yaw'],p['e'],p['d'],p['s'],p['cx'],p['cy'],p['T'],p['D']
c,sn=math.cos(yaw),math.sin(yaw)
def proj(lx,ly,lz):
    x=lx*c+lz*sn; z=-lx*sn+lz*c; qy=ly-T/2
    yv=qy*math.cos(e)-z*math.sin(e); zd=d-(qy*math.sin(e)+z*math.cos(e))
    return [cx+s*x*d/zd, cy-s*yv*d/zd]
walls=[(-0.55,D/2),(-0.2,D/2),(0.15,D/2),(0.5,D/2),(-1.0,-0.25),(-1.0,0.0),(-1.0,0.25)]
reg={
 'top':[proj(x,T,z) for x,z in ((0.80,-0.1),(-0.84,0.15),(0.0,0.63),(0.78,0.5),(-0.85,0.5),(0.80,0.1),(-0.84,-0.15),(0.45,0.63))],
 'title':[proj(x,T,z) for x,z in ((0.3,-0.56),(0.6,-0.56),(0.0,-0.56),(-0.2,-0.56))],
 'glass':[proj(x,0.82*T,z) for x,z in walls],
 'band':[proj(x,0.535*T,z) for x,z in walls],
 'base':[proj(x,0.28*T,z) for x,z in walls],
}
out['web']={k:{'pts':[[round(a,1),round(b,1)] for a,b in v],'target':[round(float(t),4) for t in patch_mean(img,v)]} for k,v in reg.items()}
# ---------- nube: a partir del borde inferior de la silueta ----------
img,mask=load('cloud'); H,W=mask.shape
ybot=lambda x: np.where(mask[:,x])[0].max()
ytop=lambda x: np.where(mask[:,x])[0].min()
xs=list(range(220,781,40))
reg={
 'base':[[x,ybot(x)-52] for x in xs],
 'band':[[x,ybot(x)-117] for x in xs],
 'top':[[x,y] for x in range(180,781,60) for y in range(ytop(x)+70, ybot(x)-175-35, 45)],
 'lip':[[x,ybot(x)-150] for x in xs],
}
out['cloud']={k:{'pts':[[float(a),float(b)] for a,b in v],'target':[round(float(t),4) for t in patch_mean(img,v)]} for k,v in reg.items()}
json.dump(out,open('regions.json','w'))
for sh in out:
    for k,v in out[sh].items():
        t=np.array(v['target']); print(sh,k,len(v['pts']),'pts  objetivo sRGB',tuple(int(round(255*q**(1/2.2))) for q in t))
# imagen de control con los puntos
for sh in ('web','cloud'):
    im=Image.open(ROOT+f'public/jelly/{sh}.webp').convert('RGBA'); bg=Image.new('RGBA',im.size,(255,255,255,255)); bg.alpha_composite(im); bg=bg.convert('RGB')
    from PIL import ImageDraw
    dr=ImageDraw.Draw(bg); cols={'top':(0,0,255),'title':(0,200,255),'glass':(255,0,255),'band':(0,160,0),'base':(255,255,0),'lip':(255,0,255)}
    for k,v in out[sh].items():
        for x,y in v['pts']: dr.rectangle([x-3,y-3,x+3,y+3],outline=cols[k])
    bg.save(f'regions-{sh}.png')
