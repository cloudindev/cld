// Generado por tools/gen-routes.mjs · /politica-abuso/
import content from '@/content/pages/politica-abuso.json';
import '@/styles/pages/politica-abuso.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/politica-abuso/');

export default function Page_politica_abuso() {
  return (
    <>
      <JsonLd path="/politica-abuso/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
