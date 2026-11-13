// Genera una ruta App Router por página extraída (app/<ruta>/page.tsx) que carga su contenido
// (content/pages/<slug>.json), su CSS (styles/pages/<slug>.css) y sus metadatos SEO literales.
// Uso: node tools/gen-routes.mjs <slug> [...] | --all
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
let slugs = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (process.argv.includes('--all')) slugs = fs.readdirSync(path.join(ROOT, 'content/pages')).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, ''));
const SKIP = new Set(['home', 'no-existe-xyz']);
for (const slug of slugs) {
  if (SKIP.has(slug)) continue;
  const route = '/' + slug.replace(/__/g, '/') + '/';
  const dir = path.join(ROOT, 'app', ...slug.split('__'));
  fs.mkdirSync(dir, { recursive: true });
  const ident = slug.replace(/[^a-z0-9]+/gi, '_');
  fs.writeFileSync(path.join(dir, 'page.tsx'), `// Generado por tools/gen-routes.mjs · ${route}
import content from '@/content/pages/${slug}.json';
import '@/styles/pages/${slug}.css';
import { GenericPage, type GPage } from '@/components/generic/GenericPage';
import { buildMetadata, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata('${route}');

export default function Page_${ident}() {
  return (
    <>
      <JsonLd path="${route}" />
      <GenericPage page={content as unknown as GPage} />
    </>
  );
}
`);
  console.log('ruta', route);
}
