// Generado por tools/gen-routes.mjs · /blog/category/cloud/
import content from '@/content/pages/blog__category__cloud.json';
import '@/styles/pages/blog__category__cloud.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/category/cloud/');

export default function Page_blog_category_cloud() {
  return (
    <>
      <JsonLd path="/blog/category/cloud/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
