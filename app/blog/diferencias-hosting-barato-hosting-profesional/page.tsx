// Generado por tools/gen-routes.mjs · /blog/diferencias-hosting-barato-hosting-profesional/
import content from '@/content/pages/blog__diferencias-hosting-barato-hosting-profesional.json';
import '@/styles/pages/blog__diferencias-hosting-barato-hosting-profesional.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/diferencias-hosting-barato-hosting-profesional/');

export default function Page_blog_diferencias_hosting_barato_hosting_profesional() {
  return (
    <>
      <JsonLd path="/blog/diferencias-hosting-barato-hosting-profesional/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
