// Home · «¿Qué necesita tu empresa?»: las misiones de Cloudy (debajo del personaje asomado sobre la raya).
// Tres tarjetas; al elegir una, Cloudy se zambulle detrás de la raya y aparece su vídeo con dos planes.
// LOS PLANES SON SIMULADOS (nombres, precios y características de ejemplo): ver NOTAS.md, punto 39.

export type MisionId = 'web' | 'correo' | 'marketing';
export type Link = { label: string; href: string };

export type Plan = {
  name: string;
  tag?: string;            // etiqueta («Nuevo», «Recomendado»…)
  text: string;
  price: number;           // € sin IVA
  from?: boolean;          // «desde»
  unit: string;            // «/mes», «/buzón al mes»…
  features: string[];
  cta: Link;
  featured?: boolean;      // el plan destacado de la pareja
};

export type Mision = {
  id: MisionId;
  accent: string;          // color de la misión (punto de la tarjeta, flecha, plan destacado)
  soft: string;            // el mismo color, muy claro (fondos de etiquetas y botones)
  card: { title: string; text: string };
  short: string;           // nombre corto (pastillas del panel en móvil)
  video: { src: string; poster: string; label: string };
  detail: { eyebrow: string; title: string[]; highlight: string; text: string; more: Link };
  plans: [Plan, Plan];
};

export const misiones = {
  eyebrow: 'Cloudy está listo',
  title: '¿Qué necesita tu',
  highlight: 'empresa?',
  more: 'Ver planes',
  close: 'Volver a las misiones',
  note: 'Precios sin IVA.',
  items: [
    {
      id: 'web',
      accent: '#23a9a3',
      soft: '#dff3f1',
      card: { title: 'Páginas web', text: 'A medida en WordPress o lista en minutos con inteligencia artificial.' },
      short: 'Web',
      video: { src: '/mascota/cloudy-working.mp4', poster: '/mascota/cloudy-working.webp', label: 'Cloudy, con cascos, trabaja en su portátil' },
      detail: {
        eyebrow: 'Misión 01 · Páginas web',
        title: ['Tu web,', 'lista para'],
        highlight: 'despegar',
        text: 'Cloudy ya se ha puesto los cascos. Elige cómo quieres tu web: diseñada a medida en WordPress o creada con inteligencia artificial en tiempo récord.',
        more: { label: 'Descubre nuestras páginas web', href: '/paginas-web/' },
      },
      plans: [
        {
          name: 'Web WordPress',
          tag: 'A medida',
          text: 'Diseño propio, fácil de editar y preparada para crecer contigo.',
          price: 39, from: true, unit: '/mes',
          features: ['Diseño personalizado con tu marca', 'Hasta 6 secciones y blog', 'Hosting, dominio y SSL incluidos', 'SEO inicial y formulario de contacto', 'Formación para editarla tú'],
          cta: { label: 'La quiero', href: '/contacto/' },
          featured: true,
        },
        {
          name: 'Web IA',
          tag: 'Nuevo',
          text: 'Cuéntanos tu negocio y la IA crea tu web en minutos.',
          price: 14.9, unit: '/mes',
          features: ['Web generada con IA para tu negocio', 'Textos e imágenes creados para ti', 'Editor visual muy sencillo', 'Hosting, dominio y SSL incluidos', 'Online en 24 horas'],
          cta: { label: 'Crear mi web IA', href: '/contacto/' },
        },
      ],
    },
    {
      id: 'correo',
      accent: '#5b7bfb',
      soft: '#e6ebff',
      card: { title: 'Correo electrónico', text: 'Correo profesional con tu dominio, sin spam y en todos tus dispositivos.' },
      short: 'Correo',
      video: { src: '/mascota/cloudy-email.mp4', poster: '/mascota/cloudy-email.webp', label: 'Cloudy lanza un avión de papel entre un montón de sobres' },
      detail: {
        eyebrow: 'Misión 02 · Correo electrónico',
        title: ['Correo', 'profesional'],
        highlight: 'sin líos',
        text: 'Escribe desde tu@tuempresa.com, olvídate del spam y lleva tu correo en el móvil, la tableta y el ordenador. Cloudy se encarga de que tus mensajes despeguen.',
        more: { label: 'Guías para configurar tu correo', href: '/academy/correo/' },
      },
      plans: [
        {
          name: 'Correo Esencial',
          text: 'Para empezar con una imagen profesional.',
          price: 1.49, unit: '/buzón al mes',
          features: ['Buzón de 10 GB', 'Tu dominio en cada correo', 'Antispam y antivirus', 'Webmail y apps del móvil', 'Soporte en español'],
          cta: { label: 'Lo quiero', href: '/contacto/' },
        },
        {
          name: 'Correo Empresa',
          tag: 'Recomendado',
          text: 'Para equipos que viven en el correo.',
          price: 3.99, unit: '/buzón al mes',
          features: ['Buzón de 50 GB', 'Calendario y contactos compartidos', 'Alias y listas de distribución', 'Copias de seguridad diarias', 'Migración de buzones gratis'],
          cta: { label: 'Lo quiero', href: '/contacto/' },
          featured: true,
        },
      ],
    },
    {
      id: 'marketing',
      accent: '#e1603e',
      soft: '#fdebe4',
      card: { title: 'Marketing', text: 'Que te encuentren en Google y confíen en ti a la primera.' },
      short: 'Marketing',
      video: { src: '/mascota/cloudy-shield.mp4', poster: '/mascota/cloudy-shield.webp', label: 'Cloudy sostiene un escudo con un check de verificado' },
      detail: {
        eyebrow: 'Misión 03 · Marketing',
        title: ['Que te encuentren', 'y que te'],
        highlight: 'elijan',
        text: 'SEO, Google Business Profile y campañas para que tu negocio aparezca cuando te buscan… y transmita confianza cuando te encuentran. Cloudy pone el sello de verificado.',
        more: { label: 'Posicionamiento SEO', href: '/posicionamiento-seo-asturias/' },
      },
      plans: [
        {
          name: 'SEO Local',
          text: 'Aparece en Google y en Maps en tu zona.',
          price: 149, unit: '/mes',
          features: ['Auditoría SEO inicial', 'Ficha de Google Business optimizada', 'Gestión de reseñas', 'Palabras clave de tu zona', 'Informe mensual de resultados'],
          cta: { label: 'Lo quiero', href: '/contacto/' },
        },
        {
          name: 'Marketing 360',
          tag: 'Todo incluido',
          text: 'SEO, campañas y redes en una sola estrategia.',
          price: 349, unit: '/mes',
          features: ['Todo lo de SEO Local', 'Campañas en Google Ads y Meta', 'Gestión de 2 redes sociales', 'Contenidos mensuales para tu blog', 'Reunión de seguimiento mensual'],
          cta: { label: 'Lo quiero', href: '/contacto/' },
          featured: true,
        },
      ],
    },
  ] satisfies Mision[],
};

/** «desde 14,90 €»: el precio más bajo de la misión (resumen en la tarjeta) */
export const desde = (m: Mision) => Math.min(...m.plans.map(p => p.price));
export const euros = (n: number) =>
  new Intl.NumberFormat('es-ES', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n);
