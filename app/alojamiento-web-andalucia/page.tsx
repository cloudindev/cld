// Generado por tools/gen-routes.mjs · /alojamiento-web-andalucia/
import content from '@/content/pages/alojamiento-web-andalucia.json';
import '@/styles/pages/alojamiento-web-andalucia.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-andalucia/');

export default function Page_alojamiento_web_andalucia() {
  return (
    <>
      <JsonLd path="/alojamiento-web-andalucia/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
