import { describe, expect, it } from 'vitest';
import { searchPoints } from './search';
import type { Point } from './types';

const makePoint = (id: string, title: string, exact: string, note = ''): Point => ({
  id,
  paperId: 'paper-1',
  title,
  note,
  anchor: { kind: 'text', pageIndex: 0, rects: [], exact, prefix: '', suffix: '' },
  sourceSummary: 'Page 1 — Text',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
});

describe('searchPoints', () => {
  const points = [
    makePoint('title-hit', 'Radical pathway', 'unrelated source'),
    makePoint('excerpt-hit', 'Control experiment', 'TEMPO suggests a radical intermediate'),
    makePoint('note-hit', 'Observation', 'other text', 'Need to compare with TEMPO')
  ];

  it('searches titles, notes, and source excerpts', () => {
    expect(searchPoints(points, 'TEMPO').map((point) => point.id)).toEqual(['note-hit', 'excerpt-hit']);
  });

  it('returns all points for an empty query', () => {
    expect(searchPoints(points, '')).toEqual(points);
  });

  it('supports prefix matching', () => {
    expect(searchPoints(points, 'radic')[0].id).toBe('title-hit');
  });
});
