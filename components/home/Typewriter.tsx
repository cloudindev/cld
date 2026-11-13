'use client';
// Efecto máquina de escribir de las pastillas del hero (RsTypewriterAddOn en el original):
// escribe 30 ms/carácter, espera 1000 ms, borra a 20 ms/carácter y pasa al siguiente texto, en bucle.
import { useEffect, useState } from 'react';

const TYPE_MS = 30;
const DELETE_MS = 20;
const HOLD_MS = 1000;

export function Typewriter({ texts, startDelay }: { texts: readonly string[]; startDelay: number }) {
  const [shown, setShown] = useState(texts[0] ?? '');
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let t: ReturnType<typeof setTimeout>;
    let idx = 0;
    let len = 0;
    let deleting = false;
    setShown('');
    const tick = () => {
      const full = texts[idx] ?? '';
      if (!deleting) {
        len++;
        setShown(full.slice(0, len));
        if (len >= full.length) { deleting = true; t = setTimeout(tick, HOLD_MS); return; }
        t = setTimeout(tick, TYPE_MS);
      } else {
        len--;
        setShown(full.slice(0, Math.max(0, len)));
        if (len <= 0) { deleting = false; idx = (idx + 1) % texts.length; }
        t = setTimeout(tick, DELETE_MS);
      }
    };
    t = setTimeout(tick, startDelay);
    return () => clearTimeout(t);
  }, [texts, startDelay]);
  return <span aria-label={texts.join(' / ')}>{shown}</span>;
}
