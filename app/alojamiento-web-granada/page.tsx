// Generado por tools/gen-routes.mjs · /alojamiento-web-granada/
import content from '@/content/pages/alojamiento-web-granada.json';
import '@/styles/pages/alojamiento-web-granada.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-granada/');

export default function Page_alojamiento_web_granada() {
  return (
    <>
      <JsonLd path="/alojamiento-web-granada/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
