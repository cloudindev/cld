// Generado por tools/gen-routes.mjs · /alojamiento-web-asturias/
import content from '@/content/pages/alojamiento-web-asturias.json';
import '@/styles/pages/alojamiento-web-asturias.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-asturias/');

export default function Page_alojamiento_web_asturias() {
  return (
    <>
      <JsonLd path="/alojamiento-web-asturias/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
