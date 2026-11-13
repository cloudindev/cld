// Cabecera de «Casos de éxito» (#portfolio, destino del enlace «Casos de éxito» del menú).
import { portfolio } from '@/content/home';
import { Portfolio } from './Portfolio';
import s from './PortfolioHead.module.css';

export function PortfolioSection() {
  return (
    <>
      <div className={s.spacer} />
      <section id="portfolio" className={s.head}>
        <div className={s.col}>
          <h6 className={s.eyebrow}>{portfolio.eyebrow}</h6>
          <h2 className={s.title}>{portfolio.title[0]}<br />{portfolio.title[1]}<br />{portfolio.title[2]}</h2>
        </div>
      </section>
      <section className={s.carousel}>
        <Portfolio />
      </section>
      <div className={s.after} />
    </>
  );
}
