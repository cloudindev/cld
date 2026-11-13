// Textos y enlaces literales del header y footer del original (comunes a las 90 URLs).
// Los enlaces internos del original son absolutos (https://cloudin.pro/...) y aquí son relativos
// para que la réplica funcione en cualquier dominio; los externos se mantienen idénticos.

export const topbar = {
  icon: '/wp-content/uploads/2024/04/hosting-barato.svg',
  text: 'Tu dominio GRATIS el primer año',
  button: { label: 'más info', href: '#empezar' },
};

export const logo = { src: '/wp-content/uploads/2021/06/cloudin.png', alt: 'Cloudin', width: 120, height: 26 };

export type NavItem = { label: string; href: string; badge?: string; megamenu?: boolean; submenu?: 'hosting' };

// Hosting (desplegable añadido por el cliente; no existe en el original).
export const mainNav: NavItem[] = [
  { label: 'Hosting', href: '/hosting/', submenu: 'hosting' },
  { label: 'Dominios', href: '/dominios/', badge: 'HOT' },
  { label: 'Cloud', href: '/cloud/' },
  { label: 'Casos de éxito', href: '/#portfolio' },
  { label: 'Academy', href: '#', megamenu: true },
  { label: 'Contacto', href: '/contacto/' },
];

export const academyMenu = {
  groups: [
    {
      title: 'Para empresas',
      items: [
        { title: 'Correo electrónico', text: 'Configuración, creación de cuentas y más.', icon: '/wp-content/uploads/2020/10/email-profesional-empresas.png', href: 'https://cloudin.academy/category/correo-electronico/', font: 'poppins' },
        { title: 'Dominios', text: 'Empieza tu proyecto online con un dominio.', icon: '/wp-content/uploads/2020/10/comprar-dominio.png', href: 'https://cloudin.academy/category/dominios/', font: 'chivo' },
      ],
    },
    {
      title: 'Para desarrolladores',
      items: [
        { title: 'Hosting web', text: 'Gestionar tu alojamiento web como un pro.', icon: '/wp-content/uploads/2020/10/alojamiento-web.png', href: 'https://cloudin.academy/category/hosting/', font: 'poppins' },
        { title: 'Wordpress', text: 'Tutoriales, manejo, trucos y más ...', icon: '/wp-content/uploads/2020/10/hosting-wordpress.png', href: 'https://cloudin.academy/category/wordpress/', font: 'poppins' },
      ],
    },
  ],
  button: { label: 'entra en Cloudin Academy', href: 'https://cloudin.academy/' },
} as const;

// Submenú Hosting. TODO: los href '#' no tienen página todavía; los subtítulos son provisionales.
export const hostingMenu = {
  mainTitle: 'Hosting',
  main: [
    { title: 'Hosting Web', href: '/hosting/', icon: '/wp-content/uploads/2020/10/hosting-wordpress.png' },
    { title: 'Hosting VPS', href: '#', icon: '/wp-content/uploads/2020/10/alojamiento-web.png' },
    { title: 'Hosting GPU', href: '#', icon: undefined },
  ],
  specializedTitle: 'Casos de uso',
  specialized: [
    { title: 'Hosting node.js for apps', text: 'Despliega y escala tus aplicaciones Node.js.', href: '#' },
    { title: 'Hosting Wordpress', text: 'Optimizado para que tu WordPress vuele.', href: '#' },
    { title: 'Hosting Woocommerce', text: 'Tu tienda online rápida y segura.', href: '#' },
  ],
} as const;

// Botón de la barra principal (en el original «Únete» → /unete/; cambiado a petición del cliente).
export const uneteButton = { label: 'Iniciar sesión', href: '/iniciar-sesion/' };

