// Generado por tools/gen-routes.mjs · /politica-seguridad/
import content from '@/content/pages/politica-seguridad.json';
import '@/styles/pages/politica-seguridad.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/politica-seguridad/');

export default function Page_politica_seguridad() {
  return (
    <>
      <JsonLd path="/politica-seguridad/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
