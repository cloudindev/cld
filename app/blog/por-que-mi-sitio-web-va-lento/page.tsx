// Generado por tools/gen-routes.mjs · /blog/por-que-mi-sitio-web-va-lento/
import content from '@/content/pages/blog__por-que-mi-sitio-web-va-lento.json';
import '@/styles/pages/blog__por-que-mi-sitio-web-va-lento.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/por-que-mi-sitio-web-va-lento/');

export default function Page_blog_por_que_mi_sitio_web_va_lento() {
  return (
    <>
      <JsonLd path="/blog/por-que-mi-sitio-web-va-lento/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
