// /seguridad/ · página de servicio añadida a petición del cliente (no existe en el original). Contenido en content/servicios.ts.
import type { Metadata } from 'next';
import { seguridad as page } from '@/content/servicios';
import { ServicePage } from '@/components/servicios/ServicePage';

const url = `https://cloudin.pro${page.path}`;
export const metadata: Metadata = {
  title: { absolute: page.meta.title },
  description: page.meta.description,
  alternates: { canonical: url },
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  openGraph: { locale: 'es_ES', type: 'website', title: page.meta.title, description: page.meta.description, url, siteName: 'Cloudin' },
};

export default function SeguridadPage() {
  return <ServicePage page={page} />;
}
