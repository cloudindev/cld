// Generado por tools/gen-routes.mjs · /blog/hosting-wordpress-por-que-elegir-plan-especializado/
import content from '@/content/pages/blog__hosting-wordpress-por-que-elegir-plan-especializado.json';
import '@/styles/pages/blog__hosting-wordpress-por-que-elegir-plan-especializado.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/hosting-wordpress-por-que-elegir-plan-especializado/');

export default function Page_blog_hosting_wordpress_por_que_elegir_plan_especializado() {
  return (
    <>
      <JsonLd path="/blog/hosting-wordpress-por-que-elegir-plan-especializado/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
