# Repo-specific instructions for PR Agents

## Commit conventions
- Use **Conventional Commits** for all commit messages.

## Required checks
- Run `pnpm lint && pnpm test` before committing any code. Both commands must succeed.

## Documentation
- Update relevant docs when data contracts or public APIs change.

## Code organization
- Follow the naming conventions and import rules defined in `docs/60-project-Structure.md` and `docs/02-Dependency-Graph.md`.
- Keep unit test coverage at **90% or higher** as outlined in `docs/51-testing-Strategy.md`.

