import { useState, useEffect } from 'react';
import { K, emptyRecipe, lines, cookMinutes } from '../lib/recipe.js';

export default function Editor({ recipe, onSave, onDelete, onClose }) {
  const isNew = !recipe[K.id];
  const [form, setForm] = useState(recipe);
  const [saving, setSaving] = useState(false);
  // Opening a recipe reads it. Editing is a deliberate second step.
  const [mode, setMode] = useState(isNew ? 'edit' : 'view');

  useEffect(() => {
    setForm(recipe);
    setMode(recipe[K.id] ? 'view' : 'edit');
  }, [recipe]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const sourceUrl = (form[K.source] || '').trim();
  const sourceOk = /^https?:\/\//i.test(sourceUrl);

  const submit = async () => {
    if (!(form[K.name] || '').trim()) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  // View mode only touches the date, so it skips submit()'s name guard —
  // a row with a blank name in the sheet is still schedulable.
  const saveDate = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'view') {
    return (
      <ViewSheet
        recipe={recipe}
        form={form}
        saving={saving}
        sourceUrl={sourceUrl}
        sourceOk={sourceOk}
        onDateChange={set(K.date)}
        onSaveDate={saveDate}
        onEdit={() => setMode('edit')}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <h2>{isNew ? 'Add recipe' : 'Edit recipe'}</h2>

        <div className="field">
          <label>Recipe name</label>
          <input
            value={form[K.name] || ''}
            onChange={set(K.name)}
            placeholder="Weeknight chana masala"
            autoFocus
          />
        </div>

        <div className="field">
          <label>
            Original recipe <span className="hint">— link to the source</span>
          </label>
          <input
            type="url"
            value={form[K.source] || ''}
            onChange={set(K.source)}
            placeholder="https://…"
          />
          {sourceOk && (
            <a
              className="source-link"
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open original ↗
            </a>
          )}
        </div>

        <div className="row2">
          <div className="field">
            <label>Scheduled for</label>
            <input type="date" value={form[K.date] || ''} onChange={set(K.date)} />
          </div>
          <div className="field">
            <label>Cook time (minutes)</label>
            <input
              type="number"
              min="0"
              value={form[K.time] || ''}
              onChange={set(K.time)}
              placeholder="45"
            />
          </div>
        </div>

        <div className="field">
          <label>
            Night before task{' '}
            <span className="hint">— leave empty if nothing to do</span>
          </label>
          <input
            value={form[K.night] || ''}
            onChange={set(K.night)}
            placeholder="Soak the beans"
          />
        </div>

        <div className="field">
          <label>Image URL</label>
          <input value={form[K.img] || ''} onChange={set(K.img)} placeholder="https://…" />
        </div>

        <div className="field">
          <label>
            Ingredients <span className="hint">— one per line</span>
          </label>
          <textarea value={form[K.ing] || ''} onChange={set(K.ing)} />
        </div>

        <div className="field">
          <label>
            Instructions <span className="hint">— one step per line</span>
          </label>
          <textarea value={form[K.ins] || ''} onChange={set(K.ins)} />
        </div>

        <div className="sheet-actions">
          <button className="btn btn-go" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            className="btn-quiet"
            onClick={() => {
              // Existing recipe: back out to reading it, not out of the sheet.
              if (isNew) return onClose();
              setForm(recipe);
              setMode('view');
            }}
            disabled={saving}
          >
            Cancel
          </button>
          <span className="spacer" />
          {!isNew && (
            <button
              className="btn-danger"
              onClick={() => onDelete(form)}
              disabled={saving}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Read-only recipe view. The scheduled date is the one thing editable here. */
function ViewSheet({
  recipe,
  form,
  saving,
  sourceUrl,
  sourceOk,
  onDateChange,
  onSaveDate,
  onEdit,
  onClose,
}) {
  const [imgOk, setImgOk] = useState(true);
  const name = recipe[K.name] || 'Untitled recipe';
  const mins = cookMinutes(recipe);
  const night = (recipe[K.night] || '').trim();
  const imgUrl = (recipe[K.img] || '').trim();
  const ingredients = lines(recipe[K.ing]);
  const instructions = lines(recipe[K.ins]);
  const dateDirty = (form[K.date] || '') !== (recipe[K.date] || '');

  // Every column in the sheet is shown, empty ones included — an absent
  // "night before" is information too.
  const blank = <span className="view-blank">Not set</span>;

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        {imgUrl && imgOk && (
          <img
            className="view-hero"
            src={imgUrl}
            alt=""
            onError={() => setImgOk(false)}
          />
        )}

        <h2 className="view-title">{name}</h2>

        <div className="view-meta">
          <span>{mins !== null ? `${mins} min` : 'No cook time set'}</span>
          {sourceOk && (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              Open original ↗
            </a>
          )}
        </div>

        <div className="view-section">
          <h3>Original recipe</h3>
          {sourceUrl ? (
            sourceOk ? (
              <a
                className="view-url"
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {sourceUrl}
              </a>
            ) : (
              // not a link — show whatever's in the cell verbatim
              <p className="view-text">{sourceUrl}</p>
            )
          ) : (
            <p className="view-text">{blank}</p>
          )}
        </div>

        <div className="field view-date">
          <label htmlFor="view-date-input">Scheduled for</label>
          <input
            id="view-date-input"
            type="date"
            value={form[K.date] || ''}
            onChange={onDateChange}
            disabled={saving}
          />
        </div>

        <div className="view-section">
          <h3>Cook time</h3>
          <p className="view-text">{mins !== null ? `${mins} minutes` : blank}</p>
        </div>

        <div className="view-section">
          <h3>Night before</h3>
          <p className="view-text view-night">{night || blank}</p>
        </div>

        <div className="view-section">
          <h3>Ingredients</h3>
          {ingredients.length > 0 ? (
            <ul className="view-list">
              {ingredients.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          ) : (
            <p className="view-text">{blank}</p>
          )}
        </div>

        <div className="view-section">
          <h3>Instructions</h3>
          {instructions.length > 0 ? (
            <ol className="view-steps">
              {instructions.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>
          ) : (
            <p className="view-text">{blank}</p>
          )}
        </div>

        <div className="view-section">
          <h3>Image URL</h3>
          {imgUrl ? (
            <a
              className="view-url"
              href={imgUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {imgUrl}
            </a>
          ) : (
            <p className="view-text">{blank}</p>
          )}
        </div>

        <div className="sheet-actions">
          {dateDirty ? (
            <button className="btn btn-go" onClick={onSaveDate} disabled={saving}>
              {saving ? 'Saving…' : 'Save date'}
            </button>
          ) : (
            <button className="btn" onClick={onEdit} disabled={saving}>
              Edit recipe
            </button>
          )}
          <button className="btn-quiet" onClick={onClose} disabled={saving}>
            Close
          </button>
          <span className="spacer" />
          {dateDirty && (
            <button className="btn-quiet" onClick={onEdit} disabled={saving}>
              Edit recipe
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { emptyRecipe };
