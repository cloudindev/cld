// Utilidad: consulta el HTML renderizado del original con selectores CSS.
// Uso: node tools/q.mjs <slug> '<selector>' [outer|text|attr:name] [max]
import * as cheerio from 'cheerio';
import fs from 'node:fs';
const [slug, sel, mode = 'outer', max = '5'] = process.argv.slice(2);
const $ = cheerio.load(fs.readFileSync(new URL(`../_inventory/pages/${slug}/rendered.html`, import.meta.url), 'utf8'));
$(sel).slice(0, +max).each((i, el) => {
  const e = $(el);
  if (mode === 'text') console.log(e.text().replace(/\s+/g, ' ').trim());
  else if (mode.startsWith('attr:')) console.log(e.attr(mode.slice(5)));
  else console.log($.html(e).replace(/\s+/g, ' ').replace(/<style[^>]*>.*?<\/style>/g, ''));
  console.log('----');
});
