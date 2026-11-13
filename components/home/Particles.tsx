'use client';
// Partículas de fondo tras «PIENSA…» (particles.js en el original): 5 formas de tamaño 5 en los
// colores del original, opacidad 1, movimiento aleatorio continuo. Lienzo propio, sin librería.
import { useEffect, useRef } from 'react';

const COLORS = ['#69DCDD', '#6AE7D0', '#7FEFBB', '#CBF987', '#F9F871'];
const SHAPES = ['circle', 'edge', 'triangle', 'polygon', 'circle'] as const;

export function Particles({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0;
    const resize = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight; };
    resize();
    const ps = SHAPES.map((shape, i) => ({
      shape, color: COLORS[i]!, r: 5,
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        if (!reduce) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        if (p.shape === 'circle') ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        else if (p.shape === 'edge') ctx.rect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        else {
          const n = p.shape === 'triangle' ? 3 : 5;
          for (let k = 0; k < n; k++) {
            const a = -Math.PI / 2 + (k * 2 * Math.PI) / n;
            const px = p.x + p.r * 1.3 * Math.cos(a), py = p.y + p.r * 1.3 * Math.sin(a);
            if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
          }
          ctx.closePath();
        }
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
