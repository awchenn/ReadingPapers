# ADR 0004: PDF-space rectangles as durable anchors

**Status:** Accepted  
**Date:** 2026-06-23

## Context

CSS pixels change with zoom, screen size, rotation, device-pixel ratio, and page virtualization. Saved source locations must work across mobile and desktop layouts and after a reload.

## Decision

Persist a zero-based page index and normalized rectangles in PDF page coordinates. Text anchors additionally retain the exact quote plus bounded prefix and suffix context. Region previews are derived conveniences, not source identifiers.

## Consequences

- Anchors can be restored under different viewports.
- Capture and jump code must use tested PDF.js coordinate conversions.
- Text context supports verification and possible future re-anchoring.
- Cross-page text selections remain unsupported in the MVP and must fail visibly.

See [PDF source anchoring](../source-anchoring.md).
