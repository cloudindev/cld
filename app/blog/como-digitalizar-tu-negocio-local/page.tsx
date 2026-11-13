// Generado por tools/gen-routes.mjs · /blog/como-digitalizar-tu-negocio-local/
import content from '@/content/pages/blog__como-digitalizar-tu-negocio-local.json';
import '@/styles/pages/blog__como-digitalizar-tu-negocio-local.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/como-digitalizar-tu-negocio-local/');

export default function Page_blog_como_digitalizar_tu_negocio_local() {
  return (
    <>
      <JsonLd path="/blog/como-digitalizar-tu-negocio-local/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
