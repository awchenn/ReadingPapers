import { describe, expect, it } from 'vitest';
import { connectedPoints, validateConnection } from './relationships';
import type { Connection, Point } from './types';

const point = (id: string, title: string): Point => ({
  id,
  paperId: 'paper-1',
  title,
  anchor: { kind: 'text', pageIndex: 0, rects: [], exact: '', prefix: '', suffix: '' },
  sourceSummary: 'Page 1 — Text',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
});

const connection: Connection = {
  id: 'connection-1',
  paperId: 'paper-1',
  subjectPointId: 'evidence',
  objectPointId: 'claim',
  type: 'supports',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

describe('connectedPoints', () => {
  const points = [point('evidence', 'TEMPO suppresses product formation'), point('claim', 'A radical pathway is proposed')];

  it('uses the forward label from the subject', () => {
    expect(connectedPoints('evidence', points, [connection])[0].label).toBe('Supports');
  });

  it('uses the inverse label from the object', () => {
    expect(connectedPoints('claim', points, [connection])[0].label).toBe('Supported by');
  });
});

describe('validateConnection', () => {
  it('rejects self-connections', () => {
    expect(validateConnection({ subjectPointId: 'a', objectPointId: 'a', type: 'related' }, [])).toMatch(/itself/);
  });

  it('rejects an exact ordered duplicate', () => {
    expect(validateConnection(connection, [connection])).toMatch(/already exists/);
  });

  it('allows a different relationship type for later confirmation in the UI', () => {
    expect(validateConnection({ ...connection, type: 'qualifies' }, [connection])).toBeNull();
  });
});
