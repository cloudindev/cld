# NOTAS

Rarezas o mejoras posibles detectadas en el original. **Se replican tal cual** salvo que se indique lo contrario.

## Detectadas en la Fase 1

1. **Modal «¿Te ayudamos?» inaccesible.** `#modal-1473`, con su formulario CF7, está en el DOM de todas las páginas, pero su único disparador (`a[href="#modal-1473"]`) está dentro de una columna con `display:none` en 1440, 1024, 768 y 390 px.
2. **Selector «Cambiar región».** El panel se abre encima del propio texto «Cambiar región». De sus 3 ítems (Portugal (soon), Francia, Italia) solo se ve Portugal, y los tres apuntan a `href="#"`. Francia e Italia llevan además un `target="_blank&quot;"` mal formado.
3. **Desbordamiento horizontal** en la home: `scrollWidth` 1470 px con viewport de 1440, causado por el carrusel de casos de éxito. En la réplica las capturas se recortan al viewport. Lo replicaré si la verificación lo exige.
4. **Errata** en el footer: «IaaS (Infrastucture as a Service)».
5. **Chat:** «¿Como podemos ayudarte?» (sin tilde en «Cómo»).
6. **Fechas relativas en inglés y español mezclados** en el blog: «2 semanas ago», «1 mes ago».
7. **Paginación falsa:** `/blog/page/N/` devuelve 200 para cualquier N, con el mismo listado y canonical a `/blog/`.
8. Las **páginas de autor** (`/blog/author/admin_cdin/`, `/blog/author/breno/`) redirigen a la home.
9. **Sin meta description:** las 6 legales, `/blog/` y `/hosting-web/`.
10. `/contacto-old/`, `/hosting-web/` y `/brief-alta-nuevo-cliente-fm/` aparecen en el sitemap e indexables. Parecen páginas internas o antiguas.
11. **442 `<img>` sin `alt`** (por ejemplo, los 9 logos de partners y las banderas). Se replican con `alt=""` igual que el original. Si quieres, en una iteración posterior se pueden completar.
12. **Imagen cargada desde la demo del tema** (`saaspro.liquid-themes.com/.../Images@2x.jpg`) en `/dominios/`. Se ha descargado a `public/external/`.
13. **`/hosting-y-dominios-cloud-empresas/`** es una copia de la home más un vídeo MP4 de **69 MB** (`/cloudin-hosting.mp4`), con su propio canonical: contenido duplicado.
14. **Placeholder del buscador** con espacio final: «Escribe el dominio que deseas ».
15. **Tooltip de Cookies** con espacio antes del punto: «…así que relájate y navega .»
16. **Paneles de chat y modal**: Support Board y reCAPTCHA cargan en todas las páginas aunque el formulario esté oculto.
17. **Rendimiento:** el original carga 30+ scripts (jQuery, GSAP, RevSlider, Flickity, Bootstrap…).

## Decisiones tomadas (OK del cliente, 2026-11-13)

