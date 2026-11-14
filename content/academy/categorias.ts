// Temas del Centro de Ayuda, en el orden de la portada (la tarjeta oscura «¿Acabas de llegar?» va la última).
// Colores tomados del diseño: son los mismos tramos de la raya de colores.
import type { Category, CatSlug } from './types';

export const categorias: Category[] = [
  {
    slug: 'dominios', name: 'Dominios', short: 'Dominios',
    intro: 'Registra, transfiere y apunta tu dominio sin perder ni un correo por el camino.',
    icon: 'globe', color: '#6779eb', ink: 'light', more: 'Ver todas las guías',
    meta: { title: 'Ayuda con dominios | Cloudin Academy', description: 'Guías paso a paso para apuntar tu dominio a Cloudin, transferirlo desde otro proveedor y activar la renovación automática.' },
  },
  {
    slug: 'hosting', name: 'Hosting', short: 'Hosting',
    intro: 'Todo lo que puedes hacer desde tu panel: webs, bases de datos, certificados y copias.',
    icon: 'server', color: '#dda993', ink: 'dark', more: 'Ver todas las guías',
    meta: { title: 'Ayuda con el hosting | Cloudin Academy', description: 'Guías paso a paso para entrar en tu panel Plesk, activar el certificado SSL de tu web y cambiar la versión de PHP.' },
  },
  {
    slug: 'vps', name: 'VPS', short: 'VPS',
    intro: 'Tu servidor, tus reglas: acceso, seguridad y mantenimiento explicados con calma.',
    icon: 'chip', color: '#68a4a1', ink: 'light', more: 'Ver todas las guías',
    meta: { title: 'Ayuda con tu VPS | Cloudin Academy', description: 'Guías paso a paso para conectarte por SSH a tu VPS, configurar el firewall y crear y restaurar copias de seguridad.' },
  },
  {
    slug: 'correo', name: 'Correo electrónico', short: 'Correo',
    intro: 'Configura tus buzones en cualquier dispositivo y consigue que tus mensajes lleguen.',
    icon: 'mail', color: '#c46e50', ink: 'light', more: 'Ver todas las guías',
    meta: { title: 'Ayuda con el correo electrónico | Cloudin Academy', description: 'Guías paso a paso para configurar tu correo en el móvil, los datos IMAP, POP y SMTP de tu buzón y cómo evitar que tus correos acaben en spam.' },
  },
  {
    slug: 'wordpress', name: 'WordPress', short: 'WordPress',
    intro: 'Instala, migra, acelera y protege tu web. Y qué hacer cuando algo se rompe.',
    icon: 'layout', color: '#b1d5cc', ink: 'dark', more: 'Ver todas las guías',
    meta: { title: 'Ayuda con WordPress | Cloudin Academy', description: 'Guías paso a paso para instalar WordPress en tu hosting, migrarlo a Cloudin y resolver el «error crítico» de tu web.' },
  },
  {
    slug: 'primeros-pasos', name: 'Primeros pasos', short: 'Primeros pasos', card: '¿Acabas de llegar?',
    intro: 'Tres pasos para dejar tu cuenta lista el primer día.',
    icon: 'flag', color: '#b1d5cc', ink: 'dark', featured: true, more: 'Empezar por aquí',
    meta: { title: 'Primeros pasos en Cloudin | Cloudin Academy', description: 'Tres pasos para dejar tu cuenta lista el primer día: entra en el Área de cliente, publica tu primera web y paga y descarga tus facturas.' },
  },
];

export const categoria = (slug: string) => categorias.find(c => c.slug === slug);
export const catBySlug = (slug: CatSlug) => categorias.find(c => c.slug === slug)!;

// «Lo más buscado» (debajo del buscador): texto del botón y búsqueda que lanza
export const masBuscado = [
  { label: 'Configurar correo', q: 'configurar correo' },
  { label: 'Cambiar DNS', q: 'DNS' },
  { label: 'Activar SSL', q: 'SSL' },
  { label: 'Migrar WordPress', q: 'migrar WordPress' },
];

// «Las que más resuelven», por orden
export const populares = [
  'configurar-iphone-android',
  'apuntar-dominio-dns',
  'activar-ssl',
  'migrar-wordpress',
  'datos-imap-pop-smtp',
  'conectar-ssh',
  'error-critico',
  'transferir-dominio',
];
