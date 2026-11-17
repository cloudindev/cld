// Contenido literal de la home (https://cloudin.pro/). Textos, enlaces e imágenes tal cual el original.

export const domainSearch = {
  action: 'https://panel.cloudin.pro/cart.php?a=add&domain=register',
  placeholder: 'Escribe el dominio que deseas ', // espacio final literal (ver NOTAS.md)
  submit: 'Buscar dominio',
};

/* ---------- Hero (RevSlider slider-15 en el original) ---------- */
// Coordenadas medidas en el original para cada ancho de referencia (x/y relativas al módulo).
// La réplica las posiciona respecto al centro del viewport, como hace RevSlider con su rejilla centrada.
export type Box = { x: number; y: number; w?: number; h?: number };
export type HeroLevel = {
  vw: number; height: number;
  title: Box & { fs: number; lh: number };
  ahora: Box & { fs: number; lh: number; pad: string };
  desc: Box & { fs: number; lh: number };
  monster: Box;
  photoSize: number;
  photos: { man: Box; dog: Box; plant: Box; woman: Box };
  outlines?: { a: Box; b: Box; c: Box; d: Box };
  pills: { fs: number; lh: number; padX: number; man: Box; dog: Box; woman: Box };
  box?: { bg: Box; dot: Box; text: Box & { fs: number; lh: number }; button: Box & { fs: number; lh: number; padX: number } };
};

