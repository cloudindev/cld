// Generado por tools/gen-routes.mjs · /contacto-old/
import content from '@/content/pages/contacto-old.json';
import '@/styles/pages/contacto-old.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/contacto-old/');

export default function Page_contacto_old() {
  return (
    <>
      <JsonLd path="/contacto-old/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
