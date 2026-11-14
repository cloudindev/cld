// Iconos de línea para las páginas de servicio (24 × 24, trazo del color del texto).
import type { IconName } from '@/content/servicios';

const P: Record<IconName, React.ReactNode> = {
  design: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 9v11" /></>,
  devices: <><rect x="2" y="4" width="14" height="10" rx="1.5" /><path d="M6 18h6M9 14v4" /><rect x="17.5" y="9" width="4.5" height="11" rx="1.2" /></>,
  seo: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5.5 5.5" /><path d="m7.5 12.5 2-2 1.5 1.5 2.5-3" /></>,
  speed: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  support: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="m5.6 5.6 3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6" /></>,
  budget: <><path d="M6 3h9l4 4v14H6Z" /><path d="M15 3v4h4M9 12h7M9 16h5" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3M12 15v2" /></>,
  backup: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>,
  server: <><rect x="3" y="4" width="18" height="7" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /><path d="M7 7.5h.01M7 16.5h.01" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" /></>,
  pulse: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
  uptime: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}
