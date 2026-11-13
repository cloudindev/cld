'use client';
// Formulario de acceso al área de cliente. El envío pasa por submitLogin() (TODO: backend).
import { useState, type FormEvent } from 'react';
import { login as c } from '@/content/global';
import { submitLogin } from '@/lib/submitLogin';
import s from './Login.module.css';

export function LoginForm() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(null);
    const r = await submitLogin({ email: String(f.get('email') ?? ''), password: String(f.get('password') ?? ''), remember: f.get('remember') === 'on' });
    setBusy(false);
    if (r.ok) window.location.assign(r.redirect); else setError(r.message);
  }

  return (
    <form className={s.form} onSubmit={onSubmit} noValidate={false}>
      <label className={s.field}>
        <span className={s.label}>{c.email}</span>
        <input className={s.input} type="email" name="email" autoComplete="username" placeholder={c.emailPlaceholder} required />
      </label>
      <label className={s.field}>
        <span className={s.labelRow}>
          <span className={s.label}>{c.password}</span>
          <a className={s.forgot} href={c.forgot.href}>{c.forgot.label}</a>
        </span>
        <span className={s.pwd}>
          <input className={s.input} type={show ? 'text' : 'password'} name="password" autoComplete="current-password" required />
          <button type="button" className={s.show} onClick={() => setShow(v => !v)} aria-pressed={show}>{show ? c.hide : c.show}</button>
        </span>
      </label>
      <label className={s.check}>
        <input type="checkbox" name="remember" /> <span>{c.remember}</span>
      </label>
      {error && (
        <p className={s.error} role="alert">
          {error} <a href={c.panel.href}>{c.panel.label}</a>
        </p>
      )}
      <button className={s.submit} type="submit" disabled={busy}>{busy ? c.sending : c.submit}</button>
    </form>
  );
}
