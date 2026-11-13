// Generado por tools/gen-routes.mjs · /blog/cuando-cambiar-a-un-servidor-vps/
import content from '@/content/pages/blog__cuando-cambiar-a-un-servidor-vps.json';
import '@/styles/pages/blog__cuando-cambiar-a-un-servidor-vps.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/cuando-cambiar-a-un-servidor-vps/');

export default function Page_blog_cuando_cambiar_a_un_servidor_vps() {
  return (
    <>
      <JsonLd path="/blog/cuando-cambiar-a-un-servidor-vps/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
