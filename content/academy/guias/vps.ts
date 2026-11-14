import type { Guide } from '../types';

export const vps: Guide[] = [
  {
    slug: 'conectar-ssh',
    cat: 'vps',
    title: 'Conectarte por SSH a tu VPS',
    crumb: 'Conectarte por SSH',
    level: 'intermedio',
    summary: 'SSH te da acceso cifrado a la línea de comandos de tu servidor. Así te conectas desde Windows, macOS o Linux, y así usas claves en lugar de contraseña.',
    keywords: ['ssh', 'terminal', 'consola', 'putty', 'powershell', 'clave ssh', 'root', 'acceso', 'servidor'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'antes-de-empezar', title: 'Antes de empezar',
        blocks: [
          { type: 'p', text: 'Necesitas la **IP de tu VPS**, el **usuario** y la **contraseña** que te enviamos al activarlo. También los encuentras en el [Área de cliente]({area}), dentro de **Servicios**.' },
        ],
      },
      {
        id: 'conectarte', title: 'Conectarte',
        blocks: [
          { type: 'tabs', tabs: [
            { label: 'macOS y Linux', steps: [
              'Abre la app **Terminal**.',
              'Escribe `ssh usuario@IP` con tu usuario y la IP de tu VPS, y pulsa Intro.',
              'La primera vez te preguntará si confías en el servidor: escribe `yes`.',
              'Escribe la contraseña (no verás nada mientras escribes) y pulsa Intro.',
            ] },
            { label: 'Windows', steps: [
              'Abre **PowerShell** o **Terminal** desde el menú Inicio.',
              'Escribe `ssh usuario@IP` y pulsa Intro.',
              'Acepta la huella del servidor escribiendo `yes`.',
              'Escribe la contraseña y pulsa Intro. Si prefieres un programa con ventanas, usa **PuTTY** con los mismos datos.',
            ] },
          ] },
        ],
      },
      {
        id: 'claves-ssh', title: 'Claves en lugar de contraseña',
        blocks: [
          { type: 'p', text: 'Una clave SSH es más segura que una contraseña y te ahorra escribirla cada vez. Créala en tu ordenador y cópiala al servidor:' },
          { type: 'code', label: 'Terminal', code: 'ssh-keygen -t ed25519\nssh-copy-id usuario@IP' },
          { type: 'p', text: 'En Windows no viene `ssh-copy-id`: copia el contenido de tu clave pública (el fichero `.pub`) al final de `~/.ssh/authorized_keys` en el servidor.' },
          { type: 'note', tone: 'warn', text: 'Antes de desactivar el acceso con contraseña, comprueba desde otra ventana que puedes entrar con la clave. Si no, podrías quedarte fuera.' },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: '«Connection refused» o «Connection timed out»', text: 'Revisa la IP y que el puerto 22 (o el que hayas configurado) esté abierto en el [firewall](/academy/vps/configurar-firewall/).' },
            { title: '«Permission denied»', text: 'El usuario o la contraseña no son correctos. Cuidado con las mayúsculas y con la distribución del teclado.' },
            { title: '«REMOTE HOST IDENTIFICATION HAS CHANGED»', text: 'Pasa si has reinstalado el VPS. Borra la huella antigua con `ssh-keygen -R IP` y vuelve a conectar.' },
          ] },
        ],
      },
    ],
    related: ['configurar-firewall', 'copia-seguridad'],
  },
  {
    slug: 'configurar-firewall',
    cat: 'vps',
    title: 'Configurar el firewall paso a paso',
    crumb: 'Configurar el firewall',
    level: 'avanzado',
    summary: 'Deja abiertos solo los puertos que usas y cierra el resto. Así lo haces con UFW o firewalld sin quedarte fuera de tu propio servidor.',
    keywords: ['firewall', 'cortafuegos', 'ufw', 'firewalld', 'iptables', 'puertos', 'seguridad', 'abrir puerto'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'antes-de-empezar', title: 'Antes de empezar',
        blocks: [
          { type: 'list', items: [
            'Conéctate a tu VPS [por SSH](/academy/vps/conectar-ssh/) con un usuario con permisos de administrador',
            'Apunta qué servicios usas: web (80 y 443), SSH (22), correo…',
            'Si tu VPS tiene Plesk, usa su extensión **Firewall** en lugar de estos comandos',
          ] },
        ],
      },
      {
        id: 'paso-a-paso', title: 'Paso a paso',
        blocks: [
          { type: 'tabs', tabs: [
            { label: 'Ubuntu y Debian', steps: [
              'Instala UFW si no lo tienes: `sudo apt install ufw`.',
              'Permite SSH **antes de activar nada**: `sudo ufw allow OpenSSH`.',
              'Abre la web: `sudo ufw allow 80,443/tcp`.',
              'Activa el firewall con `sudo ufw enable` y confirma con `y`.',
              'Comprueba las reglas: `sudo ufw status verbose`.',
            ] },
            { label: 'AlmaLinux y Rocky', steps: [
              'Arranca el servicio: `sudo systemctl enable --now firewalld`.',
              'Permite SSH: `sudo firewall-cmd --permanent --add-service=ssh`.',
              'Abre la web: `sudo firewall-cmd --permanent --add-service=http --add-service=https`.',
              'Aplica los cambios: `sudo firewall-cmd --reload`.',
              'Comprueba las reglas: `sudo firewall-cmd --list-all`.',
            ] },
          ] },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: 'Te has quedado fuera del servidor', text: 'Si cerraste el puerto de SSH, [abre un ticket]({ticket}) y te ayudamos a recuperar el acceso.' },
            { title: 'Cambiaste el puerto de SSH', text: 'Abre el puerto nuevo antes de activar el firewall, por ejemplo con `sudo ufw allow 2222/tcp`.' },
            { title: 'La web no carga después de activarlo', text: 'Comprueba que los puertos 80 y 443 aparecen como permitidos en la lista de reglas.' },
          ] },
        ],
      },
    ],
    related: ['conectar-ssh', 'copia-seguridad'],
  },
  {
    slug: 'copia-seguridad',
    cat: 'vps',
    title: 'Crear y restaurar una copia de seguridad',
    crumb: 'Copias de seguridad',
    level: 'intermedio',
    summary: 'Una copia que no has probado a restaurar no es una copia. Así guardas los archivos y la base de datos de tu VPS, y así los recuperas.',
    keywords: ['backup', 'copia', 'restaurar', 'mysqldump', 'tar', 'rsync', 'recuperar', 'base de datos'],
    updated: '2026-11-14',
    sections: [
      {
        id: 'que-copiar', title: 'Qué copiar',
        blocks: [
          { type: 'list', items: [
            'Los **archivos** de tus webs y aplicaciones (por ejemplo, `/var/www`)',
            'Las **bases de datos**, exportadas a un fichero',
            'Los **ficheros de configuración** que hayas cambiado (por ejemplo, `/etc/nginx`)',
          ] },
        ],
      },
      {
        id: 'crear-la-copia', title: 'Crear la copia',
        blocks: [
          { type: 'steps', steps: [
            'Exporta la base de datos: `mysqldump -u usuario -p nombre_bd > bd.sql`.',
            'Comprime los archivos junto con la exportación: `tar -czf copia-$(date +%F).tar.gz /var/www bd.sql`.',
            'Llévate la copia fuera del servidor: a tu ordenador con `scp` o a otro almacenamiento con `rsync`.',
            'Guarda varias copias de días distintos, no solo la última.',
          ] },
          { type: 'note', text: 'Si tu VPS tiene Plesk, puedes programar copias automáticas desde su administrador de copias de seguridad, en **Herramientas y configuración**.' },
        ],
      },
      {
        id: 'restaurarla', title: 'Restaurarla',
        blocks: [
          { type: 'steps', steps: [
            'Sube la copia al servidor y descomprímela en una carpeta aparte: `mkdir restaurar && tar -xzf copia-AAAA-MM-DD.tar.gz -C restaurar`.',
            'Devuelve los archivos a su sitio: `rsync -a restaurar/var/www/ /var/www/`.',
            'Importa la base de datos: `mysql -u usuario -p nombre_bd < restaurar/bd.sql`.',
            'Abre tu web y comprueba que todo está como esperabas.',
          ] },
          { type: 'note', tone: 'warn', text: 'Practica la restauración de vez en cuando en un entorno de pruebas: es la única forma de saber que tus copias sirven.' },
        ],
      },
      {
        id: 'si-algo-falla', title: 'Si algo falla',
        blocks: [
          { type: 'issues', items: [
            { title: '«Access denied» al exportar la base de datos', text: 'Ese usuario no tiene permisos sobre la base de datos. Usa el de la aplicación (está en su fichero de configuración) o el administrador.' },
            { title: 'El disco se llena con las copias', text: 'Borra las antiguas o guárdalas fuera del VPS. Comprueba el espacio libre con `df -h`.' },
          ] },
        ],
      },
    ],
    related: ['configurar-firewall', 'conectar-ssh'],
  },
];
