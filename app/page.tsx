import { buildMetadata, JsonLd } from '@/lib/seo';
import { DomainSearch } from '@/components/home/DomainSearch';
import { HostingPlans } from '@/components/home/HostingPlans';
import { Hero } from '@/components/home/Hero';
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
      <HostingPlans />
      <Hero />
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
