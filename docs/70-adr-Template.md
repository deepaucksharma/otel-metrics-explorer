# 70 · adr-Template.md
_Template for Architectural Decision Records_

---

# ADR Template

```markdown
# ADR-YYYY-MM-DD: Title of the Decision

## Status

[Proposed | Accepted | Deprecated | Superseded by [ADR-YYYY-MM-DD](link)]

## Context

Describe the problem or situation that this ADR addresses. What forces are at play? What constraints must be considered?

## Decision

State the decision clearly and concisely. Use active voice: "We will..."

## Consequences

What becomes easier or more difficult because of this decision? What are the trade-offs?

## Alternatives Considered

What other options were considered? Why weren't they chosen?

## Implementation Plan

How will this decision be implemented? Include timeline and responsibility assignments.
```

# Example ADR

```markdown
# ADR-2025-06-10: Migrating from React to Svelte

## Status

Proposed

## Context

Our application's bundle size has grown to 320 kB (gzipped), exceeding our 200 kB budget. Additionally, maintaining our own memo logic and selector patterns requires significant developer overhead and has led to subtle bugs.

## Decision

We will migrate from React to Svelte as our UI framework.

Key migration steps:
1. Create a parallel Svelte implementation of the UI layer
2. Leave data and logic layers unchanged (leveraging our clean architecture)
3. Replace React components one-by-one with Svelte equivalents
4. Remove React dependencies once migration is complete

## Consequences

### Positive
- Reduced bundle size (estimated 60% reduction)
- Improved runtime performance via compiled components
- Less boilerplate for reactive state
- Simpler mental model for developers

### Negative
- Learning curve for team members new to Svelte
- Temporary maintenance of dual implementations
- Need to rewrite test suite for UI components
- Potential regression in untested edge cases

## Alternatives Considered

### React Optimization Only
- Pros: Less disruptive, familiar ecosystem
- Cons: Limited gains, doesn't address root cause

### Preact Switch
- Pros: API-compatible, smaller bundle
- Cons: Still uses virtual DOM approach, limited gain

### Vue Migration
- Pros: Popular framework, good performance
- Cons: Larger ecosystem switch, more complexity than Svelte

## Implementation Plan

| Phase | Timeline | Owner | Description |
|-------|----------|-------|-------------|
| 1 | June 15-30 | @li | Create Svelte UI scaffolding and core components |
| 2 | July 1-15 | Team | Convert simple components (cards, panels) |
| 3 | July 16-31 | @steph | Convert complex components (treemap, config) |
| 4 | August 1-15 | @jack | Testing, integration |
| 5 | August 16-30 | All | Final cleanup, React removal |
```
