// Generado por tools/gen-routes.mjs · /blog/que-son-como-utilizar-redirecciones-dominio/
import content from '@/content/pages/blog__que-son-como-utilizar-redirecciones-dominio.json';
import '@/styles/pages/blog__que-son-como-utilizar-redirecciones-dominio.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/que-son-como-utilizar-redirecciones-dominio/');

export default function Page_blog_que_son_como_utilizar_redirecciones_dominio() {
  return (
    <>
      <JsonLd path="/blog/que-son-como-utilizar-redirecciones-dominio/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
