---
name: frontend-ui
description: Map of reusable UI components and the design system (Chakra UI v3) in apps/frontend. Catalogs existing components so new code reuses them instead of duplicating, and documents semantic tokens, recipe variants, and style patterns (mobile-first, modal/bottom-sheet split, textStyle, semantic colors). Use when building or editing anything under apps/frontend/src/, when asked to add a page/component/modal/card/form/button, when writing Chakra JSX, when choosing colors/spacing/typography, or when touching apps/frontend/src/app/theme/. Triggers on frontend, UI, component, reusable, Chakra, Chakra v3, theme, recipe, slot recipe, textStyle, semantic color, design token, design system, variant, card, button, modal, bottom sheet, drawer, badge, input, form, empty state, step card, stat card, mobile-first, colorPalette, bg.primary, text.default.
---

# Frontend UI (Chakra v3) — Components & Style Map

Before writing any UI under `apps/frontend/src/`, check this catalog. **Reuse existing components; never re-invent a modal, card, button, or form field that already exists.**

## 1. Where the design system lives

- `apps/frontend/src/app/theme/theme.ts` — `createSystem` config, **tokens**, **semanticTokens**, `textStyles`, keyframes, recipes registry.
- `apps/frontend/src/app/theme/*.ts` — one file per recipe / slot recipe (`button.ts`, `card.ts`, `badge.ts`, `input.ts`, `alert.ts`, `dialog.ts`, `tabs.ts`, `text.ts`, `heading.ts`, `steps.ts`, `switch.ts`, `table.ts`, `checkbox.ts`, `radio-group.ts`, `popover.ts`, `select.ts`, `native-select.ts`, `skeleton.ts`, `separator.ts`, `breadcrumb.ts`).
- CSS vars prefix: `vbd` (e.g. `var(--vbd-colors-...)`).
- After ANY theme change: `yarn chakra:typegen` (or `yarn chakra:typegen:watch` in dev).

## 2. Design tokens — use these, never hex

### Typography

| Usage | Token |
|-------|-------|
| Any `<Text>` size | `textStyle` only. Values: `xxs, xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl` |
| Any `<Heading>` size | `size` only (same scale, default `xl`) |
| Font weight | `normal` (400), `semibold` (600), `bold` (700) — **nothing else** |

Never set `fontSize` or `lineHeight` directly. For responsive sizes use `{ base: "sm", md: "md" }`.

### Semantic colors (use these in `color`, `bg`, `borderColor`)

| Group | Keys |
|-------|------|
| Text | `text.default`, `text.subtle`, `text.alt`, `text.alt-subtle` |
| Backgrounds | `bg.primary`, `bg.secondary`, `bg.tertiary`, `bg.alt`, `bg.alt-subtle` |
| Borders | `border.primary`, `border.secondary`, `border.tertiary`, `border.active` (also legacy `borders.primary/secondary/active`) |
| Card | `card.default`, `card.subtle`, `card.hover`, `card.active-border` |
| Icon | `icon.default`, `icon.subtle` |
| Actions | `actions.{primary\|secondary\|tertiary\|negative\|disabled}.{default\|hover\|pressed\|disabled\|text\|text-disabled}` |
| Status | `status.{positive\|negative\|info\|warning\|teal\|yellow\|purple\|neutral}.{strong\|primary\|secondary\|subtle}` |
| Brand | `brand.primary`, `brand.secondary`, `brand.tertiary`, `brand.secondary-strong/stronger/subtle` |
| Banner | `banner.{blue\|green\|yellow\|dashboard-tokens}` |
| Graph/Calendar | `graph.{1..6}`, `calendar.{1..4}` |
| Social | `social.{telegram\|discord\|youtube\|medium\|twitter}` |
| Transparency | `transparency.{100..900}` (white alpha), `opacity.{100..900}` (black alpha) |

Raw palettes (`gray/blue/red/green/orange` 50-950) exist but prefer semantic tokens so dark mode works automatically.

### Recipe variants (cheat sheet)

| Component | Variants | Sizes | Notes |
|-----------|----------|-------|-------|
| `<Button>` | `primary`, `secondary`, `tertiary`, `negative`, `link`, `subtle`, `ghost` | default Chakra sizes | Always `rounded="full"` from base recipe |
| `<Card.Root>` | `primary`, `subtle`, `action`, `outline` | — | `outline` is the go-to for listing cards |
| `<Badge>` | `warning`, `info`, `teal`, `yellow`, `purple`, `negative`, `neutral`, `positive`, `outline` | `sm`, `md`, `lg` | `borderRadius: full`, `fontWeight: semibold` |
| `<Alert.Root>` | — | — | `status: info \| warning \| success \| error \| neutral` |
| `<Tabs.Root>` | `line` (default), `subtle` | `sm`, `md`, `lg` | |
| `<Input>` | `outline`, `amountInput` | — | `amountInput` = large bold money input |

