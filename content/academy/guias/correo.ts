import type { Guide } from '../types';

export const correo: Guide[] = [
  {
    slug: 'configurar-iphone-android',
    cat: 'correo',
    title: 'Configurar tu correo en iPhone y Android',
    crumb: 'Configurar en iPhone y Android',
    level: 'básico',
    summary: 'Añade tu buzón de Cloudin a la app de correo de tu móvil para leer y enviar mensajes desde cualquier sitio.',
    keywords: ['móvil', 'movil', 'teléfono', 'ios', 'mail', 'gmail', 'samsung', 'cuenta de correo', 'buzón', 'configurar correo'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'antes-de-empezar', title: 'Antes de empezar',
        blocks: [
          { type: 'p', text: 'Ten a mano estas tres cosas. Si no recuerdas la contraseña, puedes cambiarla desde tu panel de hosting.' },
          { type: 'list', items: [
            'Tu dirección de correo completa, por ejemplo **nombre@tudominio.com**',
            'La contraseña de ese buzón',
            'Los datos del servidor que tienes justo aquí debajo',
          ] },
        ],
      },
      {
        id: 'datos-del-servidor', title: 'Datos del servidor',
        blocks: [
          { type: 'table', head: ['', 'Servidor', 'Puerto', 'Seguridad'], rows: [
            ['Entrante (IMAP)', '{imap}', '993', 'SSL/TLS'],
            ['Saliente (SMTP)', '{smtp}', '465', 'SSL/TLS'],
          ], note: 'El usuario es siempre tu dirección de correo completa, tanto para el correo entrante como para el saliente.' },
        ],
      },
      {
        id: 'paso-a-paso', title: 'Paso a paso',
        blocks: [
          { type: 'tabs', tabs: [
            { label: 'iPhone', steps: [
              'Abre **Ajustes**, entra en **Mail** y toca **Cuentas**.',
              'Toca **Añadir cuenta**, elige **Otra** y después **Añadir cuenta de correo**.',
              'Escribe tu nombre, tu dirección de correo y la contraseña del buzón. Pulsa **Siguiente**.',
              'Deja marcado **IMAP** y rellena el servidor entrante y el saliente con los datos de la tabla. En ambos, el usuario es tu dirección completa.',
              'Pulsa **Siguiente**, espera a que se verifique la cuenta y toca **Guardar**. Tu buzón ya aparece en la app Mail.',
            ] },
            { label: 'Android', steps: [
              'Abre la app **Gmail**, toca tu foto de perfil y elige **Añadir otra cuenta**.',
              'Elige **Otra**, escribe tu dirección de correo y toca **Configuración manual**.',
              'Selecciona **Personal (IMAP)** y escribe la contraseña del buzón.',
              'Rellena el servidor entrante y el saliente con los datos de la tabla, con su puerto y su seguridad. En ambos, el usuario es tu dirección completa.',
              'Elige cada cuánto quieres sincronizar, ponle un nombre a la cuenta y toca **Siguiente**. Ya puedes leer y enviar desde Gmail.',
            ] },
          ] },
          { type: 'note', text: 'En las versiones más recientes de iOS, Mail está dentro de **Ajustes → Apps**. Si usas otra app de correo en Android, los datos que te pide son los mismos.' },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: '«No se puede verificar el nombre o la contraseña»', text: 'Revisa que el usuario sea la dirección completa, no solo la parte anterior a la arroba, y vuelve a escribir la contraseña.' },
            { title: 'Recibes correos pero no puedes enviar', text: 'El servidor saliente también necesita usuario y contraseña. Compruébalos junto al puerto y la seguridad de la tabla.' },
            { title: 'Aviso de certificado no fiable', text: 'Suele indicar que el nombre del servidor no es exactamente el de la tabla. Cópialo tal cual, sin espacios.' },
          ] },
        ],
      },
    ],
    related: ['evitar-spam', 'datos-imap-pop-smtp'],
  },
  {
    slug: 'datos-imap-pop-smtp',
    cat: 'correo',
    title: 'Datos IMAP, POP y SMTP de tu buzón',
    crumb: 'Datos IMAP, POP y SMTP',
    level: 'básico',
    summary: 'Los servidores, puertos y tipos de seguridad que te pide cualquier programa de correo: Outlook, Thunderbird, Apple Mail o la app de tu móvil.',
    keywords: ['outlook', 'thunderbird', 'puerto', 'puertos', 'servidor entrante', 'servidor saliente', 'pop3', 'ssl', 'tls', 'starttls', 'configurar correo'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'los-datos', title: 'Los datos',
        blocks: [
          { type: 'table', head: ['', 'Servidor', 'Puerto', 'Seguridad'], rows: [
            ['Entrante (IMAP)', '{imap}', '993', 'SSL/TLS'],
            ['Entrante (POP3)', '{pop}', '995', 'SSL/TLS'],
            ['Saliente (SMTP)', '{smtp}', '465', 'SSL/TLS'],
            ['Saliente (alternativo)', '{smtp}', '587', 'STARTTLS'],
          ], note: 'Usuario: tu dirección de correo completa. Contraseña: la de ese buzón. El servidor saliente también pide usuario y contraseña.' },
        ],
      },
      {
        id: 'imap-o-pop', title: '¿IMAP o POP?',
        blocks: [
          { type: 'p', text: '**IMAP** deja los mensajes en el servidor y sincroniza todos tus dispositivos: lo que lees, mueves o borras en el móvil se ve igual en el ordenador. Es la opción que te recomendamos.' },
          { type: 'p', text: '**POP3** descarga los mensajes a un solo dispositivo y, según cómo lo configures, los borra del servidor. Solo tiene sentido si lees el correo desde un único equipo y quieres guardarlo allí.' },
          { type: 'note', tone: 'warn', text: 'Si pasas de POP a IMAP, guarda antes una copia de los mensajes que solo tengas en tu ordenador: IMAP muestra únicamente lo que está en el servidor.' },
        ],
      },
      {
        id: 'en-tu-programa', title: 'En tu programa de correo',
        blocks: [
          { type: 'steps', steps: [
            'Busca la opción de **añadir cuenta** y elige la configuración **manual** o **avanzada**: si dejas que el programa detecte los datos solo, puede elegir mal.',
            'Elige **IMAP** como tipo de cuenta y escribe el servidor entrante, el puerto y la seguridad de la tabla.',
            'En el servidor saliente escribe sus datos y marca la opción de que **requiere autenticación**, con el mismo usuario y contraseña.',
            'Guarda y envíate un correo de prueba para comprobar que sale y que llega.',
          ] },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: 'El puerto 465 no conecta', text: 'Prueba con el **587** y seguridad **STARTTLS**. Algunas redes, como las de hoteles u oficinas, bloquean ciertos puertos de salida.' },
            { title: 'Te pide aceptar un certificado', text: 'Comprueba que el nombre del servidor es exactamente el de la tabla. Si usas otro nombre, el certificado no coincide.' },
            { title: 'Los enviados no aparecen en el móvil', text: 'Con IMAP, indica a tu programa que guarde los mensajes enviados en la carpeta **Enviados** del servidor.' },
          ] },
        ],
      },
    ],
    related: ['configurar-iphone-android', 'evitar-spam'],
  },
  {
    slug: 'evitar-spam',
    cat: 'correo',
    title: 'Evitar que tus correos acaben en spam',
    crumb: 'Evitar el spam',
    level: 'intermedio',
    summary: 'Configura SPF, DKIM y DMARC en tu dominio y conoce los hábitos que ayudan a que tus mensajes lleguen a la bandeja de entrada.',
    keywords: ['correo no deseado', 'bandeja de entrada', 'spf', 'dkim', 'dmarc', 'entregabilidad', 'no llegan', 'newsletter', 'registro txt'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'por-que-pasa', title: 'Por qué pasa',
        blocks: [
          { type: 'p', text: 'Gmail, Outlook y el resto de proveedores deciden si un mensaje es de fiar mirando quién lo envía y desde dónde. Si tu dominio no dice qué servidores pueden enviar en su nombre, o el mensaje parece publicitario, acaba en spam o ni siquiera llega.' },
          { type: 'list', items: [
            'Tu dominio no tiene los registros **SPF**, **DKIM** y **DMARC**',
            'Envías desde un servicio que no está autorizado en tu SPF, como una herramienta de newsletters',
            'El mensaje parece publicitario: solo una imagen, muchos enlaces o el asunto en mayúsculas',
          ] },
        ],
      },
      {
        id: 'los-tres-registros', title: 'Los tres registros',
        blocks: [
          { type: 'table', head: ['', 'Para qué sirve', 'Cómo empieza'], rows: [
            ['SPF', 'Dice qué servidores pueden enviar correo de tu dominio', '`v=spf1`'],
            ['DKIM', 'Firma cada mensaje para demostrar que nadie lo ha cambiado', '`v=DKIM1`'],
            ['DMARC', 'Indica qué hacer con los mensajes que no pasan SPF o DKIM', '`v=DMARC1`'],
          ], note: 'Solo puede haber **un** registro SPF por dominio. Si envías desde otros servicios (newsletters, tienda online), añádelos a ese mismo registro con `include:`.' },
        ],
      },
      {
        id: 'activarlos-en-plesk', title: 'Activarlos en Plesk',
        blocks: [
          { type: 'steps', steps: [
            'Entra en tu panel Plesk y abre **Sitios web y dominios**.',
            'En tu dominio, abre **Configuración de correo** y activa **DKIM** para firmar el correo saliente. Guarda los cambios.',
            'Abre **Configuración de DNS** y comprueba que hay un registro TXT que empieza por `v=spf1` y otro en `_dmarc.tudominio.com`.',
            'Si tu dominio usa los DNS de otro proveedor, copia allí esos registros tal cual: lo que cambies en Plesk no se aplica fuera.',
          ] },
          { type: 'note', text: 'Los cambios de DNS pueden tardar unas horas en verse en todo el mundo.' },
        ],
      },
      {
        id: 'buenas-practicas', title: 'Buenas prácticas',
        blocks: [
          { type: 'list', items: [
            'Envía desde una dirección de tu dominio, nunca desde una de Gmail u Outlook en nombre de tu empresa',
            'Para envíos masivos usa una herramienta de newsletters y autorízala en tu SPF',
            'Equilibra texto e imágenes y evita asuntos tipo «¡¡GRATIS!!»',
            'Incluye siempre un enlace para darse de baja en los envíos comerciales',
          ] },
        ],
      },
      {
        id: 'comprobarlo', title: 'Comprobarlo',
        blocks: [
          { type: 'p', text: 'Envía un mensaje a una cuenta de Gmail, abre el menú del mensaje y elige **Mostrar original**: verás si SPF, DKIM y DMARC aparecen como **PASS**. Si alguno falla, revisa ese registro o [abre un ticket]({ticket}) y lo miramos contigo.' },
        ],
      },
    ],
    related: ['datos-imap-pop-smtp', 'apuntar-dominio-dns'],
  },
];
