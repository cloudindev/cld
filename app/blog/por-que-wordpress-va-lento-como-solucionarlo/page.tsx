// Generado por tools/gen-routes.mjs · /blog/por-que-wordpress-va-lento-como-solucionarlo/
import content from '@/content/pages/blog__por-que-wordpress-va-lento-como-solucionarlo.json';
import '@/styles/pages/blog__por-que-wordpress-va-lento-como-solucionarlo.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/por-que-wordpress-va-lento-como-solucionarlo/');

export default function Page_blog_por_que_wordpress_va_lento_como_solucionarlo() {
  return (
    <>
      <JsonLd path="/blog/por-que-wordpress-va-lento-como-solucionarlo/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
