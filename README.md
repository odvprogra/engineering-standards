# Engineering Standards

> One engineering handbook, one set of decision records and one set of reusable CI workflows, shared
> by every repository I build.

[![Self-test](https://github.com/odvprogra/engineering-standards/actions/workflows/self-test.yml/badge.svg)](https://github.com/odvprogra/engineering-standards/actions/workflows/self-test.yml)
[![Lint](https://github.com/odvprogra/engineering-standards/actions/workflows/lint.yml/badge.svg)](https://github.com/odvprogra/engineering-standards/actions/workflows/lint.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Why this repo exists

My projects are separate repositories, but they should look, build and behave as if one team with
shared standards wrote them. Instead of copying conventions from repo to repo, they live here once:

- **Handbook**: how code is structured, tested, documented and delivered.
- **Architecture Decision Records**: why the shared baseline is what it is.
- **Reusable GitHub Actions workflows**: each project's CI is a short file that calls these, so a
  change in the standards reaches every project.
- **Templates** for pull requests, issues and ADRs.

New Python services are generated from
[python-service-template](https://github.com/odvprogra/python-service-template), which implements
these standards as code.

## Contents

| Path                                   | What it is                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [HANDBOOK.md](HANDBOOK.md)             | The standards: tooling, layout, architecture, testing, API conventions, delivery, docs, UI & UX        |
| [docs/adr](docs/adr/README.md)         | Decisions shared by every repo, with context and alternatives                                          |
| [.github](.github)                     | Canonical pull request and issue templates. The service template copies them into every generated repo |
| [.github/workflows](.github/workflows) | Reusable CI workflows (below) and the self-tests that exercise them                                    |
| [tests/fixtures](tests/fixtures)       | Minimal sample projects the self-tests run the workflows against                                       |

## Reusable workflows

| Workflow                                                 | What it does                                                                                                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`python-ci.yml`](.github/workflows/python-ci.yml)       | `uv sync --locked` → ruff format and lint → mypy → pytest with a total coverage gate (80%) and a domain coverage gate (95%) → coverage summary, artifact and optional Codecov upload |
| [`web-ci.yml`](.github/workflows/web-ci.yml)             | pnpm from `packageManager` → `pnpm install --frozen-lockfile` → the project's `just check` → optional Codecov upload → optional Playwright journeys after `docker compose up --wait` |
| [`security.yml`](.github/workflows/security.yml)         | pip-audit (Python) and/or `pnpm audit` (Node) on the locked dependencies + gitleaks on the full git history (binary checksum-verified); honors a repo's `.gitleaks.toml`             |
| [`docker-build.yml`](.github/workflows/docker-build.yml) | Builds the image (with layer cache), fails if it runs as root, starts it (alone, or with its dependencies through `docker compose up --wait`) and polls `/health/ready`              |

A project calls them from its own `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  python:
    uses: odvprogra/engineering-standards/.github/workflows/python-ci.yml@v1
    with:
      working-directory: api # where pyproject.toml lives; defaults to "."
    secrets: inherit # passes CODECOV_TOKEN if the repo defines it

  security:
    uses: odvprogra/engineering-standards/.github/workflows/security.yml@v1
    with:
      working-directory: api

  docker:
    uses: odvprogra/engineering-standards/.github/workflows/docker-build.yml@v1
    with:
      context: api
      dockerfile: api/Dockerfile
      compose-file: docker-compose.yml # optional: readiness needs PostgreSQL
```

A web project (pnpm, Next.js) calls the web and security workflows instead:

```yaml
jobs:
  web:
    uses: odvprogra/engineering-standards/.github/workflows/web-ci.yml@v1
    with:
      journeys: true # Playwright, after the services below are up
      compose-file: e2e/compose.yaml # optional: the API and its database
    secrets: inherit

  security:
    uses: odvprogra/engineering-standards/.github/workflows/security.yml@v1
    with:
      audit-python: false
      audit-node: true
```

`python-ci.yml` inputs:

| Input                     | Default      | Meaning                                                            |
| ------------------------- | ------------ | ------------------------------------------------------------------ |
| `working-directory`       | `.`          | Directory that contains `pyproject.toml`                           |
| `coverage-min`            | `80`         | Minimum total coverage, in percent                                 |
| `domain-coverage-min`     | `95`         | Minimum coverage of domain code, in percent; `0` disables the gate |
| `domain-coverage-pattern` | `*/domain/*` | coverage.py `--include` pattern that selects domain code           |
| `system-packages`         | none         | Debian packages the tests need, installed with apt first           |

`web-ci.yml` inputs (the coverage gate lives in the project's Vitest configuration, and its
justfile's `check` recipe decides what runs):

| Input                 | Default              | Meaning                                                             |
| --------------------- | -------------------- | ------------------------------------------------------------------- |
| `working-directory`   | `.`                  | Directory that contains `package.json` and `pnpm-lock.yaml`         |
| `node-version`        | `24`                 | Node.js version                                                     |
| `coverage-file`       | `coverage/lcov.info` | Report uploaded to Codecov, relative to `working-directory`         |
| `journeys`            | `false`              | Run `pnpm exec playwright test` in its own job                      |
| `playwright-browsers` | `chromium`           | Browsers Playwright installs, with their system dependencies        |
| `compose-file`        | none                 | Compose file (from the repository root) started before the journeys |

`security.yml` takes `working-directory`, `audit-python` (default `true`) and `audit-node` (default
`false`); gitleaks always runs.

Callers pin a release tag (`@v1`), never `@main`. Third-party actions inside the workflows are
pinned to full commit SHAs, with the version in a comment.

## Working on this repo

Requires Docker, Node.js 24 (for `npx` and Corepack) and [uv](https://docs.astral.sh/uv/).

```sh
just setup   # install the sample projects used by the self-tests
just check   # lint (actionlint, Prettier, markdownlint) + python-ci's steps and web-ci's recipe
just fmt     # format everything with Prettier
```

CI runs the same `just lint` recipe, so tool versions are pinned in one place: the
[justfile](justfile).

## License

[MIT](LICENSE)
