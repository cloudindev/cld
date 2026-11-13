// Generado por tools/gen-routes.mjs · /blog/como-proteger-los-datos-de-tu-empresa-en-la-nube/
import content from '@/content/pages/blog__como-proteger-los-datos-de-tu-empresa-en-la-nube.json';
import '@/styles/pages/blog__como-proteger-los-datos-de-tu-empresa-en-la-nube.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/como-proteger-los-datos-de-tu-empresa-en-la-nube/');

export default function Page_blog_como_proteger_los_datos_de_tu_empresa_en_la_nube() {
  return (
    <>
      <JsonLd path="/blog/como-proteger-los-datos-de-tu-empresa-en-la-nube/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
