# 0002. Runtime baseline: Python 3.14 and PostgreSQL 18

- **Status:** Accepted
- **Date:** 2026-10-02

## Context

Every service needs the same Python and PostgreSQL versions, so that the template, CI and local
environments behave identically.

The handbook mandates **UUIDv7** identifiers: time-ordered, index-friendly and safe to expose (RFC
9562). Before 2025 neither Python nor PostgreSQL could generate them natively.

State of the runtimes on the decision date:

| Runtime           | Released   | Support until | Status                                                 |
| ----------------- | ---------- | ------------- | ------------------------------------------------------ |
| Python 3.12       | 2023-10-02 | 2028-10       | Security fixes only, no new binaries                   |
| Python 3.13       | 2024-10-07 | 2029-10       | Security fixes only, no new binaries                   |
| **Python 3.14**   | 2025-10-07 | 2030-10       | Bug fixes; adds `uuid.uuid7()` to the standard library |
| Python 3.15       | —          | 2031-10       | Pre-release                                            |
| PostgreSQL 16     | 2023-09-14 | 2028-11-09    | Supported                                              |
| PostgreSQL 17     | 2024-09-26 | 2029-11-08    | Supported                                              |
| **PostgreSQL 18** | 2025-09-25 | 2030-11-14    | Supported; adds `uuidv7()`                             |
| PostgreSQL 19     | —          | —             | Beta                                                   |

Sources: [Python versions](https://devguide.python.org/versions/),
[PostgreSQL versioning policy](https://www.postgresql.org/support/versioning/),
[PostgreSQL 18 UUID functions](https://www.postgresql.org/docs/18/functions-uuid.html).

## Decision

We will pin **Python 3.14** (`.python-version`, `requires-python = ">=3.14"`) and **PostgreSQL 18**
(`postgres:18` images in Compose and testcontainers) in every repository.

IDs are generated with `uuid.uuid7()` in application code, and with `uuidv7()` where a database
default is useful. No third-party UUID library is used.

## Alternatives considered

- **Python 3.12 or 3.13 with a UUIDv7 library** (`uuid-utils`, `uuid6`): wider library support, but
  it adds a dependency for something the standard library now provides. Both versions are already
  security-only, with no new binary releases.
- **Python 3.15 / PostgreSQL 19:** newest features, but still pre-release or beta. The library
  ecosystem (wheels for C extensions) lags new releases for months.
- **PostgreSQL 16 or 17 with IDs generated only in the application:** works, but loses the database
  default and any SQL-side generation (seeds, migrations).

## Consequences

- **Positive:** native UUIDv7 on both sides with no extra dependency.
- **Positive:** both runtimes are mature (a year in production) and supported until late 2030.
- **Negative:** each new dependency must ship Python 3.14 support. The template's CI catches this on
  every change.
- **Negative:** any managed database used for deployment must offer PostgreSQL 18. Verify this
  before the first deploy; the fallback is a container or a superseding ADR.
