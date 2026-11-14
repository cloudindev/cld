# Compara el render 3D con la foto: lado a lado, IoU de siluetas y diferencia media de color (requiere shot.mjs)
# Uso (desde la raíz del repo): python3 tools/jelly/compare.py [web,cloud]
import os, sys
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')) + '/'
OUT = os.path.join(ROOT, '_inventory', 'jelly'); os.makedirs(OUT, exist_ok=True); os.chdir(OUT)
import sys, numpy as np
from PIL import Image
S='.'
for shape in (sys.argv[1].split(',') if len(sys.argv)>1 else ['web','cloud']):
    ref=Image.open(ROOT+f'public/jelly/{shape}.webp').convert('RGBA'); W,H=ref.size
    bg=Image.new('RGBA',ref.size,(255,255,255,255)); bg.alpha_composite(ref); refc=np.array(bg.convert('RGB')).astype(int)
    mask=np.array(ref)[...,3]>128
    raw=np.frombuffer(open(f'{S}/{shape}-rgba.bin','rb').read(),np.uint8).reshape(H,W,4)
    rmask=raw[...,3]>250
    r=np.array(Image.open(f'{S}/{shape}-3d.png').convert('RGB')).astype(int)
    iou=(mask&rmask).sum()/(mask|rmask).sum()
    ys,xs=np.where(rmask); ys2,xs2=np.where(mask)
    both=mask&rmask
    d=np.abs(r-refc).sum(2)[both].mean()/3
    print(f'{shape}: IoU {iou:.4f} · bbox render x[{xs.min()},{xs.max()}] y[{ys.min()},{ys.max()}] · foto x[{xs2.min()},{xs2.max()}] y[{ys2.min()},{ys2.max()}] · dif. color media {d:.1f}')
    side=Image.new('RGB',(W*2+20,H),(255,255,255)); side.paste(bg.convert('RGB'),(0,0)); side.paste(Image.fromarray(r.astype(np.uint8)),(W+20,0))
    side.save(f'{S}/{shape}-side.png')
    ov=np.zeros((H,W,3),np.uint8); ov[...,0]=rmask*255; ov[...,1]=mask*255; Image.fromarray(ov).save(f'{S}/{shape}-mask.png')
