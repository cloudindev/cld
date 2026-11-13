// Generado por tools/gen-routes.mjs · /accesibilidad/
import content from '@/content/pages/accesibilidad.json';
import '@/styles/pages/accesibilidad.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/accesibilidad/');

export default function Page_accesibilidad() {
  return (
    <>
      <JsonLd path="/accesibilidad/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
