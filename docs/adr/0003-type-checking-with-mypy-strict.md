# 0003. Type checking with mypy in strict mode

- **Status:** Accepted
- **Date:** 2026-10-02

## Context

Every Python repo is fully type-hinted (handbook §6). Type hints only pay off if a checker enforces
them in CI, and every repo must use the same checker with the same strictness. Otherwise "typed"
means something different in each repo.

The services lean on Pydantic (settings, API schemas, value objects). Pydantic models generate their
`__init__` signatures dynamically, so a checker needs help to validate model construction.

## Decision

We will use **mypy with `strict = true`** and the **`pydantic.mypy` plugin** in every repository:

- Configured in `pyproject.toml` by the service template, and run by `just typecheck`, pre-commit
  and CI.
- `warn_unused_ignores` is on. Every `# type: ignore[code]` names the error code and carries a short
  reason on the same line.
- CI's mypy result is the authority. Editor diagnostics (for example Pylance) are a convenience.

## Alternatives considered

- **pyright / basedpyright in strict mode:** faster with stronger inference, and the same engine as
  VS Code's Pylance. But it has no plugin system, so Pydantic models get less precise checking, and
  it is less familiar to Python-only teams.
- **Newer Rust-based checkers** (Astral's `ty`, Meta's Pyrefly): very fast and promising, but
  younger, with rule sets still evolving. Revisit when they are stable; a superseding ADR would
  switch every repo through the template.
- **Non-strict mypy:** easier to adopt, but lets `Any` leak silently through untyped calls, which
  defeats the purpose.

## Consequences

- **Positive:** the most widely recognized checker. Strict mode makes `Any` leaks and missing
  annotations visible, and the Pydantic plugin checks model construction.
- **Negative:** mypy is slower than pyright on large codebases. The cache and small repos keep it
  acceptable.
- **Negative:** editors running pyright may disagree with mypy in edge cases. CI decides.
