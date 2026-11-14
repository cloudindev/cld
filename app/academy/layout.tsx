// Academy (Centro de Ayuda), integrada en la web (antes era un sitio aparte, cloudin.academy).
// Todas sus páginas comparten los colores del diseño y terminan con la raya de colores sobre el footer.
import { Line } from '@/components/academy/Parts';
import a from '@/components/academy/Academy.module.css';

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={a.academy}>
      {children}
      <Line className={a.endLine} />
    </div>
  );
}
