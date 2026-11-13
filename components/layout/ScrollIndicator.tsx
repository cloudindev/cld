'use client';
// Indicador «scroll» fijo a la derecha (≥1200px): el punto avanza por la línea según el scroll.
import { useEffect, useRef } from 'react';
import s from './ScrollIndicator.module.css';

export function ScrollIndicator() {
  const dot = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (dot.current) dot.current.style.transform = `translateY(${(p * 60).toFixed(2)}px)`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className={s.wrap}>
      <a href="#wrap" className={s.link}>
        <span className={s.txt}>scroll</span>
        <span className={s.line}><span ref={dot} className={s.dot} /></span>
      </a>
    </div>
  );
}
