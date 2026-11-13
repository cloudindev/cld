// Generado por tools/gen-routes.mjs · /blog/cuanta-ram-necesita-servidor-alojar-web/
import content from '@/content/pages/blog__cuanta-ram-necesita-servidor-alojar-web.json';
import '@/styles/pages/blog__cuanta-ram-necesita-servidor-alojar-web.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/cuanta-ram-necesita-servidor-alojar-web/');

export default function Page_blog_cuanta_ram_necesita_servidor_alojar_web() {
  return (
    <>
      <JsonLd path="/blog/cuanta-ram-necesita-servidor-alojar-web/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
