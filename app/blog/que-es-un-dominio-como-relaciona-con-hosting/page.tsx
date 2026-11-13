// Generado por tools/gen-routes.mjs · /blog/que-es-un-dominio-como-relaciona-con-hosting/
import content from '@/content/pages/blog__que-es-un-dominio-como-relaciona-con-hosting.json';
import '@/styles/pages/blog__que-es-un-dominio-como-relaciona-con-hosting.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/que-es-un-dominio-como-relaciona-con-hosting/');

export default function Page_blog_que_es_un_dominio_como_relaciona_con_hosting() {
  return (
    <>
      <JsonLd path="/blog/que-es-un-dominio-como-relaciona-con-hosting/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
