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

## Design references

- [VBD Design System (Figma)](https://vechain-brand-assets.s3.eu-north-1.amazonaws.com/VBD+Design+System.fig)

## AI tooling

This repo includes a `CLAUDE.md` with guidelines for AI-assisted development. See also [vechain-ai-skills](https://github.com/vechain/vechain-ai-skills) for rich context AI tools can use.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
