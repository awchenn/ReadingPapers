import { create } from 'zustand';
import {
  activePaper,
  db,
  removePoint,
  replacePaper,
  saveConnection,
  savePoint
} from '../data/db';
import { debugEvent, serializeError } from '../debug/instrumentation';
import { validateConnection } from '../domain/relationships';
import type {
  AppView,
  Connection,
  Paper,
  Point,
  RelationshipType
} from '../domain/types';

type PointDraft = {
  title: string;
  note?: string;
  excerpt: string;
  pageIndex: number;
  sourceSummary: string;
};

type ReaderState = {
  paper?: Paper;
  points: Point[];
  connections: Connection[];
  activeView: AppView;
  activePointId?: string;
  targetPageIndex: number;
  loading: boolean;
  error?: string;
  hydrate: () => Promise<void>;
  importPaper: (file: File, pageCount: number) => Promise<void>;
  createPoint: (draft: PointDraft) => Promise<Point>;
  deletePoint: (pointId: string) => Promise<void>;
  createConnection: (
    subjectPointId: string,
    objectPointId: string,
    type: RelationshipType
  ) => Promise<string | null>;
  setActiveView: (view: AppView) => void;
  focusPoint: (pointId: string, view?: AppView) => void;
  jumpToPoint: (point: Point) => void;
};

export const useReaderStore = create<ReaderState>((set, get) => ({
  points: [],
  connections: [],
  activeView: 'reader',
  targetPageIndex: 0,
  loading: true,

  hydrate: async () => {
    const started = performance.now();
    debugEvent('store', 'hydrate-start');
    set({ loading: true, error: undefined });
    try {
      const paper = await activePaper();
      const [points, connections] = paper
        ? await Promise.all([
            db.points.where('paperId').equals(paper.id).sortBy('createdAt'),
            db.connections.where('paperId').equals(paper.id).toArray()
          ])
        : [[], []];
      set({ paper, points, connections, loading: false });
      debugEvent('store', 'hydrate-complete', {
        paperId: paper?.id,
        filename: paper?.filename,
        pointCount: points.length,
        connectionCount: connections.length,
        durationMs: Math.round((performance.now() - started) * 10) / 10
      });
    } catch (error) {
      debugEvent('store', 'hydrate-failed', serializeError(error), 'error');
      set({ loading: false, error: 'Local data could not be opened.' });
    }
  },

  importPaper: async (file, pageCount) => {
    const now = new Date().toISOString();
    const paper: Paper = {
      id: crypto.randomUUID(),
      filename: file.name,
      fingerprint: `${file.name}:${file.size}:${file.lastModified}`,
      byteLength: file.size,
      pageCount,
      pdfBlob: file,
      importedAt: now,
      lastPage: 0,
      lastOffset: 0
    };
    debugEvent('store', 'import-paper-entity-created', {
      paperId: paper.id,
      filename: paper.filename,
      fingerprint: paper.fingerprint,
      byteLength: paper.byteLength,
      blobSize: paper.pdfBlob.size,
      blobType: paper.pdfBlob.type,
      pageCount
    });
    await replacePaper(paper);
    set({
      paper,
      points: [],
      connections: [],
      activePointId: undefined,
      targetPageIndex: 0,
      activeView: 'reader'
    });
    debugEvent('store', 'import-paper-state-updated', {
      paperId: paper.id,
      activeView: 'reader'
    });
    if (navigator.storage?.persist) {
      debugEvent('storage', 'persistence-request-start', undefined, 'debug');
      void navigator.storage
        .persist()
        .then((granted) =>
          debugEvent('storage', 'persistence-request-complete', { granted })
        )
        .catch((error) =>
          debugEvent('storage', 'persistence-request-failed', serializeError(error), 'warn')
        );
    } else {
      debugEvent('storage', 'persistence-api-unavailable', undefined, 'warn');
    }
  },

  createPoint: async (draft) => {
    const paper = get().paper;
    if (!paper) throw new Error('Import a paper before creating points.');
    const now = new Date().toISOString();
    const point: Point = {
      id: crypto.randomUUID(),
      paperId: paper.id,
      title: draft.title.trim(),
      note: draft.note?.trim() || undefined,
      anchor: {
        kind: 'text',
        pageIndex: draft.pageIndex,
        rects: [],
        exact: draft.excerpt.trim(),
        prefix: '',
        suffix: ''
      },
      sourceSummary:
        draft.sourceSummary.trim() || `Page ${draft.pageIndex + 1} — Text`,
      createdAt: now,
      updatedAt: now
    };
    debugEvent('store', 'create-point-start', {
      pointId: point.id,
      paperId: point.paperId,
      titleLength: point.title.length,
      noteLength: point.note?.length ?? 0,
      excerptLength: point.anchor.kind === 'text' ? point.anchor.exact.length : 0,
      pageIndex: point.anchor.pageIndex
    });
    await savePoint(point);
    set((state) => ({
      points: [...state.points, point],
      activePointId: point.id
    }));
    debugEvent('store', 'create-point-complete', { pointId: point.id });
    return point;
  },

  deletePoint: async (pointId) => {
    debugEvent('store', 'delete-point-start', { pointId });
    await removePoint(pointId);
    set((state) => ({
      points: state.points.filter((point) => point.id !== pointId),
      connections: state.connections.filter(
        (connection) =>
          connection.subjectPointId !== pointId &&
          connection.objectPointId !== pointId
      ),
      activePointId:
        state.activePointId === pointId ? undefined : state.activePointId
    }));
    debugEvent('store', 'delete-point-complete', { pointId });
  },

  createConnection: async (subjectPointId, objectPointId, type) => {
    const paper = get().paper;
    if (!paper) return 'Import a paper before creating connections.';
    const validationError = validateConnection(
      { subjectPointId, objectPointId, type },
      get().connections
    );
    if (validationError) {
      debugEvent('store', 'create-connection-rejected', {
        subjectPointId,
        objectPointId,
        type,
        validationError
      }, 'warn');
      return validationError;
    }

    const now = new Date().toISOString();
    const connection: Connection = {
      id: crypto.randomUUID(),
      paperId: paper.id,
      subjectPointId,
      objectPointId,
      type,
      createdAt: now,
      updatedAt: now
    };
    debugEvent('store', 'create-connection-start', connection);
    await saveConnection(connection);
    set((state) => ({ connections: [...state.connections, connection] }));
    debugEvent('store', 'create-connection-complete', {
      connectionId: connection.id
    });
    return null;
  },

  setActiveView: (activeView) => set({ activeView }),
  focusPoint: (activePointId, activeView = 'connected') =>
    set({ activePointId, activeView }),
  jumpToPoint: (point) =>
    set({
      targetPageIndex: point.anchor.pageIndex,
      activePointId: point.id,
      activeView: 'reader'
    })
}));
