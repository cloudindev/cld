// Buscador de dominios: formulario POST (target _blank) a panel.cloudin.pro, igual que el original.
// En el original hay dos variantes (escritorio/tablet y móvil); aquí es un único formulario con CSS responsive.
import { domainSearch } from '@/content/home';
import s from './DomainSearch.module.css';

export function DomainSearch() {
  return (
    <section className={s.section} aria-label="Buscar dominio">
      <div className={s.box}>
        <form className={s.form} action={domainSearch.action} method="post" target="_blank">
          <input className={s.input} type="text" name="query" size={20} placeholder={domainSearch.placeholder} aria-label="Dominio" />{' '}
          <input className={s.submit} type="submit" value={domainSearch.submit} />
        </form>
      </div>
    </section>
  );
}
