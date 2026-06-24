# Search and related-point suggestions

Search and suggestions are separate capabilities. Search provides deterministic retrieval across all saved points; suggestions offer a small convenience ranking while a point is being connected. Neither assigns scientific meaning or chooses a relationship.

## Full point search

MiniSearch maintains an in-memory index rebuilt from IndexedDB when a paper opens and updated after point mutations.

| Field | Weight | Reason |
| --- | ---: | --- |
| Title | 5 | Represents the user's general idea |
| Note | 3 | Contains the user's interpretation or reminder |
| Source excerpt | 1.5 | Supports recall using the paper's wording |
| Source summary | 1 | Supports page, figure, table, or scheme lookup |

Results support prefix matching and mild fuzzy matching for typing errors. Index failure must not block point CRUD; the UI displays **Point search is rebuilding** and recreates the index from IndexedDB.

## Suggestions

The suggestion service compares the draft point's title, note, and excerpt against earlier points using tokenized TF-IDF vectors and cosine similarity.

1. Normalize case and whitespace and remove punctuation plus a conservative English stop-word list.
2. Preserve chemical tokens, formulas, numerals, abbreviations, and hyphenated terms; do not use aggressive stemming.
3. Weight title-to-title similarity most strongly, followed by notes and excerpts.
4. Add a small page-proximity bonus capped so proximity cannot dominate text similarity.
5. Exclude the draft point, deleted points, and already connected points.
6. Return at most five candidates with a plain explanation such as “shared terms in title and source.”

If fewer than three candidates have a nonzero score, show only the available candidates and keep **Search all points** prominent. The UI labels the section **Possibly related** and never presents similarity as evidence.

## Required behavior

- Suggestions never select or recommend a relationship type.
- Full search remains available even when suggestions exist.
- Ties resolve deterministically by score, then creation time, then ID.
- Ranking is covered by fixtures containing formulas, abbreviations, hyphenated terms, sparse text, and nearby-page false positives.
- Search and ranking run locally without network calls or telemetry containing indexed content.
