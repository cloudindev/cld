// Generado por tools/gen-routes.mjs · /alojamiento-web-bilbao/
import content from '@/content/pages/alojamiento-web-bilbao.json';
import '@/styles/pages/alojamiento-web-bilbao.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-bilbao/');

export default function Page_alojamiento_web_bilbao() {
  return (
    <>
      <JsonLd path="/alojamiento-web-bilbao/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
