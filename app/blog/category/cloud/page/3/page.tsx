// Generado por tools/gen-routes.mjs · /blog/category/cloud/page/3/
import content from '@/content/pages/blog__category__cloud__page__3.json';
import '@/styles/pages/blog__category__cloud__page__3.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/category/cloud/page/3/');

export default function Page_blog_category_cloud_page_3() {
  return (
    <>
      <JsonLd path="/blog/category/cloud/page/3/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