export const hero = {
  title: ['DIGITALIZA', 'TU NEGOCIO'],
  highlight: 'AHORA',
  description: 'Te damos las tecnologías que necesitas para abrirte al mundo y alcanzar más clientes para seguir creciendo.',
  boxText: 'Empieza tu proyecto online',
  boxButton: '¿Cómo lo hago?',
  monster: '/wp-content/uploads/2025/01/cloudin-mosnter-theboss.png',
  photos: {
    man: { src: '/wp-content/uploads/2024/12/home-6.jpg', size: '140%' },
    dog: { src: '/wp-content/uploads/revslider/saas-product-slider/cutout4.jpg', size: '140%' },
    plant: { src: '/wp-content/uploads/2024/12/home-7.jpg', size: 'contain' },
    woman: { src: '/wp-content/uploads/revslider/saas-product-slider/cutout2.jpg', size: '120%' },
  },
  // Efecto máquina de escribir: cada pastilla alterna sus dos textos en bucle.
  pills: {
    man: ['gymfitness.com', "Let's go online!"],
    dog: ['Guau!!!!', 'tiendamascotas.com'],
    woman: ['institutodecoherencia.com', 'Gracias Cloudin!'],
  },
  levels: [
    {
      vw: 1440, height: 870,
      title: { x: 130, y: 100, w: 590, fs: 82, lh: 74 },
      ahora: { x: 130, y: 252, h: 80, fs: 82, lh: 74, pad: '0 0 6px 4px' },
      desc: { x: 130, y: 382, w: 409, fs: 20, lh: 30 },
      monster: { x: 171, y: 549, w: 141, h: 187 },
      photoSize: 300,
      photos: { man: { x: 770, y: 153.8 }, dog: { x: 1110, y: 53.8 }, plant: { x: 800, y: 503.8 }, woman: { x: 1150, y: 403.8 } },
      outlines: { a: { x: 790, y: 172.4 }, b: { x: 890, y: 542.4 }, c: { x: 1130, y: 442.4 }, d: { x: 1140, y: 92.4 } },
      pills: { fs: 17, lh: 40, padX: 20, man: { x: 920, y: 388.7 }, dog: { x: 1260, y: 289.7 }, woman: { x: 1300, y: 430.7 } },
      box: {
        bg: { x: 130, y: 572, w: 786.7, h: 120 },
        dot: { x: 155.38, y: 597.38, w: 19.25 },
        text: { x: 317.59, y: 602, w: 321, h: 60, fs: 20, lh: 60 },
        button: { x: 638.59, y: 602, w: 248.11, h: 60, fs: 18, lh: 60, padX: 50 },
      },
    },
    {
      vw: 1024, height: 718,
      title: { x: 30.31, y: 100, w: 481.67, fs: 68, lh: 61 },
      ahora: { x: 30.31, y: 225, h: 66, fs: 68, lh: 61, pad: '0 0 5px 3px' },
      desc: { x: 30.31, y: 341, w: 409, fs: 20, lh: 30 },
      monster: { x: 58.31, y: 453, w: 116.36, h: 154.33 },
      photoSize: 300,
      photos: { man: { x: 561.31, y: 153.3 }, dog: { x: 901.31, y: 53.3 }, plant: { x: 591.31, y: 503.3 }, woman: { x: 941.31, y: 403.3 } },
      outlines: { a: { x: 581.31, y: 173.4 }, b: { x: 582.31, y: 543.4 }, c: { x: 921.31, y: 443.4 }, d: { x: 931.31, y: 93.4 } },
      pills: { fs: 17, lh: 40, padX: 20, man: { x: 711.31, y: 388 }, dog: { x: 1051.31, y: 289 }, woman: { x: 1091.31, y: 430 } },
      box: {
        bg: { x: 30.31, y: 531, w: 642.25, h: 110 },
        dot: { x: 56.52, y: 557.09, w: 16.07 },
        text: { x: 172.23, y: 561, w: 264.91, h: 50, fs: 17, lh: 50 },
        button: { x: 437.14, y: 561, w: 205.42, h: 50, fs: 15, lh: 50, padX: 41 },
      },
    },
    {
      vw: 768, height: 642,
      title: { x: 30, y: 50, w: 354, fs: 39, lh: 44 },
      ahora: { x: 30, y: 140, w: 354, h: 48, fs: 39, lh: 44, pad: '0 0 4px 2px' },
      desc: { x: 30, y: 218, w: 256, fs: 16, lh: 22 },
      monster: { x: 43, y: 339, w: 86.86, h: 115.48 },
      photoSize: 180,
      photos: { man: { x: 414, y: 31.8 }, dog: { x: 614, y: 11.8 }, plant: { x: 414, y: 231.8 }, woman: { x: 614, y: 211.8 } },
      pills: { fs: 13, lh: 30, padX: 10, man: { x: 504, y: 171.7 }, dog: { x: 704, y: 152.7 }, woman: { x: 704, y: 222.7 } },
      box: {
        bg: { x: 30, y: 356, w: 708, h: 138 },
        dot: { x: 47.9, y: 373.73, w: 14.4 },
        text: { x: 250.41, y: 376, w: 467.59, h: 49, fs: 18, lh: 49 },
        button: { x: 526.34, y: 425, w: 191.66, h: 49, fs: 16, lh: 49, padX: 30 },
      },
    },
    {
      vw: 390, height: 772,
      title: { x: 20, y: 50, w: 350, fs: 49, lh: 43 },
      ahora: { x: 20, y: 137, h: 45.5, fs: 49, lh: 30, pad: '5px 0 2px 1px' },
      desc: { x: 20, y: 201.5, w: 350, fs: 16, lh: 22 },
      monster: { x: 21, y: 172, w: 43.88, h: 58.5 },
      photoSize: 180,
      photos: { man: { x: 10, y: 333.6 }, dog: { x: 200, y: 333.6 }, plant: { x: 10, y: 523.6 }, woman: { x: 200, y: 523.6 } },
      pills: { fs: 13, lh: 30, padX: 10, man: { x: 100, y: 475.4 }, dog: { x: 290, y: 475.4 }, woman: { x: 290, y: 535.4 } },
    },
  ] satisfies HeroLevel[],
};

/* ---------- «Piensa como los grandes» ---------- */
export const think = {
  lines: ['Piensa', 'como los grandes', 'y hazlo realidad'],
  text: 'Impulsa tus ventas lanzando tu proyecto online con un hosting web y dominio.',
};

