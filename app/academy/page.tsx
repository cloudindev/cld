// /academy/ · portada del Centro de Ayuda. Contenido en content/academy/ (ver NOTAS.md, punto 38).
import { AcademyHome } from '@/components/academy/AcademyHome';
import { academyMeta } from '@/components/academy/seo';

export const metadata = academyMeta({
  path: '/academy/',
  title: 'Centro de Ayuda | Cloudin Academy',
  description: 'Guías claras, paso a paso, para tus dominios, tu hosting, tu VPS, tu correo y tu WordPress. Y si no lo encuentras, te ayuda una persona del equipo.',
});

export default function AcademyPage() {
  return <AcademyHome />;
}
