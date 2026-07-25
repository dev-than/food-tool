import { useEffect, useMemo, useState, useCallback } from 'react';
import Tonight from './components/Tonight.jsx';
import Timeline from './components/Timeline.jsx';
import Filters, { DEFAULT_FILTERS } from './components/Filters.jsx';
import RecipeCard from './components/RecipeCard.jsx';
import Editor from './components/Editor.jsx';
import { K, cookMinutes, emptyRecipe, matchesQuery } from './lib/recipe.js';
import { daysFromToday } from './lib/dates.js';
import {
  loadRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from './api.js';

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null); // recipe object or null
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [dragging, setDragging] = useState(false);

  const flash = useCallback((msg, bad = false) => {
    setToast({ msg, bad });
    setTimeout(() => setToast(null), bad ? 4500 : 1800);
  }, []);

  useEffect(() => {
    loadRecipes()
      .then((rs) => {
        setRecipes(rs);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  const refresh = (rs) => setRecipes(rs);

  // ─── Mutations (optimistic where it helps) ──────────────────────────────
  const assignDate = async (id, day) => {
    const prev = recipes;
    const target = recipes.find((r) => r[K.id] === id);
    if (!target) return;
    // optimistic
    setRecipes((rs) =>
      rs.map((r) => (r[K.id] === id ? { ...r, [K.date]: day } : r))
    );
    try {
      const rs = await updateRecipe({ ...target, [K.date]: day });
      refresh(rs);
    } catch (err) {
      setRecipes(prev);
      flash('Could not schedule: ' + err.message, true);
    }
  };

  const saveRecipe = async (form) => {
    try {
      const rs = form[K.id]
        ? await updateRecipe(form)
        : await createRecipe(form);
      refresh(rs);
      setEditing(null);
      flash('Saved');
    } catch (err) {
      flash('Save failed: ' + err.message, true);
    }
  };

  const removeRecipe = async (form) => {
    if (
      !confirm(
        `Delete "${form[K.name] || 'this recipe'}"? It comes out of the sheet too.`
      )
    )
      return;
    try {
      const rs = await deleteRecipe(form[K.id]);
      refresh(rs);
      setEditing(null);
      flash('Deleted');
    } catch (err) {
      flash('Delete failed: ' + err.message, true);
    }
  };

  // ─── Drag plumbing ──────────────────────────────────────────────────────
  const onDragStart = (e, recipe) => {
    e.dataTransfer.setData('text/plain', recipe[K.id]);
    e.dataTransfer.effectAllowed = 'move';
    setDragging(true);
  };
  const onDragEnd = () => setDragging(false);

  // ─── Filtering + sorting for the grid ───────────────────────────────────
  const visible = useMemo(() => {
    let list = recipes.slice();

    // text search — name + ingredients
    list = list.filter((r) => matchesQuery(r, filters.q));

    // cook-time filter
    list = list.filter((r) => {
      const m = cookMinutes(r);
      switch (filters.time) {
        case 'u30':
          return m !== null && m < 30;
        case '30-60':
          return m !== null && m >= 30 && m <= 60;
        case 'o60':
          return m !== null && m > 60;
        default:
          return true;
      }
    });

    // scheduled-date filter
    list = list.filter((r) => {
      const d = r[K.date];
      const delta = d ? daysFromToday(d) : null;
      switch (filters.made) {
        case 'unscheduled':
          return !d;
        case 'recent':
          return delta !== null && delta <= 0 && delta >= -14;
        case 'stale':
          return delta !== null && delta <= -30;
        default:
          return true;
      }
    });

    // sort
    const name = (r) => (r[K.name] || '').toLowerCase();
    list.sort((a, b) => {
      switch (filters.sort) {
        case 'recent':
          return (b[K.date] || '').localeCompare(a[K.date] || '');
        case 'oldest': {
          // unscheduled sinks to the bottom
          const da = a[K.date] || '9999';
          const db = b[K.date] || '9999';
          return da.localeCompare(db);
        }
        case 'quick': {
          const ma = cookMinutes(a);
          const mb = cookMinutes(b);
          if (ma === null) return 1;
          if (mb === null) return -1;
          return ma - mb;
        }
        default:
          return name(a).localeCompare(name(b));
      }
    });

    return list;
  }, [recipes, filters]);

  const openNew = () => setEditing(emptyRecipe());

  return (
    <div className="wrap">
      <header className="top">
        <h1 className="mark">
          Prep<span>.</span>
        </h1>
        <button className="btn btn-go" onClick={openNew}>
          Add recipe
        </button>
      </header>

      {status === 'error' && (
        <div className="empty">
          Couldn’t reach the sheet. Check the API URL and secret in{' '}
          <code>src/config.js</code>, and that the Apps Script deployment is set
          to “Anyone.”
        </div>
      )}

      {status !== 'error' && (
        <>
          <Tonight recipes={recipes} onOpen={setEditing} />

          <section className="block">
            <div className="block-head">
              <h2>Next 14 days</h2>
              <span className="block-note">
                drag a recipe up, or tap a day to search
              </span>
            </div>
            <Timeline
              recipes={recipes}
              onAssign={assignDate}
              onOpen={setEditing}
              dragging={dragging}
            />
          </section>

          <section className="block">
            <div className="block-head">
              <h2>All recipes</h2>
              <span className="block-note">{visible.length}</span>
            </div>
            <Filters
              filters={filters}
              onChange={setFilters}
              count={visible.length}
            />

            {status === 'loading' ? (
              <div className="empty">Loading…</div>
            ) : visible.length === 0 ? (
              <div className="empty">
                {recipes.length === 0
                  ? 'No recipes yet. Add one, or paste rows into the sheet.'
                  : filters.q.trim()
                    ? `Nothing matches “${filters.q.trim()}”.`
                    : 'No recipes match these filters.'}
              </div>
            ) : (
              <div className="rgrid">
                {visible.map((r) => (
                  <RecipeCard
                    key={r[K.id]}
                    recipe={r}
                    onOpen={setEditing}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {editing && (
        <Editor
          recipe={editing}
          onSave={saveRecipe}
          onDelete={removeRecipe}
          onClose={() => setEditing(null)}
        />
      )}

      {toast && (
        <div className={'toast' + (toast.bad ? ' toast-bad' : '')}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
