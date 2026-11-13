// Generado por tools/gen-routes.mjs · /posicionamiento-seo-asturias/
import content from '@/content/pages/posicionamiento-seo-asturias.json';
import '@/styles/pages/posicionamiento-seo-asturias.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/posicionamiento-seo-asturias/');

export default function Page_posicionamiento_seo_asturias() {
  return (
    <>
      <JsonLd path="/posicionamiento-seo-asturias/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
