# ADR 0001: Local-first, client-only PWA

**Status:** Accepted  
**Date:** 2026-06-23

## Context

The MVP serves one reader working with one potentially unpublished paper. Reading, annotation, retrieval, and source jumps must survive unreliable connectivity. Accounts, collaboration, and cross-device synchronization are out of scope.

## Decision

Build a static, installable PWA. Persist PDF bytes and user data in IndexedDB, cache the application shell with a service worker, and require no application backend.

## Consequences

- Core work can remain offline and paper content does not need to leave the device.
- Hosting and operational complexity stay low.
- Browser storage durability and quota behavior become explicit product concerns.
- Cloud sync, sharing, and server-side processing require future product and architecture decisions; this design does not pre-commit to them.

See [system architecture](../architecture.md).
