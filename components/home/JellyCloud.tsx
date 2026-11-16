'use client';
// Pieza de gominola. Motor 3D con física de sólido blando (public/jelly/jelly3d.js, WebGL2); si no hay
// WebGL2 se usa el motor 2D sobre la foto recortada (public/jelly/jelly.js). Ambos se cargan en el
// navegador sin pasar por el bundler. Hasta entonces (o sin JS) se ve la imagen estática.
import { useEffect, useRef, type CSSProperties } from 'react';
import '@/public/jelly/jelly.css';

type Jelly = { destroy(): void; reset(): void; hop?(): void };
const ENGINE_3D = '/jelly/jelly3d.js';
const ENGINE_2D = '/jelly/jelly.js';

/** Imágenes de public/jelly (recorte con alfa + sombra «multiply» opcional) y su forma 3D equivalente. */
export const JELLY: Record<'cloud' | 'web', { src: string; shadow: string | null; width: number; height: number; shape: 'cloud' | 'web' }> = {
  cloud: { src: '/jelly/cloud.webp', shadow: null, width: 900, height: 654, shape: 'cloud' },
  web: { src: '/jelly/web.webp', shadow: '/jelly/web-shadow.webp', width: 900, height: 513, shape: 'web' },
};

/** `reset`: cada vez que cambia, la pieza vuelve a su sitio (si se había arrastrado).
 *  `hop`: cada vez que cambia, la pieza da un rebote (saludo al llegar el ratón a su tarjeta; el motor lo ignora
 *  mientras se juega con ella). */
export function JellyCloud({ alt, className, image = 'cloud', reset = 0, hop = 0 }: { alt: string; className?: string; image?: keyof typeof JELLY; reset?: number; hop?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const jelly = useRef<Jelly | undefined>(undefined);
  const im = JELLY[image];
  useEffect(() => {
    let j: Jelly | undefined, cancelled = false;
    const run = async () => {
      try {
        const m = (await import(/* webpackIgnore: true */ ENGINE_3D)) as { createJelly3D(el: HTMLElement, o: { shape: string }): Jelly | null };
        if (cancelled || !ref.current) return;
        j = m.createJelly3D(ref.current, { shape: im.shape }) ?? undefined;
      } catch { /* sin motor 3D */ }
      if (!j) {
        try {
          const m = (await import(/* webpackIgnore: true */ ENGINE_2D)) as { createJelly(el: HTMLElement): Jelly };
          if (cancelled || !ref.current) return;
          j = m.createJelly(ref.current);
        } catch { /* sin motor: queda la imagen estática */ }
      }
      jelly.current = j;
    };
    // Construir la malla y asentarla tarda ~0,3 s: se hace fuera del primer pintado
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const id = w.requestIdleCallback ? w.requestIdleCallback(run, { timeout: 1500 }) : window.setTimeout(run, 150);
    return () => {
      cancelled = true;
      if (w.cancelIdleCallback) w.cancelIdleCallback(id); else window.clearTimeout(id);
      j?.destroy(); jelly.current = undefined;
    };
  }, [image, im.shape]);
  useEffect(() => { if (reset) jelly.current?.reset(); }, [reset]);
  useEffect(() => { if (hop) jelly.current?.hop?.(); }, [hop]);
  // --jr = alto/ancho: lo usa el CSS de la página para centrar sin transform (ver NOTAS.md, punto 34)
  const style = { aspectRatio: `${im.width} / ${im.height}`, '--jr': im.height / im.width } as CSSProperties;
  return (
    <div ref={ref} className={`jelly ${className ?? ''}`} style={style}>
      <div className="jelly-body">
        {/* eslint-disable-next-line @next/next/no-img-element -- la <img> es la textura WebGL: debe ser el archivo original, sin optimizar */}
        {im.shadow && <img className="jelly-shadow" src={im.shadow} alt="" width={im.width} height={im.height} />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="jelly-img" src={im.src} alt={alt} width={im.width} height={im.height} />
      </div>
    </div>
  );
}
