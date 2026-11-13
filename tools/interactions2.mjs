import { chromium } from 'playwright';
const O='/Users/luis/_Dev/cloudin.pro/_inventory/interactions/';
const b=await chromium.launch();
const HIDE='.sb-main,.sb-chat,.grecaptcha-badge{display:none!important}';
// modal móvil
{ const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
  await p.goto('https://cloudin.pro/',{waitUntil:'networkidle'}); await p.addStyleTag({content:HIDE}); await p.waitForTimeout(2000);
  await p.screenshot({path:O+'mobile-header-trigger-390.png',clip:{x:0,y:0,width:390,height:120}});
  for (const w of [390,768,1024,1440]) { await p.setViewportSize({width:w,height:844}); await p.waitForTimeout(500); console.log('trigger@'+w, await p.evaluate(()=>{const a=document.querySelector('a[href="#modal-1473"]');let e=a,hid=[];while(e&&e!==document.body){const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0')hid.push(e.tagName+'.'+String(e.className).split(' ').slice(0,3).join('.')+':'+cs.display+'/'+cs.visibility+'/'+cs.opacity);e=e.parentElement}const r=a.getBoundingClientRect();return {r:[r.x,r.y,r.width,r.height],hid}})); }
  await p.setViewportSize({width:390,height:844});
  await p.evaluate(()=>document.querySelector('a[href="#modal-1473"]').click()); await p.waitForTimeout(1800);
  await p.screenshot({path:O+'modal-390.png'});
  console.log(await p.evaluate(()=>{const m=document.querySelector('#modal-1473');const cs=getComputedStyle(m);const c=m.querySelector('.lqd-lity-container');return {open:m.className, bd:getComputedStyle(m.querySelector('.lqd-lity-backdrop')).backgroundColor, w:c?.getBoundingClientRect().width, tr:cs.transition}}));
  await p.keyboard.press('Escape'); await p.waitForTimeout(800);
  // tooltip cookies + region en 390
}
// región: forzar hover por JS (mouse-in-out)
{ const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
  await p.goto('https://cloudin.pro/',{waitUntil:'networkidle'}); await p.addStyleTag({content:HIDE}); await p.waitForTimeout(2000);
  const li=p.locator('footer li.megamenu').first(); await li.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
  await p.locator('footer li.megamenu > a').first().hover(); await p.waitForTimeout(400);
  await p.mouse.move(150,0,{steps:1}); 
  const bb=await p.locator('footer li.megamenu > a').first().boundingBox();
  await p.mouse.move(bb.x+20,bb.y+10,{steps:5}); await p.waitForTimeout(1200);
  await p.screenshot({path:O+'region-open-1440.png'});
  console.log(await p.evaluate(()=>{const c=document.querySelector('footer li.megamenu .nav-item-children');const cs=getComputedStyle(c);const r=c.getBoundingClientRect();return {li:c.parentElement.className,op:cs.opacity,vis:cs.visibility,r:[r.x,r.y,r.width,r.height]}}));
  const ck=p.locator('footer a[href="/cookies/"]').first(); await ck.hover(); await p.waitForTimeout(800);
  const cb=await ck.boundingBox(); await p.screenshot({path:O+'cookies-tooltip-1440.png',clip:{x:0,y:Math.max(0,cb.y-250),width:900,height:330}});
}
await b.close();
