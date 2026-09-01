/* ==========================================================================
   Vertical scroll drives the filmstrip sideways.

   The track is made exactly as tall as the strip's horizontal overflow, so
   one pixel of scroll is one pixel of travel and the strip finishes exactly
   as the sticky stage lets go. Measured rather than guessed at, because the
   plate width is a clamp() and changes with the viewport.
   ========================================================================== */

const mqStacked = window.matchMedia('(max-width: 760px)');

function initFilmstrip() {
  const track = document.querySelector('.track');
  const stage = document.querySelector('.stage');
  const strip = document.querySelector('.strip');
  if (!track || !stage || !strip) return;

  let overflow = 0;
  let start = 0;

  function measure() {
    if (mqStacked.matches) {
      track.style.height = '';
      strip.style.transform = '';
      overflow = 0;
      return;
    }
    // How far the strip has to travel to bring its right edge into view.
    overflow = Math.max(0, strip.scrollWidth - stage.clientWidth);
    start = track.offsetTop;
    track.style.height = `${stage.clientHeight + overflow}px`;
    render();
  }

  // No rAF and no ticking latch here on purpose. A latch that is unset inside
  // a rAF callback wedges permanently if that callback is ever dropped, and
  // then scrolling silently stops moving the strip. Scroll events are already
  // delivered at frame rate, and this only reads a cached number and writes
  // one transform, so it can just run.
  function render() {
    if (overflow <= 0) return;
    const progress = Math.min(1, Math.max(0, (window.scrollY - start) / overflow));
    strip.style.transform = `translate3d(${-progress * overflow}px, 0, 0)`;
  }

  window.addEventListener('scroll', render, { passive: true });
  window.addEventListener('resize', measure);
  mqStacked.addEventListener('change', measure);

  // Fonts and images both change the strip's width, so re-measure once they
  // have settled rather than trusting the first layout.
  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('load', measure);
}

/* Keep a focused plate on screen. Without this, tabbing through the strip
   moves focus to something the sticky stage has clipped out of view. */
function initFocusFollow() {
  document.querySelectorAll('.shot').forEach(shot => {
    shot.addEventListener('focus', () => {
      if (mqStacked.matches) return;
      const track = document.querySelector('.track');
      const strip = document.querySelector('.strip');
      const stage = document.querySelector('.stage');
      const overflow = Math.max(0, strip.scrollWidth - stage.clientWidth);
      if (overflow <= 0) return;
      const target = shot.offsetLeft - stage.clientWidth / 2 + shot.offsetWidth / 2;
      const progress = Math.min(1, Math.max(0, target / overflow));
      window.scrollTo({ top: track.offsetTop + progress * overflow, behavior: 'auto' });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initFilmstrip();
  initFocusFollow();
});