For anything not covered above, open the recipe file in `app/theme/` and check its `variants`. If you need a new variant, add it there (one concern per file) rather than inline styles in JSX.

## 3. Reusable component catalog

Paths are relative to `apps/frontend/src/`. **Search these before creating anything new.**

### Shells: modals, drawers, bottom sheets

| Component | Path | When to use |
|-----------|------|-------------|
| `BaseModal` | `components/BaseModal.tsx` | **Default for all dialogs.** Auto-switches to `BaseBottomSheet` below 1060px. Takes `isOpen/onClose/children/showCloseButton/isCloseable`. |
| `BaseBottomSheet` | `components/BaseBottomSheet.tsx` | Drag-to-dismiss mobile sheet. Used by `BaseModal`; use directly only if you need a sheet on all viewports. |
| `Modal` | `components/Modal.tsx` | Legacy alert/confirm shell; prefer `BaseModal`. |
| `StepModal` | `components/StepModal/StepModal.tsx` | Multi-step flows (wizard). |
| `TransactionModal` | `components/TransactionModal/TransactionModal.tsx` (+ `LoadingModalContent`, `SuccessModalContent`, `ErrorModalContent`, `UnknownModalContent`) | Wrap every on-chain tx. Handles loading/success/error states uniformly. |
| `UnsavedChangesModal` | `components/UnsavedChangesModal.tsx` | Dirty-form confirmation. |
| `MintNFTModal` | `components/MintNFTModal.tsx` | GM NFT mint flow. |
| `MobileFilterDrawer` | `components/MobileFilterDrawer/MobileFilterDrawer.tsx` | Bottom-anchored filter drawer. |

### Cards & containers

| Component | Path | Purpose |
|-----------|------|---------|
| `StatCard` | `components/AssetsOverview/StatCard.tsx` | Status-colored info tile w/ icon + title + subtitle + optional CTA. Variants: `info \| warning \| positive \| neutral`. |
| `EmptyStateCard` | `components/EmptyStateCard.tsx` | Wraps Chakra `EmptyState` + icon + title + description + optional action button. Use it everywhere for empty lists. |
| `StepCard` | `components/StepCard.tsx` | "Step N — Title — Description" marketing/onboarding card. |
| `CheckableCard` | `components/CheckableCard/` | Selectable card (radio/checkbox semantics). |
| `AppPreviewDetailCard` | `components/AppPreviewDetailCard.tsx` | X2Earn app preview tile. |
| `GMNFTCard` | `components/GMNFTCard/GMNFTCard.tsx` | GM NFT tile. |
| `GmNFTAndNodeCard` | `components/GmNFTAndNodeCard/` | Combined NFT + node summary card. |
| `ProposalCompactCard` | `components/ProposalCompactCard.tsx` | Compact governance proposal card. |
| `ManagedAppsCard` | `components/ManagedAppsCard/` | Creator's managed apps tile. |
| `TransactionCard/*` | `components/TransactionCard/cards/` | Per-activity tx summary cards (`BetterActionCard`, `SwapCard`, `UpgradeGMCard`). |

### Identity, addresses & avatars

| Component | Path | Purpose |
|-----------|------|---------|
| `AddressButton` | `components/AddressButton.tsx` | Truncated address pill with copy icon + blockie. |
| `AddressIcon` | `components/AddressIcon.tsx` | Blockie avatar for an address. |
| `AppImage` | `components/AppImage/AppImage.tsx` | X2Earn app logo with fallback. |
| `OverlappedAppsImages` | `components/OverlappedAppsImages.tsx` | Stacked avatars for N apps. |

### Forms & inputs (under `components/CustomFormFields/`)

| Component | Purpose |
|-----------|---------|
| `FormItem` | Generic labeled text/textarea/email/url/number input with error, tooltip, char count. Takes `react-hook-form` `register`. **Default form field.** |
| `FormSelect` | Labeled `<select>` wrapper. |
| `FormDateInput`, `FormDateSelect` | Date pickers (bound / native). |
| `FormMoneyInput` | Uses `input` variant `amountInput`. |
| `FormCheckbox` | Checkbox + label. |
| `FormAccordionSection` | Collapsible section inside a form. |
| `FormSocialConnectButton` | OAuth connect button. |
| `validators.ts` | Shared RHF validator fns — import from here. |
| `SearchField` (`components/SearchField/SearchField.tsx`) | Search input with icon. |
| `SelectField` (`components/SelectField/`) | Generic styled select. |
| `PointsSelector` (`components/PointsSelector/`) | Numeric +/- stepper. |
| `DatePicker` (`components/DatePicker/`) | Calendar picker. |
| `UploadFileButton` (`components/UploadFileButton/`) | File upload. |

