/* ==========================================================================
   The plates converge as you scroll.

   Each plate carries its start and end position in the source's canvas units
   (data-x0, data-x1), measured off the live template. Plate 1 is anchored and
   never moves; every other plate slides in behind it and settles about 44
   apart, so the run ends as a fanned stack sitting fully on screen.

   Measured rather than read from the animation config, whose dx values pair
   off by one against the plates and would drag the whole stack off the left
   edge. Every widget shares one timeline: duration 0.5, start_offset 0,
   ease-both, with the distance varying per plate.
   ========================================================================== */

const CANVAS = 1024;
const MAX_TRAVEL = 2354;   // the furthest plate's travel, x0 - x1
const mqStacked = window.matchMedia('(max-width: 760px)');

/* Every plate moves at the same speed, so the one with least distance to
   cover lands first and the furthest lands last. That staggered arrival is
   the whole effect: plates that have landed sit as slivers on the left while
   the ones still travelling are still open on the right.

   Measured off the live template. Plate progress against scroll came out as
   duration proportional to distance, e.g. plate 7 reads 0.51 at 20% scroll
   and this model predicts 0.52.

   Plate 1 never moves, so it would land instantly and snap its caption away.
   FLOOR gives it a short nominal travel so it fades like the rest. */
const SPAN = 1;      // the furthest plate lands exactly at the end of the run
const FLOOR = 150;   // minimum nominal travel, canvas units

// "ease-both" in the source.
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function initConverge() {
  const track = document.querySelector('.track');
  const stage = document.querySelector('.stage');
  const shots = [...document.querySelectorAll('.shot')];
  if (!track || !stage || !shots.length) return;

  let scale = 1;
  let travel = 0;
  let start = 0;

  function measure() {
    if (mqStacked.matches) {
      track.style.height = '';
      stage.style.removeProperty('--scale');
      shots.forEach(s => { s.style.removeProperty('--tx'); s.style.removeProperty('--cap-op'); });
      travel = 0;
      return;
    }
    // Clamped so plates neither shrink to nothing nor swell on a huge display.
    scale = Math.min(1.5, Math.max(0.5, stage.clientWidth / CANVAS));
    stage.style.setProperty('--scale', scale);
    travel = MAX_TRAVEL * scale;
    start = track.offsetTop;
    track.style.height = `${stage.clientHeight + travel}px`;
    render();
  }

  // No rAF and no ticking latch: a latch cleared inside a rAF callback wedges
  // for good if that callback is ever dropped. Scroll events already arrive
  // at frame rate, and this only writes one custom property per plate.
  function render() {
    if (travel <= 0) return;
    const p = Math.min(1, Math.max(0, (window.scrollY - start) / travel));

    const last = shots[shots.length - 1];

    for (const shot of shots) {
      const x0 = parseFloat(shot.dataset.x0) || 0;
      const x1 = parseFloat(shot.dataset.x1) || 0;
      const dist = Math.abs(x0 - x1);

      // This plate's own slice of the run, proportional to how far it goes.
      const dur = (Math.max(dist, FLOOR) / MAX_TRAVEL) * SPAN;
      const u = dur > 0 ? Math.min(1, p / dur) : 1;

      shot.style.setProperty('--tx', `${(x0 + (x1 - x0) * easeInOut(u)) * scale}px`);

      // The caption leaves as its own plate lands, not on a global timer, so
      // plates still travelling keep their labels while landed ones do not.
      //
      // The last plate keeps its label for good. It is the one left open on
      // top of the finished stack, so the run ends on a titled frame rather
      // than on nothing. The source drops this one too; this is deliberate.
      const cap = shot === last ? 1 : 1 - Math.min(1, Math.max(0, (u - 0.7) / 0.3));
      shot.style.setProperty('--cap-op', cap.toFixed(3));
    }
  }

  window.addEventListener('scroll', render, { passive: true });
  window.addEventListener('resize', measure);
  mqStacked.addEventListener('change', measure);

  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('load', measure);
}

/* Tabbing must not land on a plate the stage has pushed off screen, so scroll
   to the point in the timeline where that plate is in view. */
function initFocusFollow() {
  const track = document.querySelector('.track');
  const stage = document.querySelector('.stage');
  document.querySelectorAll('.shot').forEach((shot, i, all) => {
    shot.addEventListener('focus', () => {
      if (mqStacked.matches) return;
      // Plate i is comfortably in frame once the timeline has run far enough
      // to have pulled it in from the right.
      const p = all.length > 1 ? i / (all.length - 1) : 0;
      const travel = MAX_TRAVEL * Math.min(1.5, Math.max(0.5, stage.clientWidth / CANVAS));
      window.scrollTo({ top: track.offsetTop + p * travel, behavior: 'auto' });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initConverge();
  initFocusFollow();
});
