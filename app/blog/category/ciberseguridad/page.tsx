// Generado por tools/gen-routes.mjs · /blog/category/ciberseguridad/
import content from '@/content/pages/blog__category__ciberseguridad.json';
import '@/styles/pages/blog__category__ciberseguridad.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/category/ciberseguridad/');

export default function Page_blog_category_ciberseguridad() {
  return (
    <>
      <JsonLd path="/blog/category/ciberseguridad/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
