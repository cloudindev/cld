// Generado por tools/gen-routes.mjs · /alojamiento-web-aviles/
import content from '@/content/pages/alojamiento-web-aviles.json';
import '@/styles/pages/alojamiento-web-aviles.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-aviles/');

export default function Page_alojamiento_web_aviles() {
  return (
    <>
      <JsonLd path="/alojamiento-web-aviles/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
