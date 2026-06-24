import Dexie, { type EntityTable } from 'dexie';
import { debugEvent, serializeError } from '../debug/instrumentation';
import type { Connection, Paper, Point } from '../domain/types';

type Setting = { key: string; value: string };

class ReaderDatabase extends Dexie {
  papers!: EntityTable<Paper, 'id'>;
  points!: EntityTable<Point, 'id'>;
  connections!: EntityTable<Connection, 'id'>;
  settings!: EntityTable<Setting, 'key'>;

  constructor() {
    super('connectedPdfReader');
    debugEvent('db', 'database-constructed', { name: this.name, schemaVersion: 1 }, 'debug');
    this.version(1).stores({
      papers: 'id, fingerprint, importedAt',
      points: 'id, paperId, [paperId+createdAt]',
      connections:
        'id, paperId, subjectPointId, objectPointId, [subjectPointId+type], [objectPointId+type]',
      settings: 'key'
    });
  }
}

export const db = new ReaderDatabase();

export async function activePaper(): Promise<Paper | undefined> {
  const started = performance.now();
  debugEvent('db', 'active-paper-read-start', undefined, 'debug');
  try {
    const setting = await db.settings.get('activePaperId');
    const paper = setting ? await db.papers.get(setting.value) : undefined;
    debugEvent('db', 'active-paper-read-complete', {
      activePaperId: setting?.value,
      found: Boolean(paper),
      filename: paper?.filename,
      blobSize: paper?.pdfBlob?.size,
      durationMs: Math.round((performance.now() - started) * 10) / 10
    });
    return paper;
  } catch (error) {
    debugEvent('db', 'active-paper-read-failed', serializeError(error), 'error');
    throw error;
  }
}

export async function replacePaper(paper: Paper): Promise<void> {
  const started = performance.now();
  debugEvent('db', 'replace-paper-start', {
    paperId: paper.id,
    filename: paper.filename,
    declaredBytes: paper.byteLength,
    blobSize: paper.pdfBlob.size,
    blobType: paper.pdfBlob.type,
    pageCount: paper.pageCount
  });
  try {
    await db.transaction(
      'rw',
      [db.papers, db.points, db.connections, db.settings],
      async () => {
        const existingCounts = {
          papers: await db.papers.count(),
          points: await db.points.count(),
          connections: await db.connections.count()
        };
        debugEvent('db', 'replace-paper-transaction-open', { existingCounts }, 'debug');
        await Promise.all([
          db.connections.clear(),
          db.points.clear(),
          db.papers.clear()
        ]);
        debugEvent('db', 'replace-paper-existing-data-cleared', undefined, 'debug');
        await db.papers.add(paper);
        debugEvent('db', 'replace-paper-record-written', {
          paperId: paper.id,
          blobSize: paper.pdfBlob.size
        }, 'debug');
        await db.settings.put({ key: 'activePaperId', value: paper.id });
      }
    );
    const persisted = await db.papers.get(paper.id);
    debugEvent('db', 'replace-paper-complete', {
      paperId: paper.id,
      persisted: Boolean(persisted),
      persistedBlobSize: persisted?.pdfBlob?.size,
      persistedBlobType: persisted?.pdfBlob?.type,
      durationMs: Math.round((performance.now() - started) * 10) / 10
    });
  } catch (error) {
    debugEvent('db', 'replace-paper-failed', {
      paperId: paper.id,
      error: serializeError(error),
      durationMs: Math.round((performance.now() - started) * 10) / 10
    }, 'error');
    throw error;
  }
}

export async function savePoint(point: Point): Promise<void> {
  debugEvent('db', 'save-point-start', {
    pointId: point.id,
    paperId: point.paperId,
    anchorKind: point.anchor.kind,
    pageIndex: point.anchor.pageIndex
  }, 'debug');
  await db.points.put(point);
  debugEvent('db', 'save-point-complete', { pointId: point.id }, 'debug');
}

export async function removePoint(pointId: string): Promise<void> {
  debugEvent('db', 'remove-point-start', { pointId }, 'debug');
  await db.transaction('rw', [db.points, db.connections], async () => {
    await db.points.delete(pointId);
    const incident = await db.connections
      .filter(
        (connection) =>
          connection.subjectPointId === pointId ||
          connection.objectPointId === pointId
      )
      .primaryKeys();
    debugEvent('db', 'remove-point-incidents-found', {
      pointId,
      connectionCount: incident.length
    }, 'debug');
    await db.connections.bulkDelete(incident);
  });
  debugEvent('db', 'remove-point-complete', { pointId }, 'debug');
}

export async function saveConnection(connection: Connection): Promise<void> {
  debugEvent('db', 'save-connection-start', {
    connectionId: connection.id,
    subjectPointId: connection.subjectPointId,
    objectPointId: connection.objectPointId,
    type: connection.type
  }, 'debug');
  await db.connections.put(connection);
  debugEvent('db', 'save-connection-complete', {
    connectionId: connection.id
  }, 'debug');
}
