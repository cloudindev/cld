// /blog/author/breno/ redirige a la home en el original (301). Con output: 'export' no hay redirecciones de
// servidor: se sirve una página con meta refresh y canonical a la home. Regla 301 recomendada en README.md.
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: { absolute: 'Cloudin' },
  alternates: { canonical: 'https://cloudin.pro/' },
  robots: { index: false, follow: true },
};

export default function AuthorRedirect() {
  return (
    <>
      <meta httpEquiv="refresh" content="0;url=/" />
      <p style={{ padding: '40px 20px' }}><Link href="/">cloudin.pro</Link></p>
    </>
  );
}