export const footer = {
  logo: { src: '/wp-content/uploads/2024/04/cloudin.svg', alt: 'cloudin', width: 120, height: 29 },
  region: {
    label: 'Cambiar región',
    // En el original los tres llevan href="#"; Francia e Italia con un target malformado (ver NOTAS.md).
    items: [
      { label: 'Portugal (soon)', flag: '/wp-content/uploads/2024/05/portugal.png', target: '_self' },
      { label: 'Francia', flag: '/wp-content/uploads/2024/05/francia.png', target: '_blank"', rel: 'nofollow' },
      { label: 'Italia', flag: '/wp-content/uploads/2024/05/italia.png', target: '_blank"', rel: 'nofollow' },
    ],
  },
  topMenu: [
    { label: 'Soporte', href: 'https://panel.cloudin.pro/submitticket.php', external: true, rel: 'nofollow' },
    { label: 'Contacto', href: '/contacto', external: false, rel: undefined },
    { label: 'Academy', href: 'https://cloudin.academy', external: true, rel: 'nofollow' },
    { label: '|\u00a0\u00a0\u00a0\u00a0\u00a0Área de cliente', href: 'https://panel.cloudin.pro/index.php?rp=/login', external: true, rel: 'nofollow' },
  ],
  vat: 'Los precios no incluyen IVA',
  helpEyebrow: '¿Te ayudamos?',
  phone: { label: '+34 900 433 400', href: 'tel:+34900433400' },
  copyright: '© Cloudin | Todos los derechos Reservados',
  operatedBy: 'This website is operated by Cloudin Hosting SL (VAT B56282924). “Cloudin” is a Registered Trademark of Cloudin Hosting SL.',
  legal: [
    { label: 'Aviso legal', href: '/aviso-legal/' },
    { label: 'Privacidad', href: '/privacidad/' },
    { label: 'Cookies', href: '/cookies/', tooltip: true },
    { label: 'Accesibilidad', href: '/accesibilidad/' },
    { label: 'Política de abuso', href: '/politica-abuso/' },
    { label: 'Política de seguridad', href: '/politica-seguridad/' },
  ],
  cookiesTooltip: { title: '¿Busca una exención de responsabilidad sobre cookies?', text: 'No utilizamos cookies, así que relájate y navega .' },
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/cloudin.pro/', icon: 'instagram' },
    { label: 'Linkedin', href: 'https://www.linkedin.com/company/cloudinhosting', icon: 'linkedin' },
  ],
  purpose: 'Nuestro propósito es ayudar a las personas y organizaciones a soñar en grande y avanzar más rápido brindando tecnología en un entorno seguro y confiable para almacenar y procesar datos digitales.',
  columns: [
    {
      title: 'Cloud Computing',
      links: [
        { label: '¿Qué es la nube?', href: '/blog/que-es-la-nube/' },
        { label: 'IaaS (Infrastucture as a Service)', href: '/blog/que-es-el-iaas-infrastructure-as-a-service/' },
      ],
    },
    {
      title: 'Hosting web',
      links: [
        { label: 'Hosting web', href: '/hosting/' },
        { label: 'Dominios', href: '/dominios/' },
        { label: 'Diseño páginas web', href: '/diseno-paginas-web-asturias/' },
        { label: 'Posicionamiento SEO', href: '/posicionamiento-seo-asturias/' },
        { label: 'Alojamiento web en Asturias', href: '/alojamiento-web-asturias/' },
      ],
    },
    {
      title: 'Conócenos',
      links: [
        { label: 'Data Center España', href: '/data-center-espana/' },
        { label: 'Únete', href: '/unete/' },
        { label: 'Blog', href: '/blog/' },
      ],
    },
  ],
};

/* ---------- Pantalla «Iniciar sesión» (añadida; no existe en el original) ---------- */
export const login = {
  title: 'Accede a tu área de cliente',
  text: 'Gestiona tus dominios, hosting, servidores y facturas desde un solo lugar.',
  email: 'Correo electrónico',
  emailPlaceholder: 'tu@empresa.com',
  password: 'Contraseña',
  show: 'Mostrar', hide: 'Ocultar',
  remember: 'Recordarme',
  forgot: { label: '¿Has olvidado tu contraseña?', href: 'https://panel.cloudin.pro/index.php?rp=/password/reset' },
  submit: 'Iniciar sesión',
  sending: 'Comprobando…',
  noAccount: '¿Aún no eres cliente?',
  register: { label: 'Crea tu cuenta', href: 'https://panel.cloudin.pro/register.php' },
  panel: { label: 'Entrar desde el panel de clientes', href: 'https://panel.cloudin.pro/index.php?rp=/login' },
  help: { text: '¿Necesitas ayuda?', label: 'Abre un ticket de soporte', href: 'https://panel.cloudin.pro/submitticket.php' },
};