### Navigation, layout, feedback

| Component | Path | Purpose |
|-----------|------|---------|
| `Navbar/DesktopNavbar`, `Navbar/MobileNavbar`, `Navbar/NavbarLogo`, `Navbar/NavbarMenu`, `Navbar/ProfileButton` | `components/Navbar/` | Shell nav. |
| `Footer` | `components/Footer/` | Shell footer (incl. `LanguageSelector`). |
| `ConnectWalletButton` | `components/ConnectWalletButton/ConnectWalletButton.tsx` | Universal connect CTA. |
| `Banners` | `components/Banners/` | `AppsBanner` etc.; uses `banner.*` semantic tokens. |
| `ShareButtons`, `ShareButtonsBlue` | `components/ShareButtons.tsx`, `ShareButtonsBlue.tsx` | Social share rows. |
| `ProgressRing` | `components/ProgressRing.tsx` | Circular progress indicator. |
| `CountdownBoxes` | `components/CountdownBoxes/` | Countdown timer tiles. |
| `MulticolorBar` | `components/MulticolorBar/` | Segmented multi-color progress bar. |
| `CategorySelector` | `components/CategorySelector.tsx` | Horizontal chip selector. |
| `BlurredWrapper` | `components/BlurredWrapper.tsx` | Content blur gating (auth wall). |
| `MotionVStack` | `components/MotionVStack.tsx` | Framer-motion-wrapped `VStack`. |
| `ConditionalWrapper` | `components/ConditionalWrapper.tsx` | Conditionally wrap children. |
| `FeatureFlagWrapper` | `components/FeatureFlagWrapper.tsx` | Feature-flag gate. |
| `DotSymbol` | `components/DotSymbol.tsx` | Middle dot separator. |
| `GmActionButton` | `components/GmActionButton.tsx` | Reusable primary-action CTA for GM NFT flows. |

### Chakra v3 primitives (under `components/ui/`, generated by CLI)

`clipboard.tsx`, `color-mode.tsx`, `empty-state.tsx`, `provider.tsx`, `toaster.tsx`, `toggle-tip.tsx`, `tooltip.tsx`. Import from `@/components/ui/<name>`. Use `toaster` (not a custom toast), `Tooltip` (not a custom one).

### Icons

- **Prefer `react-icons`** (`react-icons/lu` for Lucide is the house standard; `react-icons/fa6` used too, plus `iconoir-react`).
- Custom icons live in `components/Icons/` as React components wrapping SVGs under `components/Icons/svg/`. Wrap with Chakra `<Icon as={MyIcon} boxSize={4} />` — never import the SVG multiple times to recolor.
- Key branded icons: `B3TRIcon`, `VOT3Icon`, `VETIcon`, `VTHOIcon`, `LeafIcon`, `Handshake`, `OkHandIcon`, `SignIcon`, `WalletIcon`, `VoteCheckmarkIcon`, `BeBetterVeBetterIcon`, `ThreeSparklesIcon`, `ThreeTokensIcon`, `CurveArrowIcon`, `ExclamationTriangle`.

### Domain-specific feature dirs (don't duplicate their internals)

`Activities/*`, `AllocationAmounts/*`, `AllocationRoundsList/*`, `AllocationStateBadge/*`, `AssetsOverview/*`, `Convert/*` (swap modal + token pickers), `CreateEditAppForm/*`, `FreshDeskWidget/*`, `GmNFT/*`, `Leaderboard/*`, `PowerUpModal/*`, `Proposal/*` (+ `ProposalStatusBadge`, `ResultsDisplay`), `ProposalExecutableActions/*`, `ProposalSessionSection/*`, `ProposalSupportProgressChart/*`, `Sustainability/*`, `SubmitCreatorForm/*`, `GenerateFunctionToCallParamsInput/*`.

## 4. Style patterns to replicate

### Mobile-first (~90% of users are mobile)

Always write `base` styles first, add `md`/`lg` for larger screens:

```tsx
<Text textStyle={{ base: "sm", md: "md" }} color="text.subtle">...</Text>
<Card.Body p={{ base: "4", md: "6" }}>...</Card.Body>
```

Prefer `SimpleGrid`/`Grid` over deep `HStack/VStack` nesting. Cap heading clamping with `lineClamp`. Ensure touch targets ≥ 44px and no horizontal overflow at 360px wide.

