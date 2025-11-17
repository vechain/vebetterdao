# TOP PRIORITY RULES

**BE EXTREMELY CONCISE IN ALL TASKS UNLESS EXPLICITLY STATED OTHERWISE.**
Sacrifice grammar for concision.

## PR Creation

When I say "PR" (uppercase):

- **ALWAYS push commits first**: `git push -u origin <branch>`
- Then run: `gh pr create -a="@me" -B main -r vechain/b3tr`
- Description: Bare minimum necessary info only
- Format: Bullet points
- NO EMOJIS
- Use comparison tables/measurements only if critical

# Project structure

Turborepo monorepo with:

- `apps/frontend`: Next.js frontend app
- `packages/contracts`: VeChain VeBetterDAO smart contracts
- `packages/*`: Shared config, utils, constants, lambda functions

# Environments

- local: Local development
- testnet-staging: Staging testnet
- testnet: VeChain testnet
- mainnet: VeChain mainnet

# Common commands

## Development

- `yarn dev`: Local dev with endorsed xapps
- `yarn dev:<env>`: Dev for specific environment (staging/testnet/mainnet)
- `yarn start:<env>`: Production build for specific environment

## Building

- `yarn build`: Build for local
- `yarn build:<env>`: Build for specific environment (staging/testnet/mainnet)
- `yarn build:lambda`: Build lambda functions

## Testing

- `yarn test`: Run all tests
- `yarn test:watch`: Run tests in watch mode
- `yarn typecheck`: Run TypeScript type checking (frontend workspace)
- `yarn playwright:e2e`: Run Playwright e2e tests
- `yarn contracts:test`: Run contract tests (Hardhat)

## Storybook

- `yarn storybook`: Start Storybook dev server (port 6006)
- `yarn build-storybook`: Build static Storybook to public/storybook
- Stories located in `apps/frontend/src/**/*.stories.@(js|jsx|mjs|ts|tsx)`
- Storybook configured with: Chromatic, Docs, A11y, Vitest, Themes, MCP addons
- Uses Next.js Vite framework for optimal integration

## Contracts

- `yarn contracts:compile`: Compile smart contracts
- `yarn contracts:deploy:<env>`: Deploy contracts to environment
- `yarn contracts:upgrade:<env>`: Upgrade contracts on environment
- `yarn contracts:call:<env>`: Call contract functions interactively

## Code quality

- `yarn lint`: Run linter
- `yarn format`: Format code with Prettier

# Code style

- Use ES modules (import/export), not CommonJS (require)
- Destructure imports when possible
- TypeScript for all code

# Workflow

- Always typecheck after making code changes
- Use turbo for parallel builds/tests when possible
- Contracts must be compiled before frontend dev

# Tools

- Use GitHub CLI for repo operations
- Use Playwright/Chrome DevTools MCP for browser testing/debugging
- Turbo handles workspace dependencies automatically

# MCP Servers

MCP servers configured in `.mcp.json`:

## Figma Desktop MCP

- HTTP server at `http://127.0.0.1:3845/mcp`
- Access Figma designs, generate code from Figma components
- Get screenshots, metadata, variable definitions
- Map Figma components to code with Code Connect

## Chrome DevTools MCP

- Command: `npx -y chrome-devtools-mcp@latest`
- Take snapshots/screenshots of browser pages
- Navigate, click, fill forms, evaluate scripts
- Performance tracing, network request analysis
- Console message inspection, CPU/network emulation

## Playwright MCP

- Command: `npx @playwright/mcp@latest`
- Browser automation and testing
- Navigate, interact with elements, capture accessibility snapshots
- Take screenshots, handle dialogs, file uploads
- Network monitoring, multi-tab management

## Storybook MCP

- HTTP server at `http://localhost:6006/mcp`
- Requires `yarn storybook` running
- Interact with component stories programmatically
- Test component states and variations
- Integrated with Storybook dev server via `@storybook/addon-mcp`

# Component Development

- DO NOT use comments during development

## Chakra UI v3

- Project uses Chakra UI v3 design system
- **Use Chakra MCP when working with or creating components**
- Main theme: `apps/frontend/src/app/theme/theme.ts`
- Component recipes: `apps/frontend/src/app/theme/` (button.ts, card.ts, etc.)
- Run `yarn chakra:typegen` after theme changes
- Run `yarn chakra:typegen:watch` for auto-typegen during dev

## Storybook Workflow

1. Start Storybook: `yarn storybook`
2. Create story files in `apps/frontend/src` alongside components
3. **ALWAYS use Chakra's `For` component for rendering multiple story variants** (in `apps/frontend/src/stories/`)
4. Use Storybook MCP for automated component testing
5. Use Figma MCP to sync designs with components
6. Build static docs: `yarn build-storybook`

### Story Variations Pattern

For all component stories, create 4 variations:

1. `{Name}LightMode` - main component (default)
2. `{Name}DarkMode` - cloneElement with dark theme
3. `{Name}MobileLightMode` - cloneElement with mobile viewport
4. `{Name}MobileDarkMode` - cloneElement with dark theme + mobile viewport

Example:

```tsx
export const LightMode = () => <YourComponent />

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark", viewport: { value: "desktop" } }

export const MobileLightMode = () => cloneElement(<LightMode />)
MobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const MobileDarkMode = () => cloneElement(<LightMode />)
MobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }
```

## Figma to Code

1. Ensure Figma Desktop app open with design file
2. Use Figma MCP tools to get code/variables from designs
3. Map Figma components to codebase with Code Connect
4. Generate UI code matching design system
5. Use uppercase for hex colors.
