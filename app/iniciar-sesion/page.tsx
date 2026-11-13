// /iniciar-sesion/ · pantalla de acceso al área de cliente (añadida; no existe en el original).
import type { Metadata } from 'next';
import { login as c } from '@/content/global';
import { LoginForm } from '@/components/login/LoginForm';
import { JellyCloud } from '@/components/home/JellyCloud';
import s from '@/components/login/Login.module.css';

export const metadata: Metadata = {
  title: { absolute: 'Iniciar sesión | Cloudin' },
  description: c.text,
  robots: { index: false, follow: true },
  alternates: { canonical: '/iniciar-sesion/' },
};

export default function LoginPage() {
  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <aside className={s.aside} aria-hidden="true">
          <JellyCloud alt="" className={s.cloud} />
          <p className={s.asideTitle}>CLOUDIN</p>
          <p className={s.asideText}>{c.text}</p>
        </aside>
        <section className={s.card}>
          <h1 className={s.title}>{c.title}</h1>
          <p className={s.text}>{c.text}</p>
          <LoginForm />
          <p className={s.foot}>
            {c.noAccount} <a href={c.register.href}>{c.register.label}</a><br />
            {c.help.text} <a href={c.help.href}>{c.help.label}</a>
          </p>
        </section>
      </div>
    </div>
  );
}
