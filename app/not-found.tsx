// Página 404 («Uhhhhhh · Parece que estás perdido»). Se exporta como out/404.html.
import { buildMetadata, JsonLd } from '@/lib/seo';
import { NotFoundHero } from '@/components/notfound/NotFound';

export const metadata = buildMetadata('/no-existe-xyz/');

export default function NotFound() {
  return (
    <>
      <JsonLd path="/no-existe-xyz/" />
      <NotFoundHero />
    </>
  );
}
