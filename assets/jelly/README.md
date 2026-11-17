# Imágenes fuente de las piezas «jelly»

No se publican. Las versiones de la web están en `public/jelly/`:

- `jelly-cloudin-hosting-vps.png` → `cloud.webp` (nube, panel VPS). Ya venía recortada con transparencia; la sombra de contacto `shadow.webp` se genera a partir de su silueta.
- `hosting-web-original.jpg` → `web.webp` + `web-shadow.webp` (panel Hosting Web). Recortada del fondo blanco; la sombra de la foto se conserva en una capa «multiply».
- `hosting-ia-original.jpg` → `chip.webp` + `chip-shadow.webp` (sección «Hosting para IA» de la home). Recortada del fondo gris con `python3 tools/jelly/chip_cutout.py`: la pieza por el color (la gelatina y la crema tienen croma; el fondo y su sombra son grises) y, bajo las patitas, solo lo oscuro o muy saturado, porque el suelo lleva el reflejo morado de la luz que atraviesa la gelatina. Ese reflejo y la sombra van en la capa «multiply».
