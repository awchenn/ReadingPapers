# ADR 0003: Connected bullet outlines instead of named threads

**Status:** Accepted  
**Date:** 2026-06-23

## Context

Readers need to inspect how saved ideas relate without maintaining a second organizing object or navigating a graph canvas on a phone. Directed relationships already contain enough information to derive a useful local view.

## Decision

Derive a one-level connected outline from the focused point. Display direct neighbors as bullets with forward or inverse relationship labels. Do not create named threads in the MVP.

## Consequences

- Users organize points through explicit connections rather than thread membership.
- The view is readable on mobile and has no separate lifecycle to manage.
- Cycles are valid in storage but cannot cause recursive rendering.
- Recursive expansion and manual multi-level ordering remain deferred.

See [product requirements](../product-requirements.md) and [data model](../data-model.md).
