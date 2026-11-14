# Recorte del personaje para la sección de la raya (public/mascota/mascota.webp) a partir de la foto original.
#   1) fondo gris neutro modelado con un polinomio cuadrático (zonas vacías de la foto)
#   2) máscara por crominancia menta (G y B por encima de R) o diferencia con el fondo; huecos rellenos
#   3) alfa suave en la franja del borde (pelo) y color del pelo cercano en la parte semitransparente
#   4) recorte de la cabeza y los hombros (con margen bajo la raya para asomarse) y coordenadas del rig
# Uso (desde la raíz del repo): python3 tools/mascota/recorte.py   → escribe public/mascota/mascota.webp
# e imprime el RIG para pegarlo en public/mascota/mascota.js. Necesita numpy, Pillow y cwebp.
import os, json, subprocess, tempfile
import numpy as np
from PIL import Image
from collections import deque
ROOT=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..'))

# Puntos de referencia medidos sobre la foto original (1376 × 768)
FACE_C, FACE_R = (688.5, 266), (129, 86)
EYES, EYE_R = ((619.3, 266.7), (756.7, 266.7)), 15.5
HEAD_C, HEAD_R = (690, 245), (205, 165)
CLIP_Y = 392                 # por aquí pasa la raya: por encima se ven la cabeza y los hombros
CROP_Y = (84, 486)           # de la parte de arriba de la cabeza a algo por debajo de la raya

SRC=os.path.join(ROOT,'assets/mascota/mascota-original.jpg')
I=np.array(Image.open(SRC).convert('RGB')).astype(np.float64); H,W=I.shape[:2]
yy,xx=np.mgrid[0:H,0:W]
# 1) fondo: polinomio cuadrático ajustado a las zonas claramente vacías (lejos del personaje)
far=((xx<360)|(xx>1020)|(yy<60))
Xd=np.stack([np.ones(far.sum()),xx[far],yy[far],xx[far]**2,yy[far]**2,xx[far]*yy[far]],1)/np.array([1,W,H,W*W,H*H,W*H])
Bimg=np.zeros_like(I)
for c in range(3):
    coef,*_=np.linalg.lstsq(Xd,I[...,c][far],rcond=None)
    Xa=np.stack([np.ones(H*W),xx.ravel(),yy.ravel(),xx.ravel()**2,yy.ravel()**2,(xx*yy).ravel()],1)/np.array([1,W,H,W*W,H*H,W*H])
    Bimg[...,c]=(Xa@coef).reshape(H,W)
res=np.abs(I-Bimg)[far].mean(0); print('error del modelo de fondo (media abs por canal):', res.round(2))
# 2) máscara aproximada: crominancia menta (G,B > R) o diferencia con el fondo
chroma=lambda X: (X[...,1]+X[...,2])/2-X[...,0]
ch=chroma(I)-chroma(Bimg)
diff=np.sqrt(((I-Bimg)**2).sum(2))
rough=(ch>9)|(diff>28)
def label_largest(m):
    lab=np.zeros(m.shape,np.int32); best=(0,0); n=0
    for y0,x0 in zip(*np.where(m)):
        if lab[y0,x0]: continue
        n+=1; q=deque([(y0,x0)]); lab[y0,x0]=n; c=0
        while q:
            y,x=q.popleft(); c+=1
            for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                Y,X=y+dy,x+dx
                if 0<=Y<H and 0<=X<W and m[Y,X] and not lab[Y,X]: lab[Y,X]=n; q.append((Y,X))
        if c>best[0]: best=(c,n)
    return lab==best[1]
body=label_largest(rough)
# rellenar huecos (cara, ojos): todo lo no alcanzable desde el borde sin pasar por el cuerpo
outside=np.zeros((H,W),bool); q=deque([(0,0)]); outside[0,0]=True
while q:
    y,x=q.popleft()
    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
        Y,X=y+dy,x+dx
        if 0<=Y<H and 0<=X<W and not body[Y,X] and not outside[Y,X]: outside[Y,X]=True; q.append((Y,X))
