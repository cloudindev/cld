#!/bin/sh
# Vídeos de Cloudy para la sección de misiones de la home: assets/mascota/cloudy-*.mp4 → public/mascota/
# Sin audio (se reproducen en silencio), H.264 compatible con todos los navegadores, «faststart» para que
# empiecen a verse antes de descargarse enteros y un fotograma clave cada segundo. Portada: primer fotograma.
# Uso: sh tools/mascota/videos.sh
set -e
cd "$(dirname "$0")/../.."
for n in working email shield; do
  ffmpeg -v error -y -i "assets/mascota/cloudy-$n.mp4" -an \
    -c:v libx264 -preset slow -crf 25 -profile:v high -level 4.0 -pix_fmt yuv420p -g 30 \
    -movflags +faststart "public/mascota/cloudy-$n.mp4"
  # portada: primer fotograma en PNG → WebP con PIL (el ffmpeg de Homebrew no trae libwebp)
  tmp="$(mktemp -t cloudy).png"
  ffmpeg -v error -y -i "assets/mascota/cloudy-$n.mp4" -frames:v 1 -update 1 "$tmp"
  python3 -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], 'WEBP', quality=82, method=6)" "$tmp" "public/mascota/cloudy-$n.webp"
  rm -f "$tmp"
done
ls -la public/mascota/cloudy-*
