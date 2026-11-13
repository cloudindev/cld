'use client';
// Nube de gominola animada: el motor es public/jelly/jelly.js (el mismo que usa la demo /jelly/).
// Se carga en el navegador sin pasar por el bundler. Hasta entonces (o sin JS) se ven las imágenes estáticas.
import { useEffect, useRef } from 'react';
import '@/public/jelly/jelly.css';

type Jelly = { destroy(): void };
const ENGINE = '/jelly/jelly.js';

export function JellyCloud({ alt, className }: { alt: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let j: Jelly | undefined, cancelled = false;
    import(/* webpackIgnore: true */ ENGINE).then((m: { createJelly(el: HTMLElement): Jelly }) => {
      if (!cancelled && ref.current) j = m.createJelly(ref.current);
    }).catch(() => { /* sin motor: queda la imagen estática */ });
    return () => { cancelled = true; j?.destroy(); };
  }, []);
  return (
    <div ref={ref} className={`jelly ${className ?? ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- la <img> es la textura WebGL: debe ser el archivo original, sin optimizar */}
      <img className="jelly-shadow" src="/jelly/shadow.webp" alt="" width={900} height={548} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="jelly-img" src="/jelly/cloud.webp" alt={alt} width={900} height={548} />
    </div>
  );
}
