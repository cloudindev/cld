// Generado por tools/gen-routes.mjs · /blog/uptime-que-es-importante-hosting/
import content from '@/content/pages/blog__uptime-que-es-importante-hosting.json';
import '@/styles/pages/blog__uptime-que-es-importante-hosting.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/uptime-que-es-importante-hosting/');

export default function Page_blog_uptime_que_es_importante_hosting() {
  return (
    <>
      <JsonLd path="/blog/uptime-que-es-importante-hosting/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
