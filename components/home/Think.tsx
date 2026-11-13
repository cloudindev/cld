// «PIENSA COMO LOS GRANDES Y HAZLO REALIDAD» con partículas de fondo.
import { think } from '@/content/home';
import { Particles } from './Particles';
import s from './Think.module.css';

export function Think() {
  const [a, b, c] = think.lines;
  return (
    <section className={s.section}>
      <Particles className={s.canvas} />
      <div className={s.inner} data-reveal="up">
        <div className={s.line} style={{ ['--i' as string]: 0 }}><div className={s.dark}><h1 className={s.h84}>{a}</h1></div></div>
        <div className={s.line} style={{ ['--i' as string]: 1 }}><div className={s.plain}><h1 className={s.h78}>{b}</h1></div></div>
        <div className={s.line} style={{ ['--i' as string]: 2 }}><div className={s.dark}><h1 className={s.h83}>{c}</h1></div></div>
      </div>
      <div className={s.textWrap}>
        <div className={s.textPad} data-reveal="up">
          <p className={s.text} style={{ ['--i' as string]: 3 }}>{think.text}</p>
        </div>
      </div>
      <div className={s.bottomSpacer} />
    </section>
  );
}
