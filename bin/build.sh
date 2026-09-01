#!/bin/sh
# Copy the site into build/ for hosts that insist on a publish directory.
#
# There is no real build step here. This exists only because the Render static
# site was created with Publish Directory = "build", and that field lives in
# the dashboard, not in the repo. Fix the field to "." and this whole shim,
# build/ included, can be deleted.
#
# Run from the repo root:  bin/build.sh
set -e
cd "$(dirname "$0")/.."

rm -rf build
mkdir -p build
cp index.html build/
cp -R css js assets build/

# Keep the shim honest: build/ must match source byte for byte.
for f in index.html css/styles.css css/tokens.css js/app.js; do
  cmp -s "$f" "build/$f" || { echo "MISMATCH: $f" >&2; exit 1; }
done

echo "build/ regenerated: $(find build -type f | wc -l | tr -d ' ') files, $(du -sh build | cut -f1)"
