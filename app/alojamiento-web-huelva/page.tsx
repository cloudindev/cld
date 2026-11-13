// Generado por tools/gen-routes.mjs · /alojamiento-web-huelva/
import content from '@/content/pages/alojamiento-web-huelva.json';
import '@/styles/pages/alojamiento-web-huelva.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-huelva/');

export default function Page_alojamiento_web_huelva() {
  return (
    <>
      <JsonLd path="/alojamiento-web-huelva/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
