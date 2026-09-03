/* ==========================================================================
   Marks the body once the page has scrolled, so the fixed chrome can put a
   backdrop behind itself and stay readable over moving content.

   No rAF and no ticking latch: a latch cleared inside a rAF callback wedges
   for good if that callback is ever dropped. This only toggles one class.
   ========================================================================== */

function initScrolled() {
  const mark = () => {
    document.body.classList.toggle('is-scrolled', window.scrollY > 4);
  };
  window.addEventListener('scroll', mark, { passive: true });
  mark();   // a reload can restore a scrolled position
}

document.addEventListener('DOMContentLoaded', initScrolled);
