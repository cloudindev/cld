// Generado por tools/gen-routes.mjs · /blog/como-migrar-tu-web-a-otro-hosting-sin-perder-nada/
import content from '@/content/pages/blog__como-migrar-tu-web-a-otro-hosting-sin-perder-nada.json';
import '@/styles/pages/blog__como-migrar-tu-web-a-otro-hosting-sin-perder-nada.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/como-migrar-tu-web-a-otro-hosting-sin-perder-nada/');

export default function Page_blog_como_migrar_tu_web_a_otro_hosting_sin_perder_nada() {
  return (
    <>
      <JsonLd path="/blog/como-migrar-tu-web-a-otro-hosting-sin-perder-nada/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
