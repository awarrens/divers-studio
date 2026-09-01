# divers.studio

Site starter. A clean rebuild of the filmstrip portfolio pattern from the
Readymag template "Horizon" (`readymag.com/designs/6357495`).

Open `index.html` directly, or serve it:

```
python3 -m http.server 4200
```

## Deploying

There is no build step. Any host should serve the repo root as-is.

- **GitHub Pages** is live at https://awarrens.github.io/divers-studio/ from
  `main` / root. Pages needs a public repo on the free plan.
- **Render** static sites default to a `build` publish directory, which does
  not exist here and fails with `Publish directory build does not exist!`. Set
  Publish Directory to `.` and leave Build Command empty. `render.yaml` records
  this, but only Blueprint-managed services read it; a service created by hand
  in the dashboard keeps its own settings.

That server sends `Last-Modified` but no `Cache-Control`, so a soft reload can
serve stale CSS and make a fix look like it did not land. The asset links in
`index.html` carry a `?v=` stamp for that reason; bump it, or hard reload
(cmd-shift-R), if a change does not show up.

## What was taken from the source

The source is a Readymag export: every element is absolutely positioned inside
a fixed 1024px canvas that is `transform: scale()`d to fit the viewport. That
markup is not reusable, so only the design decisions were carried over. The
measured values live in `css/tokens.css` with the original numbers in comments.

| | Source | Here |
|---|---|---|
| Canvas | 1024px, scaled to viewport | fluid, `clamp()` |
| Layout | absolute `left`/`top` per widget | flex row + scroll snap |
| Type | Inter 400/500 at 8, 9, 11px on the 1024 canvas | same ratios, bounded |
| Color | `#131212` on `#e1dedb`, no accent | unchanged |
| Corners | 0 on media, 40px on the one pill | unchanged |
| Reveal | opacity 0 to 1, 1.6s ease-out | same, shorter stagger |
| Hover | second stacked image, 0.2s opacity | kept, plus a push-in |
| Mobile | none worth keeping | vertical list under 720px |

## What was fixed

- Horizontal scroll is keyboard reachable (arrows, Page keys, Home, End) and
  the strip is a focusable region.
- `prefers-reduced-motion` disables reveals, the pulse and smooth scrolling.
- Real `<article>` / `<h2>` structure instead of stacked divs.
- The 1.6s stagger between elements is 120ms here. At 1.6s a six card strip
  takes ten seconds to appear.

## Swapping in real work

Each card holds two images. The second is the hover frame:

```html
<div class="card__media">
  <img src="…/still.jpg" alt="Title, still frame">
  <img src="…/hover.jpg" alt="" aria-hidden="true">
</div>
```

Keep them the same aspect ratio. The card ratio is set once, in
`--card-ratio: 230 / 334`. For a production company a muted `<video>` loop
drops into the same slot as the second image.

All five project cards carry real plates: `first-light-a.jpg`,
`cold-open-a.jpg`, `handmade-a.jpg`, `long-run-a.jpg`, `open-water-a.jpg`.
No generated placeholders remain. No card has a hover frame yet; add a `-b` plate to enable the
0.2s swap.

The strip runs: intro (type only), five project cards, then a `.card--action`
slot holding a bare "View all" link to `/work/`. That index page does not
exist yet. The slot takes a card-sized box so it holds the grid rhythm, with
the link centred in it.

The intro card is type only, no plate. It carries `aspect-ratio: var(--card-ratio)`
so it occupies the same box as a photo card and centres identically, which is
what levels its first line of text with the top edge of the frames.

### bin/make-card-image.sh

Crops and resizes any photo, HEIC included, to a card plate at 640x930
(2x the card cap, at the 230:334 ratio):

```
bin/make-card-image.sh ~/Downloads/IMG_1234.HEIC cold-open a
bin/make-card-image.sh ~/Downloads/IMG_1235.HEIC cold-open b   # hover frame
```

Then point the card at `assets/<slug>-a.jpg`.

### The caption scrim

Captions sit over the bottom of the frame. Horizon got away with no scrim
because every still in it was dark down there; real photography is not that
obliging, so the scrim is **on by default** for every card except the intro.
Add `class="card--no-scrim"` to an `<article>` to switch it off for a frame
that is already dark.

### Card hover

Beyond the source's image swap, a card hover runs a 2.5% `scale` on the frame
over `--dur-hover` (0.6s), clipped by `.card__media`'s `overflow: hidden`, plus
a 3px shove on the caption arrow. Scale rather than lift or shadow, since
nothing else in this design casts one, and 0.6s so it reads as a slow camera
push instead of a UI bounce. Both are held still under
`prefers-reduced-motion`, rather than snapping to the end state.

The swap itself is still inert until cards get a `-b` plate.

### bin/reorder-card.py

Moves a card one slot along the strip:

```
python3 bin/reorder-card.py "Open Water" left
```

It splices the two `<article>` spans and keeps the whitespace between them.
Rebuilding the block by joining regex matches drops the blank lines, so the
replace target stops matching and the edit silently does nothing.

### bin/check-caption-contrast.py

Measures the worst-case WCAG contrast between the caption color and the
brightest pixel under it, with the scrim's real alpha applied:

```
python3 bin/check-caption-contrast.py assets/handmade-a.jpg
```

Current plates: `handmade-a.jpg` 12.7:1, `first-light-a.jpg` 10.2:1,
`open-water-a.jpg` 11.8:1, `long-run-a.jpg` 10.4:1, `first-light-a.jpg` 10.2:1,
`cold-open-a.jpg` 8.9:1. AAA is 7:1. If a new frame comes in under that, deepen the gradient in
`css/styles.css` rather than nudging the text color.