/* ---------- Tarjetas Cloud / Hosting / Dominios ---------- */
export const productCards = {
  cloud: { title: 'CLOUD', text: 'Almacena y protege tus datos empresariales en un lugar seguro', button: 'conocer más', href: '/cloud/', bg: '/wp-content/uploads/2024/12/cloud-empresas.webp' },
  hosting: { title: 'HOSTING', text: 'Alojamiento web rápido y fiable', button: 'ver planes', href: '/hosting/', bg: '/wp-content/uploads/2024/12/hosting-y-dominios.jpg' },
  domains: { title: 'DOMINIOS', text: 'Encuentra el nombre perfecto para tu proyecto online.', button: 'buscar dominio', href: '/dominios/', bg: '/wp-content/uploads/2024/12/tecnologia-para-empresas.jpg' },
};

/* ---------- Pestañas «¿Qué necesitas para tu empresa?» ---------- */
export const needs = {
  title: '¿Qué necesitas para tu empresa?',
  tabs: [
    {
      label: 'Página Web',
      title: 'Crea tu página web',
      price: 'desde 5,90€/mes',
      paragraphs: [
        'Si vas a crear una página web para tu empresa, mostrar tu portfolio o a abrir una tienda online para vender de todo, desde galletas y recetas digitales a clases de repostería, podrás hacerlo con el creador de Sitios Web de Cloudin.',
        'Sigue unos pasos muy sencillos para crear tu web con nuestro potente creador todo en uno diseñado para ayudarte a crecer.',
      ],
      bg: { image: '/wp-content/uploads/2024/12/pagina-web-empresas.jpg', color: undefined, size: 'cover', position: 'top left' },
      titleColor: '#01213a',
      justify: false,
    },
    {
      label: 'Correo electrónico',
      title: 'Correo profesional para empresas',
      price: 'desde 3,90€/mes',
      paragraphs: [
        'Impulsa tu negocio y tu marca con una dirección de email personalizada que coincide con tu dominio. Crea confianza con una dirección de email con dominio propio como tunombre@tudominio.com.',
        'También puedes combinar tu email con aplicaciones de Microsoft 365 como Word, Excel y Teams, trabajar estés donde estés a través de dispositivos y obtener hasta 50 GB de almacenamiento de email.',
      ],
      bg: { image: '/wp-content/uploads/2024/12/email-para-empresas.jpg', color: '#F1E6E3', size: '85% auto', position: '0% 0%' },
      titleColor: '#000000',
      justify: false,
    },
    {
      label: 'Seguridad',
      title: 'Seguridad para tu negocio y tus clientes',
      price: 'desde 49,99€/mes',
      paragraphs: [
        'Cifra los datos de tu web, tanto si se trata de información de inicio de sesión o números de tarjeta de crédito. Cloudin otorga a tu web un sello del sitio que indica que tus datos están protegidos, y un indicador de confianza al lado de tu dominio que lo confirma.',
      ],
      bg: { image: '/wp-content/uploads/2024/12/seguridad-web-bg.jpg', color: '#EBF0FC', size: '88% auto', position: 'top left' },
      titleColor: '#000000',
      justify: true,
    },
  ],
};

/* ---------- Casos de éxito (RevSlider slider-7, carrusel de 3 diapositivas) ---------- */
export const portfolio = {
  eyebrow: '20 AÑOS CAMBIANDO LAS REGLAS',
  title: ['Y LOS MEJORES ', 'CLIENTES ', 'DEL MUNDO'],
  // Cada diapositiva: 4 (o 3) imágenes en dos columnas.
  slides: [
    { id: 'slide-11', images: ['/wp-content/uploads/2024/05/bendito-tupper.jpg', '/wp-content/uploads/2024/05/subway.jpg', '/wp-content/uploads/2024/04/paddock-motors.jpg', '/wp-content/uploads/2024/05/bmw.jpg'] },
    { id: 'slide-10', images: ['/wp-content/uploads/2024/05/world-duty-free.jpg', '/wp-content/uploads/2024/05/omnisauto.jpg', '/wp-content/uploads/2024/05/sanchez-y-lago-4.jpg'] },
    { id: 'slide-12', images: ['/wp-content/uploads/2024/05/spacio-soluciones-1.jpg', '/wp-content/uploads/2024/05/funkybox.jpg', '/wp-content/uploads/2024/05/anytimefitness.jpg'] },
  ],
};

