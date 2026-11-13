// Generado por tools/gen-routes.mjs · /alojamiento-web-sevilla/
import content from '@/content/pages/alojamiento-web-sevilla.json';
import '@/styles/pages/alojamiento-web-sevilla.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-sevilla/');

export default function Page_alojamiento_web_sevilla() {
  return (
    <>
      <JsonLd path="/alojamiento-web-sevilla/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
