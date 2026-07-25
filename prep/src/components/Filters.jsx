const TIME_OPTS = [
  { id: 'any', label: 'Any time' },
  { id: 'u30', label: 'Under 30' },
  { id: '30-60', label: '30–60' },
  { id: 'o60', label: 'Over 60' },
];

const MADE_OPTS = [
  { id: 'any', label: 'All' },
  { id: 'unscheduled', label: 'No date' },
  { id: 'recent', label: 'Last 14 days' },
  { id: 'stale', label: '30+ days ago' },
];

const SORT_OPTS = [
  { id: 'name', label: 'Name (A–Z)' },
  { id: 'recent', label: 'Most recent date' },
  { id: 'oldest', label: 'Oldest date' },
  { id: 'quick', label: 'Quickest to cook' },
];

function Group({ label, options, value, onChange }) {
  return (
    <div className="filter-group">
      <span className="filter-label">{label}</span>
      <div className="chips">
        {options.map((o) => (
          <button
            key={o.id}
            className={'chip' + (value === o.id ? ' chip-on' : '')}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Filters({ filters, onChange, count }) {
  const set = (key) => (val) => onChange({ ...filters, [key]: val });

  return (
    <div className="filters">
      <div className="filter-group filter-search">
        <span className="filter-label">Search</span>
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" />
            <line x1="10.5" y1="10.5" x2="14" y2="14" />
          </svg>
          <input
            type="search"
            className="search-input"
            value={filters.q}
            onChange={(e) => set('q')(e.target.value)}
            placeholder="Name or ingredient…"
            aria-label="Search recipes by name or ingredient"
          />
          {filters.q && (
            <button
              type="button"
              className="search-clear"
              onClick={() => set('q')('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        {filters.q.trim() && (
          <span className="search-count">
            {count} {count === 1 ? 'match' : 'matches'}
          </span>
        )}
      </div>
      <Group
        label="Cook time"
        options={TIME_OPTS}
        value={filters.time}
        onChange={set('time')}
      />
      <Group
        label="Scheduled"
        options={MADE_OPTS}
        value={filters.made}
        onChange={set('made')}
      />
      <div className="filter-group">
        <span className="filter-label">Sort</span>
        <select
          className="sort-select"
          value={filters.sort}
          onChange={(e) => set('sort')(e.target.value)}
        >
          {SORT_OPTS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export const DEFAULT_FILTERS = { time: 'any', made: 'any', sort: 'name', q: '' };