solid=~outside
def morph(m,r,op):
    out=m.copy(); ky,kx=np.mgrid[-r:r+1,-r:r+1]; k=(ky**2+kx**2)<=r*r
    for dy,dx in zip(ky[k],kx[k]):
        sh=np.zeros_like(m) if op=='or' else np.ones_like(m)
        sh[max(0,dy):H+min(0,dy),max(0,dx):W+min(0,dx)]=m[max(0,-dy):H+min(0,-dy),max(0,-dx):W+min(0,-dx)]
        out=(out|sh) if op=='or' else (out&sh)
    return out
inner=morph(solid,7,'and')          # seguro dentro
outer=morph(solid,6,'or')           # fuera de esto, seguro fondo
# 3) alfa suave en la franja del borde: crominancia relativa a la del pelo cercano
from math import ceil
def box_blur(a,r):
    k=2*r+1; p=np.pad(a,r,mode='edge'); c=p.cumsum(0).cumsum(1); c=np.pad(c,((1,0),(1,0)))
    return (c[k:,k:]-c[:-k,k:]-c[k:,:-k]+c[:-k,:-k])/(k*k)
fur=inner&(ch>8)
chF=box_blur(np.where(fur,ch,0),14)/np.maximum(box_blur(fur.astype(float),14),1e-3)
chF=np.where(chF<10,22,chF)
a_ch=np.clip(ch/chF,0,1)
dF=box_blur(np.where(inner,diff,0),14)/np.maximum(box_blur(inner.astype(float),14),1e-3)
a_df=np.clip(diff/np.maximum(dF,20),0,1)
alpha=np.maximum(a_ch,a_df)
alpha=np.where(inner,1.0,np.where(outer,alpha,0.0))
# suavizado leve del alfa (ruido JPEG) y contraste
alpha=np.clip((box_blur(alpha,1)-0.04)/0.9,0,1)
# 4) descontaminar el color del borde: F = (I - (1-a)·B) / a
a3=alpha[...,None]
F=np.where(a3>0.08,(I-(1-a3)*Bimg)/np.maximum(a3,1e-3),I)
# para alfas muy bajos, color del pelo cercano
furcol=np.stack([box_blur(np.where(inner,I[...,c],0),16)/np.maximum(box_blur(inner.astype(float),16),1e-3) for c in range(3)],-1)
# en la franja semitransparente el color es el del pelo cercano (la reconstrucción pixel a pixel oscurece el borde)
t=np.clip((a3-0.55)/0.4,0,1); t=t*t*(3-2*t)
F=furcol*(1-t)+F*t
F=np.clip(F,0,255)
alpha8=(alpha*255).astype(np.uint8)
out=np.dstack([F.astype(np.uint8),alpha8])
Y0,Y1=CROP_Y
xs=np.where((alpha8[Y0:Y1]>5).any(0))[0]; X0,X1=int(xs.min())-6,int(xs.max())+7
crop=Image.fromarray(out,'RGBA').crop((X0,Y0,X1,Y1))
P=lambda x,y: [round(x-X0,1), round(y-Y0,1)]
rig={'size':[X1-X0,Y1-Y0],'face':{'c':P(*FACE_C),'r':list(FACE_R)},'head':{'c':P(*HEAD_C),'r':list(HEAD_R)},
     'eyes':[P(*e) for e in EYES],'eyeR':EYE_R,'pivot':P(HEAD_C[0],CLIP_Y)}
with tempfile.TemporaryDirectory() as tmp:
    png=os.path.join(tmp,'mascota.png'); crop.save(png)
    subprocess.run(['cwebp','-quiet','-q','90','-alpha_q','100','-m','6',png,'-o',os.path.join(ROOT,'public/mascota/mascota.webp')],check=True)
print('public/mascota/mascota.webp', crop.size, '· raya en y =', round(CLIP_Y-Y0,1))
print('RIG =', json.dumps(rig))
