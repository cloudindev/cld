// Generado por tools/gen-routes.mjs · /alojamiento-web-cordoba/
import content from '@/content/pages/alojamiento-web-cordoba.json';
import '@/styles/pages/alojamiento-web-cordoba.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-cordoba/');

export default function Page_alojamiento_web_cordoba() {
  return (
    <>
      <JsonLd path="/alojamiento-web-cordoba/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
