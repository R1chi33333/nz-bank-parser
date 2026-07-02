# Roadmap

Development follows small, releasable increments. Each item below is one loop.

## Milestone: v0.1.0 — Core parsing

- [x] Loop 1: repository scaffold, CI pipeline, deployable blank playground
- [ ] Loop 2: CSV tokenizer (quoted fields, BOM, CRLF, empty lines) with tests
- [ ] Loop 3: shared parsing primitives — date normalisation (DD/MM/YYYY and friends), amount parsing (negative sign and parentheses, cents output), row error model
- [ ] Loop 4: ANZ adapter with synthetic fixtures
- [ ] Loop 5: ASB adapter with synthetic fixtures
- [ ] Loop 6: Westpac adapter with synthetic fixtures
- [ ] Loop 7: Kiwibank adapter with synthetic fixtures
- [ ] Loop 8: bank auto-detection from header fingerprints, public `parse()` API
- [ ] Release v0.1.0 (semantic-release wiring, first GitHub release)

## Milestone: v0.2.0 — Playground

- [ ] Loop 9: file drop zone and paste input, client-side parse
- [ ] Loop 10: results table, error panel, detected-bank badge
- [ ] Loop 11: polish pass — empty states, sample CSV buttons, responsive layout
- [ ] Deploy to Vercel, release v0.2.0

## Milestone: v1.0.0 — Publish

- [ ] Loop 12: coverage to 90 percent or above, edge-case hardening from self-review
- [ ] Loop 13: README format support matrix, demo GIF, npm publish via semantic-release
- [ ] Release v1.0.0

## Later

- [ ] OFX/QIF export helpers
- [ ] Additional institutions (BNZ, TSB, Co-operative Bank)
- [ ] Category inference helpers for downstream apps
