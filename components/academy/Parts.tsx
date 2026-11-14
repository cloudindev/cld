// Piezas comunes de Academy: raya de colores, migas de pan con buscador, buscador grande,
// «Lo más buscado» y el bloque de contacto «¿No lo encuentras?».
import Link from 'next/link';
import { datos } from '@/content/academy/datos';
import { masBuscado } from '@/content/academy/categorias';
import { Arrow } from './Icons';
import { SearchForm } from './SearchForm';
import a from './Academy.module.css';

export { SearchForm };
const searchHref = (q: string) => `/academy/buscar/?q=${encodeURIComponent(q)}`;

export const Line = ({ className = '' }: { className?: string }) => (
  <div className={`${a.line} ${className}`} aria-hidden="true"><span /><span /><span /><span /><span /><span /></div>
);

export function Popular({ className = '' }: { className?: string }) {
  return (
    <div className={`${a.popular} ${className}`}>
      <span className={a.popularLabel}>Lo más buscado:</span>
      <ul>
        {masBuscado.map(t => <li key={t.q}><Link href={searchHref(t.q)} className={a.chip}>{t.label}</Link></li>)}
      </ul>
    </div>
  );
}

export type Crumb = { label: string; href?: string };

/** Barra superior de las páginas interiores: migas de pan + buscador */
export function Topbar({ crumbs, search = true }: { crumbs: Crumb[]; search?: boolean }) {
  return (
    <div className={`${a.wrap} ${a.topbar}`}>
      <nav aria-label="Migas de pan">
        <ol className={a.crumbs}>
          {crumbs.map((c, i) => (
            <li key={c.label}>
              {c.href && i < crumbs.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      {search && <SearchForm variant="pill" id="buscar-ayuda" />}
    </div>
  );
}

/** Título de tarjeta con flecha: la última palabra y la flecha no se separan */
const WithArrow = ({ text }: { text: string }) => {
  const i = text.lastIndexOf(' ');
  return <>{text.slice(0, i + 1)}<span className={a.nowrap}>{text.slice(i + 1)}&nbsp;<Arrow size={16} /></span></>;
};

/** «¿No lo encuentras?»: ticket, teléfono y tutoriales */
export function HelpContact() {
  return (
    <section className={`${a.wrap} ${a.contact}`} aria-labelledby="no-lo-encuentras">
      <h2 id="no-lo-encuentras" className={a.contactTitle}><small>¿No lo</small> encuentras?</h2>
      <p className={a.contactText}>Cuéntanos qué necesitas y te responde una persona del equipo.</p>
      <ul className={a.contactGrid}>
        <li>
          <a href={datos.ticket} target="_blank" rel="noopener nofollow" className={`${a.contactCard} ${a.contactDark}`}>
            <span className={a.eyebrow}>Ticket</span>
            <strong><WithArrow text="Abrir un ticket de soporte" /></strong>
            <span>La vía más rápida: llega directo al equipo técnico.</span>
          </a>
        </li>
        <li>
          <a href={datos.telefonoHref} className={a.contactCard}>
            <span className={a.eyebrow}>Teléfono gratuito</span>
            <strong>{datos.telefono}</strong>
            <span>{datos.horario}</span>
          </a>
        </li>
        <li>
          <Link href="/blog/" className={a.contactCard}>
            <span className={a.eyebrow}>Academy</span>
            <strong><WithArrow text="Tutoriales en Cloudin Academy" /></strong>
            <span>Para aprender a fondo, a tu ritmo.</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
