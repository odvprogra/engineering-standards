# Engineering Standards

> One engineering handbook, one set of decision records and one set of reusable CI workflows, shared
> by every repository I build.

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

| Path                           | What it is                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| [HANDBOOK.md](HANDBOOK.md)     | The standards: tooling, layout, architecture, testing, API conventions, delivery, docs, UI & UX |
| [docs/adr](docs/adr/README.md) | Decisions shared by every repo, with context and alternatives                                   |

## License

[MIT](LICENSE)
