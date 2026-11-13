// Generado por tools/gen-routes.mjs · /cookies/
import content from '@/content/pages/cookies.json';
import '@/styles/pages/cookies.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/cookies/');

export default function Page_cookies() {
  return (
    <>
      <JsonLd path="/cookies/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
