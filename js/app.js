/* ==========================================================================
   Filmstrip behaviour: vertical wheel -> horizontal scroll, pointer drag,
   keyboard paging, and staggered reveals.
   ========================================================================== */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isStacked    = () => window.matchMedia('(max-width: 720px)').matches;

/* --- Reveal on enter ---------------------------------------------------- */
function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, root: null });

  items.forEach((el, i) => {
    el.style.setProperty('--i', i);
    io.observe(el);
  });
}

/* --- Wheel: map vertical intent onto the horizontal axis ----------------- */
function initWheel(strip) {
  strip.addEventListener('wheel', (e) => {
    if (isStacked()) return;
    // Let real horizontal gestures (trackpad swipe) through untouched.
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    strip.scrollLeft += e.deltaY;
  }, { passive: false });
}

/* --- Pointer drag -------------------------------------------------------- */
function initDrag(strip) {
  let startX = 0, startLeft = 0, dragging = false;

  strip.addEventListener('pointerdown', (e) => {
    if (isStacked() || e.pointerType === 'touch') return;
    dragging  = true;
    strip.dataset.moved = 'false';   // reset per gesture, not per click
    startX    = e.clientX;
    startLeft = strip.scrollLeft;
    strip.setPointerCapture(e.pointerId);
  });

  strip.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 3) {
      strip.classList.add('is-dragging');
      strip.dataset.moved = 'true';
    }
    strip.scrollLeft = startLeft - dx;
  });

  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    strip.classList.remove('is-dragging');
    if (e.pointerId != null && strip.hasPointerCapture?.(e.pointerId)) {
      strip.releasePointerCapture(e.pointerId);
    }
  };
  strip.addEventListener('pointerup', end);
  strip.addEventListener('pointercancel', end);

  // A drag that moved should not also fire the card's link.
  strip.addEventListener('click', (e) => {
    if (strip.dataset.moved === 'true') e.preventDefault();
  }, true);
}

/* --- Keyboard ------------------------------------------------------------ */
function initKeyboard(strip) {
  strip.addEventListener('keydown', (e) => {
    if (isStacked()) return;
    const card = strip.querySelector('.card');
    const step = card ? card.getBoundingClientRect().width + 12 : 240;
    const map  = {
      ArrowRight: step, ArrowLeft: -step,
      PageDown:   step, PageUp:   -step,
    };
    if (e.key in map) {
      e.preventDefault();
      strip.scrollBy({ left: map[e.key], behavior: reduceMotion ? 'auto' : 'smooth' });
    } else if (e.key === 'Home') {
      e.preventDefault();
      strip.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      strip.scrollTo({ left: strip.scrollWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  });
}

/* --- Hide the scroll hint once the user has moved ------------------------ */
function initHint(strip) {
  const hint = document.querySelector('.hint');
  if (!hint) return;
  strip.addEventListener('scroll', () => {
    if (strip.scrollLeft > 40) hint.style.opacity = '0';
  }, { passive: true, once: false });
}

document.addEventListener('DOMContentLoaded', () => {
  const strip = document.querySelector('.strip');
  initReveal();
  if (!strip) return;
  initWheel(strip);
  initDrag(strip);
  initKeyboard(strip);
  initHint(strip);
});
