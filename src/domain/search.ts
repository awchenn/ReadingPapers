import MiniSearch from 'minisearch';
import type { Point } from './types';

type SearchDocument = {
  id: string;
  title: string;
  note: string;
  excerpt: string;
  sourceSummary: string;
};

export function searchPoints(points: Point[], query: string): Point[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return points;

  const index = new MiniSearch<SearchDocument>({
    fields: ['title', 'note', 'excerpt', 'sourceSummary'],
    storeFields: ['id'],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 5, note: 3, excerpt: 1.5, sourceSummary: 1 }
    }
  });

  index.addAll(
    points.map((point) => ({
      id: point.id,
      title: point.title,
      note: point.note ?? '',
      excerpt: point.anchor.kind === 'text' ? point.anchor.exact : '',
      sourceSummary: point.sourceSummary
    }))
  );

  const byId = new Map(points.map((point) => [point.id, point]));
  return index
    .search(normalizedQuery)
    .map((result) => byId.get(String(result.id)))
    .filter((point): point is Point => Boolean(point));
}
