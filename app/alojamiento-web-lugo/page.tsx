// Generado por tools/gen-routes.mjs · /alojamiento-web-lugo/
import content from '@/content/pages/alojamiento-web-lugo.json';
import '@/styles/pages/alojamiento-web-lugo.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-lugo/');

export default function Page_alojamiento_web_lugo() {
  return (
    <>
      <JsonLd path="/alojamiento-web-lugo/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
