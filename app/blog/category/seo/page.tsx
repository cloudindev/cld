// Generado por tools/gen-routes.mjs · /blog/category/seo/
import content from '@/content/pages/blog__category__seo.json';
import '@/styles/pages/blog__category__seo.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/category/seo/');

export default function Page_blog_category_seo() {
  return (
    <>
      <JsonLd path="/blog/category/seo/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
