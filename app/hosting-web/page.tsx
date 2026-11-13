// Generado por tools/gen-routes.mjs · /hosting-web/
import content from '@/content/pages/hosting-web.json';
import '@/styles/pages/hosting-web.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/hosting-web/');

export default function Page_hosting_web() {
  return (
    <>
      <JsonLd path="/hosting-web/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
