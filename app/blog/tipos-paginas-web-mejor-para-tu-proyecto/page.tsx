// Generado por tools/gen-routes.mjs · /blog/tipos-paginas-web-mejor-para-tu-proyecto/
import content from '@/content/pages/blog__tipos-paginas-web-mejor-para-tu-proyecto.json';
import '@/styles/pages/blog__tipos-paginas-web-mejor-para-tu-proyecto.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/tipos-paginas-web-mejor-para-tu-proyecto/');

export default function Page_blog_tipos_paginas_web_mejor_para_tu_proyecto() {
  return (
    <>
      <JsonLd path="/blog/tipos-paginas-web-mejor-para-tu-proyecto/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
