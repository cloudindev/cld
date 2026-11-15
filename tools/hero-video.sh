#!/bin/sh
# Vídeo hero de la home: assets/hero-cloudin.mp4 (HEVC 1932×1080 con audio, 51 MB) → public/video/hero-cloudin.mp4
# Recortado a 16:9 (1920×1080) y a 720p, H.264 compatible con todos los navegadores, sin audio (se reproduce en
# silencio), «faststart» para que empiece a verse antes de descargarse entero y un fotograma clave cada segundo
# (saltos de capítulo rápidos). Póster: primer fotograma. Ver NOTAS.md, punto 35.
# Uso: sh tools/hero-video.sh
set -e
cd "$(dirname "$0")/.."
src=assets/hero-cloudin.mp4
ffmpeg -v error -y -i "$src" -an \
  -vf "crop=1920:1080:(in_w-1920)/2:0,scale=1280:720:flags=lanczos" \
  -c:v libx264 -preset slow -crf 24 -profile:v high -level 4.0 -pix_fmt yuv420p -g 30 \
  -movflags +faststart public/video/hero-cloudin.mp4
# póster: primer fotograma en PNG → WebP con PIL (el ffmpeg de Homebrew no trae libwebp)
tmp="$(mktemp -t hero).png"
ffmpeg -v error -y -i "$src" -vf "crop=1920:1080:(in_w-1920)/2:0,scale=1280:720:flags=lanczos" -frames:v 1 -update 1 "$tmp"
python3 -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], 'WEBP', quality=80, method=6)" "$tmp" public/video/hero-cloudin.webp
rm -f "$tmp"
ls -la public/video/hero-cloudin.*
