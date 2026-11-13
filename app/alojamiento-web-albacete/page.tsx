// Generado por tools/gen-routes.mjs · /alojamiento-web-albacete/
import content from '@/content/pages/alojamiento-web-albacete.json';
import '@/styles/pages/alojamiento-web-albacete.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-albacete/');

export default function Page_alojamiento_web_albacete() {
  return (
    <>
      <JsonLd path="/alojamiento-web-albacete/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
