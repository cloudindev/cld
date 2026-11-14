// Iconos de Academy: los de cada tema (24 × 24, trazo) y los de la interfaz (lupa, flecha).
import type { CatIcon as Name } from '@/content/academy';

const P: Record<Name, React.ReactNode> = {
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5S9.6 5.8 12 3.5Z" /></>,
  server: <><rect x="4" y="4.5" width="16" height="6.5" rx="2" /><rect x="4" y="13" width="16" height="6.5" rx="2" /><path d="M7.5 7.75h3M7.5 16.25h3" /></>,
  chip: <><rect x="6.5" y="6.5" width="11" height="11" rx="1.5" /><rect x="10" y="10" width="4" height="4" rx=".5" /><path d="M10 3.5v3M14 3.5v3M10 17.5v3M14 17.5v3M3.5 10h3M3.5 14h3M17.5 10h3M17.5 14h3" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  layout: <><rect x="4" y="4.5" width="16" height="15" rx="2" /><path d="M4 9h16M9 9v10.5M12 12.5h5M12 15.5h3.5" /></>,
  flag: <path d="M6.5 20.5V4.5h11l-2.5 3.75 2.5 3.75h-11" />,
};

export function CatIcon({ name, size = 20 }: { name: Name; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}

export const SearchIcon = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4.5 4.5" />
  </svg>
);

export const Arrow = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 8h10M8.5 4 12.5 8l-4 4" />
  </svg>
);
