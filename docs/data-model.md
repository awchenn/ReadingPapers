# Data and relationship model

## Entities

| Entity | Key fields |
| --- | --- |
| Paper | `id`, `filename`, `fingerprint`, `byteLength`, `pageCount`, `pdfBlob`, `importedAt`, `lastPage`, `lastOffset` |
| Point | `id`, `paperId`, `title`, `note?`, `sourceSummary`, `anchor`, `thumbnailBlob?`, `createdAt`, `updatedAt` |
| Connection | `id`, `paperId`, `subjectPointId`, `objectPointId`, `type`, `sortOrder?`, `createdAt`, `updatedAt` |
| PageText | `[paperId+pageIndex]`, `normalizedText`, `extractionVersion` |
| AppSetting | `key`, value; includes schema version, active paper, and display preferences |

## Domain types

```ts
type PdfRect = { x1: number; y1: number; x2: number; y2: number };

type TextAnchor = {
  kind: 'text';
  pageIndex: number;
  rects: PdfRect[];
  exact: string;
  prefix: string;
  suffix: string;
};

type RegionAnchor = {
  kind: 'region';
  pageIndex: number;
  rect: PdfRect;
};

type Point = {
  id: string;
  paperId: string;
  title: string;
  note?: string;
  anchor: TextAnchor | RegionAnchor;
  sourceSummary: string;
  thumbnailBlob?: Blob;
  createdAt: string;
  updatedAt: string;
};

type RelationshipType =
  | 'supports'
  | 'explains'
  | 'builds_on'
  | 'contrasts'
  | 'depends_on'
  | 'example_of'
  | 'qualifies'
  | 'related';

type Connection = {
  id: string;
  paperId: string;
  subjectPointId: string;
  objectPointId: string;
  type: RelationshipType;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
};
```

`pageIndex` is zero-based internally. User-facing page labels are one-based. Rectangles are normalized PDF-page coordinates, never CSS pixels.

## IndexedDB schema

| Table | Primary key | Indexes |
| --- | --- | --- |
| `papers` | `id` | `fingerprint`, `importedAt` |
| `points` | `id` | `paperId`, `[paperId+createdAt]`, `[paperId+anchor.pageIndex]` |
| `connections` | `id` | `paperId`, `subjectPointId`, `objectPointId`, `[subjectPointId+type]`, `[objectPointId+type]` |
| `pageTexts` | `[paperId+pageIndex]` | `paperId` |
| `settings` | `key` | none |

Dexie schema versions are explicit. Every migration is tested against fixtures produced by all earlier versions.

## Transaction boundaries and invariants

- All multi-record mutations use a Dexie transaction.
- Paper replacement deletes the old PDF, page text, points, thumbnails, and connections atomically before assigning the new active paper.
- Deleting a point deletes all incident connections in the same transaction.
- A point and connection must reference the same paper.
- A connection cannot link a point to itself.
- One connection of a given type may exist for an ordered point pair.
- A different second relationship between the same pair requires explicit confirmation; the default action edits the existing connection.
- Failed writes leave the previously acknowledged state intact.

## Directional relationship model

Connections are stored as `subject → relationship → object`. The UI chooses a forward or inverse display label according to the focused endpoint. Symmetric relationships use the same label in both directions.

| Stored type | From subject | From object | Meaning |
| --- | --- | --- | --- |
| `supports` | Supports | Supported by | A provides evidence for B |
| `explains` | Explains | Explained by | A gives a reason or interpretation for B |
| `builds_on` | Builds on | Built on by | A extends B |
| `contrasts` | Contrasts with | Contrasts with | A and B differ meaningfully |
| `depends_on` | Depends on | Required by | A requires B as context or premise |
| `example_of` | Example of | Has example | A is a concrete instance of B |
| `qualifies` | Qualifies | Qualified by | A limits, narrows, or adds an exception to B |
| `related` | Related | Related | A and B are connected without a stronger label |

If “TEMPO suppresses product formation” supports “A radical pathway is proposed,” the radical point displays `(Supported by) TEMPO suppresses product formation`; the TEMPO point displays `(Supports) A radical pathway is proposed`.

## Connected-view ordering

Direct connections sort by explicit `sortOrder` when present, then relationship type, then creation time. Cycles are valid but do not recurse in the MVP. A later recursive view must include visited-node detection and a defined repeated-branch policy.
