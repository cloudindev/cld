// Modelo de contenido de Academy (Centro de Ayuda, /academy/). Ver NOTAS.md, punto 38.
//
// Texto con marcas mínimas (lo interpreta components/academy/Rich.tsx):
//   **negrita** · `código` · [texto](/enlace/) · {dato}
// {dato} se sustituye por un valor de content/academy/datos.ts (servidores, horario…): así cada dato
// se cambia en un solo sitio aunque aparezca en varias guías.

export type CatSlug = 'dominios' | 'hosting' | 'vps' | 'correo' | 'wordpress' | 'primeros-pasos';
export type CatIcon = 'globe' | 'server' | 'chip' | 'mail' | 'layout' | 'flag';
export type Level = 'básico' | 'intermedio' | 'avanzado';

export type Category = {
  slug: CatSlug;
  name: string;            // nombre completo («Correo electrónico»)
  short: string;           // etiqueta corta de filtros y listas («Correo»)
  card?: string;           // título en la tarjeta de la portada, si es distinto del nombre
  intro: string;           // texto de la tarjeta y entradilla de la página de la categoría
  icon: CatIcon;
  color: string;           // fondo del icono
  ink: 'light' | 'dark';   // color del dibujo del icono sobre ese fondo
  featured?: boolean;      // tarjeta oscura «¿Acabas de llegar?»
  more: string;            // enlace al pie de la tarjeta
  meta: { title: string; description: string };
};

export type Block =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }                                        // lista con puntos de color
  | { type: 'table'; head: string[]; rows: string[][]; note?: string }       // tabla oscura (primera columna = etiqueta)
  | { type: 'steps'; steps: string[] }                                       // pasos numerados
  | { type: 'tabs'; tabs: { label: string; steps: string[] }[] }             // pasos por plataforma (iPhone / Android…)
  | { type: 'issues'; items: { title: string; text: string }[] }             // «Si algo falla»
  | { type: 'code'; code: string; label?: string }
  | { type: 'note'; text: string; tone?: 'info' | 'warn' };

export type Section = { id: string; title: string; blocks: Block[] };

export type Guide = {
  slug: string;
  cat: CatSlug;
  title: string;           // título completo (h1, listas)
  card?: string;           // versión corta para la tarjeta de la categoría, si hace falta
  crumb: string;           // versión corta para la miga de pan
  level: Level;
  summary: string;         // entradilla
  keywords: string[];      // palabras que la gente busca y no salen en el texto
  updated: string;         // fecha de la última revisión (AAAA-MM-DD)
  sections: Section[];
  related: string[];       // slugs de «Sigue por aquí»
};
