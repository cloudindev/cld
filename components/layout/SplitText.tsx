// Texto partido en palabras y letras (equivalente al SplitText del tema) para la animación
// de hover letra a letra de los botones. Cada letra recibe su índice en --i (retardo escalonado).
import { Fragment } from 'react';

export function SplitText({ text, reverse = false }: { text: string; reverse?: boolean }) {
  const words = text.split(' ');
  const total = text.replace(/ /g, '').length;
  let n = 0;
  return (
    <span className="split" aria-label={text}>
      {words.map((w, wi) => (
        <Fragment key={wi}>
          <span className="split-word" aria-hidden="true">
            {[...w].map((ch, ci) => {
              const i = n++;
              return <span key={ci} className="split-char" style={{ ['--i' as string]: reverse ? total - 1 - i : i }}><span className="split-in" data-char={ch}>{ch}</span></span>;
            })}
          </span>
          {wi < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  );
}
