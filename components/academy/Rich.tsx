// Texto de las guías con sus marcas: **negrita**, `código`, [texto](enlace) y {dato} (ver content/academy/types.ts).
import Link from 'next/link';
import { Fragment } from 'react';
import { datos } from '@/content/academy';

const TOKEN = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\{(\w+)\}/g;
const value = (k: string) => (Object.hasOwn(datos, k) ? datos[k as keyof typeof datos] : `{${k}}`);

function A({ href, children }: { href: string; children: React.ReactNode }) {
  if (href.startsWith('/')) return <Link href={href}>{children}</Link>;
  if (/^https?:/.test(href)) return <a href={href} target="_blank" rel="noopener nofollow">{children}</a>;
  return <a href={href}>{children}</a>;
}

export function Rich({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0, i = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, bold, code, label, href, dato] = m;
    const key = i++;
    if (bold !== undefined) out.push(<strong key={key}><Rich text={bold} /></strong>);
    else if (code !== undefined) out.push(<code key={key}>{code}</code>);
    else if (label !== undefined && href !== undefined) out.push(<A key={key} href={href.replace(/^\{(\w+)\}$/, (_, k: string) => value(k))}><Rich text={label} /></A>);
    else if (dato !== undefined) out.push(<span key={key} data-dato={dato}>{value(dato)}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <Fragment>{out}</Fragment>;
}
