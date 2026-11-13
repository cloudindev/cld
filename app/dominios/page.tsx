// Generado por tools/gen-routes.mjs · /dominios/
import content from '@/content/pages/dominios.json';
import '@/styles/pages/dominios.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/dominios/');

export default function Page_dominios() {
  return (
    <>
      <JsonLd path="/dominios/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
