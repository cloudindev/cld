// Metadatos SEO literales del original (content/seo.json, generado desde el inventario).
import type { Metadata } from 'next';
import seoData from '@/content/seo.json';

type Seo = {
  slug: string; status: number; finalUrl: string; title: string; description: string | null;
  canonical: string | null; robots: string | null; metas: Record<string, string[]>; jsonld: unknown[]; bodyClass: string;
};
const SEO = seoData as unknown as Record<string, Seo>;

export function seoEntry(path: string): Seo {
  const e = SEO[path];
  if (!e) throw new Error(`Sin metadatos SEO para ${path}`);
  return e;
}

const first = (m: Record<string, string[]>, k: string) => m[k]?.[0];

export function buildMetadata(path: string): Metadata {
  const e = seoEntry(path);
  const m = e.metas;
  const other: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(m)) {
    if (/^(og:(title|description|url|site_name|locale|type|image(:\w+)?)|twitter:card)$/.test(k)) continue;
    other[k] = v.length === 1 ? v[0]! : v;
  }
  const ogImage = first(m, 'og:image');
  return {
    title: { absolute: e.title },
    description: e.description ?? undefined,
    alternates: e.canonical ? { canonical: e.canonical } : undefined,
    robots: e.robots ?? undefined,
    openGraph: {
      locale: first(m, 'og:locale'),
      title: first(m, 'og:title'),
      description: first(m, 'og:description'),
      url: first(m, 'og:url'),
      siteName: first(m, 'og:site_name'),
      images: ogImage ? [{ url: ogImage, width: Number(first(m, 'og:image:width')) || undefined, height: Number(first(m, 'og:image:height')) || undefined, type: first(m, 'og:image:type') }] : undefined,
      ...(first(m, 'og:type') ? { type: first(m, 'og:type') } : {}),
    } as Metadata['openGraph'],
    twitter: first(m, 'twitter:card') ? { card: first(m, 'twitter:card') as 'summary_large_image' } : undefined,
    other,
  };
}

export function JsonLd({ path }: { path: string }) {
  const e = seoEntry(path);
  return (
    <>
      {e.jsonld.map((j, i) => (
        <script key={i} type="application/ld+json" className="yoast-schema-graph" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />
      ))}
    </>
  );
}
