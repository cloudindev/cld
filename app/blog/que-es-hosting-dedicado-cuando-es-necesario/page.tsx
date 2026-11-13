// Generado por tools/gen-routes.mjs · /blog/que-es-hosting-dedicado-cuando-es-necesario/
import content from '@/content/pages/blog__que-es-hosting-dedicado-cuando-es-necesario.json';
import '@/styles/pages/blog__que-es-hosting-dedicado-cuando-es-necesario.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/que-es-hosting-dedicado-cuando-es-necesario/');

export default function Page_blog_que_es_hosting_dedicado_cuando_es_necesario() {
  return (
    <>
      <JsonLd path="/blog/que-es-hosting-dedicado-cuando-es-necesario/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
