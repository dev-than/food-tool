import { K } from '../lib/recipe.js';
import { tomorrowIso } from '../lib/dates.js';

export default function Tonight({ recipes, onOpen }) {
  const tm = tomorrowIso();
  const tasks = recipes.filter(
    (r) => r[K.date] === tm && (r[K.night] || '').trim()
  );

  if (tasks.length === 0) {
    return (
      <div className="tonight tonight-clear">
        <div className="eyebrow">Tonight</div>
        <p className="task">Nothing to prep. Free evening.</p>
      </div>
    );
  }

  return (
    <div className="tonight-stack">
      {tasks.map((r) => (
        <button
          key={r[K.id]}
          className="tonight"
          onClick={() => onOpen(r)}
          title="Edit recipe"
        >
          <div className="eyebrow">Tonight — for tomorrow</div>
          <p className="task">{r[K.night]}</p>
          <p className="why">{r[K.name] || 'Untitled recipe'}</p>
        </button>
      ))}
    </div>
  );
}
