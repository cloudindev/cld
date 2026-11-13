'use client';
// Animaciones de entrada al hacer scroll (equivalente a las «custom animations» GSAP del tema):
// cualquier elemento con [data-reveal] recibe .is-in al entrar en el viewport.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)')];
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }, { rootMargin: '0px 0px -10% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
