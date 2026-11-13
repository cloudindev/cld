// Generado por tools/gen-routes.mjs · /hosting/
import content from '@/content/pages/hosting.json';
import '@/styles/pages/hosting.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/hosting/');

export default function Page_hosting() {
  return (
    <>
      <JsonLd path="/hosting/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
