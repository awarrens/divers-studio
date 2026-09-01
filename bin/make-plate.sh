#!/bin/sh
# Crop any photo to an exact plate size, at 2x for retina.
#
#   bin/make-plate.sh <source> <out-name> <w> <h> [density]
#   bin/make-plate.sh ~/Desktop/light.jpg shot-1 327 360 3
#
# Writes assets/<out-name>.jpg centre-cropped to cover, at density x the CSS
# size (default 3, for retina at the largest layout scale). Never upscales
# past the source: asking for pixels a photo does not have only softens it.
set -e
SRC="$1"; NAME="$2"; W="$3"; H="$4"; DEN="${5:-3}"
[ -n "$SRC" ] && [ -n "$NAME" ] && [ -n "$W" ] && [ -n "$H" ] || {
  echo "usage: $0 <source> <out-name> <w> <h> [density]" >&2; exit 1; }
[ -f "$SRC" ] || { echo "no such file: $SRC" >&2; exit 1; }

SRCW=$(sips -g pixelWidth "$SRC" | awk -F': ' '/pixelWidth/{print $2}')
TW=$((W * DEN)); TH=$((H * DEN))
# Cap at what the source actually holds, so nothing is upscaled.
if [ "$TW" -gt "$SRCW" ]; then
  TW=$SRCW
  TH=$(( SRCW * H / W ))
fi
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
sips -s formatOptions 92 "$TMP" --out "$OUT" >/dev/null
rm -f "$TMP"
printf "  %-18s %sx%s\n" "$NAME.jpg" "$(sips -g pixelWidth "$OUT" | awk -F': ' '/pixelWidth/{print $2}')" "$(sips -g pixelHeight "$OUT" | awk -F': ' '/pixelHeight/{print $2}')"
