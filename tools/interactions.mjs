// Fase 1 · Documenta interacciones del original con capturas de estado.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, '_inventory/interactions');
await fs.mkdir(OUT, { recursive: true });
const log = {};
const browser = await chromium.launch();
const HIDE_CHAT = '.sb-main,.sb-chat,.grecaptcha-badge{display:none!important}';

async function open(w, h = 900, url = 'https://cloudin.pro/') {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.addStyleTag({ content: HIDE_CHAT });
  await page.waitForTimeout(2500);
  return { ctx, page };
}
const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(OUT, name + '.png'), ...opts });
const txt = (page, sel) => page.evaluate(s => [...document.querySelectorAll(s)].map(e => e.innerText.trim().replace(/[ \t]+/g, ' ')).join('\n---\n'), sel);
async function step(name, fn) { try { await fn(); console.log('ok', name); } catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); log[name + '_error'] = e.message.split('\n')[0]; } }

// ---------- Desktop 1440
{
  const { ctx, page } = await open(1440);
  await step('header-default', async () => {
    await shot(page, 'header-1440', { clip: { x: 0, y: 0, width: 1440, height: 220 } });
    log.header = await page.evaluate(() => { const h = document.querySelector('header.main-header, header'); const cs = getComputedStyle(h); return { cls: h.className, position: cs.position, attrs: [...h.attributes].map(a => `${a.name}=${a.value.slice(0, 200)}`) }; });
  });
  await step('academy-megamenu', async () => {
    const item = page.locator('header li.megamenu > a', { hasText: 'Academy' }).first();
    await item.hover(); await page.waitForTimeout(900);
    await shot(page, 'academy-megamenu-1440');
    log.academy = await txt(page, 'header li.megamenu .nav-item-children');
    log.academyLinks = await page.evaluate(() => [...document.querySelectorAll('header li.megamenu .nav-item-children a')].map(a => ({ href: a.href, text: a.innerText.trim(), label: a.getAttribute('aria-label'), target: a.target })));
    log.academyAnim = await page.evaluate(() => { const c = document.querySelector('header li.megamenu .nav-item-children'); const cs = getComputedStyle(c); return { transition: cs.transition, opacity: cs.opacity, transform: cs.transform, visibility: cs.visibility, width: c.getBoundingClientRect().width, left: c.getBoundingClientRect().left, top: c.getBoundingClientRect().top, bg: cs.backgroundColor, shadow: cs.boxShadow, radius: cs.borderRadius }; });
    await page.mouse.move(700, 600); await page.waitForTimeout(600);
  });
  await step('nav-hover', async () => {
    await page.locator('header a', { hasText: 'Hosting' }).first().hover(); await page.waitForTimeout(500);
    await shot(page, 'nav-hover-hosting-1440', { clip: { x: 0, y: 0, width: 1440, height: 130 } });
    await page.locator('header a', { hasText: 'Únete' }).first().hover(); await page.waitForTimeout(700);
    await shot(page, 'btn-hover-unete-1440', { clip: { x: 1150, y: 20, width: 290, height: 100 } });
    log.uneteHover = await page.evaluate(() => { const a = [...document.querySelectorAll('header a')].find(x => x.innerText.includes('Únete')); const cs = getComputedStyle(a); return { bg: cs.backgroundColor, color: cs.color, shadow: cs.boxShadow, transform: cs.transform, cls: a.className }; });
    await page.mouse.move(700, 600);
  });
  await step('sticky-header', async () => {
    await page.evaluate(() => scrollTo(0, 1200)); await page.waitForTimeout(1500);
    await shot(page, 'sticky-header-1440', { clip: { x: 0, y: 0, width: 1440, height: 200 } });
    log.sticky = await page.evaluate(() => { const h = document.querySelector('header'); const s = document.querySelector('.is-stuck, .lqd-stickybar-wrap, [data-sticky-header] .is-stuck'); return { headerCls: h.className, stuckEl: s?.className, topbarVisible: [...document.querySelectorAll('.lqd-hide-onstuck')].map(e => getComputedStyle(e).display + '/' + getComputedStyle(e).opacity + '/' + getComputedStyle(e).height) }; });
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(800);
  });
  await step('tabs', async () => {
    const tabs = page.locator('.lqd-tabs-nav a');
    const n = await tabs.count(); log.tabs = [];
    await tabs.first().scrollIntoViewIfNeeded(); await page.waitForTimeout(1200);
    for (let i = 0; i < n; i++) {
      await tabs.nth(i).click(); await page.waitForTimeout(1200);
      const box = await page.locator('.lqd-tabs').first().boundingBox();
      await shot(page, `tabs-${i}-1440`, { clip: { x: 0, y: Math.max(0, box.y - 40), width: 1440, height: Math.min(box.height + 80, 900) } });
      log.tabs.push(await txt(page, '.lqd-tabs-pane.active, .lqd-tabs-content > .active'));
    }
    log.tabsNav = await txt(page, '.lqd-tabs-nav');
    log.tabsAnim = await page.evaluate(() => { const p = document.querySelector('.lqd-tabs-pane'); const cs = getComputedStyle(p); return { transition: cs.transition, animation: cs.animationName + ' ' + cs.animationDuration }; });
  });
  await step('carousel', async () => {
    const c = page.locator('.flickity-enabled, [data-lqd-flickity]').first();
    await c.scrollIntoViewIfNeeded(); await page.waitForTimeout(1500);
    const box = await c.boundingBox();
    await shot(page, 'carousel-0-1440', { clip: { x: 0, y: box.y, width: 1440, height: Math.min(box.height, 900) } });
    log.carousel = await page.evaluate(() => { const el = document.querySelector('.flickity-enabled, [data-lqd-flickity]'); return { cls: el.className, opts: el.getAttribute('data-lqd-flickity'), cells: [...el.querySelectorAll('.flickity-slider > *, .carousel-item')].map(c => ({ cls: c.className.slice(0, 80), w: c.getBoundingClientRect().width, img: c.querySelector('img')?.currentSrc, alt: c.querySelector('img')?.alt, link: c.querySelector('a')?.href, text: c.innerText.trim().slice(0, 100) })), navs: [...document.querySelectorAll('.lqd-carousel-nav button, .flickity-prev-next-button, [class*="carousel-nav"] button, .flickity-button')].map(b => b.className + ' | ' + b.getAttribute('aria-label')) }; });
    const next = page.locator('.flickity-button.next, .flickity-next, button[class*="next"], .lqd-carousel-nav-next').first();
    if (await next.count()) { await next.click({ force: true }); await page.waitForTimeout(1500); await shot(page, 'carousel-1-1440', { clip: { x: 0, y: (await c.boundingBox()).y, width: 1440, height: Math.min(box.height, 900) } }); }
    await page.waitForTimeout(6000); await shot(page, 'carousel-after6s-1440', { clip: { x: 0, y: (await c.boundingBox()).y, width: 1440, height: Math.min(box.height, 900) } });
  });
  await step('hover-cards', async () => {
    for (const t of ['ver planes', 'conocer más', 'Contactar']) {
      const l = page.locator('a', { hasText: t }).first(); if (!(await l.count())) continue;
      await l.scrollIntoViewIfNeeded(); await page.waitForTimeout(800); await l.hover(); await page.waitForTimeout(800);
      const b = await l.boundingBox(); await shot(page, `hover-${t.replace(/\s/g, '-')}-1440`, { clip: { x: Math.max(0, b.x - 40), y: Math.max(0, b.y - 40), width: b.width + 80, height: b.height + 80 } });
    }
  });
  await step('region-selector', async () => {
    const r = page.locator('a', { hasText: 'Cambiar región' }).first();
    await r.scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
    await r.hover(); await page.waitForTimeout(900);
    await shot(page, 'region-hover-1440');
    await r.click().catch(() => {}); await page.waitForTimeout(900);
    await shot(page, 'region-click-1440');
    log.region = await txt(page, 'footer li.megamenu .nav-item-children');
    log.regionLinks = await page.evaluate(() => [...document.querySelectorAll('footer li.megamenu .nav-item-children a')].map(a => ({ href: a.getAttribute('href'), text: a.innerText.trim() })));
  });
  await step('modal', async () => {
    log.modalTriggers = await page.evaluate(() => [...document.querySelectorAll('a[href^="#modal"], [data-lity], a[href*="modal-"]')].map(a => ({ href: a.getAttribute('href'), text: a.innerText.trim(), cls: a.className.slice(0, 100), inHeader: !!a.closest('header'), inFooter: !!a.closest('footer') })));
    log.modalText = await page.evaluate(() => document.querySelector('#modal-1473 .lqd-modal-content')?.innerText.trim());
    const trig = page.locator('a[href="#modal-1473"]').first();
    if (await trig.count()) { await trig.scrollIntoViewIfNeeded(); await trig.click({ force: true }); await page.waitForTimeout(1500); await shot(page, 'modal-1440'); await page.keyboard.press('Escape'); await page.waitForTimeout(800); }
  });
  await step('animations', async () => {
    log.animated = await page.evaluate(() => {
      const r = [];
      document.querySelectorAll('[data-custom-animations],[data-split-text],[data-parallax],[data-ca-options],[data-reveal],[data-lqd-mi],[data-moving-get-options],[data-inview],[data-hover3d],.lqd-highlight,[data-scroll-based],[data-typewriter]').forEach(el => {
        r.push({ el: el.tagName.toLowerCase() + '.' + String(el.className).split(/\s+/).slice(0, 3).join('.'), text: (el.innerText || '').trim().slice(0, 60), attrs: [...el.attributes].filter(a => /^data-(custom|ca|split|parallax|reveal|lqd|moving|inview|hover3d|scroll|typewriter|delay|transition)/.test(a.name)).map(a => `${a.name}=${a.value.slice(0, 600)}`) });
      });
      return r;
    });
  });
  await ctx.close();
}

