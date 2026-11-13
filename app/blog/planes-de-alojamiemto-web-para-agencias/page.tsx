// Generado por tools/gen-routes.mjs · /blog/planes-de-alojamiemto-web-para-agencias/
import content from '@/content/pages/blog__planes-de-alojamiemto-web-para-agencias.json';
import '@/styles/pages/blog__planes-de-alojamiemto-web-para-agencias.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/planes-de-alojamiemto-web-para-agencias/');

export default function Page_blog_planes_de_alojamiemto_web_para_agencias() {
  return (
    <>
      <JsonLd path="/blog/planes-de-alojamiemto-web-para-agencias/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
