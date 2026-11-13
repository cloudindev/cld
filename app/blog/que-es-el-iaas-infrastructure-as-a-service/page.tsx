// Generado por tools/gen-routes.mjs · /blog/que-es-el-iaas-infrastructure-as-a-service/
import content from '@/content/pages/blog__que-es-el-iaas-infrastructure-as-a-service.json';
import '@/styles/pages/blog__que-es-el-iaas-infrastructure-as-a-service.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('/blog/que-es-el-iaas-infrastructure-as-a-service/');

export default function Page_blog_que_es_el_iaas_infrastructure_as_a_service() {
  return (
    <>
      <JsonLd path="/blog/que-es-el-iaas-infrastructure-as-a-service/" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
