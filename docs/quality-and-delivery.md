# Quality and delivery plan

## Recoverable errors

| Condition | User message | Recovery |
| --- | --- | --- |
| Invalid file | The selected file is not a readable PDF. | Return to importer; preserve no partial records. |
| Encrypted PDF | Password-protected PDFs are not supported yet. | Choose another file. |
| No text layer | This appears to be a scanned PDF. | Explain the text-based requirement and choose another file. |
| Storage quota | The paper could not be stored on this device. | Keep the current paper intact; offer retry or delete. |
| Anchor failure | The saved source could not be highlighted. | Open the page and show excerpt and page number. |
| PDF render failure | This page could not be rendered. | Retry rendering and allow navigation elsewhere. |
| Index failure | Point search is rebuilding. | Continue CRUD and rebuild from IndexedDB. |

Errors must be actionable, must not leave partial acknowledged records, and must not silently discard user data.

## Test coverage

| Level | Required coverage |
| --- | --- |
| Unit | Inverse labels, connection validation, TF-IDF scoring, quote normalization, coordinate transforms, migrations |
| Component | Editor validation, suggestion/search switching, connected bullets, delete confirmations, offline/update banners |
| Integration | Text selection to stored anchor, region capture to thumbnail, transaction behavior, index updates after CRUD |
| End-to-end | Import → text point → region point → connect → search → jump → offline reload |
| Visual | Mobile/desktop toolbars, bottom sheets, connected bullets, long titles, expanded excerpts |
| Performance | Page virtualization, 1,000-point search, repeated jumps, storage pressure |

## Critical acceptance tests

1. A selected sentence saved as a titled point reappears after a full offline reload.
2. Jump to source opens and overlays the original selection at multiple zoom levels.
3. A region preview and rectangle remain correct after switching between desktop and mobile widths.
4. With more than five points, the picker shows no more than five suggestions and full search finds any title or excerpt.
5. If A supports B, A displays `(Supports) B` and B displays `(Supported by) A`.
6. Deleting a point removes every incident connection and leaves no broken bullet.
7. While offline, the active PDF, point CRUD, search, connection CRUD, and source jumps work.
8. Replacing a paper is atomic: failure preserves the current paper and all annotations.

## Implementation phases

| Phase | Work | Exit criterion |
| --- | --- | --- |
| 1. Foundation | PWA shell, import, PDF.js reader, virtualization, Dexie schema, replacement flow | A paper reopens offline at the last position. |
| 2. Anchored points | Text selection, region mode, editor, overlays, point list, previews | Text and region points survive reload and jump correctly. |
| 3. Connections | Relationship model, picker, inverse labels, connected bullets | Typed links render correctly from either endpoint. |
| 4. Retrieval | MiniSearch, full search, local similarity, ranking tests | Any point is searchable; up to five suggestions appear. |
| 5. Hardening | Updates, persistence, recovery, accessibility, mobile/performance tests | Acceptance suite passes on iOS Safari and desktop browsers. |

Each phase must leave a demonstrable vertical slice; incomplete later phases do not weaken already acknowledged persistence behavior.

## Definition of done

The MVP is complete when a reader can install or open the app, import one supported PDF, create text and region points, find and connect any earlier point, review directionally correct connected bullets, jump back to every saved source, and repeat the workflow offline after reloading. All content remains on-device, and unsupported files or failed anchors provide clear recovery rather than silent data loss.
