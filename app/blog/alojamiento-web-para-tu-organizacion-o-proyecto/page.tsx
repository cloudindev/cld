// Generado por tools/gen-routes.mjs · /blog/alojamiento-web-para-tu-organizacion-o-proyecto/
import content from '@/content/pages/blog__alojamiento-web-para-tu-organizacion-o-proyecto.json';
import '@/styles/pages/blog__alojamiento-web-para-tu-organizacion-o-proyecto.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/alojamiento-web-para-tu-organizacion-o-proyecto/');

export default function Page_blog_alojamiento_web_para_tu_organizacion_o_proyecto() {
  return (
    <>
      <JsonLd path="/blog/alojamiento-web-para-tu-organizacion-o-proyecto/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
