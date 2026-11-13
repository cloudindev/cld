// Generado por tools/gen-routes.mjs · /cloud/
import content from '@/content/pages/cloud.json';
import '@/styles/pages/cloud.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/cloud/');

export default function Page_cloud() {
  return (
    <>
      <JsonLd path="/cloud/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
