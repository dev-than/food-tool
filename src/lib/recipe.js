// Keys map exactly to the sheet's header row. If you rename a column in the
// sheet, change it here too (and in Code.gs COLUMNS).
export const K = {
  id: 'ID',
  name: 'Recipe Name',
  date: 'Scheduled For',
  img: 'Image URL',
  night: 'Night Before Task',
  source: 'Original Recipe',
  time: 'Cook Time (Minutes)',
  ing: 'Ingredients',
  ins: 'Instructions',
};

export const lines = (s) =>
  (s || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

/** Cook time as a number, or null if blank/unparseable. */
export function cookMinutes(r) {
  const n = parseInt(r[K.time], 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Does a recipe match a search query? Matches on name and ingredients, so
 * "what can I do with the chorizo" works as well as searching by title.
 * All whitespace-separated terms must match somewhere (AND, not phrase).
 */
export function matchesQuery(r, query) {
  const terms = (query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const hay = `${r[K.name] || ''}\n${r[K.ing] || ''}`.toLowerCase();
  return terms.every((t) => hay.includes(t));
}

export function hasSource(r) {
  const s = (r[K.source] || '').trim();
  return /^https?:\/\//i.test(s);
}

/** A blank recipe object for the "add" form. */
export function emptyRecipe() {
  return {
    [K.id]: '',
    [K.name]: '',
    [K.date]: '',
    [K.img]: '',
    [K.night]: '',
    [K.source]: '',
    [K.time]: '',
    [K.ing]: '',
    [K.ins]: '',
  };
}
