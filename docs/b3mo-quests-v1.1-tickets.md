# B3MO Quests v1.1 — frontend quick wins

## Product direction

Make B3MO Quests feel persistent and actionable across Better without adding new
contract mechanics or depending on an indexer release. The experience should answer
one question first: **what is the next useful thing this wallet can do?**

## Constraints

- Frontend first: no contract or `vechain-indexer` changes unless an acceptance
  criterion is proven impossible with the existing wallet challenge filters and
  contract reads.
- User-facing copy says **Quest**; `challenge` remains the technical code/API term.
- Reuse the existing `NeededAction`, `MyChallenges`, `OpenToJoin`, `OthersActive`,
  and `History` data flows.
- Do not build persistent notifications, unread state, AI matching, lottery,
  ratings/reviews, polls, or a new quick-duel contract format.
- New copy must be added to every supported locale and translation files must stay
  synchronized and sorted.

## Ticket 1 — Add an in-product Quest participation guide

### What to build

Add a reusable, contextual guide that explains how sponsored, stake, Max Actions,
and Split Win quests work. It must be discoverable from the Quest hub and usable
without navigating to external documentation.

### Acceptance criteria

- [ ] The Quest hub exposes a clear `How Quests work` entry point.
- [ ] The guide explains valid actions, active windows, ranking/threshold behavior,
      claims, refunds, and the difference between Max Actions and Split Win.
- [ ] Copy never promises a win for Max Actions based only on the viewer's progress.
- [ ] The guide is responsive, keyboard accessible, localized, and covered by
      focused tests where the existing component conventions support them.

### Blocked by

None — can start immediately.

## Ticket 2 — Give app owners a B3MO Quest launchpad

### What to build

Add an owner-only section to the app administration experience that makes sponsored
Quest creation discoverable and presents a lightweight eligibility/compliance
checklist. Keep the flow within existing frontend and contract capabilities.

### Acceptance criteria

- [ ] Eligible app owners see a `Grow your app with B3MO Quests` section.
- [ ] The primary CTA takes the owner to the existing sponsored Quest creation flow
      or the closest safe existing entry point without introducing backend storage.
- [ ] The section contains a concise checklist covering action timestamps, clear
      claim frequency, transparent eligibility, and no insider-only requirements.
- [ ] Non-owners do not gain access to owner-only controls.
- [ ] The section is responsive and localized.

### Blocked by

None — can start immediately.

## Ticket 3 — Surface the wallet's next Quest action on the homepage

### What to build

Add a compact `Your Quests` homepage card that prioritizes the most useful current
state for the connected wallet rather than presenting a generic activity feed.

### Acceptance criteria

- [ ] The card prioritizes claim/refund/finalize, invitation, active progress,
      upcoming participation, then relevant outcomes.
- [ ] Split Win progress may state the number of actions remaining; Max Actions copy
      reports progress without implying that a threshold guarantees victory.
- [ ] Pending quests remind joined users that the quest has not started yet.
- [ ] Fully claimed Split Win quests communicate that no prize slots remain.
- [ ] Each state links to the relevant Quest detail; a secondary action links to all
      of the wallet's Quests.
- [ ] Disconnected wallets do not see a misleading empty card, and loading uses a
      skeleton rather than an empty state.
- [ ] Existing challenge React Query data is reused without duplicating server state.

### Blocked by

None — can start immediately.

## Ticket 4 — Make duels and stake quests visible even when discovery is empty

### What to build

Improve the Quest hub so private participation, invitations, and the option to start
a duel remain visible when no public quests are available. Present one prioritized
`Your next move` area and an honest empty state that invites peer competition.

### Acceptance criteria

- [ ] The hub highlights the wallet's highest-priority actionable or participating
      Quest before public discovery content.
- [ ] A persistent `Challenge someone` action exposes the existing stake/private
      creation flow.
- [ ] When no public quests exist, the page explains that clearly and suggests
      creating a duel instead of appearing inactive or broken.
- [ ] Existing private quests and invitations remain visible through wallet-scoped
      data even when public sections are empty.
- [ ] No AI matchmaking or new on-chain duel format is introduced.
- [ ] Cross-section deduplication and current/history behavior remain correct.

### Blocked by

- Ticket 1, only where it reuses the guide entry point or shared education copy.

## Integration order

1. Ticket 1 — participation guide
2. Ticket 2 — app-owner launchpad
3. Ticket 3 — homepage status
4. Ticket 4 — hub visibility and final integration
