// /academy/<tema>/<guía>/ · una guía.
import { notFound } from 'next/navigation';
import { catBySlug, catHref, guia, guiaHref, guias, plain, SITE } from '@/content/academy';
import { GuidePage } from '@/components/academy/GuidePage';
import { academyMeta, breadcrumbs, JsonLd } from '@/components/academy/seo';

type Params = { params: Promise<{ categoria: string; guia: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => guias.map(g => ({ categoria: g.cat, guia: g.slug }));

export async function generateMetadata({ params }: Params) {
  const { categoria, guia: slug } = await params;
  const g = guia(categoria, slug);
  return g ? academyMeta({ path: guiaHref(g), title: `${g.title} | Cloudin Academy`, description: plain(g.summary), modified: g.updated }) : {};
}

export default async function Page({ params }: Params) {
  const { categoria, guia: slug } = await params;
  const g = guia(categoria, slug);
  if (!g) notFound();
  const c = catBySlug(g.cat);
  return (
    <>
      <JsonLd data={breadcrumbs([{ name: 'Centro de Ayuda', path: '/academy/' }, { name: c.name, path: catHref(c) }, { name: g.title, path: guiaHref(g) }])} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: g.title,
        description: plain(g.summary),
        inLanguage: 'es-ES',
        dateModified: g.updated,
        url: `${SITE}${guiaHref(g)}`,
        proficiencyLevel: g.level === 'avanzado' ? 'Expert' : 'Beginner',
        publisher: { '@type': 'Organization', name: 'Cloudin', url: SITE },
      }} />
      <GuidePage guide={g} />
    </>
  );
}
