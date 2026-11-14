// Páginas de servicio añadidas a petición del cliente (no existen en el original): /paginas-web/ y /seguridad/.
// Los textos reutilizan lo que ya dice la web (página «Diseño de páginas web», política de seguridad IT,
// características de los planes, data center en España). Son provisionales: ver NOTAS.md, punto 37.

export type IconName =
  | 'design' | 'devices' | 'seo' | 'speed' | 'support' | 'budget'
  | 'lock' | 'backup' | 'server' | 'mail' | 'pulse' | 'uptime';

export type Link = { label: string; href: string };

export type ServicePage = {
  path: string;
  meta: { title: string; description: string };
  hero: {
    eyebrow: string;
    title: string[];          // líneas del titular
    highlight: string;        // última línea, con el resaltado turquesa de «AHORA»
    text: string;
    cta: Link;
    secondary?: Link;
    jelly: 'web' | 'cloud';   // pieza 3D interactiva del encabezado
    tone: 'web' | 'vps';      // color de fondo (los de las tarjetas de la home)
  };
  intro?: { title: string; text: string };
  features: { title: string; items: { icon: IconName; title: string; text: string; link?: Link }[] };
  steps?: { title: string; items: { title: string; text: string; link?: Link }[] };
  band?: { title: string; text: string; link: Link };
  faq?: { title: string; items: { q: string; a: string }[] };
  cta: { title: string; text: string; button: Link; secondary?: Link };
};

export const paginasWeb: ServicePage = {
  path: '/paginas-web/',
  meta: {
    title: 'Diseño de páginas web | Cloudin',
    description: 'Diseñamos páginas web a medida: únicas, rápidas, seguras y adaptadas a cualquier dispositivo, con el SEO integrado desde el principio y soporte continuo.',
  },
  hero: {
    eyebrow: 'Páginas web',
    title: ['PÁGINAS WEB', 'QUE IMPULSAN'],
    highlight: 'TU NEGOCIO',
    text: 'Diseñamos sitios únicos que combinan estética, funcionalidad y rendimiento. Tu página web es la cara visible de tu negocio online.',
    cta: { label: 'Cuéntanos tu proyecto', href: '/contacto/' },
    secondary: { label: 'Busca tu dominio', href: '/dominios/' },
    jelly: 'web',
    tone: 'web',
  },
  intro: {
    title: 'Contamos con cientos de diseños realizados',
    text: 'Cada página que hacemos está pensada para las necesidades concretas de su negocio. No solo diseñamos páginas web: creamos herramientas digitales que conectan con tu público y te ayudan a crecer.',
  },
  features: {
    title: 'Por qué elegir nuestras páginas web',
    items: [
      { icon: 'design', title: 'Diseño a medida', text: 'Nada de plantillas genéricas: cada diseño es único y parte de tu marca, tus objetivos y tu público.' },
      { icon: 'devices', title: 'En cualquier pantalla', text: 'Diseño responsive: tu web funciona perfectamente en el móvil, la tableta y el ordenador.' },
      { icon: 'seo', title: 'SEO desde el principio', text: 'Integramos la optimización para buscadores en el diseño, no como un añadido al final.' },
      { icon: 'speed', title: 'Rápida y segura', text: 'Optimizamos el rendimiento y la seguridad, y probamos cada detalle antes del lanzamiento.' },
      { icon: 'support', title: 'Soporte continuo', text: 'Una web no termina con su lanzamiento: te ayudamos a mantenerla actualizada, segura y siempre operativa.' },
      { icon: 'budget', title: 'Presupuesto claro', text: 'Un presupuesto detallado y sin sorpresas, con paquetes adaptados a cada proyecto.' },
    ],
  },
  steps: {
    title: 'Cómo hacemos tu página web',
    items: [
      { title: 'Reunión inicial', text: 'Entendemos tus necesidades, tus objetivos y la identidad de tu marca.' },
      { title: 'Diseño y desarrollo', text: 'Combinamos creatividad y conocimiento técnico: colores, estructura y contenidos pensados para tu público.' },
      { title: 'Optimización y pruebas', text: 'Nos aseguramos de que sea rápida, segura y responsive, y la probamos a fondo.' },
      { title: 'Lanzamiento y soporte', text: 'Publicamos tu web y seguimos a tu lado para mantenerla al día.' },
    ],
  },
  band: {
    title: 'Todo empieza por un dominio',
    text: 'Tu dominio GRATIS el primer año.',
    link: { label: 'Busca tu dominio', href: '/dominios/' },
  },
  faq: {
    title: 'Preguntas frecuentes',
    items: [
      { q: '¿Qué ventajas tiene una web hecha a medida?', a: 'Un diseño completamente personalizado, adaptado a tu marca y a tus objetivos; una web intuitiva y fácil de navegar; el SEO integrado desde el principio, y soporte técnico continuo para mantenerla actualizada, segura y operativa.' },
      { q: '¿Usáis plantillas?', a: 'No. Cada diseño que creamos es único y parte de tu negocio, tu público y tus objetivos.' },
      { q: '¿Cuánto cuesta una página web?', a: 'Depende de cada proyecto. Antes de empezar recibes un presupuesto detallado y sin sorpresas, y tenemos paquetes adaptados a distintas necesidades.' },
      { q: '¿Qué pasa después del lanzamiento?', a: 'Seguimos contigo: te ayudamos a mantener tu web actualizada, segura y siempre operativa.' },
    ],
  },
  cta: {
    title: '¿Hablamos de tu web?',
    text: 'Cuéntanos qué necesitas y te preparamos un presupuesto detallado.',
    button: { label: 'Contacta con nosotros', href: '/contacto/' },
  },
};

