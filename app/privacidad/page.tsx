// Generado por tools/gen-routes.mjs · /privacidad/
import content from '@/content/pages/privacidad.json';
import '@/styles/pages/privacidad.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/privacidad/');

export default function Page_privacidad() {
  return (
    <>
      <JsonLd path="/privacidad/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
