// Generado por tools/gen-routes.mjs · /blog/como-migrar-web-a-otro-hosting-sin-perder-trafico/
import content from '@/content/pages/blog__como-migrar-web-a-otro-hosting-sin-perder-trafico.json';
import '@/styles/pages/blog__como-migrar-web-a-otro-hosting-sin-perder-trafico.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/como-migrar-web-a-otro-hosting-sin-perder-trafico/');

export default function Page_blog_como_migrar_web_a_otro_hosting_sin_perder_trafico() {
  return (
    <>
      <JsonLd path="/blog/como-migrar-web-a-otro-hosting-sin-perder-trafico/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
