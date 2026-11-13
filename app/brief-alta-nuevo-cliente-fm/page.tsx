// Generado por tools/gen-routes.mjs · /brief-alta-nuevo-cliente-fm/
import content from '@/content/pages/brief-alta-nuevo-cliente-fm.json';
import '@/styles/pages/brief-alta-nuevo-cliente-fm.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/brief-alta-nuevo-cliente-fm/');

export default function Page_brief_alta_nuevo_cliente_fm() {
  return (
    <>
      <JsonLd path="/brief-alta-nuevo-cliente-fm/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
