// Generado por tools/gen-routes.mjs · /blog/por-que-velocidad-hosting-afecta-seo/
import content from '@/content/pages/blog__por-que-velocidad-hosting-afecta-seo.json';
import '@/styles/pages/blog__por-que-velocidad-hosting-afecta-seo.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/por-que-velocidad-hosting-afecta-seo/');

export default function Page_blog_por_que_velocidad_hosting_afecta_seo() {
  return (
    <>
      <JsonLd path="/blog/por-que-velocidad-hosting-afecta-seo/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
