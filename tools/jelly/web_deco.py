# Vista cenital rectificada de la cara superior de la ventana y medidas de barras y puntos (requiere web_fit.json)
# Uso (desde la raíz del repo): python3 tools/jelly/web_deco.py   · salida en _inventory/jelly/
import os, sys
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')) + '/'
OUT = os.path.join(ROOT, '_inventory', 'jelly'); os.makedirs(OUT, exist_ok=True); os.chdir(OUT)
import numpy as np, math, json
from PIL import Image
p=json.load(open('web_fit.json'))
im=np.array(Image.open(ROOT+'public/jelly/web.webp').convert('RGBA')).astype(np.float32)
H,W=im.shape[:2]
yaw,e,d,s,cx,cy,T,D=p['yaw'],p['e'],p['d'],p['s'],p['cx'],p['cy'],p['T'],p['D']
c,sn=math.cos(yaw),math.sin(yaw)
def proj(lx,ly,lz):
    x=lx*c+lz*sn; z=-lx*sn+lz*c; qy=ly-T/2
    yv=qy*math.cos(e)-z*math.sin(e); zd=d-(qy*math.sin(e)+z*math.cos(e))
    return cx+s*x*d/zd, cy-s*yv*d/zd
def sample(X,Y):
    X=np.clip(X,0,W-1.001); Y=np.clip(Y,0,H-1.001)
    x0=np.floor(X).astype(int); y0=np.floor(Y).astype(int); fx=(X-x0)[...,None]; fy=(Y-y0)[...,None]
    return (im[y0,x0]*(1-fx)*(1-fy)+im[y0,x0+1]*fx*(1-fy)+im[y0+1,x0]*(1-fx)*fy+im[y0+1,x0+1]*fx*fy)
PX=500 # px por unidad
lx=np.linspace(-1.02,1.02,int(2.04*PX)); lz=np.linspace(-D/2-0.02,D/2+0.02,int((D+0.04)*PX))
LX,LZ=np.meshgrid(lx,lz)
X,Y=proj(LX,T+0.008,LZ)
top=sample(X,Y)
rgb=top[...,:3]; a=top[...,3:]/255
img=(rgb*a+255*(1-a)).astype(np.uint8)
Image.fromarray(img).save('web_top.png'); print('web_top', img.shape, 'x∈[-1.02,1.02] z∈[%.3f,%.3f]'%(lz[0],lz[-1]))
np.save('web_top.npy', img)
# segmentación: marfil (barras) y puntos de color
R,G,B=[img[...,i].astype(int) for i in range(3)]
mx=np.maximum(np.maximum(R,G),B); mn=np.minimum(np.minimum(R,G),B)
inside=(np.abs(LX)<0.93)&(np.abs(LZ)<D/2-0.07)
ivory=inside&(mn>205)&(mx-mn<50)
def comps(mask,minpx=150):
    lab=np.zeros(mask.shape,int); out=[]; n=0
    ys,xs=np.where(mask)
    for y0,x0 in zip(ys,xs):
        if lab[y0,x0]: continue
        n+=1; st=[(y0,x0)]; lab[y0,x0]=n; pts=[]
        while st:
            y,x=st.pop(); pts.append((y,x))
            for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                yy,xx=y+dy,x+dx
                if 0<=yy<mask.shape[0] and 0<=xx<mask.shape[1] and mask[yy,xx] and not lab[yy,xx]: lab[yy,xx]=n; st.append((yy,xx))
        if len(pts)>=minpx: out.append(np.array(pts))
    return out
print('BARRAS (x0,x1,z0,z1 en coordenadas locales; z negativo = fondo):')
for pts in sorted(comps(ivory), key=lambda q:(q[:,0].mean())):
    xs=lx[pts[:,1]]; zs=lz[pts[:,0]]
    # extremos robustos (percentiles)
    print('  x[%.3f,%.3f] z[%.3f,%.3f]  w=%.3f h=%.3f  n=%d' % (np.percentile(xs,0.5),np.percentile(xs,99.5),np.percentile(zs,0.5),np.percentile(zs,99.5), np.percentile(xs,99.5)-np.percentile(xs,0.5), np.percentile(zs,99.5)-np.percentile(zs,0.5), len(pts)))
sat=(mx-mn)
red=inside&(R>170)&(G<90)&(B<90); yel=inside&(R>200)&(G>170)&(B<110); grn=inside&(G>130)&(R<120)&(B<110)
for name,m in (('rojo',red),('amarillo',yel),('verde',grn)):
    for pts in comps(m,40):
        xs=lx[pts[:,1]]; zs=lz[pts[:,0]]
        print('  PUNTO %s centro x=%.3f z=%.3f  diámetros x=%.3f z=%.3f n=%d'%(name,xs.mean(),zs.mean(),xs.max()-xs.min(),zs.max()-zs.min(),len(pts)))
