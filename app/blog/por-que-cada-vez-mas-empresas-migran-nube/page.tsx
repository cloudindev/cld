// Generado por tools/gen-routes.mjs · /blog/por-que-cada-vez-mas-empresas-migran-nube/
import content from '@/content/pages/blog__por-que-cada-vez-mas-empresas-migran-nube.json';
import '@/styles/pages/blog__por-que-cada-vez-mas-empresas-migran-nube.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/por-que-cada-vez-mas-empresas-migran-nube/');

export default function Page_blog_por_que_cada_vez_mas_empresas_migran_nube() {
  return (
    <>
      <JsonLd path="/blog/por-que-cada-vez-mas-empresas-migran-nube/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
