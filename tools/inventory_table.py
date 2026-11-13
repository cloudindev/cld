import json,os,re
R='/Users/luis/_Dev/cloudin.pro/_inventory'
idx=json.load(open(f'{R}/crawl-index.json'))
sm=idx['sitemapUrls']
extra=list(idx['discovered'])+['https://cloudin.pro/blog/category/cloud/page/2/','https://cloudin.pro/blog/category/cloud/page/3/','https://cloudin.pro/no-existe-xyz/']
def slug(u):
    p=re.sub(r'^https://cloudin.pro/|/$','',u); return p.replace('/','__') or 'home'
def group(s):
    if s=='home': return 'Home'
    if s=='hosting-y-dominios-cloud-empresas': return 'Home (variante con vídeo)'
    if s in('hosting','dominios','cloud'): return 'Producto'
    if s in('alojamiento-web-asturias','alojamiento-web-aviles','alojamiento-web-gijon','alojamiento-web-oviedo','alojamiento-web-malaga'): return 'Ciudad B'
    if s.startswith('alojamiento-web-'): return 'Ciudad A'
    if s in('diseno-paginas-web-asturias','posicionamiento-seo-asturias'): return 'Servicio Asturias'
    if s in('aviso-legal','privacidad','cookies','accesibilidad','politica-abuso','politica-seguridad'): return 'Legal'
    if s.startswith('blog__category'): return 'Archivo categoría'
    if s.startswith('blog__author'): return 'Autor → redirige a /'
    if s=='blog': return 'Blog índice'
    if s.startswith('blog__'): return 'Entrada'
    if s=='no-existe-xyz': return '404'
    return 'Formulario/landing'
rows=[]
out=['| # | URL | Plantilla | HTTP | Alto 1440 | `<title>` | meta description | canonical | robots | og:image | JSON-LD @graph |','|---|---|---|---|---|---|---|---|---|---|---|']
for n,u in enumerate(sm+extra,1):
    s=slug(u); f=f'{R}/pages/{s}/data.json'
    if not os.path.exists(f): out.append(f'| {n} | {u} | — | ERROR | | | | | | | |'); continue
    d=json.load(open(f))
    types=[]
    for j in d['jsonld']:
        for g in (j.get('@graph',[j]) if isinstance(j,dict) else []):
            t=g.get('@type'); types.append(t if isinstance(t,str) else '/'.join(t))
    esc=lambda x:(x or '—').replace('|','\\|').replace('\n',' ')
    path=u.replace('https://cloudin.pro','')
    st=d['status'] if d['finalUrl']==u else f"{d['status']} → {d['finalUrl'].replace('https://cloudin.pro','')}"
    og=(d['metas'].get('og:image') or ['—'])[0].replace('https://cloudin.pro','')
    can=(d['canonical'] or '—').replace('https://cloudin.pro','')
    rob='noindex' if d['robots'] and 'noindex' in d['robots'] else 'index'
    out.append(f"| {n} | `{path}` | {group(s)} | {st} | {d['docHeight']} | {esc(d['title'])} | {esc(d['description'])} | `{can}` | {rob} | `{og}` | {', '.join(types)} |")
open(f'{R}/urls-table.md','w').write('\n'.join(out)+'\n')
print(len(out)-2)
