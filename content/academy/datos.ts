// Datos que aparecen en las guías como {clave}. Los que van entre corchetes no están publicados en la web
// y debe completarlos Cloudin (ver NOTAS.md, punto 38); el resto sale de la propia web.
export const datos = {
  // Correo (los puertos son los que da el blog: «IMAP 993 (SSL), POP3 995 (SSL), SMTP 465 (SSL) o 587 (TLS)»)
  imap: '[SERVIDOR IMAP]',
  pop: '[SERVIDOR POP]',
  smtp: '[SERVIDOR SMTP]',
  webmail: '[URL DEL WEBMAIL]',
  // Servidores de nombres (DNS) de Cloudin
  ns1: '[NS1]',
  ns2: '[NS2]',
  // Atención al cliente: página /contacto/ («Atención al cliente de 9h a 18h. Lunes a Viernes»)
  horario: 'Lunes a viernes, de 9 a 18 h',
  telefono: '900 433 400',
  telefonoHref: 'tel:+34900433400',
  // Área de cliente (WHMCS)
  area: 'https://panel.cloudin.pro/',
  ticket: 'https://panel.cloudin.pro/submitticket.php',
} as const;

export type Dato = keyof typeof datos;
export const isDato = (k: string): k is Dato => Object.hasOwn(datos, k);
