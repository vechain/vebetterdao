# Smart Contract Tests

Each test describe block is marked with a shard name. This is needed to split large test suites into smaller, parallel runs for faster CI execution and to prevent timeouts.

## Active Shards

All active shards are listed in `.github/workflows/unit-tests.yml`.

## Shard Assignments

- **shard0**: B3TR Token, B3TR Multi Sig
- **shard2**: Emissions
- **shard3a**: Galaxy Member
- **shard3b**: Galaxy Member - V6 Upgrade
- **shard3c**: Galaxy Member - V6 Compatibility
- **shard4a**: Governance - Governor and TimeLock
- **shard4b**: Governance - Voting power with proposal deposit
- **shard4c**: Governance - Milestone Creation
- **shard4d**: Governance - Proposer Requirement
- **shard4e**: Governance - V7 Compatibility & Thresholds
- **shard4f**: Governance - V7 Upgrade
- **shard4g**: Governance - V8 Upgrade
- **shard4h**: Governance - V8 Compatibility
- **shard6**: TimeLock
- **shard7**: Treasury
- **shard8**: VeBetterPassport
- **shard8a**: VeBetterPassport Upgrade
- **shard8b**: VeBetterPassport Signaling
- **shard8c**: VeBetterPassport Reset Signal Count
- **shard9**: VOT3
- **shard10**: VoterRewards
- **shard11**: X2EarnCreator
- **shard12**: X2EarnRewardsPool
- **shard13**: X-Allocation Pool
- **shard14**: X-Allocation Voting
- **shard15a**: X-Apps - Core Features
- **shard15b**: X-Apps - Team Management
- **shard15c**: X-Apps - Metadata and Endorsement
- **shard15d**: X-Apps - V7 Upgrade
- **shard15e**: X-Apps - Upgradeability
- **shard16**: VeBetterPassport (additional tests)
- **shard17a**: X-Apps (additional tests)
- **shard17b**: X-Apps (additional tests)
- **shard19**: Navigator

When adding new tests, assign them to an appropriate shard to maintain balanced execution times across all shards.

---

## Test Writing Guide

### Running Tests

```bash
cd packages/contracts
NEXT_PUBLIC_APP_ENV=local npx hardhat test --network hardhat test/YourTest.test.ts
```

### Helper Functions

Import from `./helpers`:

```typescript
import {
  getOrDeployContractInstances,
  bootstrapAndStartEmissions,
  waitForRoundToEnd,
  waitForNextCycle,
  getVot3Tokens,
  endorseApp,
} from "./helpers"
```

---

## Common Patterns & Gotchas

### Creating X2Earn Apps

Each app requires a **unique creator** with their own **X2EarnCreator NFT**:

```typescript
// WRONG - one creator can only create one app
await x2EarnCreator.safeMint(owner.address)
await x2EarnApps.connect(owner).submitApp(owner.address, owner.address, "App1", "uri")
await x2EarnApps.connect(owner).submitApp(owner.address, owner.address, "App2", "uri") // FAILS!

// CORRECT - each app needs different creator with own NFT
const appCreator1 = otherAccounts[10]
const appCreator2 = otherAccounts[11]

await x2EarnCreator.safeMint(appCreator1.address)
await x2EarnCreator.safeMint(appCreator2.address)

await x2EarnApps.connect(appCreator1).submitApp(appCreator1.address, appCreator1.address, "App1", "uri")
await x2EarnApps.connect(appCreator2).submitApp(appCreator2.address, appCreator2.address, "App2", "uri")

// Don't forget to endorse apps (use different endorsers)
await endorseApp(app1Id, otherAccounts[12])
await endorseApp(app2Id, otherAccounts[13])
```

### Claiming Rewards - Cycle Must Be Ended

Rewards can only be claimed **after the cycle ends**:

```typescript
// Start round and vote
await bootstrapAndStartEmissions()
const roundId = await xAllocationVoting.currentRoundId()
// ... voting happens ...

// Wait for round to end
await waitForRoundToEnd(Number(roundId))

// Distribute emissions (starts new cycle)
await emissions.connect(minterAccount).distribute()

// Claim for the ENDED cycle (roundId), not getCurrentCycle()
// getCurrentCycle() returns the NEW cycle that just started
const cycleToClaimFor = roundId
await voterRewards.claimReward(cycleToClaimFor, voter.address)
```

### X2EarnCreator NFT - Check Before Minting

```typescript
// Prevent "AlreadyOwnsNFT" error
if ((await x2EarnCreator.balanceOf(user.address)) === 0n) {
  await x2EarnCreator.connect(owner).safeMint(user.address)
}
```

### Navigator Setup

When testing Navigator functionality:

```typescript
// 1. Deploy Navigator
navigator = await deployProxy("Navigator", [...])

// 2. Set Navigator on XAllocationVoting via initializeV9
// IMPORTANT: Pass BOTH navigator and b3trGovernor addresses
await xAllocationVoting.initializeV9(
  await navigator.getAddress(),
  await governor.getAddress()  // Required for vote counting!
)

// 3. Set Navigator on VoterRewards
await voterRewards.setNavigator(await navigator.getAddress())
```

### Navigator Reward Flow

Navigators don't claim via `claimReward()`. Their fee comes from delegator claims:

```typescript
// WRONG
await voterRewards.claimReward(cycle, navigatorAddress)

// CORRECT - delegators claim, navigator fee is auto-deducted
await voterRewards.claimDelegatorReward(cycle, delegator.address)
// Navigator fee is sent to Navigator contract automatically
```

### Voting Power at Snapshot

For voting and rewards, power is measured at the **round snapshot**, not current block:

```typescript
const snapshot = await xAllocationVoting.roundSnapshot(roundId)
const votingPower = await navigator.getNavigatorVotingPower(navigatorAddress, snapshot)
```

### Personhood Checks

Some functions require whitelisting in VeBetterPassport:

```typescript
await veBetterPassport.connect(owner).whitelist(voter.address)
await veBetterPassport.connect(owner).toggleCheck(1) // Enable whitelist check
```

---

## Debugging Tips

- Add `console.log` statements liberally to understand flow
- Use `describe.only()` to run single test suite
- Check role assignments if getting "AccessControl" errors
- Verify contract addresses are set correctly before operations
