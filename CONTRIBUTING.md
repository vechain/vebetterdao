# Contributing to B3TR

Thank you for your interest in contributing to VeBetterDAO.

## Getting started

1. Fork the repo and clone it locally
2. Follow the setup instructions in [README.md](README.md#setting-up-the-dev-environment)
3. Create a feature branch from `main`

## Branch naming

Use descriptive branch names: `feature/short-description`, `fix/short-description`, `chore/short-description`.

## Pull requests

All PRs require a version label:

- `increment:patch` — Bug fixes
- `increment:minor` — New features, backwards compatible
- `increment:major` — Breaking changes

Keep PRs focused — one feature or fix per PR.

PRs must meet the standards outlined below. Submissions that violate these principles will be rejected.

## Core principles

### Decentralization

VeBetterDAO is a decentralized autonomous organization. **Decentralization is a top priority** and must be preserved in every contribution.

- **Contracts must be self-sufficient.** All logic and truth must live on-chain. Do not introduce contract changes where an off-chain service, oracle, or privileged actor needs to "serve the truth" — the contracts must handle everything in a decentralized way.
- **No new trust assumptions.** Do not add admin-only functions, centralized upgradeability patterns, or privileged roles unless they are strictly temporary and governed by the DAO.
- **Governance integrity.** Changes that affect voting, token distribution, or round mechanics must not give any single party an outsized advantage.

### Scalability

Contract changes must be gas-efficient and safe at scale.

- **No unbounded loops.** Do not introduce `for` loops that iterate over dynamic-length arrays or mappings. These can hit the block gas limit and brick the contract.
- **Preserve existing patterns.** The contracts follow well-established patterns (OpenZeppelin upgradeable, reentrancy guards, custom errors). Do not break or deviate from them.
- **Do not compromise DAO operability.** Every contract change must be evaluated for its impact on the DAO's day-to-day operation. If a change could cause a round to fail, voting to stall, or emissions to break, it will not be merged.

## Frontend standards

### Data sources

The frontend relies on a **single indexer**: the [VeChain indexer](https://github.com/vechain/vechain-indexer). This is intentional — a single source of truth keeps the repo maintainable and easy to debug.

- **Do not add new external data sources or third-party APIs** for on-chain data. All indexed data must come from the VeChain indexer.
- If you need data that the indexer does not yet provide, open an issue on the [vechain-indexer](https://github.com/vechain/vechain-indexer) repo or discuss it before building a workaround.
- On-chain reads via `useCallClause` (direct contract calls) are fine and expected for real-time data.

### UI consistency

The frontend uses **Chakra UI v3** with a custom design system. All UI contributions must be visually and structurally consistent with the existing app.

- Follow the existing component patterns, styling conventions, and layout structure.
- Use the project's design tokens (semantic colors, `textStyle`, `size` for headings) — no raw hex colors, no arbitrary `fontSize`/`lineHeight`.
- Use existing reusable components before creating new ones.
- **Mobile-first.** ~90% of users are on mobile. Build for small viewports first, then add `md`/`lg` breakpoints.
- Reference the design system: [VBD Design System (Figma)](https://vechain-brand-assets.s3.eu-north-1.amazonaws.com/VBD+Design+System.fig)

## Before submitting

Run these from the monorepo root:

```bash
yarn typecheck    # TypeScript type checking
yarn lint         # Linting
yarn test         # Unit tests
yarn contracts:test  # Smart contract tests (Hardhat)
```

## Code style

- TypeScript for all code, ES modules (`import`/`export`)
- Prettier for formatting (`yarn format`)
- ESLint for linting
- Mobile-first for frontend components (~90% of users are on mobile)
- Chakra UI v3 design system for UI components

## Smart contracts

- Solidity 0.8.20, OpenZeppelin 5.0.2 (upgradeable)
- NatSpec documentation on all public/external functions
- Custom errors over `require` strings
- Reentrancy guards on state-changing external functions
- See `packages/contracts/CLAUDE.md` for detailed contract development guidelines

## AI tooling

This repo includes a `CLAUDE.md` with guidelines for AI-assisted development. See also [vechain-ai-skills](https://github.com/vechain/vechain-ai-skills) for rich context AI tools can use.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
