// Generado por tools/gen-routes.mjs · /blog/como-saber-hosting-limitando-el-rendimiento-web/
import content from '@/content/pages/blog__como-saber-hosting-limitando-el-rendimiento-web.json';
import '@/styles/pages/blog__como-saber-hosting-limitando-el-rendimiento-web.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/como-saber-hosting-limitando-el-rendimiento-web/');

export default function Page_blog_como_saber_hosting_limitando_el_rendimiento_web() {
  return (
    <>
      <JsonLd path="/blog/como-saber-hosting-limitando-el-rendimiento-web/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
