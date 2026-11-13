// Generado por tools/gen-routes.mjs · /diseno-paginas-web-asturias/
import content from '@/content/pages/diseno-paginas-web-asturias.json';
import '@/styles/pages/diseno-paginas-web-asturias.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/diseno-paginas-web-asturias/');

export default function Page_diseno_paginas_web_asturias() {
  return (
    <>
      <JsonLd path="/diseno-paginas-web-asturias/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
