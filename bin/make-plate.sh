#!/bin/sh
# Crop any photo to an exact plate size, at 2x for retina.
#
#   bin/make-plate.sh <source> <out-name> <w> <h>
#   bin/make-plate.sh ~/Desktop/light.jpg collage-1 232 199
#
# Writes assets/<out-name>.jpg at 2*w by 2*h, centre-cropped to cover.
set -e
SRC="$1"; NAME="$2"; W="$3"; H="$4"
[ -n "$SRC" ] && [ -n "$NAME" ] && [ -n "$W" ] && [ -n "$H" ] || {
  echo "usage: $0 <source> <out-name> <w> <h>" >&2; exit 1; }
[ -f "$SRC" ] || { echo "no such file: $SRC" >&2; exit 1; }

TW=$((W * 2)); TH=$((H * 2))
OUT="assets/$NAME.jpg"
TMP=$(mktemp -t plate).jpg

sips -s format jpeg "$SRC" --out "$TMP" >/dev/null
SW=$(sips -g pixelWidth  "$TMP" | awk -F': ' '/pixelWidth/{print $2}')
SH=$(sips -g pixelHeight "$TMP" | awk -F': ' '/pixelHeight/{print $2}')

if [ "$((SW * TH))" -gt "$((SH * TW))" ]; then
  sips --resampleHeight "$TH" "$TMP" --out "$TMP" >/dev/null
else
  sips --resampleWidth  "$TW" "$TMP" --out "$TMP" >/dev/null
fi
sips -c "$TH" "$TW" "$TMP" --out "$TMP" >/dev/null
sips -s formatOptions 80 "$TMP" --out "$OUT" >/dev/null
rm -f "$TMP"
printf "  %-18s %sx%s\n" "$NAME.jpg" "$(sips -g pixelWidth "$OUT" | awk -F': ' '/pixelWidth/{print $2}')" "$(sips -g pixelHeight "$OUT" | awk -F': ' '/pixelHeight/{print $2}')"
