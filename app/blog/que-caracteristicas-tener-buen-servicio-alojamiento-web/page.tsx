// Generado por tools/gen-routes.mjs · /blog/que-caracteristicas-tener-buen-servicio-alojamiento-web/
import content from '@/content/pages/blog__que-caracteristicas-tener-buen-servicio-alojamiento-web.json';
import '@/styles/pages/blog__que-caracteristicas-tener-buen-servicio-alojamiento-web.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/que-caracteristicas-tener-buen-servicio-alojamiento-web/');

export default function Page_blog_que_caracteristicas_tener_buen_servicio_alojamiento_web() {
  return (
    <>
      <JsonLd path="/blog/que-caracteristicas-tener-buen-servicio-alojamiento-web/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
