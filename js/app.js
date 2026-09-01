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
      stage.style.removeProperty('--cap-op');
      shots.forEach(s => s.style.removeProperty('--tx'));
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
    const eased = easeInOut(p);

    // Captions are for the spread state. The source hides them outright once
    // the run starts, somewhere between 8% and 15% of the scroll; faded out
    // over that window here so they never stack into an unreadable smear.
    const capOp = 1 - Math.min(1, Math.max(0, (p - 0.01) / 0.09));
    stage.style.setProperty('--cap-op', capOp.toFixed(3));

    for (const shot of shots) {
      const x0 = parseFloat(shot.dataset.x0) || 0;
      const x1 = parseFloat(shot.dataset.x1) || 0;
      shot.style.setProperty('--tx', `${(x0 + (x1 - x0) * eased) * scale}px`);
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