/* ---------- Ayuda ---------- */
export const help = {
  bg: '/wp-content/uploads/2025/01/ayuda-cloudin-1.jpg',
  name: 'Raquel Sanz',
  role: 'Guía Cloudin',
  title: ['Nos gusta ayudarte con ', 'tus nuevos proyectos'],
  text: '¿No sabes exactamente qué necesitas o cómo empezar online? Escríbenos un email o llámanos. Estaremos encantados de ayudarte, aunque no seas nuestro cliente. Llámanos al +34 900 433 400. ¡Es gratis!',
  text2: 'Te atenderemos o nos pondremos en contacto contigo cuanto antes.',
  button: { label: 'obtener ayuda', href: '/contacto/' },
};

/* ---------- Partners (Flickity en el original) ---------- */
export const partners = {
  title: 'Partners',
  logos: [
    { src: '/wp-content/uploads/2024/05/synology-300x122.jpg', full: '/wp-content/uploads/2024/05/synology.jpg' },
    { src: '/wp-content/uploads/2024/05/google-cloud-300x122.jpg', full: '/wp-content/uploads/2024/05/google-cloud.jpg' },
    { src: '/wp-content/uploads/2024/05/amazon-partner-300x122.jpg', full: '/wp-content/uploads/2024/05/amazon-partner.jpg' },
    { src: '/wp-content/uploads/2024/05/hp-partner-300x122.jpg', full: '/wp-content/uploads/2024/05/hp-partner.jpg' },
    { src: '/wp-content/uploads/2024/05/fortinet-300x122.jpg', full: '/wp-content/uploads/2024/05/fortinet.jpg' },
    { src: '/wp-content/uploads/2024/05/vmware-technical-partner-300x122.jpg', full: '/wp-content/uploads/2024/05/vmware-technical-partner.jpg' },
    { src: '/wp-content/uploads/2024/05/veeamm-300x122.jpg', full: '/wp-content/uploads/2024/05/veeamm.jpg' },
    { src: '/wp-content/uploads/2024/05/plesk-300x122.jpg', full: '/wp-content/uploads/2024/05/plesk.jpg' },
    { src: '/wp-content/uploads/2024/05/sophos-300x122.jpg', full: '/wp-content/uploads/2024/05/sophos.jpg' },
  ],
};

/* ---------- CTA «Reinventa tu negocio» ---------- */
export const cta = {
  title: ['Reinventa tu negocio. ', 'Te ayudamos en todo'],
  button: { label: 'Contactar', href: '/contacto' },
};

/* ---------- Familia Cloudin ---------- */
export const family = [
  { src: '/wp-content/uploads/2025/01/cloudin-famil-1.png', alt: '' },
  { src: '/wp-content/uploads/2025/01/cloudin-famil-2.png', alt: '', href: 'https://thesquads.io/es/' },
  { src: '/wp-content/uploads/2025/01/cloudin-famil-3.png', alt: '', href: 'https://chatbotweb.io/' },
  { src: '/wp-content/uploads/2025/02/cloudin-family-4.png', alt: 'NAS Synology', href: 'https://synology.com.es' },
];

