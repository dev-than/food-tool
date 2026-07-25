import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { K } from '../lib/recipe.js';
import { dateRange, todayIso, parts, daysFromToday } from '../lib/dates.js';

const DAYS = 14;

export default function Timeline({
  recipes,
  onAssign,
  onOpen,
  dragging,
}) {
  const days = dateRange(todayIso(), DAYS);
  const [overDay, setOverDay] = useState(null);
  const [searchDay, setSearchDay] = useState(null);
  // The popover is portaled out of the scroller, so it needs its anchor's
  // live position — keep a handle on each day element.
  const dayEls = useRef({});

  const byDay = {};
  for (const r of recipes) {
    const d = r[K.date];
    if (d) (byDay[d] ||= []).push(r);
  }

  const handleDrop = (e, day) => {
    e.preventDefault();
    setOverDay(null);
    const id = e.dataTransfer.getData('text/plain');
    if (id) onAssign(id, day);
  };

  return (
    <div className="timeline-wrap">
      <div className="timeline" role="list">
        {days.map((day) => {
          const list = byDay[day] || [];
          const delta = daysFromToday(day);
          const p = parts(day);
          const isToday = delta === 0;
          const isTomorrow = delta === 1;

          return (
            <div
              key={day}
              role="listitem"
              ref={(el) => {
                if (el) dayEls.current[day] = el;
                else delete dayEls.current[day];
              }}
              className={
                'day' +
                (isToday ? ' day-today' : '') +
                (overDay === day ? ' day-over' : '') +
                (dragging ? ' day-armed' : '')
              }
              onDragOver={(e) => {
                if (dragging) {
                  e.preventDefault();
                  setOverDay(day);
                }
              }}
              onDragLeave={() =>
                setOverDay((cur) => (cur === day ? null : cur))
              }
              onDrop={(e) => handleDrop(e, day)}
            >
              <button
                className="day-head"
                onClick={() => setSearchDay(searchDay === day ? null : day)}
                title="Add a recipe to this day"
              >
                <span className="day-wd">
                  {isToday ? 'Today' : isTomorrow ? 'Tmrw' : p.weekday}
                </span>
                <span className="day-num">{p.day}</span>
                <span className="day-mo">{p.month}</span>
              </button>

              <div className="day-body">
                {list.map((r) => (
                  <button
                    key={r[K.id]}
                    className="pill"
                    onClick={() => onOpen(r)}
                    title={r[K.name]}
                  >
                    {(r[K.night] || '').trim() && (
                      <span className="pill-dot" title="Has prep" />
                    )}
                    <span className="pill-name">
                      {r[K.name] || 'Untitled'}
                    </span>
                  </button>
                ))}
                {dragging && list.length === 0 && (
                  <span className="day-hint">drop here</span>
                )}
              </div>

              {searchDay === day && (
                <DaySearch
                  recipes={recipes}
                  getAnchor={() => dayEls.current[day]}
                  onPick={(id) => {
                    onAssign(id, day);
                    setSearchDay(null);
                  }}
                  onClose={() => setSearchDay(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const GAP = 6; // popover-to-day gap
const EDGE = 8; // keep this far off every viewport edge
const MAX_W = 240;
const MAX_H = 300;
const MIN_H = 160;

function DaySearch({ recipes, getAnchor, onPick, onClose }) {
  const [q, setQ] = useState('');
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const inputRef = useRef(null);

  // Keep the latest callbacks reachable without re-binding listeners.
  const latest = useRef({ onClose, getAnchor });
  latest.current = { onClose, getAnchor };

  // Anchor to the day's live rect in viewport coordinates. The popover is
  // portaled to <body>, so it can't be clipped by .timeline-wrap's scroller.
  useLayoutEffect(() => {
    const place = () => {
      const el = latest.current.getAnchor();
      if (!el) return;
      const r = el.getBoundingClientRect();
      // visualViewport tracks the on-screen area once a mobile keyboard opens.
      const vv = window.visualViewport;
      const vw = vv?.width ?? window.innerWidth;
      const vh = vv?.height ?? window.innerHeight;
      const ox = vv?.offsetLeft ?? 0;
      const oy = vv?.offsetTop ?? 0;

      const width = Math.min(MAX_W, vw - EDGE * 2);
      const left = Math.min(
        Math.max(r.left, ox + EDGE),
        ox + vw - width - EDGE
      );

      // Flip above the day when there isn't room below it.
      const below = r.bottom + GAP;
      const roomBelow = oy + vh - EDGE - below;
      const roomAbove = r.top - GAP - (oy + EDGE);
      const flip = roomBelow < MIN_H && roomAbove > roomBelow;
      const maxHeight = Math.min(MAX_H, Math.max(flip ? roomAbove : roomBelow, MIN_H));

      setPos({
        left,
        top: flip ? Math.max(oy + EDGE, r.top - GAP - maxHeight) : below,
        width,
        maxHeight,
      });
    };

    place();
    const vv = window.visualViewport;
    // capture:true so the timeline's own horizontal scroll is caught too.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    vv?.addEventListener('resize', place);
    vv?.addEventListener('scroll', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      vv?.removeEventListener('resize', place);
      vv?.removeEventListener('scroll', place);
    };
  }, []);

  useEffect(() => {
    // preventScroll: the anchor is already in view; focusing shouldn't jump it.
    inputRef.current?.focus({ preventScroll: true });
    const onDoc = (e) => {
      const anchor = latest.current.getAnchor();
      // Taps on the day itself are the trigger's business, not a dismissal.
      if (ref.current?.contains(e.target) || anchor?.contains(e.target)) return;
      latest.current.onClose();
    };
    const onKey = (e) => e.key === 'Escape' && latest.current.onClose();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const needle = q.trim().toLowerCase();
  const matches = recipes
    .filter((r) => (r[K.name] || '').toLowerCase().includes(needle))
    .slice(0, 8);

  return createPortal(
    <div
      className="day-search"
      ref={ref}
      style={
        pos
          ? {
              left: pos.left,
              top: pos.top,
              width: pos.width,
              maxHeight: pos.maxHeight,
            }
          : { visibility: 'hidden' }
      }
    >
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Find a recipe…"
      />
      <div className="day-search-list">
        {matches.length === 0 ? (
          <div className="day-search-empty">No matches</div>
        ) : (
          matches.map((r) => (
            <button
              key={r[K.id]}
              className="day-search-item"
              onClick={() => onPick(r[K.id])}
            >
              {r[K.name] || 'Untitled'}
            </button>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}