### Modal vs bottom sheet

Always wrap dialogs in `BaseModal`. It renders `<Dialog>` on desktop (≥1060px) and `<BaseBottomSheet>` on mobile. Don't hand-roll breakpoint-switched dialogs.

### Cards

- Listing card → `<Card.Root variant="outline">` + `<Card.Body>` + optional `<Card.Footer>`.
- Info tile → `StatCard` with `variant="info|warning|positive|neutral"`, backgrounds come from `status.{variant}.{subtle|secondary}`.
- Empty state → always `EmptyStateCard` with a Lucide/iconoir icon.
- Internal gray sub-panels → `bg="bg.secondary"` + `borderRadius="xl"` + `p={3}` (see `ChallengeCard` prize/stats panel).

### Buttons

- Primary CTA → `<Button variant="primary">` (filled blue).
- Secondary CTA → `variant="secondary"` (tinted blue).
- Outline/tertiary → `variant="tertiary"`.
- Destructive → `variant="negative"`.
- Link-style → `variant="link"`.
- Icon-only → wrap Chakra `<IconButton>` with the same variants; set `colorPalette` for semantic hues (e.g. `colorPalette="gray"` for neutral).

### Text color conventions

- Primary copy: **omit `color`** (inherits `text.default`).
- Secondary/hint copy: `color="text.subtle"`.
- Uppercase eyebrows: `textTransform="uppercase"` + `color="gray.500"` (see `StepCard`).
- Numeric emphasis: `fontWeight="bold"` + `color="brand.primary"`.

### Badges for state

Use `<Badge variant="...">` with the status palette (`positive`, `negative`, `warning`, `info`, `neutral`, etc.). Domain badges (`ChallengeStatusBadge`, `ProposalStatusBadge`, `AllocationStateBadge`, `GrantsProposalStatusBadge`) already map enum → variant — use them.

### Links & navigation

- Internal links: Chakra `<Link>` (variants `underline`, `plain`, `ghost`) or Next's `Link` when routing; for card-wide links use `<LinkBox>` + `<LinkOverlay>`.
- Route navigation inside handlers: `const router = useRouter(); router.push("/path")`.

### Loading & skeletons

- Prefer Chakra `<Skeleton loading={...}>` wrapping the actual content (see `StatCard`).
- For list pages, build a dedicated `*Skeleton.tsx` sibling (see `ChallengesPageSkeleton`, `CompactSkeleton`).

### i18n

Every user-facing string goes through `useTranslation().t(...)` using **the English phrase as the key** (per `frontend-i18n-keys` rule). After adding a key, use the `translate` skill to sync all 15 locale files. Interpolations: `t("Round #{{roundId}} completed", { roundId })`.

### Accessibility & data-cy

- Give actionable elements `data-cy="kebab-case-id"` (see `AddressButton`) for e2e tests.
- Icons inside clickable buttons get `aria-label`.
- Dialogs set `ariaTitle` / `ariaDescription` (already handled by `BaseModal`).

## 5. Contract hooks inside UI

Use `useCallClause` from `@vechain/vechain-kit` (see root `CLAUDE.md`). Do **not** use deprecated `useConnex`. Read-side hooks live in `api/contracts/`; write-side (clause-building + tx lifecycle) in feature `api/*/useXActions.ts`.

## 6. Keeping this skill current

This is a **living map**. Update it in the same commit whenever you:

1. **Add / rename / delete a shared component** in `apps/frontend/src/components/` — add/remove it from the correct table in §3.
2. **Add / remove a recipe variant** in `apps/frontend/src/app/theme/*.ts` — update the cheat-sheet table in §2.
3. **Add / remove / rename a semantic token** in `theme.ts` — update the semantic-colors table in §2.
4. **Introduce a new house pattern** (e.g. a new modal shell, a new toast, a new listing skeleton) — document it in §4.
5. **Deprecate a legacy component** — move it to a "deprecated — use X instead" line in its row.

Rules to respect when editing this file:

- Keep it **under 500 lines**.
- Prefer **updating existing tables** over appending new sections.
- Match terminology with the codebase (`textStyle`, `variant`, `colorPalette`, `recipe`, `slot recipe`).
- Don't document app-feature-specific internals here — feature-specific details belong in their own skill (e.g. `challenges`).
- Don't paste implementation code; link to the file path and describe the shape.

Sanity checks (run mentally before saving):

- [ ] Every component listed has a verifiable path.
- [ ] No hex colors in examples (use semantic tokens).
- [ ] No `fontSize`/`lineHeight` in examples (use `textStyle`/`size`).
- [ ] Examples are mobile-first.
