// Generado por tools/gen-routes.mjs · /alojamiento-web-almeria/
import content from '@/content/pages/alojamiento-web-almeria.json';
import '@/styles/pages/alojamiento-web-almeria.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-almeria/');

export default function Page_alojamiento_web_almeria() {
  return (
    <>
      <JsonLd path="/alojamiento-web-almeria/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
