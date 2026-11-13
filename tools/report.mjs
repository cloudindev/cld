// Fase 3 · Genera VERIFICACION.md a partir de _inventory/compare.json (+ comprobaciones de enlaces y recursos).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const cmp = JSON.parse(fs.readFileSync(path.join(ROOT, '_inventory/compare.json'), 'utf8'));
const seo = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/seo.json'), 'utf8'));
const checks = fs.existsSync(path.join(ROOT, '_inventory/checks.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, '_inventory/checks.json'), 'utf8')) : null;
const W = [1440, 1024, 768, 390];
const rows = Object.entries(seo).map(([p, e]) => ({ p, slug: e.slug, r: cmp[e.slug] ?? {} }));
const cell = v => v == null ? '—' : `${v.pct.toFixed(2)} %${v.pct >= 2 ? ' ⚠' : ''}`;
const all = rows.flatMap(r => W.map(w => r.r[w]).filter(Boolean));
const pass = all.filter(v => v.pct < 2).length;
let md = `# VERIFICACIÓN · réplica vs original

Generado por \`tools/report.mjs\` el ${new Date().toISOString().slice(0, 10)}.

## Método

- **Original:** capturas de la Fase 1 (\`_inventory/screens/<slug>/<ancho>.png\`).
- **Réplica:** \`out/\` servido en local y capturado con \`tools/compare.mjs\` en las mismas condiciones: viewport de 1440/1024/768 × 900 y 390 × 844, scroll completo previo y captura a página completa recortada al ancho.
- **Métrica:** píxeles distintos según pixelmatch (umbral 0,1, sin contar antialiasing) dividido entre el área \`ancho × alto máximo\`. Si las alturas difieren, la franja sobrante cuenta como fondo blanco.
- **Objetivo:** < 2 % por URL y ancho. ⚠ marca los casos que no lo cumplen; la explicación está al final y en NOTAS.md.

**Resultado:** ${pass} de ${all.length} capturas por debajo del 2 %.

## Tabla URL × ancho

| URL | 1440 | 1024 | 768 | 390 |
|---|---|---|---|---|
`;
for (const r of rows) md += `| \`${r.p}\` | ${W.map(w => cell(r.r[w])).join(' | ')} |\n`;
if (checks) {
  md += `\n## Enlaces y recursos\n\n`;
  md += `- **Enlaces internos rotos:** ${checks.broken.length}${checks.broken.length ? '\n' + checks.broken.map(b => `  - \`${b.from}\` → \`${b.href}\``).join('\n') : ''}\n`;
  md += `- **Recursos cargados desde cloudin.pro:** ${checks.fromOrigin.length}${checks.fromOrigin.length ? '\n' + checks.fromOrigin.map(b => `  - \`${b}\``).join('\n') : ''}\n`;
  md += `- **Recursos externos cargados:** ${checks.external.map(x => `\`${x}\``).join(', ') || 'ninguno'}\n`;
}
const notes = path.join(ROOT, '_inventory/verificacion-notas.md');
if (fs.existsSync(notes)) md += '\n' + fs.readFileSync(notes, 'utf8');
fs.writeFileSync(path.join(ROOT, 'VERIFICACION.md'), md);
console.log('VERIFICACION.md', pass, '/', all.length);
