import { buildMetadata, JsonLd } from '@/lib/seo';
import { CloudySearch } from '@/components/home/CloudySearch';
import { HostingPlans } from '@/components/home/HostingPlans';
import { Missions } from '@/components/home/Missions';
import { VideoHero } from '@/components/home/VideoHero';
import { Think } from '@/components/home/Think';
import { ProductCards } from '@/components/home/ProductCards';
import { PortfolioSection } from '@/components/home/PortfolioHead';
import { Help } from '@/components/home/Help';
import { Partners } from '@/components/home/Partners';
import { Cta } from '@/components/home/Cta';
import { Family } from '@/components/home/Family';

export const metadata = buildMetadata('/');

// Orden de la home (cambios del cliente, ver NOTAS.md, puntos 35, 39 y 40): el buscador de dominios lleva a
// Cloudy asomado por encima; las misiones sustituyen a «Digitaliza tu negocio»; el vídeo de 4 capítulos va
// justo antes de «Y los mejores clientes del mundo»; «¿Qué necesitas para tu empresa?» ya no está en la home.
export default function HomePage() {
  return (
    <>
      <JsonLd path="/" />
      <CloudySearch />
      <HostingPlans />
      <Missions />
      <Think />
      <ProductCards />
      <VideoHero />
      <PortfolioSection />
      <Help />
      <Partners />
      <Cta />
      <Family />
    </>
  );
}
