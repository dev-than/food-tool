import { useState } from 'react';
import { K, cookMinutes, hasSource } from '../lib/recipe.js';
import { relativeLabel, daysFromToday } from '../lib/dates.js';

export default function RecipeCard({ recipe, onOpen, onDragStart, onDragEnd }) {
  const [imgOk, setImgOk] = useState(true);
  const name = recipe[K.name] || 'Untitled recipe';
  const mins = cookMinutes(recipe);
  const date = recipe[K.date];
  const dayDelta = date ? daysFromToday(date) : null;
  const future = dayDelta !== null && dayDelta > 0;

  return (
    <div
      className="rcard"
      draggable
      onDragStart={(e) => onDragStart(e, recipe)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(recipe)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(recipe);
        }
      }}
    >
      <div className="rcard-img">
        {recipe[K.img] && imgOk ? (
          <img
            src={recipe[K.img]}
            alt=""
            loading="lazy"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="rcard-img-blank">{name[0] || '?'}</div>
        )}
        {hasSource(recipe) && <span className="rcard-source">source ↗</span>}
      </div>

      <div className="rcard-body">
        <p className="rcard-name">{name}</p>
        <div className="rcard-foot">
          <span className="rcard-time">
            {mins !== null ? `${mins} min` : '—'}
          </span>
          {date ? (
            <span className={'rcard-date' + (future ? ' is-future' : '')}>
              {relativeLabel(date)}
            </span>
          ) : (
            <span className="rcard-date is-none">Unscheduled</span>
          )}
        </div>
      </div>
    </div>
  );
}
