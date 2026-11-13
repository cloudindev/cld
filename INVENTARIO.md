# INVENTARIO · cloudin.pro → réplica Next.js

Fase 1, completada el 2026-11-13. Fuente: rastreo con Chromium headless (Playwright 1.57) de https://cloudin.pro.
Todo lo que sigue sale del navegador (DOM renderizado, estilos computados y tráfico de red). Nada está estimado.

> **Fase 1 aprobada el 2026-11-13.** Las decisiones de [§8](#8-decisiones-que-necesito-de-ti) están resueltas en NOTAS.md. Las correcciones posteriores a este inventario están marcadas con «(corregido en Fase 2)».

---

## 0. Dónde está cada cosa

| Qué | Ruta |
|---|---|
| Sitemaps originales | `_inventory/page-sitemap.xml`, `_inventory/post-sitemap.xml` |
| HTML renderizado por URL | `_inventory/pages/<slug>/rendered.html` |
| Metadatos, OG, JSON-LD, enlaces, imágenes, formularios y recursos de red por URL | `_inventory/pages/<slug>/data.json` |
| Capturas a página completa (1440, 1024, 768 y 390 px) | `_inventory/screens/<slug>/<ancho>.png` (360 PNG, 434 MB) |
| Estados de interacción (hover, megamenú, pestañas, menú móvil…) | `_inventory/interactions/*.png` + `interactions.json` |
| Tokens en bruto (estilos computados agregados) | `_inventory/tokens-raw.json` |
| Tokens limpios | **`tokens.css`** |
| Recursos descargados | **`public/`** (719 ficheros, 115 MB) + `_inventory/assets-manifest.json` |
| Índice de rastreo | `_inventory/crawl-index.json`, `_inventory/crawl.log` |
| Scripts reutilizables (servirán en la Fase 3) | `tools/crawl.mjs`, `tokens.mjs`, `interactions*.mjs`, `assets.mjs`, `crop.mjs` |

`<slug>` es la ruta con `/` cambiada por `__`. La home es `home` y `/blog/que-es-la-nube/` es `blog__que-es-la-nube`.

**Normas de captura.** Las capturas se hacen después de recorrer la página con scroll para disparar el lazy‑load y las animaciones. Se recortan al ancho del viewport y ocultan el widget de chat de Support Board y el badge de reCAPTCHA, porque son flotantes y no deterministas. En la Fase 3 compararé la réplica en esas mismas condiciones.

---

## 1. URLs públicas (90)

- **81 en el sitemap** de Yoast: 48 páginas y 33 entradas.
- **6 descubiertas rastreando enlaces:** 4 archivos de categoría y 2 páginas de autor, que redirigen a `/`.
- **3 añadidas a mano:** `/blog/category/cloud/page/2/` y `/page/3/`, que responden 200 pero no están enlazadas desde ningún sitio, y una URL inexistente para capturar la plantilla 404.

Todas las URLs del brief existen. Además hay muchas que el brief no menciona:

- **28 páginas `/alojamiento-web-<ciudad>/`**, de dos plantillas: «Ciudad A» (23 páginas) y «Ciudad B» (Asturias, Avilés, Gijón, Oviedo y Málaga).
- `/hosting-web/` (formulario de contacto con otra cabecera), `/contacto-old/`, `/brief-alta-nuevo-cliente-fm/` (formulario largo de alta de cliente) y `/hosting-y-dominios-cloud-empresas/` (copia de la home con un vídeo MP4 de 69 MB).
- `/blog/page/2/`, `/page/3/`, `/page/4/`… responden 200 con el mismo listado y canonical a `/blog/`: es paginación falsa de WordPress y no hay enlaces de paginación visibles. Propongo no replicarla (ver §8).

### Plantillas

| Plantilla | Nº | URLs |
|---|---|---|
| Home | 1 | `/` |
| Home (variante con vídeo) | 1 | `/hosting-y-dominios-cloud-empresas/` |
| Producto | 3 | `/hosting/`, `/dominios/`, `/cloud/` |
| Ciudad A | 23 | murcia, barcelona, bilbao, valencia, sevilla, madrid, lleida, girona, tarragona, almeria, andalucia, cordoba, granada, huelva, huesca, toledo, albacete, zaragoza, lugo, galicia, a-coruna, la-rioja, logrono (granada, la-rioja y toledo tienen ±1 heading) |
| Ciudad B | 5 | asturias, aviles, gijon, oviedo, malaga |
| Servicio Asturias | 2 | `/diseno-paginas-web-asturias/`, `/posicionamiento-seo-asturias/` |
| Data center | 1 | `/data-center-espana/` |
| Formulario/landing | 5 | `/contacto/`, `/contacto-old/`, `/hosting-web/`, `/unete/`, `/brief-alta-nuevo-cliente-fm/` |
| Legal | 6 | aviso-legal, privacidad, cookies, accesibilidad, politica-abuso, politica-seguridad |
| Blog índice | 1 | `/blog/` (12 tarjetas de las 33 entradas) |
| Archivo de categoría | 6 | alojamiento-web, cloud (3 páginas), ciberseguridad, seo, todas **noindex** |
| Entrada | 33 | ver tabla |
| 404 | 1 | «Uhhhhhh · Parece que estás perdido» |

### Tabla completa por URL

Los valores son literales. Los campos OG/Twitter completos, `article:*` y el JSON‑LD íntegro están en cada `data.json`.

| # | URL | Plantilla | HTTP | Alto 1440 | `<title>` | meta description | canonical | robots | og:image | JSON-LD @graph |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/` | Home | 200 | 6870 | Hosting web y Dominios - Cloud para empresas \| Cloudin | Hosting para tu página web barato con velocidad ultrarrápida, seguridad inigualable y soporte. Incluye dominio y correo electrónico. | `/` | index | `/wp-content/uploads/2021/01/img-22@2x.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 2 | `/privacidad/` | Legal | 200 | 3170 | Política de privacidad \| Cloudin | — | `/privacidad/` | index | `/wp-content/uploads/2024/05/web-preview.jpg` | WebPage, BreadcrumbList, WebSite, Organization |
| 3 | `/accesibilidad/` | Legal | 200 | 1871 | Accesibilidad \| Cloudin | — | `/accesibilidad/` | index | `/wp-content/uploads/2024/05/web-preview.jpg` | WebPage, BreadcrumbList, WebSite, Organization |
| 4 | `/aviso-legal/` | Legal | 200 | 3361 | Aviso legal \| Cloudin | — | `/aviso-legal/` | index | `/wp-content/uploads/2024/05/web-preview.jpg` | WebPage, BreadcrumbList, WebSite, Organization |
| 5 | `/politica-abuso/` | Legal | 200 | 2868 | Política abuso \| Cloudin | — | `/politica-abuso/` | index | `/wp-content/uploads/2024/05/web-preview.jpg` | WebPage, BreadcrumbList, WebSite, Organization |
| 6 | `/politica-seguridad/` | Legal | 200 | 3043 | Política seguridad \| Cloudin | — | `/politica-seguridad/` | index | `/wp-content/uploads/2024/05/web-preview.jpg` | WebPage, BreadcrumbList, WebSite, Organization |
| 7 | `/blog/` | Blog índice | 200 | 2262 | Blog \| Cloudin | — | `/blog/` | index | `/wp-content/uploads/2024/05/web-preview.jpg` | WebPage, BreadcrumbList, WebSite, Organization |
| 8 | `/hosting-web/` | Formulario/landing | 200 | 2421 | Hosting web \| Cloudin | — | `/hosting-web/` | index | `/wp-content/uploads/2024/05/data-center-espana-1.jpg` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 9 | `/cookies/` | Legal | 200 | 2567 | Cookies \| Cloudin | — | `/cookies/` | index | `/wp-content/uploads/2024/05/web-preview.jpg` | WebPage, BreadcrumbList, WebSite, Organization |
| 10 | `/brief-alta-nuevo-cliente-fm/` | Formulario/landing | 200 | 3563 | Brief Alta nuevo cliente FM - Te ayudamos a lanzar tu proyecto \| Cloudin | Contáctanos y te ayudaremos a lanzar tu proyecto digital en la nube. Descubre nuestro alojamiento web y tecnología en la nube de Cloudin. | `/brief-alta-nuevo-cliente-fm/` | index | `/wp-content/uploads/2024/05/web-preview.jpg` | WebPage, BreadcrumbList, WebSite, Organization |
| 11 | `/alojamiento-web-murcia/` | Ciudad A | 200 | 7254 | ▷ Alojamiento web en Murcia - Hosting página web \| Cloudin | Alojamiento web en Murcia ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-murcia/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 12 | `/alojamiento-web-barcelona/` | Ciudad A | 200 | 7215 | ▷ Alojamiento web en Barcelona - Hosting página web \| Cloudin | Alojamiento web en Barcelona ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-barcelona/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 13 | `/unete/` | Formulario/landing | 200 | 1970 | Únete \| Cloudin | — | `/unete/` | index | `/wp-content/uploads/2024/05/unete-escuadron-cloudin.jpg` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 14 | `/alojamiento-web-bilbao/` | Ciudad A | 200 | 7187 | ▷ Alojamiento web en Bilbao - Hosting página web \| Cloudin | Alojamiento web en Bilbao ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-bilbao/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 15 | `/alojamiento-web-valencia/` | Ciudad A | 200 | 7287 | ▷ Alojamiento web en Valencia - Hosting página web \| Cloudin | Alojamiento web en Valencia ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-valencia/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 16 | `/alojamiento-web-malaga/` | Ciudad B | 200 | 5329 | Alojamiento web en Málaga - Hosting página web \| Cloudin | Alojamiento web en Málaga ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-malaga/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 17 | `/alojamiento-web-sevilla/` | Ciudad A | 200 | 7224 | ▷ Alojamiento web en Sevilla - Hosting página web \| Cloudin | Alojamiento web en Sevilla ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-sevilla/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 18 | `/posicionamiento-seo-asturias/` | Servicio Asturias | 200 | 6239 | ▷ Agencia SEO Asturias - Posicionamiento Web \| Cloudin | Agencia SEO en Asturias ✔️ Descubre los mejores profesionales ⭐ en POSICIONAMIENTO WEB ⭐ ¡Te quedarás alucinando con las estrategias! | `/posicionamiento-seo-asturias/` | index | `/wp-content/uploads/2024/12/posicionamiento-seo-asturias.jpg` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 19 | `/diseno-paginas-web-asturias/` | Servicio Asturias | 200 | 5904 | ▷ Diseño de Páginas Web en Asturias - El Mejor \| Cloudin | Páginas web en Asturias ✔️ Descubre los mejores profesionales ⭐ en DISEÑO de PÁGINAS WEB ⭐ ¡Te quedarás alucinando con nosotros! | `/diseno-paginas-web-asturias/` | index | `/wp-content/uploads/2024/12/diseno-pagina-web-asturias-baratos.jpg` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 20 | `/alojamiento-web-asturias/` | Ciudad B | 200 | 5323 | Alojamiento web en Asturias - Hosting página web \| Cloudin | Alojamiento web en Asturias ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-asturias/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 21 | `/contacto-old/` | Formulario/landing | 200 | 2401 | Contacto - Te ayudamos a lanzar tu proyecto \| Cloudin | Contáctanos y te ayudaremos a lanzar tu proyecto digital en la nube. Descubre nuestro alojamiento web y tecnología en la nube de Cloudin. | `/contacto-old/` | index | `/wp-content/uploads/2024/05/web-preview.jpg` | WebPage, BreadcrumbList, WebSite, Organization |
| 22 | `/contacto/` | Formulario/landing | 200 | 3105 | Contactar con nosotros - Te ayudamos con tu alojamiento web \| Cloudin | Te ayudamos con tu dominio, alojamiento web, servidor VPS o soluciones Cloud. Cuéntanos tu proyecto y te contactaremos con la mejor solución | `/contacto/` | index | `/wp-content/uploads/2024/12/ayuda-hosting-cloudin.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 23 | `/dominios/` | Producto | 200 | 2408 | Dominios \| Cloudin | — | `/dominios/` | index | `/wp-content/uploads/2021/01/Images@2x.jpg` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 24 | `/hosting/` | Producto | 200 | 5395 | Hosting - Alojamiento página web barato \| Cloudin | Soluciones de hosting web optimizadas y alojamiento web Wordpress diseñadas para satisfacer las necesidades de cualquier tipo de proyecto. | `/hosting/` | index | `/wp-content/uploads/2024/12/alojamiento-web-pagespeed.jpg` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 25 | `/cloud/` | Producto | 200 | 5199 | Hosting - Alojamiento página web barato \| Cloudin | Soluciones de hosting web optimizadas y alojamiento web Wordpress diseñadas para satisfacer las necesidades de cualquier tipo de proyecto. | `/cloud/` | index | `/wp-content/uploads/2024/12/cloud-para-empresas.jpg` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 26 | `/alojamiento-web-aviles/` | Ciudad B | 200 | 5275 | Alojamiento web en Avilés - Hosting página web \| Cloudin | Alojamiento web en Avilés ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-aviles/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 27 | `/alojamiento-web-oviedo/` | Ciudad B | 200 | 5276 | Alojamiento web en Oviedo - Hosting página web \| Cloudin | Alojamiento web en Oviedo ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-oviedo/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 28 | `/alojamiento-web-lleida/` | Ciudad A | 200 | 7062 | ▷ Alojamiento web en Lleida - Hosting página web \| Cloudin | Alojamiento web en Lleida ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-lleida/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 29 | `/alojamiento-web-girona/` | Ciudad A | 200 | 7130 | ▷ Alojamiento web en Girona - Hosting página web \| Cloudin | Alojamiento web en Girona ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-girona/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 30 | `/alojamiento-web-tarragona/` | Ciudad A | 200 | 6959 | ▷ Alojamiento web en Tarragona - Hosting página web \| Cloudin | Alojamiento web en Tarragona ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-tarragona/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 31 | `/alojamiento-web-almeria/` | Ciudad A | 200 | 7132 | ▷ Alojamiento web en Almería - Hosting página web \| Cloudin | Alojamiento web en Almería ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-almeria/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 32 | `/alojamiento-web-andalucia/` | Ciudad A | 200 | 7088 | ▷ Alojamiento web en Andalucía - Hosting página web | Alojamiento web en Andalucía ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-andalucia/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 33 | `/alojamiento-web-cordoba/` | Ciudad A | 200 | 7053 | ▷ Alojamiento web en Córdoba - Hosting página web \| Cloudin | Alojamiento web en Córdoba ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-cordoba/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 34 | `/alojamiento-web-granada/` | Ciudad A | 200 | 7055 | ▷ Alojamiento web en Granada - Hosting página web \| Cloudin | Alojamiento web en Granada ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-granada/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 35 | `/alojamiento-web-huelva/` | Ciudad A | 200 | 7128 | ▷ Alojamiento web en Huelva - Hosting página web \| Cloudin | Alojamiento web en Huelva ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-huelva/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 36 | `/alojamiento-web-huesca/` | Ciudad A | 200 | 7076 | ▷ Alojamiento web en Huesca - Hosting página web \| Cloudin | Alojamiento web en Huesca ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-huesca/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 37 | `/alojamiento-web-toledo/` | Ciudad A | 200 | 7140 | ▷ Alojamiento web en Toledo - Hosting página web \| Cloudin | Alojamiento web en Toledo ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-toledo/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 38 | `/alojamiento-web-albacete/` | Ciudad A | 200 | 7161 | ▷ Alojamiento web en Albacete - Hosting página web \| Cloudin | Alojamiento web en Albacete ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-albacete/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 39 | `/alojamiento-web-zaragoza/` | Ciudad A | 200 | 7042 | ▷ Alojamiento web en Zaragoza - Hosting página web \| Cloudin | Alojamiento web en Zaragoza ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-zaragoza/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 40 | `/alojamiento-web-lugo/` | Ciudad A | 200 | 7050 | ▷ Alojamiento web en Lugo - Hosting página web \| Cloudin | Alojamiento web en Lugo ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-lugo/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 41 | `/alojamiento-web-galicia/` | Ciudad A | 200 | 7170 | ▷ Alojamiento web en Galicia - Hosting página web \| Cloudin | Alojamiento web en Galicia ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-galicia/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 42 | `/alojamiento-web-a-coruna/` | Ciudad A | 200 | 7194 | ▷ Alojamiento web en A Coruña - Hosting página web \| Cloudin | Alojamiento web en A Coruña ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-a-coruna/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 43 | `/alojamiento-web-la-rioja/` | Ciudad A | 200 | 6963 | ▷ Alojamiento web en La Rioja - Hosting página web \| Cloudin | Alojamiento web en La Rioja ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-la-rioja/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 44 | `/alojamiento-web-logrono/` | Ciudad A | 200 | 7036 | ▷ Alojamiento web en Logroño - Hosting página web \| Cloudin | Alojamiento web en Logroño ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-logrono/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 45 | `/data-center-espana/` | Formulario/landing | 200 | 4071 | Data Center España - Centro de Datos Cloud \| Cloudin | En nuestro centro de datos ofrecemos soluciones de cloud público y privado, alojamiento web, servidores VPS y servidores dedicados en España. | `/data-center-espana/` | index | `/wp-content/uploads/2024/05/data-center-espana-1.jpg` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 46 | `/alojamiento-web-gijon/` | Ciudad B | 200 | 5394 | Alojamiento web en Gijón - Hosting página web \| Cloudin | Alojamiento web en Gijón ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-gijon/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 47 | `/alojamiento-web-madrid/` | Ciudad A | 200 | 6966 | ▷ Alojamiento web en Madrid - Hosting página web \| Cloudin | Alojamiento web en Madrid ✔️ Hosting Profesional ⭐ Al mejor precio ⭐ El Mejor Hosting Web Rápido y Barato ¡Entra ya para ver las ofertas! | `/alojamiento-web-madrid/` | index | `/wp-content/uploads/2024/10/wordpress-logo-1.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 48 | `/hosting-y-dominios-cloud-empresas/` | Home (variante con vídeo) | 200 | 6852 | Hosting web y Dominios - Cloud para empresas \| Cloudin | Hosting para tu página web barato con velocidad ultrarrápida, seguridad inigualable y soporte. Incluye dominio y correo electrónico. | `/hosting-y-dominios-cloud-empresas/` | index | `/wp-content/uploads/2021/01/img-22@2x.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 49 | `/blog/nube-privada-vs-nube-publica-cual-debes-utilizar/` | Entrada | 200 | 3591 | Nube privada vs Nube pública. Cuál debes utilizar \| Cloudin | — | `/blog/nube-privada-vs-nube-publica-cual-debes-utilizar/` | index | `/wp-content/uploads/2024/05/nube-publica-nube-privada.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 50 | `/blog/como-proteger-los-datos-de-tu-empresa-en-la-nube/` | Entrada | 200 | 2999 | Cómo proteger los datos de tu empresa en la nube \| Cloudin | — | `/blog/como-proteger-los-datos-de-tu-empresa-en-la-nube/` | index | `/wp-content/uploads/2024/05/cloud-storage.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 51 | `/blog/alojamiento-web-para-tu-organizacion-o-proyecto/` | Entrada | 200 | 3078 | Alojamiento web para tu organización o proyecto \| Cloudin | — | `/blog/alojamiento-web-para-tu-organizacion-o-proyecto/` | index | `/wp-content/uploads/2024/05/alojamiento-web-empresas.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 52 | `/blog/que-es-la-nube/` | Entrada | 200 | 4811 | ¿Qué es la nube? \| Cloudin | — | `/blog/que-es-la-nube/` | index | `/wp-content/uploads/2024/04/que-es-la-nube.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 53 | `/blog/planes-de-alojamiemto-web-para-agencias/` | Entrada | 200 | 2850 | Planes de alojamiemto web para agencias (resellers) \| Cloudin | — | `/blog/planes-de-alojamiemto-web-para-agencias/` | index | `/wp-content/uploads/2024/04/alojamiento-resellers-agencias.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 54 | `/blog/que-es-el-iaas-infrastructure-as-a-service/` | Entrada | 200 | 3414 | ¿Qué es el IaaS (Infrastructure as a Service)? \| Cloudin | — | `/blog/que-es-el-iaas-infrastructure-as-a-service/` | index | `/wp-content/uploads/2024/05/iaas.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 55 | `/blog/tipos-hosting-web-diferencias-compartido-vps-dedicado-cloud/` | Entrada | 200 | 6534 | Diferencias entre compartido, VPS, dedicado y cloud ¡Aquí! | Descubre en CLOUDIN, todas las DIFERENCIAS entre HOSTING COMPARTIDO, VPS, DEDICADO y CLODU, entra ya para verlo. | `/blog/tipos-hosting-web-diferencias-compartido-vps-dedicado-cloud/` | index | `/wp-content/uploads/2024/11/todas-las-diferencias-entre-compartido-VPS-dedicado-y-cloud.webp` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 56 | `/blog/por-que-mi-sitio-web-va-lento/` | Entrada | 200 | 4792 | ¿Por qué mi sitio web va lento? Todas las Razones | Descubre en CLOUDIN, todas las RAZONES de POR QUÉ tu SITIO WEB va lento, te quedarás alucinando con nuestro artículo. | `/blog/por-que-mi-sitio-web-va-lento/` | index | `/wp-content/uploads/2025/01/mi-sitio-web-va-lento.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 57 | `/blog/como-migrar-tu-web-a-otro-hosting-sin-perder-nada/` | Entrada | 200 | 5338 | Cómo migrar tu web a otro hosting sin perder información \| Cloudin | — | `/blog/como-migrar-tu-web-a-otro-hosting-sin-perder-nada/` | index | `/wp-content/uploads/2025/03/migrar-tu-web-a-otro-hosting-sin-perder-informacion.jpeg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 58 | `/blog/por-que-velocidad-hosting-afecta-seo/` | Entrada | 200 | 4251 | ¿Por qué la velocidad de tu hosting afecta al SEO? ¡Aquí! | Descubre en Cloudin, todo sobre POR QUÉ la VELOCIDAD de tu HOSTING afecta al SEO, te quedarás alucinando aquí. | `/blog/por-que-velocidad-hosting-afecta-seo/` | index | `/wp-content/uploads/2025/04/Por-que-velocidad-de-tu-hosting-afecta-al-SEO.jpeg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 59 | `/blog/errores-mas-comunes-hosting-como-solucionarlos/` | Entrada | 200 | 5842 | Los errores más comunes en hosting y cómo solucionarlos | Descubre en CLOUDIN, todos los ERRORES más COMUNES en HOSTING y CÓMO SOLUCIONARLOS, te quedarás alucinando aquí. | `/blog/errores-mas-comunes-hosting-como-solucionarlos/` | index | `/wp-content/uploads/2025/03/errores-mas-comunes-hosting-como-solucionarlos.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 60 | `/blog/que-son-como-utilizar-redirecciones-dominio/` | Entrada | 200 | 5234 | Redirecciones de Dominio: qué son y cómo utilizarlas | Descubre en Cloudin, todo sobre las REDIRECCIONES de DOMINIO, QUÉ SON y CÓMO UTILIZARLAS, te quedarás sorprendido con esta información. | `/blog/que-son-como-utilizar-redirecciones-dominio/` | index | `/wp-content/uploads/2024/10/Que-son-y-como-utilizar-las-redirecciones-de-dominio.png` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 61 | `/blog/que-es-un-servidor-dns-y-como-influye-en-tu-hosting/` | Entrada | 200 | 6130 | ¿Qué es un servidor DNS y cómo influye en tu hosting? | Descubre en CLOUDIN, todo sobre QUÉ ES UN SERVIDOR DNS y CÓMO INFLUYE en tu HOSTING, te quedarás alucinando, entra ya. | `/blog/que-es-un-servidor-dns-y-como-influye-en-tu-hosting/` | index | `/wp-content/uploads/2024/12/Que-es-un-servidor-DNS.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 62 | `/blog/que-es-un-dominio-como-relaciona-con-hosting/` | Entrada | 200 | 5171 | ¿Qué es un dominio y cómo se relaciona con el hosting? | Descubre en Cloudin, todo sobre QUÉ ES un DOMINIO y CÓMO SE RELACIONA con el HOSTING, te quedarás alucinando ahora. | `/blog/que-es-un-dominio-como-relaciona-con-hosting/` | index | `/wp-content/uploads/2025/05/Que-es-un-dominio-y-como-se-relaciona-con-el-hosting.png` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 63 | `/blog/factores-clave-posicionar-web-primeros-resultados/` | Entrada | 200 | 5411 | Factores clave para posicionar tu web en los primeros resultados | Descubre en Cloudin, todo sobre los FACTORES CLAVE para POSICIONAR tu WEB en los PRIMEROS RESULTADOS, alucinarás con estos tips. | `/blog/factores-clave-posicionar-web-primeros-resultados/` | index | `/wp-content/uploads/2025/06/Factores-clave-para-posicionar-tu-web-en-los-primeros-resultados.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 64 | `/blog/uptime-que-es-importante-hosting/` | Entrada | 200 | 4869 | ¿Qué es el uptime y por qué es tan importante en un hosting? | Descubre en Cloudin, todo sobre QUÉ ES el UPTIME y POR QUÉ ES tan importante en un HOSTING, te quedarás alucinando, entra ya. | `/blog/uptime-que-es-importante-hosting/` | index | `/wp-content/uploads/2025/07/que-es-el-uptime-web.webp` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 65 | `/blog/como-digitalizar-tu-negocio-local/` | Entrada | 200 | 2965 | Cómo digitalizar tu negocio local \| Cloudin | — | `/blog/como-digitalizar-tu-negocio-local/` | index | `/wp-content/uploads/2024/05/digitalizar-negocio-local.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 66 | `/blog/como-elegir-nombre-dominio-perfecto-marca/` | Entrada | 200 | 5006 | Cómo elegir el nombre de dominio perfecto para tu marca | Descubre en Cloudin, cómo ELEGIR el NOMBRE de DOMINIO PERFECTO para tu MARCA, te quedarás alucinando, entra ya para verlo. | `/blog/como-elegir-nombre-dominio-perfecto-marca/` | index | `/wp-content/uploads/2025/08/Como-elegir-el-nombre-de-dominio-perfecto-para-marca.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 67 | `/blog/como-estimar-cuantos-recursos-va-necesitar-web/` | Entrada | 200 | 5161 | Cómo estimar cuántos recursos va a necesitar tu web ¡Aquí! | Descubre en Cloudin, todo sobre CÓMO ESTIMAR CUÁNTOS RECURSOS VA a NECESITAR tu WEB, entra ya para descubrir todo. | `/blog/como-estimar-cuantos-recursos-va-necesitar-web/` | index | `/wp-content/uploads/2025/09/Como-estimar-cuantos-recursos-va-a-necesitar-tu-web.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 68 | `/blog/hosting-wordpress-por-que-elegir-plan-especializado/` | Entrada | 200 | 4902 | Hosting WordPress: ¿Por qué elegir un plan especializado? | Descubre en Cloudin, todo sobre el HOSTING WORDPRESS y POR QUÉ ELEGIR UN PLAN PERSONALIZADO, te quedarás alucinando. | `/blog/hosting-wordpress-por-que-elegir-plan-especializado/` | index | `/wp-content/uploads/2025/10/hosting-wordpres-especializao.jpeg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 69 | `/blog/que-es-hosting-dedicado-cuando-es-necesario/` | Entrada | 200 | 4892 | ¿Qué es el hosting dedicado y cuándo es necesario? | Descubre en Cloudin, todo sobre QUÉ es el HOSTING DEDICADO y CUÁNDO ES NECESARIO, te quedarás alucinando, entra ya para verlo. | `/blog/que-es-hosting-dedicado-cuando-es-necesario/` | index | `/wp-content/uploads/2025/12/que-es-un-hosting-dedicado.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 70 | `/blog/por-que-cada-vez-mas-empresas-migran-nube/` | Entrada | 200 | 5029 | ¿Por qué cada vez más empresas migran a la nube? | Descubre en CLOUDIN, todo sobre POR QUÉ CADA VEZ MÁS EMPRESAS MIGRAN a la NUBE, te quedarás alucinando, entra ya para verlo. | `/blog/por-que-cada-vez-mas-empresas-migran-nube/` | index | `/wp-content/uploads/2026/01/por-que-cada-vez-mas-empresas-migran-a-la-nube.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 71 | `/blog/diferencias-hosting-barato-hosting-profesional/` | Entrada | 200 | 5797 | Diferencias entre hosting barato y hosting profesional | Descubre en CLOUDIN, todos sobre las DIFERENCIAS entre HOSTING BARATO y HOSTING PROFESIONAL, te quedarás alucinando, entra ya para verlo. | `/blog/diferencias-hosting-barato-hosting-profesional/` | index | `/wp-content/uploads/2026/01/Diferencias-entre-hosting-barato-y-hosting-profesional.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 72 | `/blog/como-elegir-hosting-wordpress-2026/` | Entrada | 200 | 5779 | ¿Cómo elegir un hosting para WordPress en 2026? \| Cloudin | Descubre en CLOUDIN, todo sobre CÓMO ELEGIR un HOSTING para WORDPRESS en 2026, te quedarás alucinando, entra ya. | `/blog/como-elegir-hosting-wordpress-2026/` | index | `/wp-content/uploads/2026/02/elegir-un-hosting.png` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 73 | `/blog/como-migrar-web-a-otro-hosting-sin-perder-trafico/` | Entrada | 200 | 6473 | ¿Cómo MIGRAR tu WEB a otro HOSTING sin perder tráfico? | Descubre en CLOUDIN, todo sobre CÓMO MIGRAR tu WEB a otro HOSTING sin PERDER TRÁFICO, te quedarás alucinando, entra ya para verlo. | `/blog/como-migrar-web-a-otro-hosting-sin-perder-trafico/` | index | `/wp-content/uploads/2026/03/maneras-migrar-web-sin-perder-trafico.webp` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 74 | `/blog/tipos-paginas-web-mejor-para-tu-proyecto/` | Entrada | 200 | 5770 | Tipos de páginas web y cuál es la mejor para tu proyecto | Descubre en Cloudin, todos los tipos de páginas de web que existen y cuál es la mejor para tu proyecto, entra para ver toda la información. | `/blog/tipos-paginas-web-mejor-para-tu-proyecto/` | index | `/wp-content/uploads/2025/02/Tipos-de-paginas-web.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 75 | `/blog/que-necesitas-para-crear-una-pagina-web-desde-cero/` | Entrada | 200 | 5564 | ¿Qué necesitas para crear una página web desde cero? | Descubre en CLOUDIN, todo sobre QUÉ NECESITAS para CREAR una PÁGINA WEB desde CERO, aprende todo al máximo en este artículo | `/blog/que-necesitas-para-crear-una-pagina-web-desde-cero/` | index | `/wp-content/uploads/2026/04/Que-necesitas-para-crear-una-pagina-web-desde-cero.webp` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 76 | `/blog/como-afecta-el-hosting-a-la-experiencia-del-usuario/` | Entrada | 200 | 6108 | ¿Cómo afecta el hosting a la experiencia del usuario? | Descubre en CLOUDIN, todo sobre CÓMO AFECTA el HOSTING a la EXPERIENCIA del USUARIO, te quedarás alucinando, entra ya para verlo. | `/blog/como-afecta-el-hosting-a-la-experiencia-del-usuario/` | index | `/wp-content/uploads/2026/05/Como-afecta-el-hosting-a-la-experiencia-del-usuario.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 77 | `/blog/cuando-cambiar-a-un-servidor-vps/` | Entrada | 200 | 5576 | ¿Cuándo CAMBIAR a un SERVIDOR VPS? \| Cloudin | Descubre en CLOUDIN, todo sobre CUÁNDO CAMBIAR a un SERVIDOR VPS, te quedarás alucinando, entra ya para verlo. | `/blog/cuando-cambiar-a-un-servidor-vps/` | index | `/wp-content/uploads/2026/06/Cuando-cambiar-a-un-servidor-VPS.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 78 | `/blog/como-saber-hosting-limitando-el-rendimiento-web/` | Entrada | 200 | 6160 | ¿Cómo saber si tu hosting está limitando el rendimiento de tu web? | Descubre en CLOUDIN, todo sobre CÓMO SABER si tu HOSTING está LIMITANDO el RENDIMIENTO de tu sitio web, te quedarás alucinando. | `/blog/como-saber-hosting-limitando-el-rendimiento-web/` | index | `/wp-content/uploads/2026/08/saber-si-tu-hosting-esta-limitando-el-rendimiento-de-tu-web.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 79 | `/blog/cuanta-ram-necesita-servidor-alojar-web/` | Entrada | 200 | 5587 | ¿Cuánta RAM necesita un servidor para alojar una web? | Descubre en CLOUDIN, todo sobre CUÁNTA RAM NECESITA un SERVIDOR para ALOJAR una WEB, te quedarás alucinando, entra ya para verlo. | `/blog/cuanta-ram-necesita-servidor-alojar-web/` | index | `/wp-content/uploads/2026/08/Cuanta-RAM-necesita-servidor-para-alojar-una-web.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 80 | `/blog/por-que-wordpress-va-lento-como-solucionarlo/` | Entrada | 200 | 5967 | ¿Por qué WordPress va lento y cómo solucionarlo? | Descubre en CLOUDIN, todo sobre POR QUÉ WORDPRESS va LENTO y CÓMO SOLUCIONARLO, te quedarás alucinando, entra ya para verlo. | `/blog/por-que-wordpress-va-lento-como-solucionarlo/` | index | `/wp-content/uploads/2026/09/Por-que-WordPress-va-lento-como-solucionarlo.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 81 | `/blog/que-caracteristicas-tener-buen-servicio-alojamiento-web/` | Entrada | 200 | 5376 | ¿Qué características debe tener un buen servicio de alojamiento web? | Descubre en CLOUDIN, todo sobre QUÉ CARACTERÍSTICAS debe tener un BUEN SERVICIO de ALOJAMIENTO WEB, te quedarás alucinando, entra ya. | `/blog/que-caracteristicas-tener-buen-servicio-alojamiento-web/` | index | `/wp-content/uploads/2026/11/Que-caracteristicas-debe-tener-un-buen-servicio-de-alojamiento-web.jpg` | Article, WebPage, ImageObject, BreadcrumbList, WebSite, Organization, Person, Article |
| 82 | `/blog/category/alojamiento-web/` | Archivo categoría | 200 | 1118 | Alojamiento web archivos \| Cloudin | — | `—` | noindex | `/wp-content/uploads/2024/05/web-preview.jpg` | CollectionPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 83 | `/blog/author/breno/` | Autor → redirige a / | 200 → / | 6870 | Hosting web y Dominios - Cloud para empresas \| Cloudin | Hosting para tu página web barato con velocidad ultrarrápida, seguridad inigualable y soporte. Incluye dominio y correo electrónico. | `/` | index | `/wp-content/uploads/2021/01/img-22@2x.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 84 | `/blog/category/cloud/` | Archivo categoría | 200 | 1118 | Cloud archivos \| Cloudin | — | `—` | noindex | `/wp-content/uploads/2024/05/web-preview.jpg` | CollectionPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 85 | `/blog/author/admin_cdin/` | Autor → redirige a / | 200 → / | 6870 | Hosting web y Dominios - Cloud para empresas \| Cloudin | Hosting para tu página web barato con velocidad ultrarrápida, seguridad inigualable y soporte. Incluye dominio y correo electrónico. | `/` | index | `/wp-content/uploads/2021/01/img-22@2x.png` | WebPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 86 | `/blog/category/ciberseguridad/` | Archivo categoría | 200 | 1118 | Ciberseguridad archivos \| Cloudin | — | `—` | noindex | `/wp-content/uploads/2024/05/web-preview.jpg` | CollectionPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 87 | `/blog/category/seo/` | Archivo categoría | 200 | 1118 | SEO archivos \| Cloudin | — | `—` | noindex | `/wp-content/uploads/2024/05/web-preview.jpg` | CollectionPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 88 | `/blog/category/cloud/page/2/` | Archivo categoría | 200 | 1118 | Cloud archivos \| Página 2 de 3 \| Cloudin | — | `—` | noindex | `/wp-content/uploads/2024/05/web-preview.jpg` | CollectionPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 89 | `/blog/category/cloud/page/3/` | Archivo categoría | 200 | 1118 | Cloud archivos \| Página 3 de 3 \| Cloudin | — | `—` | noindex | `/wp-content/uploads/2024/05/web-preview.jpg` | CollectionPage, ImageObject, BreadcrumbList, WebSite, Organization |
| 90 | `/no-existe-xyz/` | 404 | 404 | 1855 | Página no encontrada \| Cloudin | — | `—` | noindex | `—` | WebSite, Organization |


### Metadatos: patrones globales

- **Yoast SEO** en todas las páginas. El JSON‑LD es un `@graph` con WebPage/CollectionPage, BreadcrumbList, WebSite, Organization y, en las entradas, Article y Person. Lo replicaré byte a byte desde `data.json`.
- `og:locale es_ES`, `og:site_name Cloudin`, `twitter:card summary_large_image`, `article:publisher https://www.facebook.com/cloudin.pro`. Las entradas añaden `twitter:label1/2` («Escrito por», «Tiempo de lectura»).
- **Páginas sin meta description:** las legales, `/blog/` y `/hosting-web/`. Las copio igual, sin descripción.
- `robots`: `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`, salvo las categorías y la 404, que llevan `noindex, follow`.
- `robots.txt` original:
  ```
  User-agent: *
  Disallow: /wp-json/
  Disallow: /?rest_route=
  User-agent: AdsBot
  Disallow: /
  Sitemap: https://cloudin.pro/sitemap_index.xml
  ```
- **Sitemap:** índice `sitemap_index.xml` más `page-sitemap.xml` y `post-sitemap.xml`, con `<lastmod>` e `<image:loc>`. Lo genero estático con los mismos `lastmod`.
- **Favicons:** `/wp-content/uploads/2024/04/favicon-1-150x150.png` (32×32), `favicon-1.png` (192×192 y apple-touch) y `/wp-content/themes/hub/favicon.png`.

---

## 2. Recursos descargados

**Criterio.** Se replica la ruta original dentro de `public/`, por ejemplo `public/wp-content/uploads/2024/05/x.jpg`. Así las URLs de imágenes, `og:image`, `<image:loc>` y JSON‑LD quedan idénticas a las del original.

**Resolución.** Se recogieron `src`, `srcset`, `data-src`, fondos CSS, metas y tráfico de red. Para cada miniatura `-WxH` se probó a descargar el original sin sufijo. Todos los originales que existen están bajo `public/` y las miniaturas también se conservan, para que el `srcset` sea exacto.

| Tipo | Nº |
|---|---|
| jpg / jpeg | 555 |
| png | 105 |
| webp | 23 |
| avif | 2 |
| svg | 6 |
| woff2 / woff / otf | 21 |
| mp4 | 1 (`/cloudin-hosting.mp4`, 69 MB) |
| externos visibles (`public/external/`) | 6: 2 avatares Gravatar «mystery man», 1 imagen servida desde la demo del tema (`saaspro.liquid-themes.com`, en /dominios/) y 1 emoji SVG de s.w.org (en la 404) |

**Fallidos: 0.** Detalle completo, con las páginas que usan cada recurso, en `_inventory/assets-manifest.json`.

**Fuentes.** Elementor sirve Poppins, Chivo y Oswald autoalojadas en `/wp-content/uploads/elementor/google-fonts/fonts/`. Montserrat 600, Roboto 400 y Oswald 300/700 llegan además desde fonts.googleapis.com (descargadas en `public/fonts/gstatic/`). Las cargaré con `next/font/local`.

**Fuentes de iconos.** `lqd-essentials` (iconos del tema: flechas, chevrons, sociales) y `revicons`. Usaré la woff2 de `lqd-essentials` descargada, o SVG equivalentes extraídos de sus glifos, para no depender del CSS del tema.

---

## 3. Tokens de diseño

Están en **`tokens.css`**. Resumen:

- **Familias.** Poppins es la principal (2.505 nodos de texto). Chivo es la fuente por defecto del `body` del tema y la de los botones (1.187). Oswald se usa en titulares display en mayúsculas (104). Montserrat 600 solo aparece en «Empieza tu proyecto online». Pesos cargados: Poppins 300–800 y 400 italic, Chivo 400–800, Oswald 400/600/700.
- **Escala de tamaños** más frecuente: 15, 13, 14, 20, 17, 16, 18 y 19 px. Titulares de 36, 45, 50, 55, 63, 74, 82 y 84 px.
- **Colores de texto:** `rgba(0,36,88,.6)` en los enlaces del footer, `#4d4d4d` en el body, `#01213a` en los titulares navy y `#5b7bfb`/`#181b31` en los enlaces.
- **Fondos:** `#f7fafe` en el footer, `#030343` en la CTA «Reinventa tu negocio», `#f1f0ec` y `#f8e9e0` en las tarjetas Hosting y Dominios, `#edf2f6` en el botón Únete. La barra superior usa `linear-gradient(90deg,#22d7df,#09c1b8)`.
- **Radios:** 3, 5, 7, 8, 12, 24, 45, 75 y 750 px. El header lleva `25px 25px 0 0`.
- **Sombras:** 5 distintas.
- **Breakpoints reales:** 479, 767/768, 991/992 y 1199/1200. El header pasa a hamburguesa a 1024 px y menos.
- **Contenedor:** `.elementor-container` boxed a 1270 px (≥1200), 1024 y 767. `.e-con-inner` = viewport − 20 px. `--lqd-site-width` 1140 px.
- **Easings y duraciones:** documentados en `tokens.css`.

---

## 4. Componentes compartidos

### Header (todas las páginas)

1. **Barra promocional superior.** Fondo con degradado `#22d7df → #09c1b8`, unos 30 px de alto, con un icono 🔥 y el texto «Tu dominio GRATIS el primer año». El botón «más info ›» hace scroll suave a `#empezar`. Al pasar el ratón, el texto del botón se anima letra a letra con 32,5 ms entre caracteres. La barra lleva la clase `lqd-hide-onstuck` y desaparece cuando el header queda fijado.
2. **Barra principal.** Tiene radio `25px 25px 0 0` sobre la barra promocional. Contiene el logo `/wp-content/uploads/2021/06/cloudin.png`, el menú (Dominios + badge **HOT**, Hosting, Cloud, Casos de éxito → `/#portfolio`, Academy ▾, Contacto) y el botón «Únete →» en forma de píldora.
   - **Hover del menú:** los demás ítems se atenúan (`main-nav-hover-fade-inactive`).
   - **Badge HOT:** texto Poppins 600 12px `#0044eb`. El fondo es un `::before` con opacidad .125 y sombra.
   - **Hover de «Únete»:** fondo `#000`, texto blanco, `translateY(-2px)` y sombra `0 12px 28px rgba(0,0,0,.12)`.
3. **Megamenú Academy.** Se abre al pasar el ratón (`toggleType: fade`, `handler: mouse-in-out`). Mide 600 px de ancho y anima opacidad y transform en 0,85 s con `cubic-bezier(.19,1,.22,1)`. Contenido literal:
   - «Para empresas»: «Correo electrónico / Configuración, creación de cuentas y más.» y «Dominios / Empieza tu proyecto online con un dominio.»
   - «Para desarrolladores»: «Hosting web / Gestionar tu alojamiento web como un pro.» y «Wordpress / Tutoriales, manejo, trucos y más ...»
   - Pie: «entra en Cloudin Academy», con el mismo hover letra a letra en orden inverso.
   - Los cuatro iconos son ilustraciones de línea. Los enlaces van a `https://cloudin.academy/category/{correo-electronico|dominios|hosting|wordpress}/` y `https://cloudin.academy/`, todos con `target=_blank`.
   - Captura: `interactions/academy-megamenu-1440.png`.
4. **Header fijo.** Al hacer scroll, el header pasa a `is-stuck` y se fija con fondo blanco. La barra promocional y el buscador de dominios desaparecen. Captura: `sticky-header-1440.png`.
5. **Buscador de dominios** bajo el header (solo en la home). Es un formulario **POST** con `target="_blank"` (corregido en Fase 2) a `https://panel.cloudin.pro/cart.php?a=add&domain=register` con el campo `query`, el placeholder «Escribe el dominio que deseas » (con espacio final literal) y el botón «Buscar dominio».
6. **Indicador «scroll».** Barra vertical fija a la derecha con el texto «scroll» rotado y un punto que avanza con el scroll de la página (`lqd-scrl-indc`).
7. **Móvil y tablet (<1200 px; corregido en Fase 2, antes decía ≤1024).** Header gris `#f6f6f6` con el logo y una hamburguesa (3 barras, transición 0,45 s `cubic-bezier(.23,1,.32,1)`). Al pulsarla se convierte en una ✕ y despliega hacia abajo un panel blanco (estilo `minimal`) con los ítems y un expansor ▾ para Academy. Capturas: `mobile-menu-open-390.png`, `mobile-submenu-open-390.png` y `tablet-menu-open-1024.png`.

### Footer (todas las páginas)

Fondo `#f7fafe`, de arriba abajo:

1. **Fila superior.** A la izquierda, el logo y «Cambiar región ▾». A la derecha, Soporte · Contacto · Academy | Área de cliente. Debajo, «Los precios no incluyen IVA», «¿TE AYUDAMOS?» (Poppins 700 10px, tracking 1px) y «+34 900 433 400» (`tel:+34900433400`).
2. **Separador**, luego «© Cloudin | Todos los derechos Reservados» y «This website is operated by Cloudin Hosting SL (VAT B56282924). “Cloudin” is a Registered Trademark of Cloudin Hosting SL.»
3. **Enlaces legales** «Aviso legal - Privacidad - Cookies - Accesibilidad - Política de abuso - Política de seguridad». Al pasar por «Cookies» aparece un tooltip con «**¿Busca una exención de responsabilidad sobre cookies?** No utilizamos cookies, así que relájate y navega .» (espacio antes del punto, literal). Captura: `cookies-tooltip-1440.png`.
4. **Redes:** Instagram (`instagram.com/cloudin.pro/`) y LinkedIn (`linkedin.com/company/cloudinhosting`).
5. **Separador y 4 columnas:**
   - Texto de propósito, justificado.
   - **Cloud Computing:** ¿Qué es la nube?, IaaS (Infrastucture as a Service). La errata «Infrastucture» es literal.
   - **Hosting web:** Hosting web, Dominios, Diseño páginas web, Posicionamiento SEO, Alojamiento web en Asturias.
   - **Conócenos:** Data Center España, Únete, Blog.
6. **Selector de región.** Se abre al pasar el ratón como un mini megamenú de 248 px. En el DOM hay 3 ítems con bandera: «Portugal (soon)», «Francia» e «Italia», todos con `href="#"`. Visualmente solo se ve Portugal y el panel tapa el propio texto «Cambiar región». Captura: `region-open-1440.png`.

### Elementos flotantes y de terceros

- **Widget de chat Support Board** (plugin de WordPress, backend en cloudin.pro). Se autoabre con el panel «¡Hola! ¿Como podemos ayudarte?» (sin «¿» de apertura correcta en «Como»; es literal), avatares, «Nueva conversación», buscador de artículos y botón ✕. Captura: `chat-widget-1440.png`. **Decisión en §8.**
- **Modal «¿Te ayudamos?»** (`#modal-1473`, lity, tipo `box`). Está en el DOM de las 90 páginas e incluye un formulario CF7 con Nombre y apellidos\*, Correo electrónico\*, Teléfono\*, Empresa\*, Mensaje, reCAPTCHA v2 y «Enviar». **Su disparador está oculto con `display:none` en los cuatro anchos**, así que ningún usuario puede abrirlo. Va a NOTAS.md y la decisión está en §8.
- **Google Analytics 4** (`G-LC74SXTVHY`, gtag) y **reCAPTCHA v2** (clave `6LfOxnIqAAAAAANFKAbg6HKGQ11wLPIMsWb_LIME`) en todas las páginas. Decisión en §8.

---

## 5. Interacciones y animaciones por componente

| # | Interacción | Dónde | Mecanismo original | Comportamiento medido | Plan de réplica |
|---|---|---|---|---|---|
| 1 | Barra promocional y «más info» | Todas | Elementor + scroll local | Scroll suave a `#empezar`. Texto partido letra a letra (SplitText) con hover escalonado de 32,5 ms. Se oculta con el header fijo | CSS `:hover` con `transition-delay` por carácter (spans generados en build) |
| 2 | Megamenú Academy | Header ≥1025 | Hub `submenu` fade, mouse‑in‑out | Fade + transform 0,85 s `cubic-bezier(.19,1,.22,1)`, se cierra al salir el ratón | CSS `:hover`/`:focus-within` y teclado (Esc) |
| 3 | Header fijo | Todas | `data-sticky-header` | A partir de ~80 px pasa a `is-stuck`, fondo blanco, oculta la barra promocional y el buscador | `position:sticky` + IntersectionObserver sobre un sentinel |
| 4 | Menú móvil | ≤1024 | Bootstrap collapse + Hub | Hamburguesa ↔ ✕ en 0,45 s, panel desplegable y submenú Academy con expansor | `<button aria-expanded>` + CSS |
| 5 | Hero «DIGITALIZA TU NEGOCIO AHORA» | `/` y `/hosting-y-dominios-cloud-empresas/` | **Revolution Slider 6** (slider‑15) | 6 imágenes en arco entran desde arriba o abajo (`power4.out`, 2 s) y salen a los 7 s en bucle. 3 pastillas con efecto typewriter en secuencia y en bucle: «gymfitness.com» ↔ «Let's go online!», «Guau!!!!» ↔ «tiendamascotas.com» y «institutodecoherencia.com» ↔ «Gracias Cloudin!» (escritura 30 ms/carácter, borrado 20 ms, inicio a 1000 ms, pausa de 1000 ms antes de borrar; entradas escalonadas a 1,0 / 1,5 / 2,0 s). «AHORA» con fondo `#00fcef`. Caja «Empieza tu proyecto online / ¿Cómo lo hago?» con el monstruo | CSS keyframes + un pequeño hook de typewriter (sin librería). Capturas en 6 instantes: `hero-t*.png` |
| 6 | «PIENSA COMO LOS GRANDES Y HAZLO REALIDAD» | `/` | Hub custom animation (GSAP) | Cada elemento hijo entra con `y:35px, opacity 0` → reposo en 1,8 s `power4.out`, con 180 ms entre elementos | IntersectionObserver + clase `.is-in` + CSS `transition` |
| 6b | Partículas de fondo tras «PIENSA…» | `/` | particles.js (lienzo de 450 px de alto) | 5 formas (círculo, «edge», triángulo, polígono) de tamaño 5 en `#69DCDD #6AE7D0 #7FEFBB #CBF987 #F9F871`, opacidad 1, movimiento aleatorio continuo | `<canvas>` con unas 60 líneas de JS propio. Al ser aleatorio, en la Fase 3 se congela para el diff |
| 7 | Títulos con split por letras | «DOMINIOS» y otros | SplitText | Letras con aparición escalonada | Igual que 6, con spans por carácter |
| 8 | Pestañas «¿Qué necesitas para tu empresa?» | `/` | `lqd-tabs` (click) | 3 pestañas: Página Web / Correo electrónico / Seguridad. Activa con fondo `#000` y texto blanco; inactivas `#f1f1f1` / `#535353`. Panel con fade de opacidad 0,15 s lineal. Textos y precios literales (5,90 €, 3,90 € y 49,99 €/mes) en `interactions.json` | `role=tablist` accesible + CSS |
| 9 | **Casos de éxito** («Y LOS MEJORES CLIENTES DEL MUNDO») | `/` | **Revolution Slider** (slider‑7, 3 slides), *no* Flickity | Carrusel de ancho completo con imágenes de cliente (bendito, Paddock Motors, Subway, BMW…). Ken Burns `scale 1.5→1` en 1 s `sine.out`. **Sin autoplay** (`stopAtSlide:1`; corregido en Fase 2): cambia solo con las flechas ‹ › laterales o arrastrando. Las slides de los extremos asoman | Carrusel propio CSS + JS mínimo (sin librería) |
| 10 | Logos de partners | `/` | **Flickity** (`cellAlign:center, groupCells, wrapAround, equalHeightCells`, sin flechas ni puntos) | Fila de 9 logos (Synology, Google Cloud, AWS, HP, Fortinet, VMware, Veeam, Plesk, Sophos), arrastrable | `scroll-snap` + drag con pointer events |
| 11 | CTA «Reinventa tu negocio. Te ayudamos en todo» | `/` | Parallax GSAP ScrollTrigger + custom animation | Parallax `y:100px, scale 1.2` → `y:0, scale 1`, de `top bottom` a `bottom-=650px top`, lineal. Además, las columnas entran con `y:65px, scale .85, rotationX:-35°, opacity 0` → reposo en 1,8 s `power4.out`, con 180 ms entre elementos | `animation-timeline: view()` con *fallback* IntersectionObserver + rAF |
| 12 | Tarjetas thesquads / chatbotweb / Synology «MÁS INFO» | `/` | Hub iconbox | Hover con elevación | CSS |
| 13 | Botones Hub (`btn-hover-txt-liquid-x`) | Todos | SplitText | El texto sube y lo reemplaza una copia, letra a letra. La flecha se desplaza 0,3 s | CSS |
| 14 | Imagen de grupo `lqd-imggrp` | Varias | `data-inview` | Reveal 0,65 s `cubic-bezier(.05,.7,.2,1)` | IntersectionObserver |
| 15 | FAQ | `/hosting/`, `/cloud/`, ciudades y Asturias | Acordeón Bootstrap | El primer ítem se abre por defecto. Expansor +/–, collapse animado | `<details>`/`<summary>` con altura animada |
| 16 | Tablas de precios | `/hosting/`, `/cloud/` | `lqd-pt` | Plan central destacado en navy. Hover en el botón | CSS |
| 17 | Contadores | Ciudades, Asturias | `lqd-counter` | Cuenta hasta el valor al entrar en viewport | IntersectionObserver + rAF |
| 18 | Hover de imagen en el blog | `/blog/`, categorías, «Otros artículos» | CSS del tema | Zoom de la imagen con transform 1 s `cubic-bezier(.23,1,.32,1)`, overlay `rgba(0,0,0,.45)` | CSS |
| 19 | Compartir entrada | Entradas | Enlaces | Facebook, Twitter y Pinterest en las 33 entradas, más «Otros artículos» (4 tarjetas) en 31 de ellas; faltan en `por-que-velocidad-hosting-afecta-seo` y `que-caracteristicas-tener-buen-servicio-alojamiento-web` | Enlaces idénticos |
| 20 | Selector de región | Footer | Megamenú Hub (hover) | Ver §4 | CSS `:hover`/`:focus-within` |
| 21 | Tooltip de Cookies | Footer | CSS | Ver §4 | CSS |
| 22 | Indicador «scroll» | Todas | `lqd-scrl-indc` | Punto que avanza con el scroll | Listener de scroll pasivo + `transform` |
| 23 | Vídeo | `/hosting-y-dominios-cloud-empresas/` | `<video>` | MP4 de 69 MB | `<video>` igual |

Todas las animaciones respetarán `prefers-reduced-motion`, que el original ya contempla en su CSS.

**Librerías.** Mi propuesta es **ninguna**. Todo lo anterior se resuelve con CSS, IntersectionObserver y algo de JS propio. El original usa jQuery, GSAP con ScrollTrigger y SplitText, Revolution Slider, Flickity, Bootstrap, lity, fresco y particles.js.

---

## 6. Formularios

| Formulario | Páginas | Campos (literales) | Destino original |
|---|---|---|---|
| Buscador de dominios | Header de todas; bloque «Todo empieza por un dominio» y «Lanza tu sitio web en minutos» en ciudades y Asturias | `query` (text), botón «Buscar dominio» / «Buscar» | POST `https://panel.cloudin.pro/cart.php?a=add&domain=register`, `target=_blank` (externo, **se mantiene tal cual**; corregido en Fase 2) |
| CF7 «¿Te ayudamos?» (#7) | Modal oculto en todas; visible en `/contacto/`, `/contacto-old/`, `/hosting-web/` | your-name\*, your-email\*, phone\*, empresa\*, your-message (máx. 2000), reCAPTCHA, «Enviar» | POST CF7 → `submitContact()` con TODO |
| Únete | `/unete/` | your-name, your-email, phone, your-message (sin reCAPTCHA) | POST CF7 → `submitContact()` |
| Brief alta cliente | `/brief-alta-nuevo-cliente-fm/` | «Datos de empresa»: your-name, your-empresa, your-nif, your-email, phone, direccion, cp, localidad, provincia. «Productos a contratar»: checkbox-207[] (Dominios y hosting), menu-seo, menu-redes, menu-ads (+altaads), menu-web | POST CF7 → `submitContact()` |
| Comentarios | Solo `/blog/nube-privada-vs-nube-publica-cual-debes-utilizar/` | author, email, url, comment, reCAPTCHA, submit | `wp-comments-post.php` → `submitContact()` con TODO |
| Subida de archivos Support Board | Todas (`files[]`, oculto) | — | Parte del chat (§8) |

Las reglas de validación de CF7 (obligatorios, `type=email`, `maxlength=400`/`2000`) y los textos de error en español los replicaré tal cual.

---

## 7. Blog

- **33 entradas.** Fechas desde 2024‑05‑24 hasta 2026‑11‑03. Categorías: Alojamiento web, Cloud, Ciberseguridad y SEO. Autor «admin_cdin» (y «breno» en una), cuyos enlaces de autor redirigen a `/`.
- **Índice `/blog/`:** cuadrícula de 12 tarjetas con imagen destacada, categoría, fecha relativa («2 semanas ago», «1 mes ago»: el original mezcla inglés y español) y overlay oscuro.
- **Entrada:** título, autor y fecha, imagen destacada, contenido (h2–h5, listas, negritas, imágenes inline), compartir y «Otros artículos».
- **Contenido.** Lo exportaré a JSON estático por entrada desde el HTML renderizado: título, slug, fechas `datePublished`/`dateModified` del JSON‑LD, categorías, imagen destacada, alt y cuerpo HTML saneado.
- **Fechas relativas.** «hace X» es un texto relativo que en el original cambia con el tiempo. En un sitio estático quedaría congelado en la fecha de build. Ver §8.

---

## 8. Decisiones que necesito de ti

1. **Chat Support Board.** Necesita el backend de WordPress en cloudin.pro, y la regla «ningún recurso cargado desde cloudin.pro» lo impide.
   - (a) Omitirlo y anotarlo en NOTAS.md. **Es mi recomendación.**
   - (b) Dejar un marcador visual estático, sin funcionalidad.
   - (c) Cargarlo desde un subdominio que tú mantengas, por ejemplo `chat.cloudin.pro`.
2. **Google Analytics 4 (G-LC74SXTVHY).** El original lo tiene, así que replicarlo no es «añadir» analítica. ¿Lo incluyo, idéntico, o lo dejo fuera?
3. **reCAPTCHA v2.** Sin backend no sirve para nada, pero ocupa espacio visual en los formularios (304×78).
   - (a) Incluir el widget real con la misma clave. Requiere que el dominio del despliegue esté autorizado en Google.
   - (b) Poner un marcador del mismo tamaño. **Es mi recomendación** mientras `submitContact()` sea un TODO.
4. **Modal «¿Te ayudamos?» inaccesible.** ¿Lo replico igual, presente en el DOM pero con el disparador oculto, como «réplica 1:1», o lo omito? Recomiendo replicarlo oculto y anotarlo.
5. **Paginación falsa `/blog/page/N/`** (devuelve 200 con el mismo contenido y canonical a `/blog/`). Recomiendo no generarla. Con `output: 'export'` habría que fijar un número finito de páginas, y no hay enlaces que lleven a ellas. Las 3 páginas reales de `/blog/category/cloud/` sí las genero.
6. **Fechas relativas del blog** («2 semanas ago»).
   - (a) Congelarlas al valor capturado hoy.
   - (b) Recalcularlas en el cliente con la misma lógica y el mismo texto. **Es mi recomendación**, porque reproduce el comportamiento real.

Otros puntos que no bloquean:

- `/contacto-old/`, `/hosting-web/` y `/brief-alta-nuevo-cliente-fm/` están en el sitemap y las replicaré, aunque parezcan internas.
- Las rutas de autor redirigen a `/`. Con `output: 'export'` no hay redirecciones de servidor, así que las implementaré como página con `<meta http-equiv="refresh">` y canonical a `/`, y te dejaré documentada la regla 301 para el hosting.
- La URL de la 404 se servirá como `404.html` del export.

---

## 9. Orden de construcción propuesto (Fase 2)

1. Base: Next 15 + `output:'export'` + `trailingSlash:true`, tokens, fuentes, Header y Footer, header fijo, menú móvil.
2. **Home**, hasta pasar la verificación (<2 % en 4 anchos).
3. Producto: hosting, dominios y cloud.
4. Ciudad A (una plantilla con contenido por ciudad), Ciudad B, Servicio Asturias y data center.
5. Formularios y landings: contacto, contacto-old, hosting-web, unete y brief.
6. Legales.
7. Blog: índice, entradas, categorías y paginación.
8. 404, `/hosting-y-dominios-cloud-empresas/`, sitemaps, robots y páginas de autor.
9. Fase 3 completa (VERIFICACION.md), README y NOTAS.md finales.
