'use client';
// Header común: barra promocional, barra principal con menú y megamenú Academy, header fijo al
// hacer scroll y header móvil (<1200px) con menú desplegable. Valores medidos en el original.
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { academyMenu, hostingMenu, logo, mainNav, topbar, uneteButton } from '@/content/global';
import { ArrowRight, ChevronRight } from './icons';
import { SplitText } from './SplitText';
import s from './Header.module.css';

function AcademyPanel({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={mobile ? s.academyMobile : s.megamenu}>
      {academyMenu.groups.map((g, gi) => (
        <div key={g.title} className={s.mmGroup}>
          {gi > 0 && <div className={s.mmDivider} aria-hidden="true"><span /></div>}
          <h2 className={s.mmTitle}>{g.title}</h2>
          <div className={`${s.mmRow} ${gi === 0 ? s.mmRowFirst : s.mmRowLast}`}>
            {g.items.map(it => (
              <div key={it.title} className={s.mmBox}>
                <Image className={s.mmIcon} src={it.icon} alt={it.title} width={49} height={49} />
                <div className={s.mmBody}>
                  <h3 className={s.mmHeading}>{it.title}</h3>
                  <p className={it.font === 'chivo' ? s.mmTextChivo : s.mmText}>{it.text}</p>
                </div>
                <a className={s.mmOverlay} href={it.href} target="_blank" aria-label={it.title} />
              </div>
            ))}
          </div>
        </div>
      ))}
      {!mobile && (
        <a className={`${s.mmButton} split-host`} href={academyMenu.button.href} target="_blank">
          <span className={s.mmButtonTxt}><SplitText text={academyMenu.button.label} reverse /></span>
          <span className={s.mmButtonIcon}><ArrowRight /></span>
        </a>
      )}
    </div>
  );
}

function HostingPanel({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  return (
    <div className={mobile ? s.hostingMobile : s.hostingMenu}>
      <div className={s.hmMain}>
        <h2 className={s.hmTitle}><span className={s.hmMark}>{hostingMenu.mainTitle}</span></h2>
        <ul>
          {hostingMenu.main.map(it => (
            <li key={it.title}>
              <Link href={it.href} onClick={onNavigate}>
                <span className={s.hmIcon}>{it.icon && <Image src={it.icon} alt="" width={49} height={49} />}</span>
                {it.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className={s.hmSpecial}>
      <h2 className={s.hmTitle}>{hostingMenu.specializedTitle}</h2>
      <ul>
        {hostingMenu.specialized.map(it => (
          <li key={it.title}>
            <Link href={it.href} onClick={onNavigate}>
              <span className={s.hmHeading}>{it.title}</span>
              <span className={s.hmText}>{it.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}

export function Header() {
  const [stuck, setStuck] = useState(false);
  const [placeholder, setPlaceholder] = useState<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [academyOpen, setAcademyOpen] = useState(false);
  const [hostingOpen, setHostingOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    // Solo el header de escritorio (≥1200px) se fija; se reserva su altura para que el contenido no salte.
    const desktop = window.matchMedia('(min-width: 1200px)');
    let natural = 0;
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      if (!el.classList.contains(s.isStuck!)) natural = el.offsetHeight;
      const st = desktop.matches && window.scrollY > natural;
      setStuck(st);
      setPlaceholder(st ? natural : undefined);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); (document.activeElement as HTMLElement | null)?.blur(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header id="header" ref={ref} className={`${s.header} ${stuck ? s.isStuck : ''}`} style={{ height: placeholder }}>
      {/* ---------- Escritorio (≥1200px) ---------- */}
      <div className={s.desktop}>
        <div className={s.topbar}>
          <div className={s.topbarRow}>
            <span className={s.topbarFigure}>
              <Image src={topbar.icon} alt="" width={18} height={18} />
            </span>
            <p className={s.topbarText}>{topbar.text}</p>
            <a className={`${s.topbarBtn} split-host`} href={topbar.button.href}>
              <span><SplitText text={topbar.button.label} /></span>
              <span className={s.topbarBtnIcon}><ChevronRight /></span>
            </a>
          </div>
        </div>
        <div className={s.barWrap}>
          <div className={s.bar}>
            <div className={s.barInner}>
              <Link href="/" className={s.brand}>
                <Image src={logo.src} alt={logo.alt} width={120} height={26} priority />
              </Link>
              <ul id="primary-nav" className={s.nav}>
                {mainNav.map(item => (
                  <li key={item.label} className={item.megamenu ? s.hasMega : item.submenu ? s.hasSub : undefined}>
                    {item.submenu ? (
                      <Link href={item.href} aria-haspopup="true">
                        {item.label}
                        <span className={s.navIcon}><i className="icn icn-arrow-down" /></span>
                      </Link>
                    ) : item.megamenu ? (
                      <a href={item.href} aria-haspopup="true" onClick={e => e.preventDefault()}>
                        {item.label}
                        <span className={s.navIcon}><i className="icn icn-arrow-down" /></span>
                      </a>
                    ) : (
                      <Link href={item.href}>
                        {item.label}
                        {item.badge && <span className={s.badge}>{item.badge}</span>}
                      </Link>
                    )}
                    {item.megamenu && <AcademyPanel />}
                    {item.submenu && <HostingPanel />}
                  </li>
                ))}
              </ul>
              <Link href={uneteButton.href} className={s.unete}>
                <span>{uneteButton.label}</span>
                <span className={s.uneteIcon}><ArrowRight /></span>
              </Link>
            </div>
          </div>
        </div>
        <div className={s.divider}><div /></div>
        <div className={s.spacer} />
      </div>

      {/* ---------- Móvil y tablet (<1200px) ---------- */}
      <div className={s.mobile}>
        <div className={s.mobileDivider} />
        <div className={s.mobileBar}>
          <Link href="/" className={s.mobileBrand}>
            <Image src={logo.src} alt={logo.alt} width={120} height={26} priority />
          </Link>
          <button type="button" className={`${s.toggle} ${open ? s.toggleOpen : ''}`} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(o => !o)}>
            <span className="sr-only">Toggle navigation</span>
            <span className={s.bars} aria-hidden="true"><span /><span /><span /></span>
          </button>
        </div>
        <nav id="mobile-nav" className={`${s.mobileNav} ${open ? s.mobileNavOpen : ''}`} aria-label="Menú principal">
          <ul>
            {mainNav.map(item => (
              <li key={item.label}>
                {item.submenu ? (
                  <>
                    <Link href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
                    <button type="button" className={s.expander} aria-expanded={hostingOpen} aria-label="Abrir submenú Hosting" onClick={() => setHostingOpen(o => !o)}>
                      <i className="icn icn-arrow-down" />
                    </button>
                    {hostingOpen && <HostingPanel mobile onNavigate={() => setOpen(false)} />}
                  </>
                ) : item.megamenu ? (
                  <>
                    <a href={item.href} onClick={e => { e.preventDefault(); setAcademyOpen(o => !o); }}>{item.label}</a>
                    <button type="button" className={s.expander} aria-expanded={academyOpen} aria-label="Abrir submenú Academy" onClick={() => setAcademyOpen(o => !o)}>
                      <i className="icn icn-arrow-down" />
                    </button>
                    {academyOpen && <AcademyPanel mobile />}
                  </>
                ) : (
                  <Link href={item.href} onClick={() => setOpen(false)}>
                    {item.label}
                    {item.badge && <span className={s.badge}>{item.badge}</span>}
                  </Link>
                )}
              </li>
            ))}
            <li>
              <Link href={uneteButton.href} onClick={() => setOpen(false)}>{uneteButton.label}</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
