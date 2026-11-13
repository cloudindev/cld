// node tools/crop.mjs in.png out.png x y w h [scale]
import fs from 'node:fs'; import { PNG } from 'pngjs';
const [i,o,x,y,w,h]=process.argv.slice(2); const src=PNG.sync.read(fs.readFileSync(i));
const W=Math.min(+w,src.width-+x),H=Math.min(+h,src.height-+y); const out=new PNG({width:W,height:H});
PNG.bitblt(src,out,+x,+y,W,H,0,0); fs.writeFileSync(o,PNG.sync.write(out));
