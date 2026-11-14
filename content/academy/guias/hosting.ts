import type { Guide } from '../types';

export const hosting: Guide[] = [
  {
    slug: 'entrar-panel-plesk',
    cat: 'hosting',
    title: 'Entrar a tu panel Plesk por primera vez',
    crumb: 'Entrar a tu panel Plesk',
    level: 'básico',
    summary: 'Plesk es el panel desde el que gestionas tu hosting: webs, correo, bases de datos, certificados y copias. Así entras y esto es lo primero que verás.',
    keywords: ['panel de control', 'acceso', 'login', 'usuario', 'contraseña', 'correo de bienvenida'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'tus-datos-de-acceso', title: 'Tus datos de acceso',
        blocks: [
          { type: 'p', text: 'Al contratar el hosting te enviamos un correo de bienvenida con la dirección del panel, tu usuario y tu contraseña. También los tienes en el [Área de cliente]({area}): abre **Servicios** y pulsa sobre tu plan de hosting.' },
        ],
      },
      {
        id: 'paso-a-paso', title: 'Paso a paso',
        blocks: [
          { type: 'steps', steps: [
            'Abre la dirección del panel que aparece en tu correo de bienvenida.',
            'Escribe tu usuario y tu contraseña y pulsa **Iniciar sesión**.',
            'Abre **Sitios web y dominios**: desde ahí se gestiona casi todo lo de tu web.',
            'Cambia la contraseña por una solo tuya desde tu perfil, arriba a la derecha, y guárdala en un gestor de contraseñas.',
          ] },
        ],
      },
      {
        id: 'que-puedes-hacer', title: 'Qué puedes hacer desde Plesk',
        blocks: [
          { type: 'list', items: [
            '**Sitios web y dominios**: tus webs, subdominios, certificados SSL y versión de PHP',
            '**Correo**: buzones, redirecciones y respuestas automáticas',
            '**Bases de datos**: bases de datos y usuarios para tus aplicaciones',
            '**Archivos**: subir, editar y descomprimir ficheros sin programas externos',
            '**WordPress**: instalar y mantener tus WordPress desde un solo sitio',
          ] },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: 'No recuerdas la contraseña del panel', text: 'En la pantalla de acceso de Plesk usa la opción para **recuperar la contraseña**, o [abre un ticket]({ticket}) y te ayudamos.' },
            { title: 'El navegador avisa de que la conexión no es privada', text: 'Comprueba que usas exactamente la dirección de tu correo de bienvenida. Si el aviso sigue, escríbenos antes de continuar.' },
          ] },
        ],
      },
    ],
    related: ['activar-ssl', 'instalar-wordpress'],
  },
  {
    slug: 'activar-ssl',
    cat: 'hosting',
    title: 'Activar el certificado SSL de tu web',
    crumb: 'Activar el certificado SSL',
    level: 'básico',
    summary: 'Tu hosting incluye certificado SSL gratis para todas tus webs. Actívalo en un par de minutos y haz que tu web cargue siempre con https.',
    keywords: ['ssl', 'https', 'candado', 'certificado', "let's encrypt", 'lets encrypt', 'sitio no seguro', 'tls'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'antes-de-empezar', title: 'Antes de empezar',
        blocks: [
          { type: 'list', items: [
            'El dominio debe **apuntar ya a Cloudin**: el certificado se valida comprobando que el dominio llega a tu hosting',
            'Si acabas de [cambiar los DNS](/academy/dominios/apuntar-dominio-dns/), espera a que se propaguen antes de pedirlo',
          ] },
        ],
      },
      {
        id: 'paso-a-paso', title: 'Paso a paso',
        blocks: [
          { type: 'steps', steps: [
            'Entra en tu panel Plesk y abre **Sitios web y dominios**.',
            'En tu dominio, pulsa **Certificados SSL/TLS**.',
            'Instala el certificado gratuito de **Let’s Encrypt** y marca también la versión con **www**.',
            'Espera unos segundos a que se emita e instale.',
            'Activa la opción de **redirigir de HTTP a HTTPS** para que todas las visitas lleguen por la versión segura.',
          ] },
        ],
      },
      {
        id: 'renovacion', title: 'Renovación',
        blocks: [
          { type: 'p', text: 'Los certificados de Let’s Encrypt duran 90 días, pero el panel los renueva solo antes de que caduquen. No tienes que hacer nada mientras el dominio siga apuntando a tu hosting.' },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: 'El certificado no se puede emitir', text: 'Casi siempre es porque el dominio todavía no apunta a tu hosting. [Comprueba los DNS](/academy/dominios/apuntar-dominio-dns/) y vuelve a intentarlo pasadas unas horas.' },
            { title: 'La web sale con el candado tachado', text: 'Hay imágenes o scripts que se cargan con http. En WordPress, revisa que la dirección del sitio empieza por https en **Ajustes → Generales**.' },
            { title: 'La web entra en un bucle de redirecciones', text: 'Puede que la redirección a HTTPS esté activada dos veces, en el panel y en un plugin. Deja solo una.' },
          ] },
        ],
      },
    ],
    related: ['apuntar-dominio-dns', 'cambiar-version-php'],
  },
  {
    slug: 'cambiar-version-php',
    cat: 'hosting',
    title: 'Cambiar la versión de PHP',
    crumb: 'Cambiar la versión de PHP',
    level: 'intermedio',
    summary: 'Usa una versión de PHP actual para que tu web sea más rápida y segura, y cámbiala en un momento si un plugin o una aplicación necesita otra.',
    keywords: ['php', 'versión', 'actualizar php', 'compatibilidad', 'extensiones'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'antes-de-empezar', title: 'Antes de empezar',
        blocks: [
          { type: 'list', items: [
            'Haz una **copia de seguridad** de tu web',
            'Comprueba qué versiones admiten tu tema, tus plugins o tu aplicación',
            'Si usas WordPress, actualiza el núcleo y los plugins antes del cambio',
          ] },
        ],
      },
      {
        id: 'paso-a-paso', title: 'Paso a paso',
        blocks: [
          { type: 'steps', steps: [
            'Entra en tu panel Plesk y abre **Sitios web y dominios**.',
            'En tu dominio, pulsa **Configuración de PHP**.',
            'Elige la nueva versión en la lista **Versión de PHP**.',
            'Pulsa **Aceptar** y abre tu web para comprobar que todo funciona.',
          ] },
        ],
      },
      {
        id: 'que-version-elegir', title: 'Qué versión elegir',
        blocks: [
          { type: 'p', text: 'La más reciente que admitan tu web y sus plugins. Las versiones antiguas dejan de recibir parches de seguridad y son más lentas. Si después del cambio algo falla, vuelve a la versión anterior desde el mismo sitio: el cambio es inmediato.' },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: 'La web muestra un error o se queda en blanco', text: 'Vuelve a la versión anterior y revisa qué plugin o tema no es compatible. En WordPress, mira [cómo resolver el «error crítico»](/academy/wordpress/error-critico/).' },
            { title: 'Te falta una extensión de PHP', text: 'En la misma pantalla puedes ajustar algunos valores de PHP. Si necesitas una extensión que no está, [abre un ticket]({ticket}).' },
          ] },
        ],
      },
    ],
    related: ['error-critico', 'activar-ssl'],
  },
];
