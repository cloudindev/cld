// /academy-sitemap.xml · sitemap de Academy, generado a partir de las guías (se enlaza desde sitemap_index.xml).
import { categorias, catHref, guiaHref, guias, guiasDe, SITE } from '@/content/academy';

export const dynamic = 'force-static';

const latest = (dates: string[]) => dates.reduce((x, y) => (y > x ? y : x));

export function GET() {
  const urls = [
    { loc: '/academy/', lastmod: latest(guias.map(g => g.updated)) },
    ...categorias.map(c => ({ loc: catHref(c), lastmod: latest(guiasDe(c.slug).map(g => g.updated)) })),
    ...guias.map(g => ({ loc: guiaHref(g), lastmod: g.updated })),
  ];
  const body = urls.map(u => `\t<url>\n\t\t<loc>${SITE}${u.loc}</loc>\n\t\t<lastmod>${u.lastmod}T00:00:00+00:00</lastmod>\n\t</url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