- **Chat Support Board:** eliminado por completo.
- **Google Analytics 4 (G-LC74SXTVHY):** se mantiene igual que en el original (gtag, `afterInteractive`).
- **Modal «¿Te ayudamos?» (#modal-1473):** eliminado.
- **`/blog/page/N/`:** no se generan. Sí se generan las 3 páginas reales de `/blog/category/cloud/`.
- **Fechas relativas del blog:** se calculan en el navegador (`lib/relativeDate.ts`) con el mismo formato mixto del original («2 semanas ago»).
- **reCAPTCHA:** sin respuesta explícita → se aplica la opción recomendada: marcador del mismo tamaño (304×78) mientras `submitContact()` sea un TODO.

## Detectadas en la Fase 2

18. **`#empezar` no existe** en ninguna página: el botón «más info» de la barra superior no lleva a ningún sitio. Se replica igual.
19. **Buscador de dominios:** es un formulario **POST** con `target="_blank"` a `panel.cloudin.pro/cart.php?a=add&domain=register` (el inventario de la Fase 1 decía GET; corregido).
20. **Carrusel «casos de éxito»:** no avanza solo (RevSlider con `stopAtSlide:1`). Solo cambia con las flechas o arrastrando. El inventario decía «cada ~5,7 s»; corregido.
21. **Enlaces internos absolutos:** el original enlaza a `https://cloudin.pro/...`; en la réplica son relativos para que funcione en cualquier dominio. Canonical, `og:url`, JSON‑LD y sitemaps conservan `https://cloudin.pro` (son metadatos, no recursos que se carguen).
22. **Sitemaps:** se eliminan las líneas `<?xml-stylesheet … //cloudin.pro/…/main-sitemap.xsl?>` porque cargarían un recurso de cloudin.pro. El resto es idéntico. `/sitemap.xml` es una copia de `/sitemap_index.xml` (en WordPress es una redirección).
23. **Páginas de autor** (`/blog/author/admin_cdin/`, `/blog/author/breno/`): en el original son una redirección 301 a la home. Con `output: 'export'` no hay redirecciones de servidor, así que se sirve una página con `<meta http-equiv="refresh">` y canonical a la home. La regla 301 para el hosting está en el README.
24. **`/hosting-y-dominios-cloud-empresas/`** es la home más un botón con el texto literal «Button» (estilo por defecto del tema) entre la 2.ª y la 3.ª imagen de la fila final. Ese botón abre un modal con el vídeo de 69 MB en autoplay.
25. **Pestañas de la home:** cada panel incluye en el DOM un botón «obtener ayuda» y una imagen flotante (`img-22@2x.png`) con `display:none` en todos los anchos. No se replican porque no son visibles en ningún caso.
26. **Animaciones de entrada** (GSAP «custom animations» del tema) en las páginas que no son la home: se muestran directamente en su estado final. El parallax con scroll (`data-parallax`) sí se reproduce.
27. **Formularios:** se mantiene la estructura (campos, nombres, obligatorios, tipos y `maxlength`) con validación nativa del navegador. El envío llama a `submitContact()` (`lib/submitContact.ts`), que es un TODO y devuelve el aviso de error de Contact Form 7. No se ha inventado backend.
28. **Recursos que la Fase 1 no descargó** (carga diferida de RevSlider en la 404): `ghost.png` y `shadow.png` (`/wp-content/uploads/2024/07/`) y la fuente **Space Grotesk**, que solo usa la 404. Se han descargado en la Fase 2. La afirmación «0 fallidos» de la Fase 1 era correcta para lo que se detectó, pero el inventario de recursos estaba incompleto en este punto.
29. **Construcción de las páginas:** la home, el header, el footer y la 404 son componentes escritos a mano. Las otras 85 URLs (Elementor con maquetaciones únicas por página) se generan con `tools/extract.mjs` → `tools/compile-page.mjs`: contenido literal en `content/pages/*.json` y CSS propio con los valores computados en `styles/pages/*.css`. Ese CSS es generado, sin nombres semánticos (`.n123`); para cambiar el diseño de esas páginas lo correcto es volver a medir el original o sustituir la página por componentes escritos a mano.
30. **Anchos intermedios:** las páginas generadas son exactas en 1440, 1024, 768 y 390 px y fluidas entre medias (anchos en %), pero entre esos puntos pueden no coincidir al píxel con el original.

## Cambios pedidos por el cliente (desviaciones del original)

31. **Menú principal:** «Hosting» pasa a ser el primer ítem y tiene un desplegable. A la izquierda: Hosting Web (→ `/hosting/`), Hosting VPS y Hosting GPU. A la derecha, sin iconos y con subtítulo: Hosting node.js for apps, Hosting Wordpress y Hosting Woocommerce. Todos menos Hosting Web apuntan a `#` porque esas páginas no existen, y los subtítulos son provisionales. Ambas cosas se cambian en `hostingMenu` (`content/global.ts`). Por este cambio el header ya no coincide al píxel con el original.
32. **Botón «Únete» → «Iniciar sesión»** (`/iniciar-sesion/`). La pantalla de acceso es solo la vista. El envío llama a `submitLogin()` (`lib/submitLogin.ts`, TODO) porque WHMCS no admite un login desde otro dominio sin backend. Opciones: un endpoint propio con `ValidateLogin` + `CreateSsoToken`, o el OAuth de WHMCS. «¿Has olvidado tu contraseña?», «Crea tu cuenta» y «Abre un ticket» enlazan al panel. La página es `noindex`.
33. **Home: selector Hosting Web / Hosting VPS** bajo el buscador de dominios, con los planes de WHMCS debajo.
    - **Origen de los datos:** los planes salen de la acción `GetProducts` de la API de WHMCS (`lib/whmcs.ts`) y se consultan **solo durante `npm run build`**. Las credenciales están en `.env.local` y no llegan al navegador.
    - **Actualización:** los precios se refrescan en cada build.
    - **IDs de producto:** están en `PLAN_IDS`.
    - **Permiso en WHMCS:** la credencial API tiene el permiso `GetProducts`. Si falla, se muestra un aviso con el enlace al carrito del panel.
    - **Características de los planes:** salen de la descripción de cada producto en WHMCS. Las líneas «Etiqueta: valor» se muestran como tabla y el resto como lista. CVPS 1 y CVPS 2 no tienen descripción.
    - **Diseño:** dos tarjetas con bordes redondeados (12 px, como las tarjetas de producto). La ventana naranja va en Hosting Web y la nube en VPS. La tarjeta activa se funde con la caja de planes como una pestaña (esquina cóncava incluida); la inactiva queda separada. En móvil (tarjetas apiladas) no hay efecto pestaña: la caja toma el color de la opción activa.
    - **Bloque de planes:** caja del color de la pestaña activa con el título, «Precios sin IVA» y el selector Mensual/Anual (por defecto Anual). Se ven 4 planes; si hay más, se pasan con flechas (carrusel con scroll-snap, 3 en tablet, 2 en 768 px y 1 en móvil). Cada plan muestra las 5 primeras líneas de su descripción (`maxFeatures` en `content/home.ts`) y el botón «Contratar».
    - **Texto provisional:** el subtítulo de VPS.
34. **Piezas de gominola** (`public/jelly/`; las imágenes fuente están en `assets/jelly/`).
    - **Nube (panel VPS):** `cloud.webp` viene del PNG ya recortado del cliente. No lleva sombra, a petición del cliente.
    - **Ventana naranja (panel Hosting Web):** `web.webp` está recortada de la foto. Su sombra (`web-shadow.webp`) es la de la propia foto.
    - **Sombras:** se aplican en modo `multiply`.
    - **Animación:** por defecto las piezas están quietas. El bucle entra y sale suavemente al pasar el ratón; en táctil, al tocar, y sigue 2,5 s más. Con la pieza parada no se pide ningún frame. Se controla con `CONFIG.idle.trigger` (`'hover'` / `'always'`). Ningún elemento por encima de la sombra puede llevar `transform`, porque aislaría la mezcla y se vería un rectángulo blanco.
    - **Arrastre (ratón y lápiz):** las piezas se pueden arrastrar dentro de su tarjeta, y el centro de la pieza no sale de ella. El cuerpo sigue al puntero con un muelle algo subamortiguado. La zona agarrada se estira hacia el puntero y adelgaza para conservar el volumen. El resto llega tarde por inercia, con un muelle secundario. Al soltar, rebota y conserva un poco de la velocidad. Se mueve con `left/top` en `.jelly-body`, nunca con `transform` (aislaría la sombra). En táctil no hay arrastre, para no bloquear el scroll.
    - **Vuelta a su sitio:** al elegir una tarjeta, la pieza de la otra vuelve rebotando (`reset()` del motor, prop `reset` de `JellyCloud`). Arrastrar una pieza no selecciona su tarjeta.
    - **Texto de la tarjeta:** ya no lleva `z-index`, para que la pieza arrastrada pase por encima del texto.
    - **Parámetros del arrastre:** `CONFIG.drag`.
    - Se anima con WebGL sobre una malla de 48×32, con fallback de CSS transforms.
    - Respeta `prefers-reduced-motion` y se pausa fuera de pantalla.
    - Parámetros: objeto `CONFIG` al inicio de `jelly.js`.
    - Demo independiente en `/jelly/` (68 KB en total).
35. **Home: vídeo hero** bajo el buscador de dominios, encima del selector de planes (`components/home/VideoHero.tsx`).
    - **Clips:** los 4 vídeos del cliente (`assets/section1-4.mp4`, 50 MB) recodificados para web en `public/video/`: H.264 720p, CRF 24, sin audio, `faststart`, 6,6 MB en total. Los clips 3 y 4 (1292×712 y 1286×716) se han recortado a 16:9. Cada uno tiene su póster `.webp` (primer fotograma).
    - **Reproducción:** se encadenan en bucle 1→2→3→4→1 sin cortes, con dos `<video>` que se alternan: mientras uno se ve, el otro ya tiene cargado el siguiente clip.
    - **Capítulos:** abajo hay 4 capítulos con barra de progreso; al pulsar uno, salta a ese clip. Los títulos de los capítulos son **provisionales** (`videoHero` en `content/home.ts`).
    - **Pausa:** hay un botón de pausa (WCAG 2.2.2).
    - **Carga y ahorro:** no descarga nada hasta que la sección está a 300 px de la pantalla y se pausa al salir de ella.
    - **Movimiento reducido:** con `prefers-reduced-motion` no arranca solo; se ve el póster con el botón de reproducir.
    - **Formato de la tarjeta:** 2:1 en escritorio y 4:5 en móvil (recorta los lados). Por debajo de 1024 px solo se ve el título del capítulo actual.
    - **Servidor:** el hosting debe aceptar peticiones `Range` (206). Sin ellas Safari no reproduce el vídeo y no se puede saltar dentro del clip. Apache y Nginx lo hacen por defecto, pero `python -m http.server` no, así que en local conviene usar `npx serve out`.
