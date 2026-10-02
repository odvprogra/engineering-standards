# Uniform commands (HANDBOOK §3). Requires: Docker, Node.js (npx) and uv.

set windows-shell := ["powershell.exe", "-NoLogo", "-NoProfile", "-Command"]

prettier := "npx --yes prettier@3.9.9"
markdownlint := "npx --yes markdownlint-cli2@0.23.3"
actionlint := "rhysd/actionlint:1.7.12@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667"

# List the recipes
default:
    @just --list

# Install the sample project used by the self-tests
[working-directory: 'tests/fixtures/sample-service']
setup:
    uv sync --locked

# Lint workflows, formatting and Markdown
lint:
    docker run --rm -v "{{ justfile_directory() }}:/repo" -w /repo {{ actionlint }}
    {{ prettier }} --check .
    {{ markdownlint }}

# Format every supported file
fmt:
    {{ prettier }} --write .

# Run the python-ci steps against the sample project
[working-directory: 'tests/fixtures/sample-service']
test:
    uv run ruff format --check .
    uv run ruff check .
    uv run mypy
    uv run pytest --cov --cov-fail-under=80

# Everything CI checks
check: lint test
