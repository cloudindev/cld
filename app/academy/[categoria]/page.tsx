// /academy/<tema>/ · las guías de un tema.
import { notFound } from 'next/navigation';
import { categoria, categorias, catHref } from '@/content/academy';
import { CategoryPage } from '@/components/academy/CategoryPage';
import { academyMeta, breadcrumbs, JsonLd } from '@/components/academy/seo';

type Params = { params: Promise<{ categoria: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => categorias.map(c => ({ categoria: c.slug }));

export async function generateMetadata({ params }: Params) {
  const c = categoria((await params).categoria);
  return c ? academyMeta({ path: catHref(c), title: c.meta.title, description: c.meta.description }) : {};
}

export default async function Page({ params }: Params) {
  const c = categoria((await params).categoria);
  if (!c) notFound();
  return (
    <>
      <JsonLd data={breadcrumbs([{ name: 'Centro de Ayuda', path: '/academy/' }, { name: c.name, path: catHref(c) }])} />
      <CategoryPage cat={c} />
    </>
  );
}
