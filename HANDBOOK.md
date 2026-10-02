# Engineering Handbook

The shared contract for every repository I build. It defines how code is structured, tested,
documented, delivered and presented, so that any repo can be read, run and changed the same way.

## How to use this handbook

- **New Python services** are generated from
  [python-service-template](https://github.com/odvprogra/python-service-template), which implements
  this handbook as code. Existing repos stay in sync with `copier update`.
- **CI** in every project calls the reusable workflows in this repo (§10).
- **Deviations are allowed, silent deviations are not.** A repo that departs from a rule records why
  in an ADR in its own `docs/adr/`.
- **Changing a standard** happens here: a pull request that updates this handbook, plus an ADR when
  the change is a decision with trade-offs.

## Contents

1. [Tooling (Python)](#1-tooling-python)
2. [Tooling (TypeScript / web)](#2-tooling-typescript--web)
3. [Uniform commands](#3-uniform-commands)
4. [Repository layout (Python service)](#4-repository-layout-python-service)
5. [Architecture principles](#5-architecture-principles)
6. [Clean code rules](#6-clean-code-rules)
7. [Testing strategy](#7-testing-strategy)
8. [API conventions](#8-api-conventions)
9. [Git & delivery](#9-git--delivery)
10. [CI (reusable workflows)](#10-ci-reusable-workflows)
11. [Documentation standard](#11-documentation-standard)
12. [Definition of Done](#12-definition-of-done)
13. [Service template](#13-service-template)
14. [UI & UX standards](#14-ui--ux-standards)

---

## 1. Tooling (Python)

| Concern           | Choice                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------- |
| Python            | 3.14, pinned in `.python-version`                                                      |
| Database          | PostgreSQL 18                                                                          |
| Packaging / env   | `uv`, lockfile committed                                                               |
| Lint + format     | `ruff` (lint + format), line length 100                                                |
| Type checking     | `mypy --strict` with the Pydantic plugin                                               |
| Tests             | `pytest`, `pytest-cov`, `pytest-asyncio`, `hypothesis` where invariants matter         |
| Integration tests | `testcontainers` with real PostgreSQL / Redis. Never SQLite as a stand-in for Postgres |
| Settings          | `pydantic-settings`, 12-factor, all configuration from the environment                 |
| Logging           | Structured JSON logs (`structlog`), `request_id` / `trace_id` on every line            |
| Observability     | OpenTelemetry traces and metrics wherever the service has HTTP traffic                 |
| Security scans    | `pip-audit`, `gitleaks`                                                                |
| Pre-commit        | ruff, mypy, gitleaks, end-of-file and whitespace fixers, commit message lint           |
| Task runner       | `just`                                                                                 |

## 2. Tooling (TypeScript / web)

| Concern            | Choice                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Package manager    | `pnpm`                                                                                         |
| Framework          | Next.js (App Router), React, TypeScript with `strict: true`                                    |
| Styling            | Tailwind CSS + shadcn/ui (Radix primitives), themed with the product's design tokens (§14)     |
| Icons              | Lucide only                                                                                    |
| Data fetching      | TanStack Query; API client **generated from OpenAPI** (`openapi-typescript` + `openapi-fetch`) |
| Forms / validation | React Hook Form + Zod                                                                          |
| Lint / format      | ESLint (+ `eslint-plugin-jsx-a11y`) + Prettier                                                 |
| Unit tests         | Vitest + Testing Library                                                                       |
| E2E                | Playwright for critical flows only, with `@axe-core/playwright`                                |
| Component catalog  | Storybook (public), a11y addon, one story per component state                                  |

## 3. Uniform commands

Every repo exposes the same `justfile` recipes, so anyone (human or AI assistant) can operate any
repo without reading its internals:

```text
just setup      # install dependencies and pre-commit hooks
just dev        # run locally (docker compose for infrastructure + app with reload)
just test       # unit + integration tests
just lint       # ruff / eslint
just typecheck  # mypy / tsc
just check      # lint + typecheck + test; must pass before anything lands on main
just fmt        # auto-format
just migrate    # apply database migrations (repos with a database)
just seed       # load demo data (where applicable)
```

## 4. Repository layout (Python service)

```text
.
├── src/<package>/
│   ├── domain/          # entities, value objects, domain services, domain errors; pure Python, no I/O
│   ├── application/     # use cases (commands/queries), ports (Protocols), DTOs
│   ├── infrastructure/  # adapters: DB repositories, HTTP clients, queues, LLM clients
│   ├── api/             # FastAPI routers, request/response schemas, dependency wiring
│   └── main.py          # composition root
├── tests/
│   ├── unit/            # domain + application, no I/O
│   ├── integration/     # adapters against real infrastructure (testcontainers)
│   └── e2e/             # API-level flows (few, critical)
├── migrations/          # Alembic
├── docs/
│   ├── adr/             # 0001-*.md, 0002-*.md, ...
│   └── architecture.md  # C4-style context and container diagrams (Mermaid)
├── .github/workflows/ci.yml   # calls the reusable workflows in this repo
├── docker-compose.yml
├── Dockerfile           # multi-stage, non-root user
├── justfile
├── pyproject.toml
├── .env.example
├── CLAUDE.md            # context for AI coding assistants: points here and to the current milestone
└── README.md
```

## 5. Architecture principles

- **Hexagonal-lite / clean architecture.** Dependencies point inward: `api` and `infrastructure`
  depend on `application`, which depends on `domain`. The domain never imports FastAPI, SQLAlchemy,
  httpx or an LLM SDK.
- **Ports are `typing.Protocol`s**, adapters live in `infrastructure`, and wiring happens only in
  the composition root.
- **Rich domain only where there are business rules** (pricing, document lifecycles, approvals).
  Plain CRUD stays plain CRUD: no aggregates for a lookup table.
- **Explicit errors.** Domain errors are typed exceptions, mapped to Problem Details at the API
  edge. No bare `except`, no swallowed errors.
- **Money is never a float.** Use `Decimal` with an explicit currency in a `Money` value object,
  with explicit rounding (`ROUND_HALF_EVEN`) at defined points. The database column is
  `NUMERIC(18,4)`.
- **Time is always UTC and timezone-aware.** Convert only at the UI edge.
- **IDs are UUIDv7**, which are sortable and safe to expose: `uuid.uuid7()` in Python and `uuidv7()`
  for database defaults.
- **Design patterns only on demand.** A pattern is welcome when it solves a concrete problem, and
  its ADR says which one. Typical justified uses:
  - Strategy or Chain of Responsibility for rule pipelines
  - State for lifecycles
  - Repository + Unit of Work for persistence
  - Adapter for external providers
  - Transactional Outbox for reliable events

  No factories, builders or abstract base classes "just in case".

## 6. Clean code rules

- Functions do one thing; prefer fewer than 30 lines. Classes have one reason to change.
- Names describe intent in domain language (`approve_quote`, not `process_data`).
- No magic numbers or strings: use constants or enums.
- Type hints everywhere, including return types. No `Any` except at a boundary, with a comment.
- Comments explain _why_, never _what_. Public modules, classes and functions get concise
  docstrings.
- No dead code, no commented-out code, no `print`.
- Value objects are immutable (`@dataclass(frozen=True)` or frozen Pydantic models).
- Prefer composition over inheritance.

## 7. Testing strategy

| Layer            | Tooling                          | Rules                                                                                                     |
| ---------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Domain unit      | pytest + hypothesis              | No mocks. Property-based tests for invariants (totals reconcile, discounts never break the margin floor). |
| Application unit | pytest + in-memory fakes         | Fakes implement the ports. Don't mock what you own: write a fake.                                         |
| Integration      | testcontainers                   | Real Postgres/Redis: repositories, migrations, outbox relay, external clients with recorded HTTP.         |
| API / e2e        | httpx `AsyncClient`              | Critical flows end to end through the HTTP layer.                                                         |
| Web              | Vitest, Playwright               | Component tests for complex UI logic; Playwright for 3–5 critical journeys.                               |
| LLM              | Recorded fixtures + eval harness | Unit tests never call a live LLM. Live calls happen only in the eval suite.                               |

**Coverage gates, enforced in CI:** at least 80% overall and 95% on `domain/`. Coverage is a floor,
not a goal: test behavior, not lines.

**Test naming:** `test_<unit>_<scenario>_<expected>`, for example
`test_pricing_volume_tier_applies_highest_matching_tier`. Separate Arrange / Act / Assert with blank
lines, and test one behavior per test.

## 8. API conventions

Applies to every HTTP service.

- REST, resource-oriented, plural nouns, under `/api/v1/...`.
- **Errors use RFC 9457 Problem Details** (`application/problem+json`): `type`, `title`, `status`,
  `detail` and `instance`, plus `code` (a stable machine-readable string) and `errors[]` for
  validation.
- **Pagination is cursor-based** (`?limit=&cursor=`), and the response shape is
  `{ "items": [...], "next_cursor": ... }`.
- **Filtering and sorting** use explicit, whitelisted query parameters.
- **Idempotency:** every non-idempotent `POST` that creates business records accepts
  `Idempotency-Key`.
- **Optimistic concurrency** on mutable aggregates: a `version` field plus `If-Match`, and `409` on
  conflict.
- **Timestamps** are ISO-8601 in UTC. **Money** is `{ "amount": "123.4500", "currency": "USD" }`,
  with the amount as a string.
- **The OpenAPI spec** is generated, committed as `openapi.json`, and checked in CI for unintended
  changes.
- **Health endpoints:** `GET /health/live` and `GET /health/ready`.
- **Every response carries `X-Request-ID`.**

## 9. Git & delivery

- **Trunk-based.** `main` is always green and deployable; branches are short-lived (`feat/...`,
  `fix/...`).
- **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `ci:`),
  enforced by a commit-msg hook.
- **Small pull requests** (aim for fewer than 400 changed lines) using the PR template: what, why,
  how it was tested, screenshots, ADR link.
- **Versioning:** SemVer, with the changelog generated by `release-please`.
- **Branch protection on `main`:** CI must pass.

## 10. CI (reusable workflows)

This repo's `.github/workflows/` exposes reusable workflows (`on: workflow_call`):

| Workflow           | Steps                                                                |
| ------------------ | -------------------------------------------------------------------- |
| `python-ci.yml`    | uv sync → ruff → mypy → pytest with coverage gates → upload coverage |
| `web-ci.yml`       | pnpm install → eslint → tsc → vitest → Playwright (optional)         |
| `security.yml`     | pip-audit / pnpm audit + gitleaks                                    |
| `docker-build.yml` | build the image, run it, smoke-test `/health/ready`                  |
| `release.yml`      | release-please                                                       |

Each project's `ci.yml` is about 20 lines that call these, so a change in the standards reaches
every project. Workflows are added when the first project needs them; the [README](README.md) lists
the ones available today.

## 11. Documentation standard

### README structure (same order in every repo)

1. **Title, one-line pitch and badges** (CI, coverage, license, Python version)
2. **Demo:** live URL and/or GIF, with demo credentials if applicable
3. **The problem:** business context in 3–5 sentences
4. **What it does:** key features as a short list
5. **Architecture:** Mermaid diagram + one paragraph, linking to `docs/architecture.md`
6. **Key decisions:** a table linking to the ADRs (decision → why)
7. **Run it locally:** prerequisites and one command
8. **Testing strategy:** what is tested at which level, and how to run it
9. **Project structure:** a short tree
10. **Trade-offs & what I'd do next:** honest limitations and next steps
11. **License**

### Architecture Decision Records

Each ADR lives in `docs/adr/NNNN-title.md` with these sections: **Status**, **Context**,
**Decision**, **Alternatives considered** and **Consequences** (positive and negative). One page at
most.

ADR-0001 in every repo is "Record architecture decisions", together with the architecture style
chosen.

## 12. Definition of Done

Every task is done when:

- [ ] Behavior matches the acceptance criteria
- [ ] Tests are written at the right level, and `just check` passes locally
- [ ] There are no new lint or type ignores without an inline justification
- [ ] Public API and schema changes are reflected in OpenAPI and in the generated client
- [ ] Migrations are included and reversible (if the database changed)
- [ ] Logs are structured and meaningful, with no secrets or PII
- [ ] Docs are updated (README section, plus an ADR if a decision was made)
- [ ] UI changes (if any) cover the four states, pass axe and keyboard checks, and have updated
      Storybook stories (§14)
- [ ] Commit messages follow Conventional Commits

## 13. Service template

[python-service-template](https://github.com/odvprogra/python-service-template) is a Copier template
that generates the §4 layout:

- `pyproject.toml` with every tool from §1 configured
- `justfile`, pre-commit config, multi-stage non-root `Dockerfile` and `docker-compose.yml`
- `ci.yml` calling the workflows in §10
- settings module, structlog setup and request-id middleware
- Problem Details error handling and health endpoints
- ADR-0001, the README skeleton from §11 and `CLAUDE.md`

Database support (PostgreSQL + Alembic) and the HTTP API (FastAPI) are optional answers. Generated
repos stay in sync with `copier update`.

## 14. UI & UX standards

Applies to every user-facing surface of a product: web apps, server-rendered review UIs, and PDF and
email templates. The goal is that they all read as **one product family**, and that usability is
designed and measured, not assumed.

### 14.1 Design system

- **One set of design tokens per product family:** color, typography, spacing, radius, shadow and
  motion. They are defined once as CSS custom properties plus a Tailwind preset; other UIs in the
  family pin a copy. **Code is the source of truth**: mockups are derived from it, never the other
  way around.
- **Semantic tokens** (`--color-danger`, `--color-surface-muted`), never raw palette values in
  components, so themes and accents change in one place.
- **Components:** shadcn/ui customized with the tokens. Do not add a second component library.
  **Icons:** Lucide.
- **Theme:** light ships first. Tokens are structured so dark mode is additive.
- **Customer (tenant) branding** is limited to a logo and one accent color in the app header, PDFs
  and emails. It never overrides semantic colors (danger, success, focus), so accessibility holds
  whatever the customer picks.
- **Pattern references:** SAP Fiori, Salesforce Lightning, Atlassian Design System, Shopify Polaris.
  When a pattern is borrowed, cite it in the relevant ADR or screen spec.

### 14.2 UX patterns (B2B back-office)

- **Layout:** desktop-first (1280 px and up is primary), fully usable at 768 px. Approval and detail
  views must also work on a phone, because managers approve on the go.
- **Lists:** data tables with cursor pagination. Filters and sorting are whitelisted and reflected
  in the URL, so views can be shared. Numbers are right-aligned in tabular figures.
- **Four explicit states for every data view:** loading (skeleton), empty (explains the next
  action), error and success. Errors map from Problem Details to a human message plus the
  `request_id` for support.
- **Forms:** React Hook Form + Zod, validated on blur. Problem Details `errors[]` map to fields.
  Destructive actions require a confirmation that names the object.
- **Concurrency:** on `409 Conflict`, show what changed and offer to reload. Never overwrite
  silently.
- **Money:** always shown with its currency, formatted with `Intl.NumberFormat` in tabular numerals.
  **Never computed in the UI**: amounts come from the API.
- **Dates:** stored in UTC and displayed in the user's timezone with `Intl.DateTimeFormat`. A
  relative time ("2 h ago") always has the absolute time in a tooltip.
- **Responsiveness:** acknowledge every action within 0.1 s (a pending state on every mutation),
  keep flows within 1 s where possible, and show progress beyond that (Nielsen's response-time
  limits).
- **Keyboard:** every flow can be completed with the keyboard, and data-entry screens support
  keyboard-first entry for power users.
- **Copy:** in English, following the product's voice & tone, kept in one place per feature
  (i18n-ready, single locale).

### 14.3 Accessibility

- **Target: WCAG 2.2 AA.** Every token pair has a verified contrast ratio: text at least 4.5:1, UI
  components and focus indicators at least 3:1.
- **Automated checks:** `eslint-plugin-jsx-a11y`, axe in the Playwright journeys and the Storybook
  a11y addon. CI fails on violations.
- **Manual checks:** a keyboard-only pass and a screen-reader pass (NVDA) on the critical journeys
  before a UI milestone closes.

### 14.4 Frontend architecture (Next.js)

- App Router. Server Components by default; Client Components only where there is interactivity.
- Feature folders: `src/features/<feature>/{components,hooks,api,schemas}`. Shared primitives go in
  `src/components/ui`.
- The API is accessed only through the client generated from `openapi.json`. No hand-written `fetch`
  calls to the API.
- Auth tokens are never stored in `localStorage`. The session pattern is decided in an ADR; the
  default is a backend-for-frontend through Next.js route handlers with httpOnly, Secure, SameSite
  cookies.
- Server state lives in TanStack Query. A global client-state library needs an ADR.

### 14.5 Design & UX process

1. **Journeys and specs:** user journeys per role, plus one spec per screen covering purpose, data,
   actions, the four states and permissions by role. They live in `docs/ux/`.
2. **Brand and design system:** designed as reviewable HTML pages, then implemented as tokens and
   components and published in Storybook.
3. **Mockups:** hi-fi clickable mockups of the key screens, reviewed before implementation.
4. **Usability test** with 5 participants on the prototype:
   - 3–5 tasks per participant
   - measure task success, time on task and errors, plus a System Usability Scale (SUS)
     questionnaire
   - write the findings and the changes they caused in `docs/ux/usability-test-N.md`
5. **Done means verified:** a UI milestone is done only when the Playwright journeys pass with zero
   axe violations and Storybook covers every state of the new components.

### 14.6 Brand

Each product keeps a brand guide in `docs/brand/` covering:

- name and positioning
- logo: SVG logomark + wordmark, clear space, minimum size, misuse
- color palette with a contrast table
- typography, iconography, voice & tone
- UI examples, PDF and email templates

Demo data uses fictional companies, and the README says so.