export const seguridad: ServicePage = {
  path: '/seguridad/',
  meta: {
    title: 'Seguridad | Cloudin',
    description: 'La seguridad de tus datos es el centro de nuestro negocio: certificados SSL gratis, copias de seguridad diarias, servidores en España y correo protegido contra el spam.',
  },
  hero: {
    eyebrow: 'Seguridad',
    title: ['TUS DATOS,', 'SIEMPRE'],
    highlight: 'PROTEGIDOS',
    text: 'En Cloudin la seguridad de tus datos es el centro de nuestro negocio. Protegemos tu web, tu correo y tu información con medidas incluidas en nuestros servicios.',
    cta: { label: 'Habla con nosotros', href: '/contacto/' },
    secondary: { label: 'Política de seguridad', href: '/politica-seguridad/' },
    jelly: 'cloud',
    tone: 'vps',
  },
  features: {
    title: 'Qué incluye',
    items: [
      { icon: 'lock', title: 'Certificados SSL gratis', text: 'SSL ilimitado y gratuito en nuestros planes de hosting: tu web y los datos de tus visitantes viajan cifrados.' },
      { icon: 'backup', title: 'Copias de seguridad diarias', text: 'Copias automáticas cada día en los planes Premium, Empresarial y Business, para recuperar tu web si algo sale mal.' },
      { icon: 'server', title: 'Servidores en España', text: 'Tus datos se alojan en nuestro data center en España.', link: { label: 'Conoce el data center', href: '/data-center-espana/' } },
      { icon: 'mail', title: 'Correo protegido', text: 'Filtros antispam configurables para que el correo no deseado no llegue a tu bandeja de entrada.' },
      { icon: 'pulse', title: 'Monitorización', text: 'En nuestros servidores gestionados vigilamos el servicio y nos ocupamos del mantenimiento mensual y de las restauraciones.' },
      { icon: 'uptime', title: '99,95 % de disponibilidad', text: 'Una infraestructura preparada para que tu web y tu correo estén siempre en línea.' },
    ],
  },
  steps: {
    title: '¿Algo no va bien? Te ayudamos',
    items: [
      { title: 'Crees que te han robado las credenciales', text: 'Cambia tu contraseña cuanto antes y contacta con soporte: te indicaremos las medidas inmediatas que puedes tomar.' },
      { title: 'Recibes spam', text: 'Ajusta los filtros antispam de tu correo. Si necesitas ayuda, abre un ticket y lo revisamos contigo.' },
      { title: 'Te llega un correo sospechoso de Cloudin', text: 'Ante la duda, no pulses los enlaces ni descargues adjuntos: comprueba el remitente y consúltanos.' },
      { title: 'Has encontrado una vulnerabilidad', text: 'Infórmanos siguiendo nuestra política de divulgación responsable.', link: { label: 'Cómo informar', href: '/politica-seguridad/' } },
    ],
  },
  band: {
    title: '¿Has encontrado una vulnerabilidad?',
    text: 'Apoyamos la divulgación responsable: investigamos todos los informes y resolvemos los problemas para proteger a nuestros clientes.',
    link: { label: 'Política de seguridad', href: '/politica-seguridad/' },
  },
  faq: {
    title: 'Preguntas frecuentes',
    items: [
      { q: '¿El certificado SSL tiene coste?', a: 'No. En nuestros planes de hosting el SSL es ilimitado y gratuito.' },
      { q: '¿Dónde se guardan mis datos?', a: 'En nuestro data center en España.' },
      { q: '¿Hacéis copias de seguridad?', a: 'Sí: diarias en los planes de hosting Premium, Empresarial y Business.' },
    ],
  },
  cta: {
    title: '¿Tienes dudas sobre la seguridad de tu web?',
    text: 'Nuestro equipo de soporte te ayuda.',
    button: { label: 'Abre un ticket', href: 'https://panel.cloudin.pro/submitticket.php' },
    secondary: { label: 'o contacta con nosotros', href: '/contacto/' },
  },
};
