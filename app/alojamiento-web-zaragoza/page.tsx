// Generado por tools/gen-routes.mjs · /alojamiento-web-zaragoza/
import content from '@/content/pages/alojamiento-web-zaragoza.json';
import '@/styles/pages/alojamiento-web-zaragoza.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-zaragoza/');

export default function Page_alojamiento_web_zaragoza() {
  return (
    <>
      <JsonLd path="/alojamiento-web-zaragoza/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
