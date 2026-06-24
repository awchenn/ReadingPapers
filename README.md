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

## Run the app

```bash
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Browser diagnostics

The app records a local, structured diagnostic history in the current browser tab. It includes PDF import phases and timings, byte counts and header checks, PDF.js worker and progress state, IndexedDB transactions, storage persistence, rendering geometry, and uncaught browser errors. It never records PDF contents, excerpts, or point notes.

Useful JavaScript console commands:

```js
ConnectedReaderDebug.help()
ConnectedReaderDebug.events()
ConnectedReaderDebug.latestError()
ConnectedReaderDebug.report()
ConnectedReaderDebug.reportText()
await ConnectedReaderDebug.copyReport()
ConnectedReaderDebug.print()
ConnectedReaderDebug.clear()
```

Diagnostic events persist across reloads within the same tab. An import-error banner also provides a **Copy debug report** button.

## Current implementation slice

The bare-bones app includes PDF import and rendering, one-paper local persistence, manually captured source-linked points, weighted local search, typed connections, direction-aware connected bullets, source-page jumps, responsive navigation, and a cached PWA shell.

Exact text-layer selection rectangles, drawn region anchors, thumbnails, suggestion ranking, and portable backup remain subsequent MVP phases. Until text-layer capture lands, point creation asks the reader to paste the selected excerpt and restores the source page rather than an exact overlay.

## Status

MVP design captured as the repository baseline on June 23, 2026. A bare-bones implementation is in progress.
