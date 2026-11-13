// Generado por tools/gen-routes.mjs · /alojamiento-web-madrid/
import content from '@/content/pages/alojamiento-web-madrid.json';
import '@/styles/pages/alojamiento-web-madrid.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-madrid/');

export default function Page_alojamiento_web_madrid() {
  return (
    <>
      <JsonLd path="/alojamiento-web-madrid/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
