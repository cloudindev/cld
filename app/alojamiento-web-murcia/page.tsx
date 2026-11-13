// Generado por tools/gen-routes.mjs · /alojamiento-web-murcia/
import content from '@/content/pages/alojamiento-web-murcia.json';
import '@/styles/pages/alojamiento-web-murcia.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-murcia/');

export default function Page_alojamiento_web_murcia() {
  return (
    <>
      <JsonLd path="/alojamiento-web-murcia/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
