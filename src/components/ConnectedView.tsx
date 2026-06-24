import { useMemo, useState } from 'react';
import { connectedPoints, relationshipLabels } from '../domain/relationships';
import {
  relationshipTypes,
  type Connection,
  type Point,
  type RelationshipType
} from '../domain/types';

type ConnectedViewProps = {
  points: Point[];
  connections: Connection[];
  activePointId?: string;
  onFocus: (id: string) => void;
  onJump: (point: Point) => void;
  onConnect: (
    subjectId: string,
    objectId: string,
    type: RelationshipType
  ) => Promise<string | null>;
};

export function ConnectedView({
  points,
  connections,
  activePointId,
  onFocus,
  onJump,
  onConnect
}: ConnectedViewProps) {
  const focalPoint = points.find((point) => point.id === activePointId) ?? points[0];
  const [targetId, setTargetId] = useState('');
  const [type, setType] = useState<RelationshipType>('supports');
  const [error, setError] = useState('');
  const connected = useMemo(
    () => (focalPoint ? connectedPoints(focalPoint.id, points, connections) : []),
    [focalPoint, points, connections]
  );
  const candidates = points.filter((point) => point.id !== focalPoint?.id);

  if (!focalPoint) {
    return (
      <section className="content-view empty-state">
        <h2>No connected outline yet</h2>
        <p>Create at least two points, then connect them here.</p>
      </section>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!targetId) {
      setError('Choose a point to connect.');
      return;
    }
    const nextError = await onConnect(focalPoint.id, targetId, type);
    setError(nextError ?? '');
    if (!nextError) setTargetId('');
  };

  return (
    <section className="content-view connected-view" aria-labelledby="connected-title">
      <p className="eyebrow">Focused point</p>
      <h2 id="connected-title">{focalPoint.title}</h2>
      {focalPoint.note && <p className="lead-note">{focalPoint.note}</p>}
      <button type="button" className="text-button" onClick={() => onJump(focalPoint)}>
        {focalPoint.sourceSummary} · Jump to source
      </button>

      <div className="connection-section">
        <h3>Connected ideas</h3>
        {connected.length ? (
          <ul className="connection-list">
            {connected.map((item) => (
              <li key={item.connection.id}>
                <button type="button" onClick={() => onFocus(item.point.id)}>
                  <span className="relationship-label">({item.label})</span>{' '}
                  <strong>{item.point.title}</strong>
                  <span>{item.point.sourceSummary}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No direct connections yet.</p>
        )}
      </div>

      <form className="connection-form" onSubmit={submit}>
        <h3>Add connection</h3>
        <label>
          Relationship
          <select value={type} onChange={(event) => setType(event.target.value as RelationshipType)}>
            {relationshipTypes.map((value) => (
              <option key={value} value={value}>
                {relationshipLabels[value].forward}
              </option>
            ))}
          </select>
        </label>
        <label>
          Point
          <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
            <option value="">Choose a point…</option>
            {candidates.map((point) => (
              <option key={point.id} value={point.id}>{point.title}</option>
            ))}
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="primary-button" disabled={!candidates.length}>
          Add connection
        </button>
      </form>
    </section>
  );
}
