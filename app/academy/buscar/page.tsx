// /academy/buscar/?q=… · resultados de búsqueda (se calculan en el navegador; ver components/academy/search.ts).
import { Suspense } from 'react';
import { searchIndex } from '@/content/academy';
import { HelpContact, Topbar } from '@/components/academy/Parts';
import { SearchFromUrl, SearchView } from '@/components/academy/SearchPage';
import { academyMeta } from '@/components/academy/seo';

export const metadata = academyMeta({
  path: '/academy/buscar/',
  title: 'Buscar en la ayuda | Cloudin Academy',
  description: 'Busca entre las guías del Centro de Ayuda de Cloudin.',
  noindex: true,
});

export default function SearchRoute() {
  const docs = searchIndex();
  return (
    <>
      <Topbar crumbs={[{ label: 'Centro de Ayuda', href: '/academy/' }, { label: 'Buscar' }]} search={false} />
      <Suspense fallback={<SearchView docs={docs} q={null} />}>
        <SearchFromUrl docs={docs} />
      </Suspense>
      <HelpContact />
    </>
  );
}
