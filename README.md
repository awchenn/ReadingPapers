# Connected PDF Reader

A local-first, mobile-first web app for reading one scientific PDF at a time and preserving the reader's path through its ideas.

Readers create source-linked points from selected text or page regions, give each point a concise title, connect points with an explicit relationship, and jump from every saved idea back to its exact source. The MVP does not interpret the paper: it organizes only what the reader records.

## MVP at a glance

- Import a text-based, unencrypted PDF.
- Create points from text selections or rectangular page regions.
- Search points and see up to five locally generated related-point suggestions.
- Add directed, typed connections between points.
- Review direct connections as direction-aware bullet outlines.
- Restore the active paper, annotations, connections, and reading position offline.
- Keep PDF bytes, excerpts, titles, and notes on the device.

## Design documentation

The repository currently contains the implementation-ready design baseline:

- [Documentation index](docs/README.md)
- [Product requirements](docs/product-requirements.md)
- [System architecture](docs/architecture.md)
- [Data and relationship model](docs/data-model.md)
- [PDF source anchoring](docs/source-anchoring.md)
- [Search and suggestions](docs/search-and-suggestions.md)
- [Quality and delivery plan](docs/quality-and-delivery.md)
- [Architecture decision records](docs/decisions/README.md)

## Proposed implementation stack

React 19, TypeScript, Vite, PDF.js, Dexie/IndexedDB, Zustand, MiniSearch, Workbox, Vitest, Testing Library, and Playwright.

## Status

MVP design captured as the repository baseline on June 23, 2026. Application implementation has not started.
