#!/bin/sh
# Crop and resize a photo to a divers.studio card plate.
#
#   bin/make-card-image.sh <source> <slug> [a|b]
#   bin/make-card-image.sh ~/Downloads/IMG_1234.HEIC first-light a
#
# Accepts anything sips reads, HEIC included. Centre-crops to the card ratio
# (230:334) and writes assets/<slug>-<variant>.jpg at 2x card width.
set -e

SRC="$1"; SLUG="$2"; VAR="${3:-a}"
[ -n "$SRC" ] && [ -n "$SLUG" ] || { echo "usage: $0 <source> <slug> [a|b]" >&2; exit 1; }
[ -f "$SRC" ] || { echo "no such file: $SRC" >&2; exit 1; }

TW=640            # target width, 2x the 320px card cap
TH=930            # 640 / (230/334), the card ratio
OUT="assets/$SLUG-$VAR.jpg"
TMP=$(mktemp -t cardimg).jpg

# Normalise to JPEG first so EXIF rotation is baked in and dims are honest.
sips -s format jpeg "$SRC" --out "$TMP" >/dev/null

W=$(sips -g pixelWidth  "$TMP" | awk -F': ' '/pixelWidth/{print $2}')
H=$(sips -g pixelHeight "$TMP" | awk -F': ' '/pixelHeight/{print $2}')

# Scale so the image covers the target box, then centre-crop to it.
if [ "$((W * TH))" -gt "$((H * TW))" ]; then
  sips --resampleHeight "$TH" "$TMP" --out "$TMP" >/dev/null   # source is wider
else
  sips --resampleWidth  "$TW" "$TMP" --out "$TMP" >/dev/null   # source is taller
fi
sips -c "$TH" "$TW" "$TMP" --out "$TMP" >/dev/null
sips -s formatOptions 82 "$TMP" --out "$OUT" >/dev/null
rm -f "$TMP"

echo "$OUT  $(sips -g pixelWidth -g pixelHeight "$OUT" | awk -F': ' '/pixel/{printf "%s ", $2}') $(wc -c < "$OUT" | tr -d ' ')B"
