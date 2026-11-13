// Generado por tools/gen-routes.mjs · /contacto/
import content from '@/content/pages/contacto.json';
import '@/styles/pages/contacto.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/contacto/');

export default function Page_contacto() {
  return (
    <>
      <JsonLd path="/contacto/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
