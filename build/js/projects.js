/* ==========================================================================
   Chip filters for the projects index.

   Filters in place with the hidden attribute rather than a class, so the
   items are genuinely removed from the accessibility tree and from tab order
   instead of merely being invisible but still focusable.
   ========================================================================== */

function initFilters() {
  const chips = [...document.querySelectorAll('.chip')];
  const items = [...document.querySelectorAll('.grid__item')];
  const count = document.querySelector('.index__count');
  if (!chips.length || !items.length) return;

  function apply(filter) {
    let shown = 0;
    for (const item of items) {
      const match = filter === 'all' || item.dataset.cat === filter;
      item.hidden = !match;
      if (match) shown += 1;
    }
    for (const chip of chips) {
      chip.setAttribute('aria-pressed', String(chip.dataset.filter === filter));
    }
    if (count) {
      count.textContent =
        `${shown} ${shown === 1 ? 'project' : 'projects'}` +
        (filter === 'all' ? '' : ` in ${filter}`);
    }
    // Reflect it in the URL so a filtered view can be linked and survives a
    // reload, without adding a history entry per click.
    const url = new URL(location.href);
    if (filter === 'all') url.searchParams.delete('filter');
    else url.searchParams.set('filter', filter);
    history.replaceState(null, '', url);
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => apply(chip.dataset.filter));
  });

  const known = chips.map(c => c.dataset.filter);
  const initial = new URL(location.href).searchParams.get('filter');
  apply(known.includes(initial) ? initial : 'all');
}

document.addEventListener('DOMContentLoaded', initFilters);
