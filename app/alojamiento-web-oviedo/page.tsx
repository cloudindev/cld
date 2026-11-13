// Generado por tools/gen-routes.mjs · /alojamiento-web-oviedo/
import content from '@/content/pages/alojamiento-web-oviedo.json';
import '@/styles/pages/alojamiento-web-oviedo.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-oviedo/');

export default function Page_alojamiento_web_oviedo() {
  return (
    <>
      <JsonLd path="/alojamiento-web-oviedo/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
