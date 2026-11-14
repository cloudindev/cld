# cloudin.pro · réplica en Next.js

Réplica 1:1 de https://cloudin.pro (WordPress + Elementor, tema Hub) en **Next.js 15 (App Router) + React 19 + TypeScript estricto**. Todas las páginas se prerenderizan (`output: 'export'`) y el resultado es HTML estático listo para cualquier hosting.

Documentos del proyecto:

- [INVENTARIO.md](INVENTARIO.md): inventario de la Fase 1 (URLs, recursos, tokens, interacciones).
- [NOTAS.md](NOTAS.md): rarezas del original replicadas tal cual, decisiones y desviaciones.
- [VERIFICACION.md](VERIFICACION.md): resultado de la comparación píxel a píxel (URL × ancho × % de diferencia).

## Requisitos

- Node.js 20 o superior (probado con 22.22)
- npm 10

## Arrancar en local

```bash
npm install
npm run dev          # http://localhost:3000
```

## Compilar

```bash
npm run build        # genera out/ (HTML estático + recursos)
npm run typecheck    # TypeScript estricto, sin emitir
npm start            # sirve out/ en http://localhost:3000 (npx serve)
```

`npm run build` exporta las 89 rutas (todas las URLs del original menos la 404, que se sirve como `out/404.html`).

## Desplegar

`out/` es un sitio estático: súbelo tal cual a cualquier hosting (Nginx, Apache, Netlify, Vercel, Cloudflare Pages, S3 + CloudFront…).

- Las URLs terminan en `/` (`trailingSlash: true`): cada ruta es `ruta/index.html`.
- Configura `404.html` como página de error.
- **Redirecciones 301 recomendadas** (en el original lo hace WordPress):
  - `/blog/author/admin_cdin/` → `/`
  - `/blog/author/breno/` → `/`
  - `/sitemap.xml` → `/sitemap_index.xml` (se incluye además una copia de `sitemap.xml`)

  Ejemplo para Nginx:

  ```nginx
  error_page 404 /404.html;
  location = /blog/author/admin_cdin/ { return 301 /; }
  location = /blog/author/breno/ { return 301 /; }
  ```

- El vídeo `/cloudin-hosting.mp4` pesa 69 MB, igual que en el original.

## Estructura

```
app/                    Rutas (una carpeta por URL). layout.tsx = header, footer, fuentes y GA4
  page.tsx              Home (componentes escritos a mano)
  <ruta>/page.tsx       Resto de páginas (generadas por tools/gen-routes.mjs)
components/
  layout/               Header, Footer, indicador «scroll», revelado al hacer scroll
  home/                 Una sección por componente (hero, pestañas, carrusel, partners…)
  generic/              Renderizador de páginas extraídas + interacciones (acordeón, pestañas, parallax…)
content/
  global.ts             Textos y enlaces de header y footer
  home.ts               Textos de la home
  pages/<slug>.json     Contenido literal de cada página (textos, enlaces, imágenes)
  seo.json              title, description, canonical, robots, OG y JSON-LD de cada URL
styles/
  tokens.css            Tokens de diseño medidos en el original
  globals.css           Base común
  pages/<slug>.css      CSS de cada página, generado con los valores medidos
lib/
  seo.tsx               Metadatos y JSON-LD literales
  submitContact.ts      Envío de formularios (TODO: conectar backend)
  relativeDate.ts       Fechas relativas del blog
public/                 Recursos del original con sus rutas (wp-content/uploads/…), sitemaps y robots.txt
tools/                  Scripts de inventario (Fase 1), extracción (Fase 2) y verificación (Fase 3)
```

### Cómo se construyen las páginas

- **Header, footer y home** son componentes React escritos a mano, con CSS Modules y los valores de `styles/tokens.css`.
- **El resto de páginas** (85 URLs con maquetaciones de Elementor distintas) siguen este proceso:
  1. `tools/extract.mjs` abre el original con Chromium y guarda el árbol de contenido (textos literales, enlaces, imágenes, formularios) y los estilos **computados** en 1440, 1024, 768 y 390 px.
  2. `tools/compile-page.mjs` convierte esa extracción en `content/pages/<slug>.json` (contenido) y `styles/pages/<slug>.css` (CSS propio con esos valores, organizado en 4 media queries).
  3. `components/generic/GenericPage.tsx` lo renderiza con HTML semántico. `next/image` se usa para las imágenes y `next/link` para los enlaces internos.

  No se copia ninguna hoja de estilos de Elementor ni de Bootstrap.

