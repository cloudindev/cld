// Generado por tools/gen-routes.mjs · /unete/
import content from '@/content/pages/unete.json';
import '@/styles/pages/unete.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/unete/');

export default function Page_unete() {
  return (
    <>
      <JsonLd path="/unete/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
