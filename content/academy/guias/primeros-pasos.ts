import type { Guide } from '../types';

export const primerosPasos: Guide[] = [
  {
    slug: 'area-de-cliente',
    cat: 'primeros-pasos',
    title: 'Entrar al Área de cliente',
    crumb: 'Entrar al Área de cliente',
    level: 'básico',
    summary: 'Desde el Área de cliente gestionas tus servicios, dominios, facturas y tickets de soporte. Así entras y esto es lo que encontrarás.',
    keywords: ['área de cliente', 'area de cliente', 'panel de cliente', 'iniciar sesión', 'login', 'acceso', 'cuenta', 'contraseña olvidada'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'paso-a-paso', title: 'Paso a paso',
        blocks: [
          { type: 'steps', steps: [
            'Abre [panel.cloudin.pro]({area}) o pulsa **Iniciar sesión**, arriba a la derecha de esta web.',
            'Escribe el correo y la contraseña con los que te diste de alta.',
            'Pulsa **Iniciar sesión**. Si es la primera vez, revisa que tus datos de facturación son correctos.',
          ] },
        ],
      },
      {
        id: 'que-encontraras', title: 'Qué encontrarás',
        blocks: [
          { type: 'list', items: [
            '**Servicios**: tus planes de hosting y VPS, con sus datos de acceso',
            '**Dominios**: renovaciones, servidores de nombres y transferencias',
            '**Facturación**: facturas, pagos y métodos de pago',
            '**Soporte**: tus tickets y la opción de abrir uno nuevo',
          ] },
        ],
      },
      {
        id: 'protege-tu-cuenta', title: 'Protege tu cuenta',
        blocks: [
          { type: 'list', items: [
            'Usa una contraseña larga que no uses en ningún otro sitio',
            'Activa la verificación en dos pasos si tu cuenta la tiene disponible',
            'Mantén al día tu correo de contacto: es por donde te llegan los avisos importantes',
          ] },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: 'No recuerdas la contraseña', text: 'En la pantalla de acceso pulsa [¿Has olvidado tu contraseña?](https://panel.cloudin.pro/index.php?rp=/password/reset) y te enviaremos un enlace para crear una nueva.' },
            { title: 'No te llega el correo para recuperarla', text: 'Revisa la carpeta de spam. Si no está, [abre un ticket]({ticket}) o llámanos al [{telefono}]({telefonoHref}).' },
          ] },
        ],
      },
    ],
    related: ['publicar-primera-web', 'pagar-facturas'],
  },
  {
    slug: 'publicar-primera-web',
    cat: 'primeros-pasos',
    title: 'Publicar tu primera web',
    crumb: 'Publicar tu primera web',
    level: 'básico',
    summary: 'De hosting recién contratado a web en línea: los pasos, en orden, para no dejarte nada.',
    keywords: ['empezar', 'publicar', 'subir web', 'primera web', 'httpdocs', 'nueva web', 'lanzar'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'el-orden-importa', title: 'El orden importa',
        blocks: [
          { type: 'p', text: 'Para que tu web se vea con su nombre y con el candado de https, conviene hacer las cosas en este orden. Cada paso tiene su guía por si necesitas el detalle.' },
        ],
      },
      {
        id: 'paso-a-paso', title: 'Paso a paso',
        blocks: [
          { type: 'steps', steps: [
            '**Apunta tu dominio** a Cloudin. Si lo registraste con nosotros, ya está hecho; si no, [cambia los DNS](/academy/dominios/apuntar-dominio-dns/).',
            '**Entra en tu panel** Plesk con los datos del correo de bienvenida. [Ver la guía](/academy/hosting/entrar-panel-plesk/).',
            '**Activa el SSL** gratis para que tu web cargue con https. [Ver la guía](/academy/hosting/activar-ssl/).',
            '**Instala WordPress** o sube los archivos de tu web a la carpeta `httpdocs`. [Ver la guía](/academy/wordpress/instalar-wordpress/).',
            '**Crea tu correo** con tu dominio y [configúralo en el móvil](/academy/correo/configurar-iphone-android/).',
          ] },
        ],
      },
      {
        id: 'ya-tenias-web', title: '¿Ya tenías una web?',
        blocks: [
          { type: 'p', text: 'Si tu web está en otro proveedor, no empieces de cero: [te la migramos gratis](/academy/wordpress/migrar-wordpress/).' },
        ],
      },
    ],
    related: ['entrar-panel-plesk', 'instalar-wordpress'],
  },
  {
    slug: 'pagar-facturas',
    cat: 'primeros-pasos',
    title: 'Pagar y descargar tus facturas',
    crumb: 'Pagar y descargar facturas',
    level: 'básico',
    summary: 'Consulta tus facturas, págalas en un par de clics y descárgalas en PDF para tu contabilidad.',
    keywords: ['factura', 'facturas', 'pagar', 'pago', 'pdf', 'tarjeta', 'iva', 'nif', 'facturación', 'recibo'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'pagar', title: 'Pagar una factura',
        blocks: [
          { type: 'steps', steps: [
            'Entra en el [Área de cliente]({area}) y abre **Facturación** → **Mis facturas**.',
            'Las facturas pendientes aparecen como **Sin pagar**. Pulsa sobre la que quieras pagar.',
            'Elige el método de pago y pulsa **Pagar ahora**.',
            'Cuando se complete, la factura pasa a **Pagada** y te llega la confirmación por correo.',
          ] },
        ],
      },
      {
        id: 'descargar', title: 'Descargarla en PDF',
        blocks: [
          { type: 'steps', steps: [
            'En **Mis facturas**, abre la factura que necesitas.',
            'Pulsa **Descargar** para guardarla en PDF.',
          ] },
        ],
      },
      {
        id: 'datos-de-facturacion', title: 'Tus datos de facturación',
        blocks: [
          { type: 'p', text: 'Las facturas salen con los datos de tu perfil. Si necesitas cambiar el nombre, el NIF o la dirección, actualízalos en los datos de tu cuenta antes de que se genere la siguiente factura.' },
          { type: 'note', text: 'Los precios de la web no incluyen IVA: se añade en la factura.' },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: 'El pago no se completa', text: 'Prueba con otra tarjeta u otro método de pago. Si te han cobrado y la factura sigue sin pagar, [abre un ticket]({ticket}) con el justificante.' },
            { title: 'Necesitas una factura con otros datos', text: '[Escríbenos]({ticket}) con los datos correctos y te ayudamos.' },
          ] },
        ],
      },
    ],
    related: ['area-de-cliente', 'renovacion-automatica'],
  },
];
