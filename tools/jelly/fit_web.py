# Ajusta la pose, la perspectiva y las proporciones de la ventana (rectángulo redondeado extruido) a la silueta de la foto → web_fit.json
# Uso (desde la raíz del repo): python3 tools/jelly/fit_web.py   · salida en _inventory/jelly/
import os, sys
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')) + '/'
OUT = os.path.join(ROOT, '_inventory', 'jelly'); os.makedirs(OUT, exist_ok=True); os.chdir(OUT)
import numpy as np, math, json, sys
from PIL import Image, ImageDraw
im=Image.open(ROOT+'public/jelly/web.webp').convert('RGBA'); A=np.array(im)[...,3].astype(np.float32)/255
H,W=A.shape
SS=2

def rrect(Dz,R,n=64):
    # rectángulo redondeado: ancho 2 (x∈[-1,1]), fondo Dz (z∈[-Dz/2,Dz/2]), radio R
    pts=[]
    hx,hz=1.0,Dz/2
    for (cx,cz,a0) in [(hx-R,hz-R,0),( -hx+R,hz-R,90),(-hx+R,-hz+R,180),(hx-R,-hz+R,270)]:
        for k in range(n//4+1):
            a=math.radians(a0+90*k/(n//4))
            pts.append((cx+R*math.cos(a), cz+R*math.sin(a)))
    return np.array(pts)

def project(P, p):
    # P: (n,3) puntos locales; p: parámetros
    yaw,e,d,s,cx,cy,T=p['yaw'],p['e'],p['d'],p['s'],p['cx'],p['cy'],p['T']
    c,sn=math.cos(yaw),math.sin(yaw)
    x=P[:,0]*c+P[:,2]*sn; y=P[:,1]; z=-P[:,0]*sn+P[:,2]*c
    qy=y-T/2
    xv=x; yv=qy*math.cos(e)-z*math.sin(e); zd=d-(qy*math.sin(e)+z*math.cos(e))
    X=cx+s*xv*d/zd; Y=cy-s*yv*d/zd
    return np.stack([X,Y],1)

def hull(pts):
    pts=sorted(map(tuple,pts))
    def half(ps):
        h=[]
        for q in ps:
            while len(h)>=2 and (h[-1][0]-h[-2][0])*(q[1]-h[-2][1])-(h[-1][1]-h[-2][1])*(q[0]-h[-2][0])<=0: h.pop()
            h.append(q)
        return h
    lo=half(pts); up=half(pts[::-1])
    return lo[:-1]+up[:-1]

def model_points(p):
    o=rrect(p['D'],p['R'])
    rb=p.get('rb',0.05)
    rings=[]
    # perfil: bisel abajo y arriba (radio rb)
    for f in (-90,-45,0):
        a=math.radians(f); rings.append((rb*(1-math.cos(a)), rb+rb*math.sin(a)))
    for f in (0,45,90):
        a=math.radians(f); rings.append((rb*(1-math.cos(a)), p['T']-rb+rb*math.sin(a)))
    # normales hacia fuera del contorno
    n=len(o); nx=np.roll(o[:,1],-1)-np.roll(o[:,1],1); nz=-(np.roll(o[:,0],-1)-np.roll(o[:,0],1))
    l=np.hypot(nx,nz); nx/=l; nz/=l
    # orientar hacia fuera (el centro es 0,0)
    sgn=np.sign((o[:,0]*nx+o[:,1]*nz).sum()); nx*=sgn; nz*=sgn
    P=[]
    for dd,y in rings:
        P.append(np.stack([o[:,0]-nx*dd, np.full(n,y), o[:,1]-nz*dd],1))
    return np.concatenate(P)

def render(p):
    pts=project(model_points(p),p)
    h=hull(pts)
    img=Image.new('L',(W*SS,H*SS),0)
    ImageDraw.Draw(img).polygon([(x*SS,y*SS) for x,y in h],fill=255)
    return np.array(img.resize((W,H),Image.BOX)).astype(np.float32)/255

KEYS=['yaw','e','d','s','cx','cy','T','D','R']
def loss_vec(v):
    p=dict(zip(KEYS,v))
    if p['d']<3 or p['T']<0.05 or p['R']<0.02 or p['D']<0.5 or p['e']<0.1 or p['e']>1.4: return 1e9
    return float(np.abs(render(p)-A).sum())

def nelder(f,x0,step,iters=1500):
    n=len(x0); S=[np.array(x0,float)]
    for i in range(n):
        y=np.array(x0,float); y[i]+=step[i]; S.append(y)
    F=[f(s) for s in S]
    for it in range(iters):
        o=np.argsort(F); S=[S[i] for i in o]; F=[F[i] for i in o]
        c=np.mean(S[:-1],0); xr=c+(c-S[-1]); fr=f(xr)
        if fr<F[0]:
            xe=c+2*(c-S[-1]); fe=f(xe)
            if fe<fr: S[-1],F[-1]=xe,fe
            else: S[-1],F[-1]=xr,fr
        elif fr<F[-2]: S[-1],F[-1]=xr,fr
        else:
            xc=c+0.5*(S[-1]-c); fc=f(xc)
            if fc<F[-1]: S[-1],F[-1]=xc,fc
            else:
                for i in range(1,n+1): S[i]=S[0]+0.5*(S[i]-S[0]); F[i]=f(S[i])
        if it%200==0: print(it, round(min(F),1), flush=True)
    o=np.argmin(F); return S[o],F[o]

best=None
for yaw0 in (math.radians(30), math.radians(42)):
  for e0 in (math.radians(28), math.radians(40)):
    x0=[yaw0,e0,9.0,310.0,W/2,H/2,0.3,1.45,0.25]
    st=[0.1,0.1,2.0,20,15,15,0.05,0.1,0.05]
    x,fv=nelder(loss_vec,x0,st,1200)
    x,fv=nelder(loss_vec,x,[s*0.3 for s in st],800)
    print('start',round(math.degrees(yaw0)),round(math.degrees(e0)),'->',fv, dict(zip(KEYS,[round(float(t),4) for t in x])), flush=True)
    if best is None or fv<best[1]: best=(x,fv)
x,fv=best
p=dict(zip(KEYS,[float(t) for t in x]))
R=render(p); iou=float(((R>0.5)&(A>0.5)).sum()/((R>0.5)|(A>0.5)).sum())
print('BEST loss',fv,'IoU',iou, {k:round(v,4) for k,v in p.items()}, 'yaw°',math.degrees(p['yaw']),'e°',math.degrees(p['e']))
json.dump(p,open('web_fit.json','w'))
# imagen de comprobación: rojo = modelo, verde = foto
out=np.zeros((H,W,3),np.uint8); out[...,0]=(R*255).astype(np.uint8); out[...,1]=(A*255).astype(np.uint8)
Image.fromarray(out).save('web_fit.png')
