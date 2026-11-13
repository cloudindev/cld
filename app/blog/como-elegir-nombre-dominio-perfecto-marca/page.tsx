// Generado por tools/gen-routes.mjs · /blog/como-elegir-nombre-dominio-perfecto-marca/
import content from '@/content/pages/blog__como-elegir-nombre-dominio-perfecto-marca.json';
import '@/styles/pages/blog__como-elegir-nombre-dominio-perfecto-marca.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/como-elegir-nombre-dominio-perfecto-marca/');

export default function Page_blog_como_elegir_nombre_dominio_perfecto_marca() {
  return (
    <>
      <JsonLd path="/blog/como-elegir-nombre-dominio-perfecto-marca/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
