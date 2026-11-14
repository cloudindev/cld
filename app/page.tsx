import { buildMetadata, JsonLd } from '@/lib/seo';
import { DomainSearch } from '@/components/home/DomainSearch';
import { HostingPlans } from '@/components/home/HostingPlans';
import { Missions } from '@/components/home/Missions';
import { VideoHero } from '@/components/home/VideoHero';
import { Think } from '@/components/home/Think';
import { ProductCards } from '@/components/home/ProductCards';
import { Needs } from '@/components/home/Needs';
import { PortfolioSection } from '@/components/home/PortfolioHead';
import { Help } from '@/components/home/Help';
import { Partners } from '@/components/home/Partners';
import { Cta } from '@/components/home/Cta';
import { Family } from '@/components/home/Family';

export const metadata = buildMetadata('/');

export default function HomePage() {
  return (
    <>
      <JsonLd path="/" />
      <DomainSearch />
      <VideoHero />
      <HostingPlans />
      {/* personaje asomado sobre la raya + misiones de Cloudy (sustituye a «Digitaliza tu negocio», ver NOTAS.md, punto 39) */}
      <Missions />
      <Think />
      <ProductCards />
      <Needs />
      <PortfolioSection />
      <Help />
      <Partners />
      <Cta />
      <Family />
    </>
  );
}
