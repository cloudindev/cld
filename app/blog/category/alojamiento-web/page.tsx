// Generado por tools/gen-routes.mjs · /blog/category/alojamiento-web/
import content from '@/content/pages/blog__category__alojamiento-web.json';
import '@/styles/pages/blog__category__alojamiento-web.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/category/alojamiento-web/');

export default function Page_blog_category_alojamiento_web() {
  return (
    <>
      <JsonLd path="/blog/category/alojamiento-web/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
