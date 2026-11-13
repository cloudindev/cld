// Generado por tools/gen-routes.mjs · /blog/errores-mas-comunes-hosting-como-solucionarlos/
import content from '@/content/pages/blog__errores-mas-comunes-hosting-como-solucionarlos.json';
import '@/styles/pages/blog__errores-mas-comunes-hosting-como-solucionarlos.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/errores-mas-comunes-hosting-como-solucionarlos/');

export default function Page_blog_errores_mas_comunes_hosting_como_solucionarlos() {
  return (
    <>
      <JsonLd path="/blog/errores-mas-comunes-hosting-como-solucionarlos/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
