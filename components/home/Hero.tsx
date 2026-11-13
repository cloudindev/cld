// Hero «DIGITALIZA TU NEGOCIO AHORA» (RevSlider slider-15 en el original), sin librerías:
// capas posicionadas con las coordenadas medidas por ancho de referencia y animaciones CSS.
import Image from 'next/image';
import { hero, type Box, type HeroLevel } from '@/content/home';
import { Typewriter } from './Typewriter';
import { HeroButton } from './HeroButton';
import s from './Hero.module.css';

const PHOTO_ORDER = ['man', 'dog', 'plant', 'woman'] as const;
// Rango de viewport donde aplica cada nivel medido (niveles de RevSlider 1240/1024/778/480).
const RANGES: Record<number, string> = {
  1440: '(min-width: 1240px)',
  1024: '(min-width: 1024px) and (max-width: 1239px)',
  768: '(min-width: 768px) and (max-width: 1023px)',
  390: '(max-width: 767px)',
};

const px = (n: number) => `${+n.toFixed(2)}px`;
const left = (x: number, vw: number) => `calc(50% + ${px(x - vw / 2)})`;
const pos = (sel: string, b: Box, vw: number, extra = '') =>
  `${sel}{left:${left(b.x, vw)};top:${px(b.y)};${b.w != null ? `width:${px(b.w)};` : ''}${b.h != null ? `height:${px(b.h)};` : ''}${extra}}`;

function levelCss(l: HeroLevel) {
  const H = `.${s.hero}`;
  const r: string[] = [];
  r.push(`${H}{height:${px(l.height)}}`);
  r.push(pos(`${H} .${s.title}`, l.title, l.vw, `font-size:${px(l.title.fs)};line-height:${px(l.title.lh)};`));
  r.push(pos(`${H} .${s.ahora}`, l.ahora, l.vw, `font-size:${px(l.ahora.fs)};line-height:${px(l.ahora.lh)};padding:${l.ahora.pad};`));
  r.push(pos(`${H} .${s.desc}`, l.desc, l.vw, `font-size:${px(l.desc.fs)};line-height:${px(l.desc.lh)};`));
  r.push(pos(`${H} .${s.monster}`, l.monster, l.vw));
  for (const k of PHOTO_ORDER) r.push(pos(`${H} [data-photo="${k}"]`, { ...l.photos[k], w: l.photoSize, h: l.photoSize }, l.vw));
  if (l.outlines) {
    for (const [k, b] of Object.entries(l.outlines)) r.push(pos(`${H} [data-outline="${k}"]`, { ...b, w: l.photoSize, h: l.photoSize }, l.vw, 'display:block;'));
  } else r.push(`${H} [data-outline]{display:none}`);
  for (const k of ['man', 'dog', 'woman'] as const) {
    r.push(pos(`${H} [data-pill="${k}"]`, l.pills[k], l.vw, `font-size:${px(l.pills.fs)};line-height:${px(l.pills.lh)};padding:0 ${px(l.pills.padX)};`));
  }
  if (l.box) {
    r.push(`${H} .${s.box}{display:block}`);
    r.push(pos(`${H} .${s.boxBg}`, l.box.bg, l.vw));
    r.push(pos(`${H} .${s.dot}`, { ...l.box.dot, h: l.box.dot.w }, l.vw));
    r.push(pos(`${H} .${s.boxText}`, l.box.text, l.vw, `font-size:${px(l.box.text.fs)};line-height:${px(l.box.text.lh)};`));
    r.push(pos(`${H} .${s.boxButton}`, l.box.button, l.vw, `font-size:${px(l.box.button.fs)};line-height:${px(l.box.button.lh)};padding:0 ${px(l.box.button.padX)};`));
  } else r.push(`${H} .${s.box}{display:none}`);
  return `@media ${RANGES[l.vw]}{${r.join('')}}`;
}

const CSS = hero.levels.map(levelCss).join('\n');

const outlineRadius: Record<string, 'top' | 'bottom'> = { a: 'top', b: 'bottom', c: 'bottom', d: 'top' };

export function Hero() {
  return (
    <div className={s.wrap}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={s.hero} data-hero>
        <div className={s.title}>{hero.title[0]}<br />{hero.title[1]}</div>
        <div className={s.ahora}>{hero.highlight}</div>
        <p className={s.desc}>{hero.description}</p>

        {Object.entries(outlineRadius).map(([k, r]) => (
          <span key={k} data-outline={k} className={`${s.outline} ${r === 'top' ? s.rTop : s.rBottom}`} aria-hidden="true" />
        ))}
        {PHOTO_ORDER.map((k, i) => (
          <div key={k} data-photo={k} className={`${s.photo} ${k === 'man' || k === 'dog' ? s.rTop : s.rBottom}`} style={{ ['--d' as string]: `${0.15 * i}s` }}>
            <span className={s.photoBg} style={{ backgroundImage: `url(${hero.photos[k].src})`, backgroundSize: hero.photos[k].size }} />
          </div>
        ))}
        {(['man', 'dog', 'woman'] as const).map((k, i) => (
          <div key={k} data-pill={k} className={s.pill} style={{ ['--d' as string]: `${1 + 0.5 * i}s` }}>
            <Typewriter texts={hero.pills[k]} startDelay={1000 + 500 * i} />
          </div>
        ))}

        <div className={s.box}>
          <span className={s.boxBg} />
          <span className={s.dot} />
          <span className={s.boxText}>{hero.boxText}</span>
          <HeroButton className={s.boxButton} label={hero.boxButton} />
        </div>
        <Image className={s.monster} src={hero.monster} alt="" width={745} height={991} priority />
      </div>
    </div>
  );
}
