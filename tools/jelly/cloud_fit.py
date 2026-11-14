# Funciones para derivar el contorno en planta de la nube a partir de la silueta de la foto (las usa cloud_shape.py)
# Uso (desde la raíz del repo): python3 tools/jelly/cloud_fit.py   · salida en _inventory/jelly/
import os, sys
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')) + '/'
OUT = os.path.join(ROOT, '_inventory', 'jelly'); os.makedirs(OUT, exist_ok=True); os.chdir(OUT)
import numpy as np, math, json, sys
from PIL import Image, ImageDraw
im=np.array(Image.open(ROOT+'public/jelly/cloud.webp').convert('RGBA'))
H,W=im.shape[:2]; S=im[...,3]>128
N=192

def shift_down(M,k):
    k=int(round(k)); out=np.zeros_like(M)
    if k>0: out[k:]=M[:-k]
    elif k<0: out[:k]=M[-k:]
    else: out[:]=M
    return out

def main_component(M):
    # componente conexa que contiene el centro de masas
    ys,xs=np.where(M); cy,cx=int(ys.mean()),int(xs.mean())
    if not M[cy,cx]:
        i=np.argmin((ys-cy)**2+(xs-cx)**2); cy,cx=ys[i],xs[i]
    out=np.zeros_like(M); out[cy,cx]=True; frontier=out.copy()
    while frontier.any():
        g=np.zeros_like(M)
        g[1:]|=frontier[:-1]; g[:-1]|=frontier[1:]; g[:,1:]|=frontier[:,:-1]; g[:,:-1]|=frontier[:,1:]
        frontier=g&M&~out; out|=frontier
    return out

def trace(M):
    M=main_component(M)
    Mp=np.pad(M,1)
    ys,xs=np.where(Mp); i=np.lexsort((xs,ys))[0]; start=(int(ys[i]),int(xs[i]))
    nb=[(0,-1),(-1,-1),(-1,0),(-1,1),(0,1),(1,1),(1,0),(1,-1)]  # horario empezando por el oeste
    c=start; b=(start[0],start[1]-1); pts=[start]
    for _ in range(40000):
        k0=nb.index((b[0]-c[0],b[1]-c[1]))
        nxt=None
        for k in range(1,9):
            dy,dx=nb[(k0+k)%8]; q=(c[0]+dy,c[1]+dx)
            if Mp[q]: nxt=q; break
            b=q
        if nxt is None or nxt==start: break
        c=nxt; pts.append(c)
    return np.array([(x-1,y-1) for y,x in pts],float)

def smooth_resample(P,n,win=9):
    k=np.ones(win)/win
    X=np.convolve(np.concatenate([P[-win:,0],P[:,0],P[:win,0]]),k,'same')[win:-win]
    Y=np.convolve(np.concatenate([P[-win:,1],P[:,1],P[:win,1]]),k,'same')[win:-win]
    Q=np.stack([X,Y],1); d=np.hypot(*(np.roll(Q,-1,0)-Q).T); cum=np.concatenate([[0],np.cumsum(d)]); L=cum[-1]
    t=np.arange(n)/n*L; idx=np.searchsorted(cum,t,side='right')-1; f=(t-cum[idx])/np.maximum(d[idx],1e-9)
    return Q[idx]*(1-f[:,None])+Q[(idx+1)%len(Q)]*f[:,None]

def derive(t,rbv,rtv):
    O0=shift_down(S,rbv)&shift_down(S,t-rtv)
    P=trace(O0)
    return smooth_resample(P,N)

def normals(O):
    n=np.roll(O,-1,0)-np.roll(O,1,0); nx,ny=n[:,1],-n[:,0]; l=np.hypot(nx,ny); nx/=l; ny/=l
    c=O.mean(0); sg=np.sign(((O[:,0]-c[0])*nx+(O[:,1]-c[1])*ny).sum())
    return nx*sg,ny*sg

def model_mask(O0,t,rbv,rtv,e,s):
    # anillos del perfil en espacio de pantalla. O0 = contorno (px) en el plano y=0.
    # bisel: radio en mundo rb = rbv/(s cos e) → retranqueo en planta d → en pantalla: dx = d*s, dy = d*s*sin e (anisótropo)
    ce,se=math.cos(e),math.sin(e)
    rb=rbv/(s*ce); rt=rtv/(s*ce); T=t/(s*ce)
    # contorno en planta (mundo): x = X/s, z = Y/(s*se)
    Ow=np.stack([O0[:,0]/s, O0[:,1]/(s*se)],1)
    nx,nz=normals(Ow)
    rings=[]
    for f in np.linspace(-90,0,6): a=math.radians(f); rings.append((rb*(1-math.cos(a)), rb+rb*math.sin(a)))
    for f in np.linspace(0,90,6): a=math.radians(f); rings.append((rt*(1-math.cos(a)), T-rt+rt*math.sin(a)))
    img=Image.new('L',(W,H),0); dr=ImageDraw.Draw(img); prev=None
    for d,y in rings:
        Xw=Ow[:,0]-nx*d; Zw=Ow[:,1]-nz*d
        R=np.stack([Xw*s, Zw*s*se - y*s*ce],1)
        dr.polygon([tuple(q) for q in R],fill=255)
        if prev is not None:
            for i in range(N):
                j=(i+1)%N; dr.polygon([tuple(prev[i]),tuple(prev[j]),tuple(R[j]),tuple(R[i])],fill=255)
        prev=R
    return np.array(img)>0

def iou(A,B): return (A&B).sum()/(A|B).sum()

if __name__=='__main__':
    e=math.radians(float(sys.argv[1]) if len(sys.argv)>1 else 32)
    s=448.5
    best=None
    for t in (165,175,185,195,205):
        for rbv in (10,25,40,60):
            for rtv in (15,30,45,60):
                O0=derive(t,rbv,rtv); M=model_mask(O0,t,rbv,rtv,e,s); v=iou(M,S)
                if best is None or v>best[0]: best=(v,t,rbv,rtv)
                print('t=%d rb=%d rt=%d IoU=%.4f'%(t,rbv,rtv,v), flush=True)
    print('BEST',best)
