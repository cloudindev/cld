// Generado por tools/gen-routes.mjs · /alojamiento-web-huesca/
import content from '@/content/pages/alojamiento-web-huesca.json';
import '@/styles/pages/alojamiento-web-huesca.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-huesca/');

export default function Page_alojamiento_web_huesca() {
  return (
    <>
      <JsonLd path="/alojamiento-web-huesca/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
