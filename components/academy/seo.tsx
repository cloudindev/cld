// Metadatos y datos estructurados de Academy (las páginas son nuevas: no salen de content/seo.json).
import type { Metadata } from 'next';
import { SITE } from '@/content/academy';

type Meta = { path: string; title: string; description: string; modified?: string; noindex?: boolean };

export function academyMeta({ path, title, description, modified, noindex }: Meta): Metadata {
  const url = `${SITE}${path}`;
  const og = { locale: 'es_ES', title, description, url, siteName: 'Cloudin' };
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    openGraph: modified ? { ...og, type: 'article', modifiedTime: `${modified}T00:00:00+00:00` } : { ...og, type: 'website' },
  };
}

export function JsonLd({ data }: { data: object }) {
  // «<» escapado: el JSON va dentro de un <script>
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

export const breadcrumbs = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${SITE}${it.path}` })),
});
