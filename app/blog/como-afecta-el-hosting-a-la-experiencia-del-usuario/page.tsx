// Generado por tools/gen-routes.mjs · /blog/como-afecta-el-hosting-a-la-experiencia-del-usuario/
import content from '@/content/pages/blog__como-afecta-el-hosting-a-la-experiencia-del-usuario.json';
import '@/styles/pages/blog__como-afecta-el-hosting-a-la-experiencia-del-usuario.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/como-afecta-el-hosting-a-la-experiencia-del-usuario/');

export default function Page_blog_como_afecta_el_hosting_a_la_experiencia_del_usuario() {
  return (
    <>
      <JsonLd path="/blog/como-afecta-el-hosting-a-la-experiencia-del-usuario/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
