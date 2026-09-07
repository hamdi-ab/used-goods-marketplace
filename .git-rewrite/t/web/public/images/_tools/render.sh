#!/usr/bin/env bash
# Rasterize all generated SVGs to PNG at 2x via headless Chrome.
# Each SVG is inlined into an HTML page sized to 2x the design box so the
# art fills the viewport (Chrome does not scale a bare .svg to the window).
set -euo pipefail

CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
IMG="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# name:WxH design size -> render at 2x
declare -A SIZES=(
  [illustrations/signature-vintech-hero.svg]="1600 1000"
  [illustrations/onboarding-create-account.svg]="1200 1000"
  [illustrations/onboarding-list-item.svg]="1200 1000"
  [illustrations/onboarding-receive-offers.svg]="1200 1000"
  [illustrations/empty-search-results.svg]="1024 1024"
  [illustrations/empty-favorites.svg]="1024 1024"
  [illustrations/empty-listings.svg]="1024 1024"
  [illustrations/empty-offers.svg]="1024 1024"
  [illustrations/error-404.svg]="1024 1024"
  [illustrations/error-500.svg]="1024 1024"
  [illustrations/error-offline.svg]="1024 1024"
  [illustrations/ai-before-after.svg]="1600 800"
  [illustrations/trust-verified-seller.svg]="1200 1000"
  [illustrations/trust-safe-transactions.svg]="1200 1000"
  [illustrations/trust-community-marketplace.svg]="1200 1000"
  [photos/photo-modern-apartment.svg]="1600 1200"
  [photos/photo-seller-taking-photos.svg]="1600 1200"
  [photos/photo-buyer-meeting-seller.svg]="1600 1200"
)

for svg in "${!SIZES[@]}"; do
  read -r W H <<<"${SIZES[$svg]}"
  png="${svg%.svg}.png"
  html="$TMP/$(basename "$svg" .svg).html"
  {
    echo '<!DOCTYPE html><html><head><style>body{margin:0}svg{display:block}</style></head><body>'
    # inline the svg, overriding width/height to 2x
    python - "$IMG/$svg" "$((W*2))" "$((H*2))" <<'PYEOF'
import sys, re
svg = open(sys.argv[1], encoding='utf-8').read()
svg = re.sub(r'width="\d+"', 'width="' + sys.argv[2] + '"', svg, count=1)
svg = re.sub(r'height="\d+"', 'height="' + sys.argv[3] + '"', svg, count=1)
sys.stdout.write(svg)
PYEOF
    echo '</body></html>'
  } > "$html"
  html_win=$(cygpath -w "$html")
  png_win=$(cygpath -w "$IMG/$png")
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --window-size=$((W * 2)),$((H * 2)) --screenshot="$png_win" "$html_win" \
    >/dev/null 2>&1 || { echo "FAIL $svg"; exit 1; }
  echo "rendered $png ($((W * 2))x$((H * 2)))"
done
echo "all pngs done"
