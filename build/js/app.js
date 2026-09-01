/* Concept two: staggered reveal on scroll. Nothing else needs script. */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  // Stagger restarts per group, so a row's plates cascade but the page does
  // not accumulate a delay that leaves the footer waiting seconds to appear.
  let i = 0, lastTop = -Infinity;
  items.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top - lastTop > 40) i = 0; else i += 1;
    lastTop = top;
    el.style.setProperty('--i', i);
    io.observe(el);
  });
}

/* The circular arrows are real controls, so give them something to do:
   move to the section they point at. Focus follows the scroll, otherwise
   keyboard users are left where they started. */
function initScrollButtons() {
  document.querySelectorAll('[data-scroll-to]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.scrollTo);
      if (!target) return;
      target.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initScrollButtons();
});
