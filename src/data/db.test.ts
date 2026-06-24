import { afterEach, describe, expect, it } from 'vitest';
import { db, removePoint, replacePaper, saveConnection, savePoint } from './db';
import type { Connection, Paper, Point } from '../domain/types';

const paper: Paper = {
  id: 'paper-1',
  filename: 'paper.pdf',
  fingerprint: 'paper.pdf:4:0',
  byteLength: 4,
  pageCount: 1,
  pdfBlob: new Blob(['%PDF']),
  importedAt: '2026-01-01T00:00:00.000Z',
  lastPage: 0,
  lastOffset: 0
};

const makePoint = (id: string): Point => ({
  id,
  paperId: paper.id,
  title: id,
  anchor: { kind: 'text', pageIndex: 0, rects: [], exact: '', prefix: '', suffix: '' },
  sourceSummary: 'Page 1 — Text',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
});

afterEach(async () => {
  await db.delete();
  await db.open();
});

describe('repository transactions', () => {
  it('deletes incident connections with a point', async () => {
    await replacePaper(paper);
    await savePoint(makePoint('a'));
    await savePoint(makePoint('b'));
    const connection: Connection = {
      id: 'c', paperId: paper.id, subjectPointId: 'a', objectPointId: 'b', type: 'related',
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'
    };
    await saveConnection(connection);

    await removePoint('a');

    expect(await db.points.get('a')).toBeUndefined();
    expect(await db.connections.count()).toBe(0);
  });

  it('replaces the active paper and clears dependent records', async () => {
    await replacePaper(paper);
    await savePoint(makePoint('a'));
    await replacePaper({ ...paper, id: 'paper-2', filename: 'next.pdf' });

    expect(await db.papers.toArray()).toHaveLength(1);
    expect(await db.points.count()).toBe(0);
    expect((await db.settings.get('activePaperId'))?.value).toBe('paper-2');
  });
});
