// Generado por tools/gen-routes.mjs · /alojamiento-web-galicia/
import content from '@/content/pages/alojamiento-web-galicia.json';
import '@/styles/pages/alojamiento-web-galicia.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-galicia/');

export default function Page_alojamiento_web_galicia() {
  return (
    <>
      <JsonLd path="/alojamiento-web-galicia/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
