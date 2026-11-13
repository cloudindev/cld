// Generado por tools/gen-routes.mjs · /blog/que-es-un-servidor-dns-y-como-influye-en-tu-hosting/
import content from '@/content/pages/blog__que-es-un-servidor-dns-y-como-influye-en-tu-hosting.json';
import '@/styles/pages/blog__que-es-un-servidor-dns-y-como-influye-en-tu-hosting.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/que-es-un-servidor-dns-y-como-influye-en-tu-hosting/');

export default function Page_blog_que_es_un_servidor_dns_y_como_influye_en_tu_hosting() {
  return (
    <>
      <JsonLd path="/blog/que-es-un-servidor-dns-y-como-influye-en-tu-hosting/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
