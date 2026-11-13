// Generado por tools/gen-routes.mjs · /data-center-espana/
import content from '@/content/pages/data-center-espana.json';
import '@/styles/pages/data-center-espana.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/data-center-espana/');

export default function Page_data_center_espana() {
  return (
    <>
      <JsonLd path="/data-center-espana/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