/* ---------- Selector Hosting Web / VPS + planes (añadido; no existe en el original) ---------- */
// TODO: subtítulo de VPS provisional, pendiente de confirmar.
export const planPicker = {
  options: [
    { key: 'web', eyebrow: 'HOSTING', title: 'WEB', text: 'Alojamiento web rápido y fiable', button: 'ver planes', plansTitle: 'Planes de Hosting Web' },
    { key: 'vps', eyebrow: 'HOSTING', title: 'VPS', text: 'Servidores virtuales con recursos dedicados', button: 'ver planes', plansTitle: 'Planes de Hosting VPS' },
  ],
  cloud: { alt: 'Nube de gominola azul translúcida' },
  web: { alt: 'Ventana de navegador de gominola naranja translúcida' },
  cycles: { monthly: 'Mensual', annually: 'Anual' },
  perMonth: '/ mes',
  perYear: '/ año',
  vat: 'Precios sin IVA',
  order: 'Contratar',
  maxFeatures: 5,
  prev: 'Planes anteriores',
  next: 'Más planes',
  unavailable: 'Este ciclo de pago no está disponible para este plan.',
  error: 'Ahora mismo no podemos mostrar los planes. Puedes verlos en el área de cliente.',
  errorLink: { label: 'Ver planes en el área de cliente', href: 'https://panel.cloudin.pro/cart.php' },
} as const;

/* ---------- Vídeo hero bajo el buscador (un vídeo en bucle, sin audio, contado en 4 capítulos) ---------- */
// Cada capítulo empieza en el segundo `start` del vídeo; los títulos son provisionales (ver NOTAS.md, punto 35).
export const videoHero = {
  label: 'Vídeo: de una idea a un proyecto online con Cloudin',
  src: '/video/hero-cloudin.mp4',
  poster: '/video/hero-cloudin.webp',
  duration: 44.2,                                               // s (hasta que el vídeo diga la suya)
  chapters: [
    { start: 0, title: 'Tienes una idea' },                     // ella imagina su tienda de plantas
    { start: 6, title: 'La llevamos a la nube' },               // por la ventana, el avión entra en las nubes
    { start: 24, title: 'Tus clientes te encuentran' },         // al salir de la nube, un cliente encuentra plantas.com
    { start: 34.1, title: 'Tu negocio crece' },                 // la oficina llena de pedidos
  ],
  play: 'Reproducir vídeo',
  pause: 'Pausar vídeo',
  chapter: 'Capítulo',
} as const;

/* ---------- «Hosting para IA» bajo las misiones (añadido a petición del cliente; ver NOTAS.md, punto 42) ---------- */
// TEXTOS PROVISIONALES, para que el cliente los revise: todavía no hay página ni planes de Hosting para IA (el menú
// tiene «Hosting GPU» sin página). No dan cifras, modelos de GPU ni precios. El botón lleva a /contacto/.
export const hostingIA = {
  id: 'hosting-ia',
  badge: 'Nuevo',
  kicker: 'Hosting para',
  title: 'IA',
  text: 'Servidores con GPU para entrenar, ajustar y poner a trabajar tus modelos de inteligencia artificial. Tú eliges el modelo y tus datos se quedan en tu servidor.',
  features: [
    { icon: 'gpu', title: 'Potencia GPU', text: 'Aceleración para entrenar y responder rápido.' },
    { icon: 'lock', title: 'Tu IA, en privado', text: 'Modelos abiertos en tu servidor: tus datos no salen.' },
    { icon: 'api', title: 'Lista para producción', text: 'Tu chatbot, agente o API con dominio y SSL.' },
    { icon: 'help', title: 'Te acompañamos', text: 'Elegimos contigo la máquina y la ponemos en marcha.' },
  ],
  cta: { label: 'Quiero mi hosting IA', href: '/contacto/' },
  chip: { alt: 'Chip de gominola morado con una estrella en relieve' },
  // serigrafía de la placa sobre la que está el chip (decorativa)
  silk: { ref: 'U1', name: 'CLOUDIN · IA', gpu: 'GPU' },
} as const;
