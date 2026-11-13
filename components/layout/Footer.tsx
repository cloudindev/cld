// Footer común a todas las páginas. Textos en content/global.ts.
import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import { footer } from '@/content/global';
import { Instagram, Linkedin } from './icons';
import s from './Footer.module.css';

const isExternal = (href: string) => /^https?:/.test(href);

function ExpanderIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="32" viewBox="0 0 21 32" aria-hidden="true"><path fill="currentColor" d="M10.5 18.375l7.938-7.938c.562-.562 1.562-.562 2.125 0s.562 1.563 0 2.126l-9 9c-.563.562-1.5.625-2.063.062L.437 12.562C.126 12.25 0 11.876 0 11.5s.125-.75.438-1.063c.562-.562 1.562-.562 2.124 0z" /></svg>
  );
}

export function Footer() {
  return (
    <footer id="footer" className={s.footer}>
      {/* Logo + menú superior */}
      <div className={`${s.row} ${s.row1}`}>
        <div className={s.r1Logo}>
          <Image src={footer.logo.src} alt={footer.logo.alt} width={120} height={29} />
        </div>
        <ul className={s.r1Menu}>
          {footer.topMenu.map(l => (
            <li key={l.label}>
              {l.external ? <a href={l.href} target="_blank" rel={l.rel}>{l.label}</a> : <Link href={l.href}>{l.label}</Link>}
            </li>
          ))}
        </ul>
      </div>

      {/* Cambiar región · IVA · teléfono */}
      <div className={`${s.row} ${s.row2}`}>
        <div className={s.col}>
          <div className={s.region}>
            <a href="#" className={s.regionLink} aria-haspopup="true">
              {footer.region.label}
              <span className={s.regionIcon}><i className="icn icn-arrow-down" /></span>
            </a>
            <span className={s.expander} aria-hidden="true"><ExpanderIcon /></span>
            <div className={s.regionPanel}>
              {footer.region.items.map(r => (
                <div key={r.label} className={s.regionItem}>
                  <Image src={r.flag} alt={r.label} width={40} height={40} />
                  <h3>{r.label}</h3>
                  {/* target malformado del original conservado (ver NOTAS.md) */}
                  <a href="#" target={r.target} rel={r.rel} aria-label={r.label} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={`${s.col} ${s.contact}`}>
          <div className={s.vatWrap}><p className={s.vat}>{footer.vat}</p></div>
          <div className={s.eyebrowWrap}><h6 className={s.eyebrow}>{footer.helpEyebrow}</h6></div>
          <div className={s.fhPhone}><h5 className={s.phoneH}><a href={footer.phone.href}>{footer.phone.label}</a></h5></div>
        </div>
      </div>

      <div className={`${s.row} ${s.dividerRow} ${s.dividerTop}`}><hr className={s.hrStrong} /></div>

      {/* Copyright, aviso de operación, legales y redes */}
      <div className={`${s.row} ${s.row4}`}>
        <div className={s.r4Main}>
          <div className={s.fh}><p className={s.copyright}>{footer.copyright}</p></div>
          <div className={s.operatedWrap}><p className={s.operated}>{footer.operatedBy}</p></div>
          <div className={s.legalWrap}>
            <p className={s.legal}>
              {footer.legal.map((l, i) => (
                <Fragment key={l.href}>
                  {i > 0 && ' - '}
                  <Link href={l.href}>
                    {l.tooltip ? (
                      <span className={s.tooltip}>
                        {l.label}
                        <span className={s.tooltipBox} role="tooltip"><strong>{footer.cookiesTooltip.title}</strong> {footer.cookiesTooltip.text}</span>
                      </span>
                    ) : l.label}
                  </Link>
                </Fragment>
              ))}
            </p>
          </div>
        </div>
        <div className={s.r4Social}>
          <ul>
            {footer.social.map(n => (
              <li key={n.label}>
                <a href={n.href} target="_blank" aria-label={n.label}>
                  {n.icon === 'instagram' ? <Instagram /> : <Linkedin />}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`${s.row} ${s.dividerRow}`}><hr className={s.hrSoft} /></div>

      {/* Propósito + 3 columnas de enlaces */}
      <div className={`${s.row} ${s.row6}`}>
        <div className={s.c1}><p className={s.purpose}>{footer.purpose}</p></div>
        {footer.columns.map((c, i) => (
          <div key={c.title} className={[s.c2, s.c3, s.c4][i]}>
            <div className={s.colTitleWrap}><h5 className={s.colTitle}>{c.title}</h5></div>
            <ul className={s.colMenu}>
              {c.links.map(l => (
                <li key={l.href}>{isExternal(l.href) ? <a href={l.href}>{l.label}</a> : <Link href={l.href}>{l.label}</Link>}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={`${s.row} ${s.dividerRow}`}><hr className={s.hrSoft} /></div>
      <div className={s.bottomSpacer} />
    </footer>
  );
}
