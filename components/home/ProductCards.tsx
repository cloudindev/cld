// Tarjetas CLOUD / HOSTING / DOMINIOS.
import Link from 'next/link';
import { productCards as c } from '@/content/home';
import s from './ProductCards.module.css';

export function ProductCards() {
  return (
    <section className={s.section}>
      <div className={s.colL}>
        <div className={`${s.card} ${s.cloud}`} style={{ backgroundImage: `url(${c.cloud.bg})` }}>
          <div className={s.cardInner}>
            <div className={s.fh}><h2 className={s.tCloud}>{c.cloud.title}</h2></div>
            <p className={s.text}>{c.cloud.text}</p>
            <div><Link className={`btn-sm ${s.r5}`} href={c.cloud.href}>{c.cloud.button}</Link></div>
          </div>
        </div>
      </div>
      <div className={s.colR}>
        <div className={`${s.card} ${s.small} ${s.hosting}`} style={{ backgroundImage: `url(${c.hosting.bg})` }}>
          <div className={s.cardInner}>
            <div className={`${s.fh} ${s.fhHosting}`}><h2 className={s.tHosting}>{c.hosting.title}</h2></div>
            <p className={s.text}>{c.hosting.text}</p>
            <div><Link className="btn-sm" href={c.hosting.href}>{c.hosting.button}</Link></div>
          </div>
        </div>
        <div className={s.gap} />
        <div className={`${s.card} ${s.small} ${s.domains}`} style={{ backgroundImage: `url(${c.domains.bg})` }}>
          <div className={s.cardInner}>
            <div className={s.fh}><h2 className={s.tDomains} aria-label={c.domains.title}>
              {[...c.domains.title].map((ch, i) => <span key={i} aria-hidden="true">{ch}</span>)}
            </h2></div>
            <p className={s.text}>{c.domains.text}</p>
            <div><Link className="btn-sm" href={c.domains.href}>{c.domains.button}</Link></div>
          </div>
        </div>
      </div>
    </section>
  );
}
