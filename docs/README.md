# Design documentation

These documents are the source of truth for the Connected PDF Reader MVP. They are split by concern so product behavior, persistence, and source-restoration details can evolve without turning one document into a thicket.

| Document | Purpose |
| --- | --- |
| [Product requirements](product-requirements.md) | Scope, user experience, functional and nonfunctional requirements |
| [System architecture](architecture.md) | Technology choices, component boundaries, state, offline behavior, privacy |
| [Data and relationship model](data-model.md) | Entities, IndexedDB schema, connection semantics, invariants |
| [PDF source anchoring](source-anchoring.md) | Text/region capture, coordinate conversion, restoration and failure behavior |
| [Search and suggestions](search-and-suggestions.md) | Local full-text search and transparent similarity ranking |
| [Quality and delivery plan](quality-and-delivery.md) | Errors, testing, acceptance criteria, phased implementation, definition of done |
| [Decision records](decisions/README.md) | Durable context for foundational technical and product decisions |

## Design principles

1. The app organizes what the reader explicitly records; it does not claim to interpret the paper.
2. Every saved point preserves a path back to its source.
3. Core reading and annotation remain useful without a network connection.
4. Paper content remains on the device in the MVP.
5. Mobile interaction at 390 CSS pixels is a first-class constraint, not a later adaptation.

## Change policy

- Update the relevant design document in the same change as behavior that alters it.
- Add or supersede an ADR when changing a foundational choice or invariant.
- Keep requirement IDs stable. Mark removed requirements as superseded rather than reusing their IDs.
- Treat deferred features as out of scope until an explicit design change moves them into the MVP.
