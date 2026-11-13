'use client';
// Pieza de gominola animada: el motor es public/jelly/jelly.js (el mismo que usa la demo /jelly/).
// Se carga en el navegador sin pasar por el bundler. Hasta entonces (o sin JS) se ven las imágenes estáticas.
import { useEffect, useRef, type CSSProperties } from 'react';
import '@/public/jelly/jelly.css';

type Jelly = { destroy(): void; reset(): void };
const ENGINE = '/jelly/jelly.js';

/** Imágenes disponibles en public/jelly (recorte con alfa + sombra «multiply» opcional del mismo tamaño). */
export const JELLY: Record<'cloud' | 'web', { src: string; shadow: string | null; width: number; height: number }> = {
  cloud: { src: '/jelly/cloud.webp', shadow: null, width: 900, height: 654 }, // sin sombra (a petición del cliente)
  web: { src: '/jelly/web.webp', shadow: '/jelly/web-shadow.webp', width: 900, height: 513 },
};

/** `reset`: cada vez que cambia, la pieza vuelve a su sitio (si se había arrastrado). */
export function JellyCloud({ alt, className, image = 'cloud', reset = 0 }: { alt: string; className?: string; image?: keyof typeof JELLY; reset?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const jelly = useRef<Jelly | undefined>(undefined);
  const im = JELLY[image];
  useEffect(() => {
    let j: Jelly | undefined, cancelled = false;
    import(/* webpackIgnore: true */ ENGINE).then((m: { createJelly(el: HTMLElement): Jelly }) => {
      if (!cancelled && ref.current) jelly.current = j = m.createJelly(ref.current);
    }).catch(() => { /* sin motor: queda la imagen estática */ });
    return () => { cancelled = true; j?.destroy(); jelly.current = undefined; };
  }, [image]);
  useEffect(() => { if (reset) jelly.current?.reset(); }, [reset]);
  // --jr = alto/ancho: lo usa el CSS de la página para centrar sin transform (ver NOTAS.md, punto 34)
  const style = { aspectRatio: `${im.width} / ${im.height}`, '--jr': im.height / im.width } as CSSProperties;
  return (
    <div ref={ref} className={`jelly ${className ?? ''}`} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element -- la <img> es la textura WebGL: debe ser el archivo original, sin optimizar */}
      <div className="jelly-body">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {im.shadow && <img className="jelly-shadow" src={im.shadow} alt="" width={im.width} height={im.height} />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="jelly-img" src={im.src} alt={alt} width={im.width} height={im.height} />
      </div>
    </div>
  );
}