Regenerar una página:

```bash
cd tools && npm install && cd ..
node tools/extract.mjs hosting         # vuelve a medir el original
node tools/compile-page.mjs hosting    # regenera content/pages/hosting.json y styles/pages/hosting.css
node tools/gen-routes.mjs hosting      # (solo si la ruta es nueva)
```

## Verificación (Fase 3)

```bash
npm run build
node tools/compare.mjs                         # todas las URLs en 4 anchos → _inventory/compare.json
node tools/compare.mjs --only=home --widths=390
node tools/landmarks.mjs home 1024             # desfase de cada texto respecto al original
node tools/nodediff.mjs hosting 1440           # desfase nodo a nodo (páginas generadas)
node tools/report.mjs                          # regenera VERIFICACION.md
```

Las capturas de la réplica se hacen en las mismas condiciones que las del original (`_inventory/screens/`):

- viewport de 1440/1024/768 × 900 y de 390 × 844;
- scroll completo para disparar lazy-load y animaciones;
- captura a página completa recortada al ancho del viewport.

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena las credenciales de la API de WHMCS. Solo se usan en `npm run build`, para cargar los planes de la home; nunca llegan al navegador. Sin ellas, el build funciona igual y la sección muestra un aviso con el enlace al panel.

Los precios se actualizan al volver a compilar. Para refrescarlos solos, programa un build periódico, por ejemplo diario, en el CI o en el hosting.

## Nube «jelly»

`public/jelly/` contiene dos motores sin dependencias:

- **`jelly3d.js`** (WebGL2, el que se usa normalmente): la nube y la ventana como sólidos blandos 3D con física real (XPBD sobre una malla de tetraedros) y render con refracción, absorción por capas y sombra. Están medidas y calibradas sobre las fotos de `assets/jelly/`: en reposo el render cae exactamente sobre la foto. Se pueden arrastrar dentro de su tarjeta. Parámetros en `CONFIG3D`; formas, materiales y luz en `SHAPES`. Demo en `/jelly/3d.html`.
- **`jelly.js`** (WebGL1 + fallback CSS): animación 2D sobre las fotos recortadas. Se usa solo si no hay WebGL2. Parámetros en `CONFIG`. Demo en `/jelly/`.

El componente `components/home/JellyCloud.tsx` prueba primero el motor 3D y, si no está disponible, el 2D. Detalles en NOTAS.md, punto 34.

### Recalibrar las piezas 3D contra las fotos

Las herramientas están en `tools/jelly/` (Python 3 con numpy y Pillow, y Playwright con Chrome). Con `out/` servido en `http://localhost:3000`:

```bash
python3 tools/jelly/fit_web.py        # pose, perspectiva y proporciones de la ventana → web_fit.json
python3 tools/jelly/web_deco.py       # vista cenital de la cara superior: barras, puntos y ranura
python3 tools/jelly/cloud_shape.py    # contorno en planta de la nube → cloud_outline.txt
python3 tools/jelly/regions.py        # zonas de muestreo y color objetivo de cada material
node tools/jelly/fit-materials.mjs web && node tools/jelly/fit-materials.mjs cloud
python3 tools/jelly/bake.py           # vuelca los materiales en SHAPES (public/jelly/jelly3d.js)
node tools/jelly/shot.mjs && python3 tools/jelly/compare.py   # lado a lado con la foto + coincidencia de siluetas
node tools/jelly/interactions.mjs     # arrastre, vuelta a su sitio, móvil y Firefox en la home
node tools/jelly/shadow-check.mjs     # comprueba que la sombra no tenga líneas claras (añade «firefox» para Firefox)
```

Todo se escribe en `_inventory/jelly/` (no se versiona). La página `/jelly/test.html?shape=web|cloud` muestra la pieza en el hueco exacto de la foto.

## Formularios

Los formularios mantienen sus campos, nombres, obligatorios y validación. El envío llama a `submitContact()` en `lib/submitContact.ts`, que está marcado con `TODO`. Ahí hay que conectar el backend que se elija; no se ha inventado ninguno. reCAPTCHA se muestra como un marcador del mismo tamaño.

## Analítica

Se mantiene Google Analytics 4 (`G-LC74SXTVHY`) igual que en el original. Para quitarlo, borra los dos `<Script>` de `app/layout.tsx`.
