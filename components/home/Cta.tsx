'use client';
// CTA «Reinventa tu negocio. Te ayudamos en todo»: parallax y 100px / scale 1.2 → 0 / 1
// entre «top bottom» y «bottom-=650px top» (GSAP ScrollTrigger en el original).
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { cta } from '@/content/home';
import s from './Cta.module.css';

export function Cta() {
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { if (el) el.style.transform = 'none'; return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const top = el.parentElement!.getBoundingClientRect().top + 10;
      const h = el.offsetHeight;
      const p = Math.min(1, Math.max(0, (vh - top) / (vh - 650 + h)));
      el.style.transform = `translateY(${(100 * (1 - p)).toFixed(2)}px) scale(${(1.2 - 0.2 * p).toFixed(4)})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <section className={s.section}>
      <section id="download" ref={box} className={s.box}>
        <div className={s.colText} data-reveal="flip">
          <h2 className={s.title} style={{ ['--i' as string]: 0 }}>{cta.title[0]}<br />{cta.title[1]}</h2>
        </div>
        <div className={s.colBtn} data-reveal="flip">
          <div style={{ ['--i' as string]: 1 }}>
            <Link href={cta.button.href} className={`${s.btn} split-host`}>
              <span className={s.btnTxt}>{cta.button.label}</span>
              <span className={s.btnIcon}><i className="icn icn-md-arrow-forward" /></span>
            </Link>
          </div>
        </div>
      </section>
    </section>
  );
}
