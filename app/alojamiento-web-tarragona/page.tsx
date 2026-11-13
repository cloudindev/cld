// Generado por tools/gen-routes.mjs · /alojamiento-web-tarragona/
import content from '@/content/pages/alojamiento-web-tarragona.json';
import '@/styles/pages/alojamiento-web-tarragona.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-tarragona/');

export default function Page_alojamiento_web_tarragona() {
  return (
    <>
      <JsonLd path="/alojamiento-web-tarragona/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
