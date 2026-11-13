// Generado por tools/gen-routes.mjs · /blog/nube-privada-vs-nube-publica-cual-debes-utilizar/
import content from '@/content/pages/blog__nube-privada-vs-nube-publica-cual-debes-utilizar.json';
import '@/styles/pages/blog__nube-privada-vs-nube-publica-cual-debes-utilizar.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/nube-privada-vs-nube-publica-cual-debes-utilizar/');

export default function Page_blog_nube_privada_vs_nube_publica_cual_debes_utilizar() {
  return (
    <>
      <JsonLd path="/blog/nube-privada-vs-nube-publica-cual-debes-utilizar/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
