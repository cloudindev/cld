// Generado por tools/gen-routes.mjs · /alojamiento-web-barcelona/
import content from '@/content/pages/alojamiento-web-barcelona.json';
import '@/styles/pages/alojamiento-web-barcelona.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-barcelona/');

export default function Page_alojamiento_web_barcelona() {
  return (
    <>
      <JsonLd path="/alojamiento-web-barcelona/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
