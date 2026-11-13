// /hosting-y-dominios-cloud-empresas/: copia de la home con un botón «Button» que abre el vídeo (ver NOTAS.md).
import { buildMetadata, JsonLd } from '@/lib/seo';
import { DomainSearch } from '@/components/home/DomainSearch';
import { Hero } from '@/components/home/Hero';
import { Think } from '@/components/home/Think';
import { ProductCards } from '@/components/home/ProductCards';
import { Needs } from '@/components/home/Needs';
import { PortfolioSection } from '@/components/home/PortfolioHead';
import { Help } from '@/components/home/Help';
import { Partners } from '@/components/home/Partners';
import { Cta } from '@/components/home/Cta';
import { Family } from '@/components/home/Family';
import { VideoButton } from '@/components/home/VideoButton';

export const metadata = buildMetadata('/hosting-y-dominios-cloud-empresas/');

export default function HomeVideoPage() {
  return (
    <>
      <JsonLd path="/hosting-y-dominios-cloud-empresas/" />
      <DomainSearch />
      <Hero />
      <Think />
      <ProductCards />
      <Needs />
      <PortfolioSection />
      <Help />
      <Partners />
      <Cta />
      <Family extra={<VideoButton />} />
    </>
  );
}
