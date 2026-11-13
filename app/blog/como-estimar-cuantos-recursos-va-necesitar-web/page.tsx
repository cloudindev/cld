// Generado por tools/gen-routes.mjs · /blog/como-estimar-cuantos-recursos-va-necesitar-web/
import content from '@/content/pages/blog__como-estimar-cuantos-recursos-va-necesitar-web.json';
import '@/styles/pages/blog__como-estimar-cuantos-recursos-va-necesitar-web.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/como-estimar-cuantos-recursos-va-necesitar-web/');

export default function Page_blog_como_estimar_cuantos_recursos_va_necesitar_web() {
  return (
    <>
      <JsonLd path="/blog/como-estimar-cuantos-recursos-va-necesitar-web/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
