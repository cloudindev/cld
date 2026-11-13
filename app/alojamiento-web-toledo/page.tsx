// Generado por tools/gen-routes.mjs · /alojamiento-web-toledo/
import content from '@/content/pages/alojamiento-web-toledo.json';
import '@/styles/pages/alojamiento-web-toledo.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/alojamiento-web-toledo/');

export default function Page_alojamiento_web_toledo() {
  return (
    <>
      <JsonLd path="/alojamiento-web-toledo/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
