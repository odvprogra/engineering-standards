# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-02

## Context

Several repositories share one set of engineering standards. The standards themselves are written in
the [handbook](../../HANDBOOK.md), but a rule without its reason gets reopened or quietly ignored.
We need a lightweight, versioned record of _why_ each significant decision was made, next to the
code it affects.

The same applies to the architecture of the services: they should share one style, chosen once and
for explicit reasons.

## Decision

We will record significant decisions as Architecture Decision Records:

- **Format:** the short format popularized by Michael Nygard (Status, Context, Decision,
  Consequences), plus an explicit _Alternatives considered_ section, using
  [the template](template.md).
- **Location:** `docs/adr/NNNN-title.md`, numbered sequentially. Decisions shared by every repo live
  here; each repo records its own decisions in its own `docs/adr/`.
- **Immutability:** an accepted ADR is not rewritten. A change of mind is a new ADR that supersedes
  it, and the old one is marked _Superseded_.
- **Size:** one page at most. If it needs more, it is a design doc that an ADR links to.

For the architecture of services we will use **hexagonal-lite**: `domain` ← `application` ←
`infrastructure` / `api`, with ports as `typing.Protocol`s and wiring only in the composition root
(handbook §4–5). Rich domain models are used only where there are business rules; CRUD stays CRUD.

## Alternatives considered

- **No written decisions** (chat, memory, commit messages): free today, but the reasons are lost and
  decisions get relitigated.
- **Long design documents for everything:** thorough, but too heavy to keep current for small
  decisions.
- **MADR template:** well structured, but more fields than these repos need. Its _Alternatives
  considered_ section is borrowed.
- **Layered MVC services:** simpler to start, but couples business rules to the web framework and
  the ORM, which makes them hard to test without infrastructure.
- **Full DDD + CQRS in every service:** powerful for complex domains, but ceremony with no payoff
  for plain CRUD.

## Consequences

- **Positive:** decisions are reviewable in pull requests, discoverable next to the code, and easy
  to cite in interviews and onboarding.
- **Positive:** the domain can be tested without I/O, and adapters (database, HTTP, LLM providers)
  can be swapped behind ports.
- **Negative:** writing ADRs takes discipline. A decision made without one is technical debt in the
  docs.
- **Negative:** hexagonal-lite adds a few indirections (ports, composition root) that a tiny script
  would not need. The template keeps that cost low by generating them.