// ---------- Hero (Revolution Slider) en frames
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://cloudin.pro/', { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: HIDE_CHAT }).catch(() => {});
  for (const t of [500, 1500, 3000, 5000, 8000, 12000]) { await page.waitForTimeout(t === 500 ? 500 : 1500 + (t > 3000 ? 1000 : 0)); await shot(page, `hero-t${t}-1440`); }
  log.revslider = await page.evaluate(() => [...document.querySelectorAll('rs-layer, rs-slide')].map(l => ({ tag: l.tagName, id: l.id, text: l.innerText?.trim().slice(0, 80), frames: l.getAttribute('data-frame_0') || l.getAttribute('data-frame_1') ? { f0: l.getAttribute('data-frame_0'), f1: l.getAttribute('data-frame_1'), f999: l.getAttribute('data-frame_999') } : undefined, typewriter: l.getAttribute('data-typewriter') || undefined, loop: l.getAttribute('data-loop_0') ? [l.getAttribute('data-loop_0'), l.getAttribute('data-loop_999')] : undefined })));
  await ctx.close();
}

// ---------- Móvil 390
{
  const { ctx, page } = await open(390, 844);
  await step('mobile-header', async () => {
    await shot(page, 'mobile-header-390');
    await page.locator('button.navbar-toggle').first().click(); await page.waitForTimeout(1200);
    await shot(page, 'mobile-menu-open-390', { fullPage: false });
    log.mobileMenu = await txt(page, '#lqd-mobile-sec .navbar-collapse, .lqd-mobile-sec .navbar-collapse');
    log.mobileMenuStyle = await page.evaluate(() => { const c = document.querySelector('.lqd-mobile-sec .navbar-collapse'); if (!c) return null; const cs = getComputedStyle(c); return { bg: cs.backgroundColor, transition: cs.transition, height: c.getBoundingClientRect().height, cls: c.className }; });
    const exp = page.locator('.lqd-mobile-sec .submenu-expander').first();
    if (await exp.count()) { await exp.click(); await page.waitForTimeout(900); await shot(page, 'mobile-submenu-open-390', { fullPage: false }); }
  });
  await ctx.close();
}
{
  const { ctx, page } = await open(1024, 900);
  await step('tablet-header', async () => { await shot(page, 'header-1024', { clip: { x: 0, y: 0, width: 1024, height: 200 } }); await page.locator('button.navbar-toggle').first().click().catch(() => {}); await page.waitForTimeout(1200); await shot(page, 'tablet-menu-open-1024'); });
  await ctx.close();
}
// Chat widget tal cual (para documentar)
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://cloudin.pro/', { waitUntil: 'networkidle' }); await page.waitForTimeout(6000);
  await shot(page, 'chat-widget-1440');
  log.chat = await page.evaluate(() => document.querySelector('.sb-main')?.innerText.trim().slice(0, 600));
  await ctx.close();
}
await browser.close();
await fs.writeFile(path.join(OUT, 'interactions.json'), JSON.stringify(log, null, 1));
console.log('DONE');
