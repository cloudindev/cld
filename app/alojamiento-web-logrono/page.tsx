// Generado por tools/gen-routes.mjs · /alojamiento-web-logrono/
import content from '@/content/pages/alojamiento-web-logrono.json';
import '@/styles/pages/alojamiento-web-logrono.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-logrono/');

export default function Page_alojamiento_web_logrono() {
  return (
    <>
      <JsonLd path="/alojamiento-web-logrono/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
