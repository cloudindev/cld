// Generado por tools/gen-routes.mjs · /alojamiento-web-valencia/
import content from '@/content/pages/alojamiento-web-valencia.json';
import '@/styles/pages/alojamiento-web-valencia.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-valencia/');

export default function Page_alojamiento_web_valencia() {
  return (
    <>
      <JsonLd path="/alojamiento-web-valencia/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
