// Generado por tools/gen-routes.mjs · /alojamiento-web-a-coruna/
import content from '@/content/pages/alojamiento-web-a-coruna.json';
import '@/styles/pages/alojamiento-web-a-coruna.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-a-coruna/');

export default function Page_alojamiento_web_a_coruna() {
  return (
    <>
      <JsonLd path="/alojamiento-web-a-coruna/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
