// «Nos gusta ayudarte con tus nuevos proyectos».
import Link from 'next/link';
import { help } from '@/content/home';
import s from './Help.module.css';

export function Help() {
  return (
    <section className={s.section}>
      <div className={s.colL}>
        <div className={s.fh}><p className={s.person}><b>{help.name}</b><br />{help.role}</p></div>
        <div className={s.spacer} />
      </div>
      <div className={s.colR}>
        <div className={s.fh}><h2 className={s.title}>{help.title[0]}<br />{help.title[1]}</h2></div>
        <div className={s.fh}><p className={s.text}>{help.text} <br /><br />{help.text2}</p></div>
        <div className={s.spacer15} />
        <Link className={`btn-sm ${s.btn}`} href={help.button.href}>{help.button.label}</Link>
      </div>
    </section>
  );
}
