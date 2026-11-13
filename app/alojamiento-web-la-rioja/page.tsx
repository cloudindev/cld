// Generado por tools/gen-routes.mjs · /alojamiento-web-la-rioja/
import content from '@/content/pages/alojamiento-web-la-rioja.json';
import '@/styles/pages/alojamiento-web-la-rioja.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-la-rioja/');

export default function Page_alojamiento_web_la_rioja() {
  return (
    <>
      <JsonLd path="/alojamiento-web-la-rioja/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
