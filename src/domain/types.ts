export type PdfRect = { x1: number; y1: number; x2: number; y2: number };

export type TextAnchor = {
  kind: 'text';
  pageIndex: number;
  rects: PdfRect[];
  exact: string;
  prefix: string;
  suffix: string;
};

export type RegionAnchor = {
  kind: 'region';
  pageIndex: number;
  rect: PdfRect;
};

export type Paper = {
  id: string;
  filename: string;
  fingerprint: string;
  byteLength: number;
  pageCount: number;
  pdfBlob: Blob;
  importedAt: string;
  lastPage: number;
  lastOffset: number;
};

export type Point = {
  id: string;
  paperId: string;
  title: string;
  note?: string;
  anchor: TextAnchor | RegionAnchor;
  sourceSummary: string;
  createdAt: string;
  updatedAt: string;
};

export const relationshipTypes = [
  'supports',
  'explains',
  'builds_on',
  'contrasts',
  'depends_on',
  'example_of',
  'qualifies',
  'related'
] as const;

export type RelationshipType = (typeof relationshipTypes)[number];

export type Connection = {
  id: string;
  paperId: string;
  subjectPointId: string;
  objectPointId: string;
  type: RelationshipType;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
};

export type AppView = 'reader' | 'points' | 'connected';
