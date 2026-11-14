import type { Guide } from '../types';

export const wordpress: Guide[] = [
  {
    slug: 'instalar-wordpress',
    cat: 'wordpress',
    title: 'Instalar WordPress en tu hosting',
    crumb: 'Instalar WordPress',
    level: 'básico',
    summary: 'Desde tu panel Plesk instalas WordPress en un par de clics, con la base de datos y el usuario ya creados.',
    keywords: ['wordpress', 'instalar', 'wp', 'cms', 'crear web', 'wp toolkit'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'antes-de-empezar', title: 'Antes de empezar',
        blocks: [
          { type: 'list', items: [
            'Tu dominio debe [apuntar a Cloudin](/academy/dominios/apuntar-dominio-dns/) para ver la web con su nombre',
            'Activa antes el [certificado SSL](/academy/hosting/activar-ssl/) para instalarla directamente con https',
            'Ten a mano el nombre de tu web y un correo para la administración',
          ] },
        ],
      },
      {
        id: 'paso-a-paso', title: 'Paso a paso',
        blocks: [
          { type: 'steps', steps: [
            'Entra en tu panel Plesk y abre **WordPress** en el menú de la izquierda.',
            'Pulsa **Instalar** y elige el dominio donde quieres la web.',
            'Escribe el título del sitio, el usuario administrador, una contraseña segura y tu correo.',
            'Pulsa **Instalar** y espera unos segundos.',
            'Entra en tu nuevo WordPress desde el propio panel o desde `tudominio.com/wp-admin`.',
          ] },
        ],
      },
      {
        id: 'primeros-ajustes', title: 'Primeros ajustes',
        blocks: [
          { type: 'list', items: [
            'Elige un tema y borra los que no vayas a usar',
            'Instala solo los plugins que necesites y mantenlos actualizados',
            'Activa las actualizaciones automáticas desde la sección WordPress del panel',
          ] },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: 'El instalador dice que la carpeta no está vacía', text: 'Ya hay archivos en el dominio, como una página de bienvenida. Bórralos desde **Archivos** o instala en otra carpeta.' },
            { title: 'Ves una página por defecto en vez de tu web', text: 'Puede que el dominio aún no apunte a Cloudin o que el navegador tenga guardada la versión antigua. Prueba en una ventana privada.' },
          ] },
        ],
      },
    ],
    related: ['migrar-wordpress', 'activar-ssl'],
  },
  {
    slug: 'migrar-wordpress',
    cat: 'wordpress',
    title: 'Migrar tu WordPress a Cloudin',
    crumb: 'Migrar tu WordPress',
    level: 'intermedio',
    summary: 'Trae tu web desde otro proveedor sin perder nada. Podemos hacerlo por ti gratis, o puedes hacerlo tú con las herramientas del panel.',
    keywords: ['migración', 'migrar', 'mover web', 'cambiar de hosting', 'trasladar', 'duplicator', 'all-in-one wp migration', 'wp-config'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'te-la-migramos', title: 'Te la migramos gratis',
        blocks: [
          { type: 'p', text: 'La migración es **gratuita**: [abre un ticket]({ticket}) con la dirección de tu web y los accesos a tu proveedor actual, y nuestro equipo se encarga de todo. Te avisamos cuando esté lista para cambiar los DNS.' },
        ],
      },
      {
        id: 'hacerlo-tu', title: 'Si prefieres hacerlo tú',
        blocks: [
          { type: 'steps', steps: [
            'Haz una copia completa de tu web actual: archivos y base de datos.',
            'En tu panel Plesk, abre **WordPress** y usa la opción de **migrar** o **importar** un sitio, con los datos de acceso a tu hosting antiguo.',
            'Si lo prefieres, usa un plugin de migración como All-in-One WP Migration o Duplicator: exporta en el hosting antiguo e importa en el nuevo.',
            'Revisa la web copiada antes de cambiar nada.',
            'Cuando esté bien, [cambia los DNS](/academy/dominios/apuntar-dominio-dns/) de tu dominio para que apunten a Cloudin.',
          ] },
        ],
      },
      {
        id: 'despues-de-migrar', title: 'Después de migrar',
        blocks: [
          { type: 'list', items: [
            'Activa el [certificado SSL](/academy/hosting/activar-ssl/) en el nuevo hosting',
            'Revisa los formularios y los correos que envía la web',
            'Mantén el hosting antiguo unos días por si necesitas recuperar algo',
          ] },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: '«Error al establecer una conexión con la base de datos»', text: 'Los datos de `wp-config.php` no coinciden con la base de datos nueva. Revisa `DB_NAME`, `DB_USER`, `DB_PASSWORD` y `DB_HOST`.' },
            { title: 'Las imágenes o los enlaces llevan al dominio antiguo', text: 'Sustituye la dirección antigua por la nueva en la base de datos, con un plugin de buscar y reemplazar o con `wp search-replace`.' },
            { title: 'La web sigue cargando desde el hosting antiguo', text: 'Los DNS tardan unas horas en propagarse. Compruébalo en una ventana privada o con los datos del móvil.' },
          ] },
        ],
      },
    ],
    related: ['apuntar-dominio-dns', 'error-critico'],
  },
  {
    slug: 'error-critico',
    cat: 'wordpress',
    title: 'Resolver el «error crítico» de tu web',
    crumb: 'Resolver el «error crítico»',
    level: 'intermedio',
    summary: '«Ha habido un error crítico en esta web» casi siempre lo provoca un plugin, el tema o la versión de PHP. Así encuentras al culpable y recuperas tu web.',
    keywords: ['error crítico', 'error critico', 'pantalla blanca', 'web caída', 'fatal error', 'debug', 'wp_debug', 'modo de recuperación', 'plugin'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'modo-de-recuperacion', title: 'Primero, mira tu correo',
        blocks: [
          { type: 'p', text: 'Cuando ocurre el error, WordPress envía un correo al administrador con el asunto **«Tu sitio está experimentando un problema técnico»**. Incluye un enlace al **modo de recuperación**: entras en el escritorio con el plugin o el tema que falla en pausa, y puedes desactivarlo.' },
        ],
      },
      {
        id: 'encontrar-la-causa', title: 'Encontrar la causa',
        blocks: [
          { type: 'p', text: 'Si no te llega el correo, activa el registro de errores. En **Archivos** de tu panel Plesk, edita `wp-config.php` y añade estas líneas antes de la que dice «¡Eso es todo, deja de editar!»:' },
          { type: 'code', label: 'wp-config.php', code: "define( 'WP_DEBUG', true );\ndefine( 'WP_DEBUG_LOG', true );\ndefine( 'WP_DEBUG_DISPLAY', false );" },
          { type: 'p', text: 'Vuelve a cargar la web y abre `wp-content/debug.log`: la última línea con **Fatal error** te dice qué plugin o tema falla.' },
        ],
      },
      {
        id: 'desactivar-el-culpable', title: 'Desactivar al culpable',
        blocks: [
          { type: 'steps', steps: [
            'En **Archivos**, entra en `wp-content/plugins` y cambia el nombre de la carpeta del plugin que falla (por ejemplo, añadiéndole `-off`).',
            'Si no sabes cuál es, cambia el nombre de la carpeta `plugins` entera: se desactivarán todos.',
            'Si el problema es el tema, cambia el nombre de su carpeta en `wp-content/themes`: WordPress usará otro tema instalado.',
            'Recarga la web. Cuando funcione, reactiva los plugins uno a uno hasta dar con el que falla.',
          ] },
          { type: 'note', text: 'Si el error apareció justo después de [cambiar la versión de PHP](/academy/hosting/cambiar-version-php/), vuelve a la anterior: es la solución más rápida.' },
          { type: 'note', tone: 'warn', text: 'Cuando acabes, vuelve a poner `WP_DEBUG` en `false`: el registro de errores no debe quedarse activo en una web publicada.' },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: 'El registro dice «Allowed memory size exhausted»', text: "A tu web le falta memoria. Añade `define( 'WP_MEMORY_LIMIT', '256M' );` a `wp-config.php`." },
            { title: 'No aparece el archivo debug.log', text: 'Revisa que las líneas están antes de «¡Eso es todo, deja de editar!» y vuelve a cargar la web para que el error se repita.' },
            { title: 'Nada de esto funciona', text: '[Abre un ticket]({ticket}) con la dirección de la web y la última línea de `debug.log`, y lo revisamos contigo.' },
          ] },
        ],
      },
    ],
    related: ['cambiar-version-php', 'migrar-wordpress'],
  },
];
