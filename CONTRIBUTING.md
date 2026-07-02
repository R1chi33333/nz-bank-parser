# Contributing

Thanks for your interest. This project is small and contributions are welcome.

## Setup

```bash
npm ci
npm test
```

The playground lives in `playground/` with its own `npm ci` and `npm run dev`.

## Rules

- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `ci:`). Releases are cut automatically from commit messages.
- Every change ships with tests. Coverage must stay at or above 90 percent.
- `npm run lint`, `npm run typecheck` and `npm test` must pass before a PR.
- Fixture files must be synthetic. Never commit real bank statements, even redacted ones.
- No emoji anywhere: code, comments, docs, commit messages.

## Reporting format issues

If a bank changes its CSV export format, open an issue using the bug template and describe the header row and one synthetic sample line.
