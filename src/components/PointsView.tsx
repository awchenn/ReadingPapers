import { useMemo, useState } from 'react';
import { searchPoints } from '../domain/search';
import type { Point } from '../domain/types';

type PointsViewProps = {
  points: Point[];
  onFocus: (id: string) => void;
  onJump: (point: Point) => void;
  onDelete: (id: string) => Promise<void>;
};

export function PointsView({ points, onFocus, onJump, onDelete }: PointsViewProps) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchPoints(points, query), [points, query]);

  return (
    <section className="content-view points-view" aria-labelledby="points-title">
      <div className="view-heading">
        <div>
          <p className="eyebrow">Your reading trail</p>
          <h2 id="points-title">Points</h2>
        </div>
        <span className="count-badge">{points.length}</span>
      </div>
      <label className="search-field">
        <span className="sr-only">Search points</span>
        <input
          type="search"
          placeholder="Search titles, notes, or excerpts"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {results.length === 0 ? (
        <div className="empty-state">
          <h3>{points.length ? 'No matching points' : 'No points yet'}</h3>
          <p>
            {points.length
              ? 'Try a title, source phrase, or page description.'
              : 'Open Reader and capture the first idea you want to remember.'}
          </p>
        </div>
      ) : (
        <ul className="point-list">
          {results.map((point) => (
            <li key={point.id} className="point-card">
              <button className="point-card-main" type="button" onClick={() => onFocus(point.id)}>
                <strong>{point.title}</strong>
                {point.anchor.kind === 'text' && point.anchor.exact && (
                  <span className="excerpt">“{point.anchor.exact}”</span>
                )}
                <span className="source-label">{point.sourceSummary}</span>
              </button>
              <div className="card-actions">
                <button type="button" onClick={() => onJump(point)}>Jump to source</button>
                <button type="button" className="danger-button" onClick={() => void onDelete(point.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
