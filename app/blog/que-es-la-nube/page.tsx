// Generado por tools/gen-routes.mjs · /blog/que-es-la-nube/
import content from '@/content/pages/blog__que-es-la-nube.json';
import '@/styles/pages/blog__que-es-la-nube.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/que-es-la-nube/');

export default function Page_blog_que_es_la_nube() {
  return (
    <>
      <JsonLd path="/blog/que-es-la-nube/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
