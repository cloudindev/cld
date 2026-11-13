// Generado por tools/gen-routes.mjs · /blog/factores-clave-posicionar-web-primeros-resultados/
import content from '@/content/pages/blog__factores-clave-posicionar-web-primeros-resultados.json';
import '@/styles/pages/blog__factores-clave-posicionar-web-primeros-resultados.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/factores-clave-posicionar-web-primeros-resultados/');

export default function Page_blog_factores_clave_posicionar_web_primeros_resultados() {
  return (
    <>
      <JsonLd path="/blog/factores-clave-posicionar-web-primeros-resultados/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
