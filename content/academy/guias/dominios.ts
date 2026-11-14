import type { Guide } from '../types';

export const dominios: Guide[] = [
  {
    slug: 'apuntar-dominio-dns',
    cat: 'dominios',
    title: 'Apuntar tu dominio a Cloudin (cambio de DNS)',
    card: 'Apuntar tu dominio a Cloudin (DNS)',
    crumb: 'Apuntar tu dominio (DNS)',
    level: 'básico',
    summary: 'Si tu dominio está registrado en otro proveedor, cambia sus servidores de nombres para que tu web y tu correo funcionen con Cloudin.',
    keywords: ['dns', 'cambiar dns', 'nameservers', 'servidores de nombres', 'propagación', 'registro a', 'apuntar', 'nslookup'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'antes-de-empezar', title: 'Antes de empezar',
        blocks: [
          { type: 'p', text: 'Necesitas entrar en el panel del proveedor donde registraste el dominio y tener a mano los servidores de nombres de Cloudin:' },
          { type: 'table', head: ['', 'Servidor de nombres'], rows: [
            ['Primario', '{ns1}'],
            ['Secundario', '{ns2}'],
          ] },
          { type: 'note', tone: 'warn', text: 'Si ya usas el correo de ese dominio en otro sitio, crea antes los buzones en Cloudin: en cuanto cambien los DNS, el correo nuevo empezará a llegar aquí.' },
        ],
      },
      {
        id: 'paso-a-paso', title: 'Paso a paso',
        blocks: [
          { type: 'steps', steps: [
            'Entra en el panel de tu proveedor actual y abre la gestión del dominio.',
            'Busca **Servidores DNS**, **Nameservers** o **Servidores de nombres** y elige usar servidores personalizados.',
            'Borra los que hay y escribe los de Cloudin: {ns1} y {ns2}.',
            'Guarda los cambios. Tu proveedor puede tardar unos minutos en aplicarlos.',
            'Espera a que se propaguen: suele ser cuestión de pocas horas, aunque puede llegar a 24-48 horas.',
          ] },
        ],
      },
      {
        id: 'comprobarlo', title: 'Comprobar que ya apunta',
        blocks: [
          { type: 'p', text: 'Puedes ver qué servidores de nombres tiene tu dominio desde la terminal de cualquier ordenador:' },
          { type: 'code', label: 'Terminal', code: 'nslookup -type=ns tudominio.com' },
          { type: 'p', text: 'Cuando aparezcan los de Cloudin, el cambio está hecho. Si en tu ordenador todavía ves la web antigua, prueba desde los datos del móvil: tu red puede tener guardada la respuesta antigua un rato más.' },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: 'Tu proveedor no te deja cambiar los DNS', text: 'Algunos dominios incluidos en otros paquetes vienen bloqueados. Pide a tu proveedor que los desbloquee o [transfiere el dominio a Cloudin](/academy/dominios/transferir-dominio/).' },
            { title: 'La web funciona pero el correo no llega', text: 'Comprueba que los buzones existen en Cloudin y que no quedan registros MX antiguos en otro proveedor de DNS.' },
            { title: 'Han pasado 48 horas y no cambia nada', text: 'Revisa que los servidores están bien escritos, sin puntos ni espacios de más. Si sigue igual, [abre un ticket]({ticket}).' },
          ] },
        ],
      },
    ],
    related: ['transferir-dominio', 'activar-ssl'],
  },
  {
    slug: 'transferir-dominio',
    cat: 'dominios',
    title: 'Transferir un dominio desde otro proveedor',
    crumb: 'Transferir un dominio',
    level: 'intermedio',
    summary: 'Trae tu dominio a Cloudin para gestionarlo junto a tu hosting y tu correo. Sin cortes: la web sigue funcionando durante la transferencia.',
    keywords: ['transferencia', 'authcode', 'auth code', 'epp', 'código de autorización', 'cambiar de proveedor', 'registrador', 'traer dominio'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'antes-de-empezar', title: 'Antes de empezar',
        blocks: [
          { type: 'p', text: 'Comprueba estas cuatro cosas en el panel de tu proveedor actual:' },
          { type: 'list', items: [
            'El dominio está **desbloqueado** para transferencias',
            'Tienes el **código de autorización** (también llamado AuthCode o EPP)',
            'El correo del titular es correcto: puede llegarte un mensaje para aprobar la transferencia',
            'En los dominios genéricos (.com, .net, .org…) han pasado más de **60 días** desde el registro o la última transferencia',
          ] },
        ],
      },
      {
        id: 'paso-a-paso', title: 'Paso a paso',
        blocks: [
          { type: 'steps', steps: [
            'Entra en el [Área de cliente]({area}), abre **Dominios** y elige la opción de **transferir** un dominio.',
            'Escribe tu dominio y el código de autorización, y completa el pedido.',
            'Si tu proveedor actual te envía un correo para confirmar la salida, apruébalo: la transferencia irá más rápida.',
            'Espera a que termine. Suele tardar de unos días a una semana, y te avisamos por correo cuando acaba.',
          ] },
          { type: 'note', text: 'En los dominios genéricos, la transferencia suele incluir un año más de registro, que se suma a la fecha de caducidad que ya tenías.' },
        ],
      },
      {
        id: 'durante-la-transferencia', title: 'Durante la transferencia',
        blocks: [
          { type: 'p', text: 'La transferencia cambia quién gestiona el dominio, no adónde apunta: tu web y tu correo siguen funcionando con los mismos DNS. Cuando termine, si quieres que apunten a tu hosting de Cloudin, [cambia los servidores de nombres](/academy/dominios/apuntar-dominio-dns/).' },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: 'El código de autorización no es válido', text: 'Cópialo de nuevo, sin espacios. Si sigue fallando, pide uno nuevo a tu proveedor: algunos caducan a los pocos días.' },
            { title: 'La transferencia aparece como rechazada', text: 'Suele ser porque el dominio sigue bloqueado o porque el proveedor actual la ha denegado. Revisa el bloqueo y vuelve a intentarlo.' },
            { title: 'Tu dominio es .es u otra extensión de país', text: 'Algunas extensiones tienen reglas propias. [Abre un ticket]({ticket}) y te guiamos paso a paso.' },
          ] },
        ],
      },
    ],
    related: ['apuntar-dominio-dns', 'renovacion-automatica'],
  },
  {
    slug: 'renovacion-automatica',
    cat: 'dominios',
    title: 'Activar la renovación automática',
    crumb: 'Renovación automática',
    level: 'básico',
    summary: 'Evita perder tu dominio por un despiste: deja que se renueve solo antes de caducar.',
    keywords: ['renovar', 'renovación', 'caducidad', 'caduca', 'vencimiento', 'expira', 'autorenovación'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'por-que', title: 'Por qué activarla',
        blocks: [
          { type: 'p', text: 'Cuando un dominio caduca, la web y el correo dejan de funcionar y, pasado un tiempo, cualquiera podría registrarlo. Con la renovación automática la factura se genera antes de la fecha de caducidad y, si tienes un método de pago guardado, se paga sola.' },
        ],
      },
      {
        id: 'paso-a-paso', title: 'Paso a paso',
        blocks: [
          { type: 'steps', steps: [
            'Entra en el [Área de cliente]({area}) y abre **Dominios** → **Mis dominios**.',
            'Pulsa sobre el dominio que quieres gestionar.',
            'Busca la opción **Renovación automática** y actívala.',
            'Comprueba que tienes un método de pago guardado en tu cuenta para que la factura se pague sin que tengas que hacer nada.',
          ] },
        ],
      },
      {
        id: 'cuando-caduca', title: 'Cuándo caduca tu dominio',
        blocks: [
          { type: 'p', text: 'En **Mis dominios** verás la fecha de vencimiento de cada uno. Los avisos de renovación llegan al correo de tu cuenta: comprueba que es una dirección que lees a menudo.' },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: 'No ves la opción de renovación automática', text: 'Puede que el dominio esté en otra cuenta o pendiente de transferencia. [Abre un ticket]({ticket}) y lo revisamos.' },
            { title: 'El dominio ya ha caducado', text: 'Muchas extensiones permiten recuperarlo durante un periodo de gracia. Escríbenos cuanto antes: cuanto más esperes, más difícil (y caro) será recuperarlo.' },
          ] },
        ],
      },
    ],
    related: ['pagar-facturas', 'transferir-dominio'],
  },
];
