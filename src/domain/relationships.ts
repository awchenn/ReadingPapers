import type { Connection, Point, RelationshipType } from './types';

export const relationshipLabels: Record<
  RelationshipType,
  { forward: string; inverse: string }
> = {
  supports: { forward: 'Supports', inverse: 'Supported by' },
  explains: { forward: 'Explains', inverse: 'Explained by' },
  builds_on: { forward: 'Builds on', inverse: 'Built on by' },
  contrasts: { forward: 'Contrasts with', inverse: 'Contrasts with' },
  depends_on: { forward: 'Depends on', inverse: 'Required by' },
  example_of: { forward: 'Example of', inverse: 'Has example' },
  qualifies: { forward: 'Qualifies', inverse: 'Qualified by' },
  related: { forward: 'Related', inverse: 'Related' }
};

export type ConnectedPoint = {
  connection: Connection;
  point: Point;
  label: string;
};

export function connectedPoints(
  focalPointId: string,
  points: Point[],
  connections: Connection[]
): ConnectedPoint[] {
  const pointsById = new Map(points.map((point) => [point.id, point]));

  return connections
    .filter(
      (connection) =>
        connection.subjectPointId === focalPointId ||
        connection.objectPointId === focalPointId
    )
    .map((connection) => {
      const isSubject = connection.subjectPointId === focalPointId;
      const otherId = isSubject
        ? connection.objectPointId
        : connection.subjectPointId;
      const point = pointsById.get(otherId);
      if (!point) return undefined;
      return {
        connection,
        point,
        label: isSubject
          ? relationshipLabels[connection.type].forward
          : relationshipLabels[connection.type].inverse
      };
    })
    .filter((item): item is ConnectedPoint => Boolean(item))
    .sort((a, b) => {
      const aOrder = a.connection.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.connection.sortOrder ?? Number.MAX_SAFE_INTEGER;
      return (
        aOrder - bOrder ||
        a.connection.type.localeCompare(b.connection.type) ||
        a.connection.createdAt.localeCompare(b.connection.createdAt)
      );
    });
}

export function validateConnection(
  draft: Pick<Connection, 'subjectPointId' | 'objectPointId' | 'type'>,
  existing: Connection[]
): string | null {
  if (draft.subjectPointId === draft.objectPointId) {
    return 'A point cannot connect to itself.';
  }

  const duplicate = existing.some(
    (connection) =>
      connection.subjectPointId === draft.subjectPointId &&
      connection.objectPointId === draft.objectPointId &&
      connection.type === draft.type
  );

  return duplicate ? 'That relationship already exists.' : null;
}
