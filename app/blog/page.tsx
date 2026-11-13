// Generado por tools/gen-routes.mjs · /blog/
import content from '@/content/pages/blog.json';
import '@/styles/pages/blog.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/');

export default function Page_blog() {
  return (
    <>
      <JsonLd path="/blog/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
