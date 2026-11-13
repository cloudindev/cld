// Generado por tools/gen-routes.mjs · /alojamiento-web-girona/
import content from '@/content/pages/alojamiento-web-girona.json';
import '@/styles/pages/alojamiento-web-girona.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-girona/');

export default function Page_alojamiento_web_girona() {
  return (
    <>
      <JsonLd path="/alojamiento-web-girona/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
