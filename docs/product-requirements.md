# Product requirements

**Status:** MVP design  
**Primary use:** Mobile reading of one scientific PDF at a time  
**Core decision:** Connected bullet outlines replace named threads

## Product summary

The app opens directly into the active paper. A reader highlights text or draws a rectangle around a visual region, creates a point with a required general-idea title and optional note, and manually connects it to another point using a typed relationship. Point lists emphasize the user-authored title; excerpts and page descriptions remain secondary and expandable.

The MVP is a local-first progressive web app. It has no account system, required backend, automatic scientific interpretation, or cross-paper graph.

## Goals

- Read an ordinary text-based PDF in the browser.
- Turn selected text or a rectangular region into a durable, source-linked point.
- Make points scannable through a title, optional note, truncated excerpt, and page description.
- Connect points manually with a small, stable relationship vocabulary.
- Suggest up to five potentially related earlier points and search every saved point.
- Present connections as bullets such as `(Supported by) TEMPO suppresses product formation`.
- Jump from a point to the exact page location and restore its highlight or region.
- Continue core work offline after the app and paper have loaded once.

## Non-goals

- Automatic extraction or interpretation of claims, evidence, mechanisms, figures, arguments, or chemistry.
- OCR, scanned PDFs, password-protected PDFs, or chemistry-aware search in the MVP.
- Cross-paper connections, a paper library, or a global knowledge graph.
- Accounts, cloud synchronization, sharing, collaboration, or institutional document management.
- Automatic relationship-type selection.

## MVP constraints

| Constraint | Decision |
| --- | --- |
| Document scope | One active paper. Replacement requires confirmation and deletes the old paper's local data atomically. |
| PDF support | Text-based, unencrypted PDFs. Unsupported files receive a clear, recoverable error. |
| Data location | On-device browser storage; no account or server synchronization. |
| Connectivity | Reading, annotation, retrieval, connections, and jumps work offline after initial load. |
| Interpretation | User-authored only; suggestions indicate textual similarity, not scientific meaning. |

## Experience model

### Responsive navigation

On desktop, the PDF occupies the main pane with a resizable points panel beside it. On mobile, the PDF is the default view and bottom navigation switches among Reader, Points, and Connected. The PDF toolbar and point editor must not overlap at 390 CSS pixels.

| View | Primary responsibilities |
| --- | --- |
| Reader | Render pages, select text, draw regions, show saved markers, and jump to anchors. |
| Points | Search and browse by creation order or page; create, edit, and delete points. |
| Connected | Show the focused point and direct connections as labeled bullets; expand details or jump to source. |

### Point presentation

The title is primary. The list view truncates the source, while selection expands the full excerpt, optional note, connections, and source actions.

> **Benzylic substrates show greater reactivity**  
> “Substrates containing benzylic centers generally afforded…”  
> Page 6 — Figure 3

### Core workflows

| Workflow | Expected behavior |
| --- | --- |
| Import | Validate and persist a chosen PDF, load page metadata, and open page 1. |
| Create from text | Select text, create a point, add a title and optional note, then save the excerpt, context, and PDF-space rectangles. |
| Create from region | Enter region mode, draw a rectangle, add a title and optional note, then save the PDF-space rectangle and preview. |
| Connect | Choose from suggestions or search all points, select a relationship, and save. |
| Review | Focus a point to see direction-aware connected bullets and truncated source metadata. |
| Jump | Open the correct page, scroll the anchor into view, and pulse the restored overlay. |

The Connected view is one level deep in the MVP. Cycles may exist in data, but the UI does not recursively expand them.

## Functional requirements

| ID | Area | Requirement |
| --- | --- | --- |
| FR-1 | Import | Accept a local PDF and reject unsupported, encrypted, or textless files with a recoverable message. |
| FR-2 | Read | Render pages, zoom, scroll, search native PDF text, and restore the last reading position. |
| FR-3 | Text point | Capture selected text, page, ordered PDF rectangles, and quote context. |
| FR-4 | Region point | Capture a drawn rectangle in PDF coordinates and generate a local preview. |
| FR-5 | Point editing | Create, edit, and delete a point with a required title and optional note. |
| FR-6 | Connections | Create and delete directed, typed connections between distinct points. |
| FR-7 | Suggestions | Rank up to five earlier unconnected points locally without selecting a relationship. |
| FR-8 | Search | Search every point by title, note, selected text, page label, and source description. |
| FR-9 | Connected view | Display direct relationships as bullets with correct forward or inverse labels. |
| FR-10 | Navigation | Jump to and highlight the saved source anchor from any point surface. |
| FR-11 | Persistence | Restore the paper, annotations, connections, and reading position after reload or offline restart. |
| FR-12 | Replacement | Confirm before replacing or deleting the active paper and all its local data. |

## Nonfunctional requirements

| ID | Quality | Target |
| --- | --- | --- |
| NFR-1 | Responsive | Core flows work at 390 × 844 CSS pixels and desktop widths. |
| NFR-2 | Offline | Core workflows work without a network after first successful load and import. |
| NFR-3 | Performance | Search returns within 100 ms for 500 points on a mid-range phone. |
| NFR-4 | Navigation | A cached-page jump begins scrolling within 500 ms; uncached rendering shows progress. |
| NFR-5 | Scale | Support a 100 MB, 300-page PDF and 1,000 points without materializing every page canvas. |
| NFR-6 | Durability | No acknowledged point or connection is lost across a normal reload or offline restart. |
| NFR-7 | Accessibility | Keyboard support, visible focus, semantic controls, 44 px targets, and reduced-motion support. |
| NFR-8 | Privacy | No PDF bytes, excerpts, or notes leave the device in the MVP. |
| NFR-9 | Compatibility | Latest stable Chrome, Safari, Firefox, and Edge; iOS Safari is required. |

## Accessibility requirements

- Icon-only actions have accessible names and tooltips; Create point, Add connection, and Jump to source retain visible mobile labels.
- The editor is a mobile bottom sheet and desktop side panel. Focus is trapped only for modal confirmation.
- Region mode is explicitly toggled so it does not intercept normal scrolling or native selection handles.
- Connected bullets are semantic list items; relationship labels are present in accessible text and not conveyed only by color.
- Titles never shrink below body size to force one line; excerpts wrap and expand.
- Jump highlighting uses color plus border and honors `prefers-reduced-motion`.

## Deferred until after MVP validation

- Portable export/import of a paper and its annotations.
- Recursive expansion or manually ordered multi-level outlines.
- Cross-paper connections and a paper library.
- Cloud sync, accounts, sharing, and collaboration.
- OCR and scanned or password-protected PDF support.
- Embedding-based suggestions after privacy, cost, and offline tradeoffs are evaluated.
