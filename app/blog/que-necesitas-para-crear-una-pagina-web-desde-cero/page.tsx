// Generado por tools/gen-routes.mjs · /blog/que-necesitas-para-crear-una-pagina-web-desde-cero/
import content from '@/content/pages/blog__que-necesitas-para-crear-una-pagina-web-desde-cero.json';
import '@/styles/pages/blog__que-necesitas-para-crear-una-pagina-web-desde-cero.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/que-necesitas-para-crear-una-pagina-web-desde-cero/');

export default function Page_blog_que_necesitas_para_crear_una_pagina_web_desde_cero() {
  return (
    <>
      <JsonLd path="/blog/que-necesitas-para-crear-una-pagina-web-desde-cero/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
