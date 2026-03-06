# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# TOP PRIORITY RULES

**BE EXTREMELY CONCISE IN ALL TASKS UNLESS EXPLICITLY STATED OTHERWISE.**
Sacrifice grammar for concision.

## PR Creation

When I say "PR" (uppercase):

- **ALWAYS push commits first**: `git push -u origin <branch>`
- Then provide the PR creation URL: `https://github.com/vechain/b3tr/compare/main...<branch>`
- Description: Bare minimum necessary info only
- Format: Bullet points
- NO EMOJIS
- Use comparison tables/measurements only if critical

# Project structure

Turborepo monorepo with:

- `apps/frontend`: Next.js frontend app
- `apps/relayer-dashboard`: Next.js static app for auto-voting relayer analytics (GitHub Pages)
- `packages/contracts`: VeChain VeBetterDAO smart contracts
- `packages/*`: Shared config, utils, constants, lambda functions

# Architecture

## Frontend (`apps/frontend`)

- Next.js 14 App Router with file-based routing
- API layer: `src/api/` - contract hooks in `src/api/contracts/`, indexer queries in `src/api/indexer/`
- State: React Query for server state, Zustand for client state
- VeChain integration: `@vechain/vechain-kit` with `useThor` hook (not deprecated `useConnex`)
- Contract types from `@vechain/vebetterdao-contracts/typechain-types`

## Relayer Dashboard (`apps/relayer-dashboard`)

Dashboard for VeBetterDAO's auto-voting relayer system. Users can enable auto-voting on `XAllocationVoting`, and relayers (off-chain services) execute votes + claim rewards on their behalf, earning fees from `RelayerRewardsPool`. The dashboard shows relayer analytics, reward pool stats, and per-relayer info.

- Contracts: `XAllocationVoting.sol` (auto-voting toggle, user counts, rounds), `RelayerRewardsPool.sol` (relayer registration, rewards, fee config)
- Data script: `packages/scripts/src/analyzeAutoVotingRounds.ts` (generates `report.json`)
- Next.js 14 App Router with `output: "export"` for static GitHub Pages deployment
- Runs on port 3001 locally; deployed to GitHub Pages under `/b3tr` base path
- Data: static `report.json` (updated hourly by GH Action) + on-chain reads via `useCallClause`
- Shared contract config (addresses, ABIs) in `src/hooks/contracts.ts`
- Navigation: state-based (no file routing), managed via `NavigationProvider` context
- All browser-dependent code (vechain-kit) loaded client-only via `dynamic(() => ..., { ssr: false })`
- Theme copied from `apps/frontend/src/app/theme/` — run `yarn workspace relayer-dashboard chakra:typegen` after changes
- Commands: `yarn relayer:dev:staging`, `yarn relayer:dev:mainnet`, `yarn relayer:build:staging`, `yarn relayer:build:mainnet`
- GH Actions: `update-relayer-data.yml` (hourly cron), `deploy-relayer-dashboard.yml` (on push to main)

## Contract Hooks Pattern

Use `useCallClause` from `@vechain/vechain-kit`:

```typescript
import { ContractFactory__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const abi = ContractFactory__factory.abi
export const useHookName = (param: string) => {
  return useCallClause({
    abi,
    address: getConfig().contractAddress,
    method: "methodName",
    args: [param],
    queryOptions: { enabled: !!param },
  })
}
```

# Environments

- local: Local development (requires Thor solo node via `make solo-up`)
- testnet-staging: Staging testnet
- testnet: VeChain testnet
- mainnet: VeChain mainnet

# Local Setup

```bash
nvm use
yarn install
cp .env.example .env
make solo-up  # Start Thor solo node (requires Docker)
yarn dev
```

Stop: `make solo-down` | Reset: `make solo-clean && make solo-up`

# Common commands

## Development

- `yarn dev`: Local dev with endorsed xapps
- `yarn dev:<env>`: Dev for specific environment (staging/testnet/mainnet)
- `yarn start:<env>`: Production build for specific environment

## Building

- `yarn build`: Build for local
- `yarn build:<env>`: Build for specific environment (staging/testnet/mainnet)
- `yarn build:lambda`: Build lambda functions
- `yarn relayer:build:staging`: Build relayer-dashboard for staging
- `yarn relayer:build:mainnet`: Build relayer-dashboard for mainnet

## Testing

- `yarn test`: Run all tests
- `yarn test:watch`: Run tests in watch mode
- `yarn typecheck`: Run TypeScript type checking (frontend workspace)
- `yarn playwright:e2e`: Run Playwright e2e tests
- `yarn contracts:test`: Run contract tests (Hardhat)

