// Generado por tools/gen-routes.mjs · /alojamiento-web-lleida/
import content from '@/content/pages/alojamiento-web-lleida.json';
import '@/styles/pages/alojamiento-web-lleida.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-lleida/');

export default function Page_alojamiento_web_lleida() {
  return (
    <>
      <JsonLd path="/alojamiento-web-lleida/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
