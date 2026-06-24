# ADR 0002: One active paper in the MVP

**Status:** Accepted  
**Date:** 2026-06-23

## Context

The core uncertainty is whether source-linked connected notes improve reading. A library and cross-paper graph would add navigation, identity, storage, and relationship complexity before that workflow is validated.

## Decision

Manage one active paper per workspace. Replacing it requires confirmation and atomically removes its PDF, page text, points, thumbnails, and connections before the replacement becomes active.

## Consequences

- The MVP focuses on the reading and connection loop.
- Every point and connection remains scoped by `paperId`, preserving a migration path.
- Users cannot build a multi-paper library until a later design is accepted.
- Portable export should precede or accompany broader paper management to reduce data-loss risk.

See [product requirements](../product-requirements.md) and [data model](../data-model.md).
