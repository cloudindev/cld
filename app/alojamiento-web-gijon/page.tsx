// Generado por tools/gen-routes.mjs · /alojamiento-web-gijon/
import content from '@/content/pages/alojamiento-web-gijon.json';
import '@/styles/pages/alojamiento-web-gijon.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-gijon/');

export default function Page_alojamiento_web_gijon() {
  return (
    <>
      <JsonLd path="/alojamiento-web-gijon/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