## Contracts

- `yarn contracts:compile`: Compile smart contracts
- `yarn contracts:test`: Test contracts on hardhat network

## Code quality

- `yarn lint`: Run linter
- `yarn format`: Format code with Prettier

# Code style

- Use ES modules (import/export), not CommonJS (require)
- Destructure imports when possible
- TypeScript for all code

# Workflow

- Use turbo for parallel builds/tests when possible
- Contracts must be compiled before frontend dev

# Tools

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

# Component Development

- **NEVER delete or remove existing comments** in frontend code unless they are factually wrong or reference deleted code.
  Existing comments carry domain knowledge and intent that may not be obvious from the code alone (e.g. why a contract call is made, what a field means, business rules).
  When rewriting or refactoring a section, preserve all existing comments — move them to the appropriate new location if the code moves.
- Avoid adding new narrating comments on frontend; on contracts, comments are encouraged.

## Mobile-first

- **~90% of users are on mobile.** Always design and build frontend components mobile-first.
- Implement and verify layout/UX for small viewports first; then add `md`/`lg` breakpoints for larger screens.
- When in doubt, prioritize touch targets, readable text, and no horizontal overflow on narrow widths.

## Chakra UI v3

- Project uses Chakra UI v3 design system
- **Use Chakra MCP when working with or creating components**
- Main theme: `apps/frontend/src/app/theme/theme.ts`
- Component recipes: `apps/frontend/src/app/theme/` (button.ts, card.ts, etc.)
- Run `yarn chakra:typegen` after theme changes
- Run `yarn chakra:typegen:watch` for auto-typegen during dev

## Design Tokens

- Use `textStyle` for Text, `size` for Heading - never `lineHeight`/`fontSize` directly
- Use semantic colors from theme.ts, not hex colors
- fontWeight: only "normal" (400), "semibold" (600), "bold" (700)
- Icons: prefer react-icons, else add SVG to `@/components/Icons/svg` and wrap with Chakra `<Icon/>`
- Links: use Chakra `Link` (variants: underline, plain, ghost); for card links use `LinkBox`/`LinkOverlay`
- Mobile-first (see above): use `base` for mobile, `md`/`lg` for larger screens
- Layouts: prefer `SimpleGrid`/`Grid` over nested Stack/Flex

## Figma to Code

1. Ensure Figma Desktop app open with design file
2. Use Figma MCP tools to get code/variables from designs
3. Map Figma components to codebase with Code Connect
4. Generate UI code matching design system
5. Use uppercase for hex colors.

# Behavioral guidelines

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# Ralph - Autonomous Agent Runner

Ralph is a script that runs Claude autonomously to implement features from a PRD (Product Requirements Document).

## Workflow

1. **Describe the feature** you want to implement
2. **Run `/prd`** - Creates detailed PRD markdown in `tasks/prd-[feature-name].md`
   - Asks clarifying questions first
   - Generates user stories with acceptance criteria
3. **Run `/ralph`** - Converts PRD to `prd.json` format
   - Archives previous prd.json/progress.txt if different feature
   - Resets `progress.txt` to empty
   - Creates `prd.json` with stories ready for execution
4. **Run Ralph** in a new terminal tab:
   ```bash
   ./ralph.sh 10
   ```
5. **Wait for completion** - Ralph implements each story and commits

## PRD Format

```json
{
  "project": "Feature Name",
  "stories": [
    {
      "id": "US-001",
      "title": "Story title",
      "description": "Detailed description of what needs to be done",
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

- **priority**: Lower number = higher priority (1 is first)
- **passes**: Set to `false` initially, Ralph sets to `true` when done
- **notes**: Ralph fills this with implementation details

## How Ralph Works

Each iteration:

1. Find highest-priority story with `passes: false`
2. Implement the feature
3. Run type checks (`yarn typecheck`)
4. Update `prd.json`: set `passes: true` and add notes
5. Append progress to `progress.txt`
6. Create a git commit

Stops when all stories have `passes: true` or iterations exhausted.

## Output

Real-time progress with timestamps:

```
[00:00] 💬 Looking at prd.json...
[00:02] 🔧 Using tool: Read
[00:03] ✅ Tool completed
[05:32] 💰 Cost: $0.15
```

## Requirements

- `jq` installed (`brew install jq`)
- Claude CLI configured
- Both `prd.json` and `progress.txt` are gitignored
