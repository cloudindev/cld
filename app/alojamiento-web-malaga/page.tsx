// Generado por tools/gen-routes.mjs · /alojamiento-web-malaga/
import content from '@/content/pages/alojamiento-web-malaga.json';
import '@/styles/pages/alojamiento-web-malaga.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-malaga/');

export default function Page_alojamiento_web_malaga() {
  return (
    <>
      <JsonLd path="/alojamiento-web-malaga/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
