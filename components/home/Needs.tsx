'use client';
// «¿Qué necesitas para tu empresa?»: pestañas accesibles (role=tablist) con fundido de 0,15 s.
import { useState, type KeyboardEvent } from 'react';
import { needs } from '@/content/home';
import s from './Needs.module.css';

export function Needs() {
  const [active, setActive] = useState(0);
  const onKey = (e: KeyboardEvent) => {
    const n = needs.tabs.length;
    if (e.key === 'ArrowRight') setActive(a => (a + 1) % n);
    else if (e.key === 'ArrowLeft') setActive(a => (a - 1 + n) % n);
  };
  return (
    <>
      <div className={s.head}>
        <h2 className={s.title}>{needs.title}</h2>
      </div>
      <div className={s.tabsWrap}>
        <nav className={s.nav}>
          <ul role="tablist" onKeyDown={onKey}>
            {needs.tabs.map((t, i) => (
              <li key={t.label}>
                <a
                  href={`#lqd-tab-${1421 + i}`}
                  role="tab"
                  id={`tab-${i}`}
                  aria-selected={active === i}
                  aria-controls={`lqd-tab-${1421 + i}`}
                  tabIndex={active === i ? 0 : -1}
                  className={active === i ? s.active : undefined}
                  onClick={e => { e.preventDefault(); setActive(i); }}
                >
                  <span>{t.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {needs.tabs.map((t, i) => (
          <div key={t.label} id={`lqd-tab-${1421 + i}`} role="tabpanel" aria-labelledby={`tab-${i}`} hidden={active !== i} className={s.pane}>
            <div
              className={s.panel}
              style={{ backgroundImage: `url(${t.bg.image})`, backgroundColor: t.bg.color, backgroundSize: t.bg.size, backgroundPosition: t.bg.position }}
            >
              <div className={s.left}><div className={s.spacer25} /></div>
              <div className={s.right}>
                <div className={s.card}>
                  <div className={s.tWrap}><h2 className={s.cardTitle} style={{ color: t.titleColor }}>{t.title}</h2></div>
                  <div className={s.pWrap}><h2 className={s.price}>{t.price}</h2></div>
                  <div className={s.spacer24} />
                  {t.paragraphs.map(p => (
                    <div key={p.slice(0, 20)} className={s.txtWrap}><p className={`${s.txt} ${t.justify ? s.justify : ''}`}>{p}</p></div>
                  ))}
                  <div className={s.spacer25} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
