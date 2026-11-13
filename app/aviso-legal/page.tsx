// Generado por tools/gen-routes.mjs · /aviso-legal/
import content from '@/content/pages/aviso-legal.json';
import '@/styles/pages/aviso-legal.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/aviso-legal/');

export default function Page_aviso_legal() {
  return (
    <>
      <JsonLd path="/aviso-legal/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
